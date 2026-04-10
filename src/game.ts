import * as THREE from 'three';
import { Renderer } from './render/renderer';
import { World } from './entities/world';
import { Player, PLAYER_EYE_HEIGHT } from './entities/player';
import { Enemy, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from './entities/enemy';
import { Pickup } from './entities/pickup';
import { Door } from './entities/door';
import { Decoration } from './entities/decoration';
import { DecorationRenderer } from './render/decoration-render';
import { PickupRenderer } from './render/pickup-render';
import { Weapon } from './weapons/weapon';
import { Sword } from './weapons/sword';
import { Bow } from './weapons/bow';
import { Bombs } from './weapons/bombs';
import { FireRod } from './weapons/fire-rod';
import { Bomb, FireBolt, Arrow } from './entities/projectile';
import { Input } from './input';
import { Hud } from './hud/hud';
import { Level, LevelJson } from './level/level';
import { loadLevel } from './level/level-loader';
import { resolveMovement } from './level/collision';
import { Cell } from './level/cell';
import { makeAABB, aabbOverlaps } from './math/aabb';
import { fromYaw } from './math/vec2';
import { buildLevelMesh, LevelMesh, LevelTextures } from './render/level-mesh';
import { loadTexture, loadTextureColorKeyed, sliceSpriteStrip, loadImageColorKeyed, sliceByRects, autoSliceSpriteStrip } from './render/sprite-atlas';
import { BillboardManager, KnightTextures } from './render/billboard';
import { ProjectileRenderer } from './render/projectile-render';
import { DoorRenderer } from './render/door-render';
import { playSound } from './audio';
import levelJsonRaw from './data/level-01.json';

const MOVE_SPEED = 7;
const MOUSE_SENSITIVITY = 0.0025;
const MAX_DT = 1 / 30;
const BOB_FREQUENCY = 10;    // oscillations per second at full speed
const BOB_AMPLITUDE = 0.08;  // world units of vertical sway

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
  private bombAnimFrames!: THREE.Texture[];
  private doorTexture!: THREE.Texture;
  private doorRenderer!: DoorRenderer;
  private statueTexture!: THREE.Texture;
  private arrowTex!: THREE.Texture;
  private arrowStuckTex!: THREE.Texture;
  private fireFrames!: THREE.Texture[];
  private decorationRenderer!: DecorationRenderer;
  private pickupRenderer!: PickupRenderer;
  private pickupTexMap!: Map<string, THREE.Texture>;
  private pickupAnimMap!: Map<string, THREE.Texture[]>;
  private lastTime = 0;
  private dead = false;
  private won = false;
  private bobPhase = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.hud = new Hud();
  }

  async start(): Promise<void> {
    const [dungeonWall, dungeonFloor, dungeonCeiling] = await Promise.all([
      loadTexture('sprites/wall_tile_light_blue.png'),
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
    const bombCanvas = await loadImageColorKeyed('sprites/bomb_animation.png');
    // Exact pixel rects for the 16 bomb frames (8 bomb blink + 8 explosion)
    this.bombAnimFrames = sliceByRects(bombCanvas, [
      // 8 bomb frames (14x13 each, blinking stages)
      { x: 3,   y: 19, w: 14, h: 13 },
      { x: 23,  y: 19, w: 14, h: 13 },
      { x: 43,  y: 19, w: 14, h: 13 },
      { x: 63,  y: 19, w: 14, h: 13 },
      { x: 83,  y: 19, w: 14, h: 13 },
      { x: 103, y: 19, w: 14, h: 13 },
      { x: 123, y: 19, w: 14, h: 13 },
      { x: 143, y: 19, w: 14, h: 13 },
      // 8 explosion frames (variable size)
      { x: 161, y: 20, w: 14, h: 15 },
      { x: 178, y: 9,  w: 30, h: 30 },
      { x: 211, y: 8,  w: 30, h: 32 },
      { x: 244, y: 0,  w: 44, h: 46 },
      { x: 291, y: 10, w: 28, h: 30 },
      { x: 322, y: 4,  w: 39, h: 39 },
      { x: 364, y: 2,  w: 42, h: 41 },
      { x: 409, y: 8,  w: 43, h: 38 },
    ]);
    const doorTexture = await loadTextureColorKeyed('sprites/open_door_blue.png');
    this.doorTexture = doorTexture;
    const statueTexture = await loadTextureColorKeyed('sprites/statue.png');
    this.statueTexture = statueTexture;
    const [arrowTex, arrowStuckTex, fireTex1, fireTex2] = await Promise.all([
      loadTextureColorKeyed('sprites/arrow.png'),
      loadTextureColorKeyed('sprites/arrow_stuck.png'),
      loadTextureColorKeyed('sprites/fire_rod_projectile1.png'),
      loadTextureColorKeyed('sprites/fire_rod_projectile2.png'),
    ]);
    this.arrowTex = arrowTex;
    this.arrowStuckTex = arrowStuckTex;
    this.fireFrames = [fireTex1, fireTex2];

    // Static pickup textures
    const pickupTexEntries = await Promise.all([
      loadTextureColorKeyed('sprites/pickups_heart.png').then(t => ['heart', t] as const),
      loadTextureColorKeyed('sprites/pickups_small_key.png').then(t => ['small_key', t] as const),
      loadTextureColorKeyed('sprites/pickups_arrows_5.png').then(t => ['arrows_5', t] as const),
      loadTextureColorKeyed('sprites/pickups_arrows_10.png').then(t => ['arrows_10', t] as const),
      loadTextureColorKeyed('sprites/pickups_bombs_4.png').then(t => ['bombs_4', t] as const),
      loadTextureColorKeyed('sprites/pickups_bombs_8.png').then(t => ['bombs_8', t] as const),
      loadTextureColorKeyed('sprites/pickups_magic_jar_small.png').then(t => ['magic_jar', t] as const),
      loadTextureColorKeyed('sprites/pickups_weapon_bow.png').then(t => ['weapon_bow', t] as const),
      loadTextureColorKeyed('sprites/pickups_weapon_firerod.png').then(t => ['weapon_fire_rod', t] as const),
    ]);
    const pickupTexMap = new Map<string, THREE.Texture>(pickupTexEntries);

    // Animated rupee textures (3-frame strips)
    const [rupee1Canvas, rupee5Canvas, rupee10Canvas] = await Promise.all([
      loadImageColorKeyed('sprites/pickups_rupee_1.png'),
      loadImageColorKeyed('sprites/pickups_rupee_5.png'),
      loadImageColorKeyed('sprites/pickups_rupee_10.png'),
    ]);
    const pickupAnimMap = new Map<string, THREE.Texture[]>();
    pickupAnimMap.set('rupee_1', autoSliceSpriteStrip(rupee1Canvas));
    pickupAnimMap.set('rupee_5', autoSliceSpriteStrip(rupee5Canvas));
    pickupAnimMap.set('rupee_10', autoSliceSpriteStrip(rupee10Canvas));

    this.pickupTexMap = pickupTexMap;
    this.pickupAnimMap = pickupAnimMap;

    this.hud.loadHudSprites();
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
    this.projectileRenderer = new ProjectileRenderer(this.renderer.scene, this.bombAnimFrames, this.fireFrames, this.arrowTex, this.arrowStuckTex);
    this.doorRenderer = new DoorRenderer(this.renderer.scene, this.doorTexture);
    this.pickupRenderer = new PickupRenderer(this.renderer.scene, this.pickupTexMap, this.pickupAnimMap);
    for (const e of this.world.entities) {
      if (e instanceof Enemy) this.billboards.add(e);
      if (e instanceof Door) this.doorRenderer.add(e, this.level.grid, this.level.gridSize);
      if (e instanceof Pickup) this.pickupRenderer.add(e);
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

    // Detect bomb detonation by checking for newly-detonated bombs
    let needMeshRebuild = false;
    for (const e of this.world.entities) {
      if (e instanceof Bomb && e.detonated && e.explosionTimer > Bomb.EXPLOSION_DURATION - 0.05) {
        needMeshRebuild = true;
        break;
      }
    }

    this.world.removeDead();
    this.pickupRenderer.removeDead();

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
    this.projectileRenderer.sync(this.world, this.renderer.camera);
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

    // Doom-style view bob: advance phase when moving, decay to zero when still
    const speed = Math.hypot(motion.x, motion.z) / (dt || 1);
    if (speed > 0.5) {
      this.bobPhase += dt * BOB_FREQUENCY;
    } else {
      // Smoothly settle back to zero when stopped
      this.bobPhase *= 0.9;
    }

    if (this.input.isDown('Digit1')) this.player.selectWeapon(0);
    if (this.input.isDown('Digit2')) this.player.selectWeapon(1);
    if (this.input.isDown('Digit3')) this.player.selectWeapon(2);
    if (this.input.isDown('Digit4')) this.player.selectWeapon(3);

    if (this.input.isLeftDown() || this.input.isDown('Space')) {
      const w = this.weapons[this.player.currentWeapon];
      if (w.canFire(this.player)) {
        w.fire(this.player, this.world);
        this.hud.triggerAttack(this.player.currentWeapon);
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
        const pickupNames: Record<string, string> = {
          heart: '+1 Heart',
          heart_large: 'Full Health!',
          magic_jar: '+Magic',
          arrows_5: '+5 Arrows',
          arrows_10: '+10 Arrows',
          bombs_4: '+4 Bombs',
          bombs_8: '+8 Bombs',
          small_key: 'Small Key',
          rupee_1: '+1 Rupee',
          rupee_5: '+5 Rupees',
          rupee_10: '+10 Rupees',
          weapon_bow: 'Got the Bow!',
          weapon_bombs: 'Got Bombs!',
          weapon_fire_rod: 'Got the Fire Rod!',
        };
        this.hud.showPickupNotice(pickupNames[pickupType] ?? pickupType);
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

    // Arrow vs Enemy collision
    for (const e of this.world.entities) {
      if (!(e instanceof Arrow) || e.stuck) continue;
      for (const target of this.world.entities) {
        if (target instanceof Enemy && aabbOverlaps(e.getAABB(), target.getAABB())) {
          target.takeDamage(e.damage);
          e.alive = false; // arrow disappears on enemy hit
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
    const bobOffset = Math.sin(this.bobPhase) * BOB_AMPLITUDE;
    this.renderer.setCamera(this.player.position, this.player.yaw, this.player.pitch, PLAYER_EYE_HEIGHT + bobOffset);
    this.billboards.update(dt, this.renderer.camera);
    this.doorRenderer.update();
    this.pickupRenderer.update(dt);
    const promptVisible = !!this.world
      .overlapCircle(this.player.position, 1.5)
      .find((e) => e instanceof Door);
    this.hud.update(dt, this.player, promptVisible);
    this.renderer.render();
  }
}
