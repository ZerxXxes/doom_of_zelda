import { Vec2, scale, add } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Cell, isSolid } from '../level/cell';

export const BOMB_GRAVITY = -15;
export const BOMB_LIFETIME = 2.0; // keep for backward compat in tests
export const BLAST_RADIUS = 3.0;
export const BOMB_DIRECT_DAMAGE = 8;
export const BOMB_FUSE_DURATION = 1.5; // seconds on ground before detonation
export const BOMB_BOUNCE_DAMPING = 0.35;
export const BOMB_THROW_UP_SPEED = 5;

export const FIREBOLT_SPEED = 20;
export const FIREBOLT_DAMAGE = 4;
export const FIREBOLT_LIFETIME = 2.0;

export type DamageFn = (target: Entity, dmg: number) => void;

export class Bomb extends Entity {
  velocity: Vec2;
  height: number;
  heightVelocity: number;
  grounded = false;
  fuseTimer = BOMB_FUSE_DURATION;
  ownerId: number;
  detonateCallback?: (world: World) => void;
  detonated = false;
  explosionTimer = 0;
  static readonly EXPLOSION_DURATION = 0.5;

  constructor(position: Vec2, velocity: Vec2, ownerId: number) {
    super(position, { x: 0.2, z: 0.2 });
    this.velocity = { ...velocity };
    this.height = 0.5; // start at hand height
    this.heightVelocity = BOMB_THROW_UP_SPEED;
    this.ownerId = ownerId;
  }

  update(dt: number, world: World): void {
    if (this.detonated) {
      this.explosionTimer -= dt;
      if (this.explosionTimer <= 0) {
        this.alive = false;
      }
      return;
    }

    if (!this.grounded) {
      // Flying phase: arc with gravity
      this.height += this.heightVelocity * dt;
      this.heightVelocity += BOMB_GRAVITY * dt;
      this.position = add(this.position, scale(this.velocity, dt));

      // Hit the ground?
      if (this.height <= 0) {
        this.height = 0;
        if (Math.abs(this.heightVelocity) < 1.5) {
          // Too slow to bounce — settle on ground
          this.grounded = true;
          this.velocity = { x: 0, z: 0 };
          this.heightVelocity = 0;
        } else {
          // Bounce: reverse and damp vertical, slow horizontal
          this.heightVelocity *= -BOMB_BOUNCE_DAMPING;
          this.velocity = scale(this.velocity, 0.3);
        }
      }
    } else {
      // Grounded: fuse is burning
      this.fuseTimer -= dt;
      if (this.fuseTimer <= 0) {
        if (this.detonateCallback) this.detonateCallback(world);
        this.detonated = true;
        this.explosionTimer = Bomb.EXPLOSION_DURATION;
      }
    }
  }

  detonate(world: World, damageFn: DamageFn): void {
    const r2 = BLAST_RADIUS * BLAST_RADIUS;
    for (const e of world.entities) {
      const dx = e.position.x - this.position.x;
      const dz = e.position.z - this.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 <= r2) {
        const d = Math.sqrt(d2);
        const dmg = Math.floor(BOMB_DIRECT_DAMAGE * (1 - d / BLAST_RADIUS));
        if (dmg > 0) damageFn(e, dmg);
      }
    }
    // Destroy breakable walls
    const g = world.grid;
    const cs = world.cellSize;
    const minCx = Math.floor((this.position.x - BLAST_RADIUS) / cs);
    const maxCx = Math.floor((this.position.x + BLAST_RADIUS) / cs);
    const minCz = Math.floor((this.position.z - BLAST_RADIUS) / cs);
    const maxCz = Math.floor((this.position.z + BLAST_RADIUS) / cs);
    for (let cz = minCz; cz <= maxCz; cz++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (g.get(cx, cz) === Cell.Breakable) {
          const ccx = (cx + 0.5) * cs;
          const ccz = (cz + 0.5) * cs;
          const dx = ccx - this.position.x;
          const dz = ccz - this.position.z;
          if (dx * dx + dz * dz <= r2) {
            g.set(cx, cz, Cell.Empty);
          }
        }
      }
    }
  }
}

export const ARROW_SPEED = 60;
export const ARROW_STUCK_DURATION = 3.0;
export const ARROW_DAMAGE = 2; // matches BOW_DAMAGE

export class Arrow extends Entity {
  velocity: Vec2;
  damage = ARROW_DAMAGE;
  stuck = false;
  stuckTimer = ARROW_STUCK_DURATION;

  constructor(position: Vec2, direction: Vec2) {
    super(position, { x: 0.15, z: 0.15 });
    const len = Math.sqrt(direction.x * direction.x + direction.z * direction.z) || 1;
    this.velocity = { x: (direction.x / len) * ARROW_SPEED, z: (direction.z / len) * ARROW_SPEED };
  }

  update(dt: number, world: World): void {
    if (this.stuck) {
      this.stuckTimer -= dt;
      if (this.stuckTimer <= 0) {
        this.alive = false;
      }
      return;
    }
    // Move
    this.position = add(this.position, scale(this.velocity, dt));
    // Wall collision
    const cs = world.cellSize;
    const cx = Math.floor(this.position.x / cs);
    const cz = Math.floor(this.position.z / cs);
    if (isSolid(world.grid.get(cx, cz))) {
      this.stuck = true;
      this.velocity = { x: 0, z: 0 };
    }
  }
}

export class FireBolt extends Entity {
  velocity: Vec2;
  lifetime = FIREBOLT_LIFETIME;
  damage = FIREBOLT_DAMAGE;
  ownerId: number;

  constructor(position: Vec2, direction: Vec2, ownerId = -1) {
    super(position, { x: 0.15, z: 0.15 });
    const speed = FIREBOLT_SPEED;
    const len = Math.sqrt(direction.x * direction.x + direction.z * direction.z) || 1;
    this.velocity = { x: (direction.x / len) * speed, z: (direction.z / len) * speed };
    this.ownerId = ownerId;
  }

  update(dt: number, world: World): void {
    this.position = add(this.position, scale(this.velocity, dt));
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.alive = false;
      return;
    }
    const cs = world.cellSize;
    const cx = Math.floor(this.position.x / cs);
    const cz = Math.floor(this.position.z / cs);
    if (isSolid(world.grid.get(cx, cz))) {
      this.alive = false;
    }
  }
}
