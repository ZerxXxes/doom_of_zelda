import { Vec2, scale, add } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Cell, isSolid } from '../level/cell';

export const BOMB_GRAVITY = -12;
export const BOMB_LIFETIME = 2.0;
export const BLAST_RADIUS = 3.0;
export const BOMB_DIRECT_DAMAGE = 8;

export const FIREBOLT_SPEED = 20;
export const FIREBOLT_DAMAGE = 4;
export const FIREBOLT_LIFETIME = 2.0;

export type DamageFn = (target: Entity, dmg: number) => void;

export class Bomb extends Entity {
  velocity: Vec2;
  heightVelocity: number;
  lifetime = BOMB_LIFETIME;
  ownerId: number;
  detonateCallback?: (world: World) => void;

  constructor(position: Vec2, velocity: Vec2, ownerId: number) {
    super(position, { x: 0.2, z: 0.2 });
    this.velocity = { ...velocity };
    this.heightVelocity = 4;
    this.ownerId = ownerId;
  }

  update(dt: number, world: World): void {
    this.heightVelocity += BOMB_GRAVITY * dt;
    this.position = add(this.position, scale(this.velocity, dt));
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      if (this.detonateCallback) this.detonateCallback(world);
      this.alive = false;
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
