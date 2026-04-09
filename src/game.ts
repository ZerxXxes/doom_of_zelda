import * as THREE from 'three';
import { Renderer } from './render/renderer';
import { World } from './entities/world';
import { Player, PLAYER_EYE_HEIGHT } from './entities/player';
import { Enemy, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from './entities/enemy';
import { Pickup } from './entities/pickup';
import { Door } from './entities/door';
import { Decoration } from './entities/decoration';
import { DecorationRenderer } from './render/decoration-render';
import { Weapon } from './weapons/weapon';
import { Sword } from './weapons/sword';
import { Bow } from './weapons/bow';
import { Bombs } from './weapons/bombs';
import { FireRod } from './weapons/fire-rod';
import { Bomb, FireBolt } from './entities/projectile';
import { Input } from './input';
import { Hud } from './hud/hud';
import { Level, LevelJson } from './level/level';
import { loadLevel } from './level/level-loader';
import { resolveMovement } from './level/collision';
import { Cell } from './level/cell';
import { makeAABB, aabbOverlaps } from './math/aabb';
import { fromYaw } from './math/vec2';
import { buildLevelMesh, LevelMesh, LevelTextures } from './render/level-mesh';
import { loadTexture, loadTextureColorKeyed, sliceSpriteStrip } from './render/sprite-atlas';
import { BillboardManager, KnightTextures } from './render/billboard';
import { ProjectileRenderer } from './render/projectile-render';
import { DoorRenderer, DoorTextures } from './render/door-render';
import { playSound } from './audio';
import levelJsonRaw from './data/level-01.json';

const MOVE_SPEED = 7;
const MOUSE_SENSITIVITY = 0.0025;
const MAX_DT = 1 / 30;

export class Game {
  private renderer: Renderer;
  private input: Input;
  private hud: Hud;
  private world!: World;
  private player!: Player;
  private weapons: Weapon[] = [];
  private level!: Level;
  private levelMesh: LevelMesh | null = null;
  private billboards!: BillboardManager;
  private projectileRenderer!: ProjectileRenderer;
  private levelTextures!: LevelTextures;
  private knightTextures!: KnightTextures;
  private deathEffectFrames!: THREE.Texture[];
  private doorTextures!: DoorTextures;
  private doorRenderer!: DoorRenderer;
  private statueTexture!: THREE.Texture;
  private decorationRenderer!: DecorationRenderer;
  private lastTime = 0;
  private dead = false;
  private won = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.hud = new Hud();
  }

  async start(): Promise<void> {
    const [dungeonWall, dungeonFloor, dungeonCeiling] = await Promise.all([
      loadTexture('sprites/wall_tile_dark_blue.png'),
      loadTexture('sprites/ground_tile_dark.png'),
      loadTexture('sprites/ground_tile_light.png'),
    ]);
    this.levelTextures = { wall: dungeonWall, floor: dungeonFloor, ceiling: dungeonCeiling };
    const [f1, f2, f3, f4, s1, s2, s3, b1, b2, b3, b4] = await Promise.all([
      loadTextureColorKeyed('sprites/blue_knight_front_1.png'),
      loadTextureColorKeyed('sprites/blue_knight_front_2.png'),
      loadTextureColorKeyed('sprites/blue_knight_front_3.png'),
      loadTextureColorKeyed('sprites/blue_knight_front_4.png'),
      loadTextureColorKeyed('sprites/blue_knight_side_1.png'),
      loadTextureColorKeyed('sprites/blue_knight_side_2.png'),
      loadTextureColorKeyed('sprites/blue_knight_side_3.png'),
      loadTextureColorKeyed('sprites/blue_knight_back_1.png'),
      loadTextureColorKeyed('sprites/blue_knight_back_2.png'),
      loadTextureColorKeyed('sprites/blue_knight_back_3.png'),
      loadTextureColorKeyed('sprites/blue_knight_back_4.png'),
    ]);
    // Pre-flip side frames for the right-side view. Cloning each texture and
    // setting repeat.x = -1 / offset.x = 1 mirrors it horizontally without
    // affecting the originals (which are used for the left side).
    function flipTexture(tex: THREE.Texture): THREE.Texture {
      const flipped = tex.clone();
      flipped.repeat.x = -1;
      flipped.offset.x = 1;
      flipped.needsUpdate = true;
      return flipped;
    }
    this.knightTextures = {
      frontFrames: [f1, f2, f3, f4],
      sideLeftFrames: [s1, s2, s3],
      sideRightFrames: [s1, s2, s3].map(flipTexture),
      backFrames: [b1, b2, b3, b4],
    };
    const deathStripTex = await loadTexture('sprites/Enemy Death Effects.png');
    this.deathEffectFrames = sliceSpriteStrip(deathStripTex, 7);
    const [doorLocked, doorUnlocked, doorOpen] = await Promise.all([
      loadTextureColorKeyed('sprites/locked_door_red.png'),
      loadTextureColorKeyed('sprites/unlocked_door_red.png'),
      loadTextureColorKeyed('sprites/open_door_blue.png'),
    ]);
    this.doorTextures = { locked: doorLocked, unlocked: doorUnlocked, open: doorOpen };
    const statueTexture = await loadTextureColorKeyed('sprites/statue.png');
    this.statueTexture = statueTexture;
    this.loadLevel();
    requestAnimationFrame((t) => this.tick(t));
  }

  private loadLevel(): void {
    this.level = loadLevel(levelJsonRaw as LevelJson);
    this.world = new World(this.level.grid, this.level.gridSize);
    this.weapons = [new Sword(), new Bow(), new Bombs(), new FireRod()];

    this.player = new Player(
      { x: this.level.spawns.player.x * this.level.gridSize, z: this.level.spawns.player.z * this.level.gridSize },
      this.level.spawns.player.yaw,
    );
    this.world.add(this.player);

    for (const e of this.level.spawns.enemies) {
      const pos = { x: e.x * this.level.gridSize, z: e.z * this.level.gridSize };
      const enemy: Enemy =
        e.type === 'green_knight' ? new GreenKnight(pos)
        : e.type === 'blue_knight' ? new BlueKnight(pos)
        : e.type === 'red_knight' ? new RedKnight(pos)
        : new PurpleKnight(pos);
      this.world.add(enemy);
    }

    for (const p of this.level.spawns.pickups) {
      this.world.add(new Pickup({ x: p.x * this.level.gridSize, z: p.z * this.level.gridSize }, p.type));
    }

    for (const d of this.level.spawns.doors) {
      const dx = (d.x + 0.5) * this.level.gridSize;
      const dz = (d.z + 0.5) * this.level.gridSize;
      this.world.add(new Door({ x: dx, z: dz }, d.locked, d.x, d.z));
    }

    this.decorationRenderer = new DecorationRenderer(this.renderer.scene, this.statueTexture);
    for (const d of this.level.spawns.decorations) {
      const dec = new Decoration(
        { x: d.x * this.level.gridSize, z: d.z * this.level.gridSize },
        d.type,
      );
      this.world.add(dec);
      this.decorationRenderer.add(dec);
    }

    if (this.levelMesh) {
      this.renderer.scene.remove(this.levelMesh.walls);
      this.renderer.scene.remove(this.levelMesh.floor);
      this.renderer.scene.remove(this.levelMesh.ceiling);
    }
    this.levelMesh = buildLevelMesh(this.level, this.levelTextures);
    this.renderer.scene.add(this.levelMesh.walls);
    this.renderer.scene.add(this.levelMesh.floor);
    this.renderer.scene.add(this.levelMesh.ceiling);
    this.renderer.applyAmbient(this.level.ambient);

    this.billboards = new BillboardManager(this.renderer.scene, this.knightTextures, this.deathEffectFrames);
    this.projectileRenderer = new ProjectileRenderer(this.renderer.scene);
    this.doorRenderer = new DoorRenderer(this.renderer.scene, this.doorTextures);
    for (const e of this.world.entities) {
      if (e instanceof Enemy) this.billboards.add(e);
      if (e instanceof Door) this.doorRenderer.add(e);
    }

    this.dead = false;
    this.won = false;
    this.hud.hideDied();
    this.hud.hideWon();
  }

  private tick(now: number): void {
    const dtRaw = (now - this.lastTime) / 1000;
    const dt = this.lastTime === 0 ? 0 : Math.min(dtRaw, MAX_DT);
    this.lastTime = now;
    if (dt > 0) this.frame(dt);
    requestAnimationFrame((t) => this.tick(t));
  }

  private frame(dt: number): void {
    if (this.dead || this.won) {
      this.renderer.render();
      return;
    }
    this.handleInput(dt);
    this.updateEntities(dt);
    this.handleCollisions();

    // Detect bomb detonation by checking for newly-dead bombs
    const bombsToDetonate = this.world.entities.filter((e) => e instanceof Bomb && !e.alive);
    let needMeshRebuild = false;
    for (const _b of bombsToDetonate) {
      needMeshRebuild = true;
      break;
    }

    this.world.removeDead();

    if (needMeshRebuild && this.levelMesh) {
      this.renderer.scene.remove(this.levelMesh.walls);
      this.renderer.scene.remove(this.levelMesh.floor);
      this.renderer.scene.remove(this.levelMesh.ceiling);
      this.levelMesh = buildLevelMesh(this.level, this.levelTextures);
      this.renderer.scene.add(this.levelMesh.walls);
      this.renderer.scene.add(this.levelMesh.floor);
      this.renderer.scene.add(this.levelMesh.ceiling);
    }

    this.billboards.removeDead();
    this.projectileRenderer.sync(this.world);
    this.checkWinLose();
    this.render(dt);
  }

  private handleInput(dt: number): void {
    const md = this.input.consumeMouseDelta();
    this.player.yaw += md.dx * MOUSE_SENSITIVITY;
    this.player.pitch -= md.dy * MOUSE_SENSITIVITY;
    this.player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.player.pitch));

    const forward = fromYaw(this.player.yaw);
    const strafe = { x: -forward.z, z: forward.x };
    let mx = 0;
    let mz = 0;
    if (this.input.isDown('KeyW')) { mx += forward.x; mz += forward.z; }
    if (this.input.isDown('KeyS')) { mx -= forward.x; mz -= forward.z; }
    if (this.input.isDown('KeyD')) { mx += strafe.x; mz += strafe.z; }
    if (this.input.isDown('KeyA')) { mx -= strafe.x; mz -= strafe.z; }
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }
    const motion = { x: mx * MOVE_SPEED * dt, z: mz * MOVE_SPEED * dt };
    this.player.position = resolveMovement(
      this.world.grid,
      makeAABB(this.player.position, this.player.halfExtents),
      motion,
      this.world.cellSize,
    );

    if (this.input.isDown('Digit1')) this.player.selectWeapon(0);
    if (this.input.isDown('Digit2')) this.player.selectWeapon(1);
    if (this.input.isDown('Digit3')) this.player.selectWeapon(2);
    if (this.input.isDown('Digit4')) this.player.selectWeapon(3);

    if (this.input.isLeftDown() || this.input.isDown('Space')) {
      const w = this.weapons[this.player.currentWeapon];
      if (w.canFire(this.player)) {
        w.fire(this.player, this.world);
        playSound('sword_swing');
      }
    }

    if (this.input.isDown('KeyE')) {
      const nearby = this.world.overlapCircle(this.player.position, 1.5);
      const door = nearby.find((e) => e instanceof Door) as Door | undefined;
      if (door) {
        const result = door.tryOpen(this.player, this.world);
        if (result === 'locked') {
          this.hud.showLocked();
          playSound('door_locked');
        } else {
          playSound('door_open');
        }
      }
    }
  }

  private updateEntities(dt: number): void {
    this.player.tickTimers(dt);
    for (const w of this.weapons) w.tick(dt);
    for (const e of [...this.world.entities]) {
      if (e === this.player) continue;
      e.update(dt, this.world);
      if (e instanceof PurpleKnight) e.maybeSummon(this.world);
    }
  }

  private handleCollisions(): void {
    for (const e of this.world.entities) {
      if (e instanceof Pickup && aabbOverlaps(e.getAABB(), this.player.getAABB())) {
        const pickupType = e.pickupType;
        e.onTouch(this.player);
        if (pickupType === 'small_key') {
          playSound('pickup_key');
        } else if (pickupType === 'magic_jar') {
          playSound('pickup_magic');
        } else if (pickupType.startsWith('weapon_')) {
          playSound('pickup_weapon');
        } else {
          playSound('pickup_heart');
        }
      }
    }

    // FireBolt vs Enemy collision
    const FireBoltCtor = FireBolt;
    for (const e of this.world.entities) {
      if (!(e instanceof FireBoltCtor)) continue;
      for (const target of this.world.entities) {
        if (target instanceof Enemy && aabbOverlaps(e.getAABB(), target.getAABB())) {
          target.takeDamage(e.damage);
          e.alive = false;
          break;
        }
      }
    }
  }

  private checkWinLose(): void {
    if (this.player.isDead()) {
      this.dead = true;
      playSound('player_die');
      this.hud.showDied(() => this.loadLevel());
      return;
    }
    const cs = this.world.cellSize;
    const cx = Math.floor(this.player.position.x / cs);
    const cz = Math.floor(this.player.position.z / cs);
    if (this.world.grid.get(cx, cz) === Cell.Exit) {
      this.won = true;
      this.hud.showWon(() => this.loadLevel());
    }
  }

  private render(dt: number): void {
    this.renderer.setCamera(this.player.position, this.player.yaw, this.player.pitch, PLAYER_EYE_HEIGHT);
    this.billboards.update(dt, this.renderer.camera);
    this.doorRenderer.update();
    const promptVisible = !!this.world
      .overlapCircle(this.player.position, 1.5)
      .find((e) => e instanceof Door);
    this.hud.update(dt, this.player, promptVisible);
    this.renderer.render();
  }
}
