import { Vec2, sub, length, distance } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Player } from './player';
import { Grid } from '../level/grid';
import { isSolid } from '../level/cell';
import { resolveMovement } from '../level/collision';
import { makeAABB } from '../math/aabb';

export const EnemyState = {
  Idle: 'IDLE',
  Chase: 'CHASE',
  Attack: 'ATTACK',
  Hurt: 'HURT',
  Dying: 'DYING',
} as const;

export type EnemyStateValue = (typeof EnemyState)[keyof typeof EnemyState];

const HURT_DURATION = 0.15;
const DYING_DURATION = 0.5;
export const ATTACK_DURATION = 0.5;

export abstract class Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  aggroRange: number;
  meleeRange: number;
  state: EnemyStateValue = EnemyState.Idle;
  stateTimer = 0;
  attackCooldown = 0;
  hasDealtAttackDamage = false;

  constructor(
    position: Vec2,
    hp: number,
    speed: number,
    damage: number,
    aggroRange: number,
    meleeRange = 1.0,
  ) {
    super(position, { x: 0.4, z: 0.4 });
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.damage = damage;
    this.aggroRange = aggroRange;
    this.meleeRange = meleeRange;
  }

  update(dt: number, world: World): void {
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    switch (this.state) {
      case EnemyState.Idle:
        this.tickIdle(world);
        break;
      case EnemyState.Chase:
        this.tickChase(dt, world);
        break;
      case EnemyState.Attack:
        this.tickAttack(dt, world);
        break;
      case EnemyState.Hurt:
        this.tickHurt(dt);
        break;
      case EnemyState.Dying:
        this.tickDying(dt);
        break;
    }
  }

  protected tickIdle(world: World): void {
    const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
    if (!player) return;
    const d = distance(this.position, player.position);
    if (d <= this.aggroRange && world.lineOfSight(this.position, player.position)) {
      this.state = EnemyState.Chase;
    }
  }

  protected tickChase(dt: number, world: World): void {
    const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
    if (!player) return;
    const d = distance(this.position, player.position);
    if (d <= this.meleeRange) {
      this.state = EnemyState.Attack;
      this.stateTimer = ATTACK_DURATION;
      this.hasDealtAttackDamage = false;
      return;
    }
    const dir = pickGreedyDirection(world.grid, world.cellSize, this.position, player.position, this.halfExtents);
    if (dir.x === 0 && dir.z === 0) return;
    const motion = { x: dir.x * this.speed * dt, z: dir.z * this.speed * dt };
    this.position = resolveMovement(world.grid, makeAABB(this.position, this.halfExtents), motion, world.cellSize);
    this.yaw = Math.atan2(dir.z, dir.x);
  }

  protected tickAttack(dt: number, world: World): void {
    this.stateTimer -= dt;
    if (!this.hasDealtAttackDamage && this.stateTimer <= ATTACK_DURATION / 2) {
      const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
      if (player && distance(this.position, player.position) <= this.meleeRange + 0.2) {
        player.takeDamage(this.damage);
      }
      this.hasDealtAttackDamage = true;
    }
    if (this.stateTimer <= 0) {
      this.state = EnemyState.Chase;
    }
  }

  protected tickHurt(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.state = EnemyState.Chase;
    }
  }

  protected tickDying(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.alive = false;
    }
  }

  takeDamage(amount: number): void {
    if (this.state === EnemyState.Dying) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.state = EnemyState.Dying;
      this.stateTimer = DYING_DURATION;
    } else {
      this.state = EnemyState.Hurt;
      this.stateTimer = HURT_DURATION;
    }
  }
}

export class GreenKnight extends Enemy {
  constructor(position: Vec2) {
    super(position, 2, 2.0, 1, 8, 1.0);
  }
}

export class BlueKnight extends Enemy {
  shieldChance = 0.3;
  constructor(position: Vec2) {
    super(position, 5, 2.5, 2, 10, 1.0);
  }
  isShielded(): boolean {
    return this.state === EnemyState.Attack && (this.stateTimer * 10) % 1 < this.shieldChance;
  }
}

const RED_CHARGE_DURATION = 1.0;
const RED_CHARGE_MULTIPLIER = 2.0;

export class RedKnight extends Enemy {
  charging = false;
  chargeTimer = 0;
  chargeDir: Vec2 = { x: 0, z: 0 };

  constructor(position: Vec2) {
    super(position, 4, 4.5, 2, 12, 1.0);
  }

  startCharge(player: Player): void {
    this.charging = true;
    this.chargeTimer = RED_CHARGE_DURATION;
    const d = sub(player.position, this.position);
    const len = length(d);
    if (len === 0) {
      this.chargeDir = { x: 1, z: 0 };
    } else {
      this.chargeDir = { x: d.x / len, z: d.z / len };
    }
  }

  protected tickChase(dt: number, world: World): void {
    if (!this.charging) {
      const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
      if (player && distance(this.position, player.position) > this.meleeRange) {
        this.startCharge(player);
      }
    }
    if (this.charging) {
      this.chargeTimer -= dt;
      const motion = {
        x: this.chargeDir.x * this.speed * RED_CHARGE_MULTIPLIER * dt,
        z: this.chargeDir.z * this.speed * RED_CHARGE_MULTIPLIER * dt,
      };
      this.position = resolveMovement(world.grid, makeAABB(this.position, this.halfExtents), motion, world.cellSize);
      this.yaw = Math.atan2(this.chargeDir.z, this.chargeDir.x);
      if (this.chargeTimer <= 0) {
        this.charging = false;
      }
      const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
      if (player && distance(this.position, player.position) <= this.meleeRange) {
        this.state = EnemyState.Attack;
        this.stateTimer = ATTACK_DURATION;
        this.hasDealtAttackDamage = false;
        this.charging = false;
      }
      return;
    }
    super.tickChase(dt, world);
  }
}

export class PurpleKnight extends Enemy {
  spawnedMinionsAt50 = false;
  spawnedMinionsAt25 = false;

  constructor(position: Vec2) {
    super(position, 20, 3.0, 4, 9999, 1.5);
  }

  maybeSummon(world: World): void {
    const half = this.maxHp / 2;
    const quarter = this.maxHp / 4;
    if (!this.spawnedMinionsAt50 && this.hp <= half) {
      this.spawnMinions(world);
      this.spawnedMinionsAt50 = true;
    } else if (!this.spawnedMinionsAt25 && this.hp <= quarter) {
      this.spawnMinions(world);
      this.spawnedMinionsAt25 = true;
    }
  }

  private spawnMinions(world: World): void {
    world.add(new GreenKnight({ x: this.position.x - 2, z: this.position.z - 2 }));
    world.add(new GreenKnight({ x: this.position.x + 2, z: this.position.z - 2 }));
  }
}

const DIR_8: Vec2[] = [
  { x: 1, z: 0 },
  { x: 0.7071, z: 0.7071 },
  { x: 0, z: 1 },
  { x: -0.7071, z: 0.7071 },
  { x: -1, z: 0 },
  { x: -0.7071, z: -0.7071 },
  { x: 0, z: -1 },
  { x: 0.7071, z: -0.7071 },
];

export function pickGreedyDirection(
  grid: Grid,
  cellSize: number,
  from: Vec2,
  to: Vec2,
  halfExtents: Vec2,
): Vec2 {
  const desired = sub(to, from);
  const len = length(desired);
  if (len === 0) return { x: 0, z: 0 };
  const ndesired = { x: desired.x / len, z: desired.z / len };

  const sorted = [...DIR_8].sort((a, b) => {
    const da = a.x * ndesired.x + a.z * ndesired.z;
    const db = b.x * ndesired.x + b.z * ndesired.z;
    return db - da;
  });

  // Probe far enough to always cross into the adjacent cell.
  // For a diagonal direction the component is 0.7071, so we need the probe
  // distance d such that d * 0.7071 > cellSize * 0.5 (worst case: standing at
  // cell centre).  d = cellSize * 0.8 satisfies this.
  const probeStep = Math.max(halfExtents.x, halfExtents.z, cellSize * 0.8);
  for (const dir of sorted) {
    const probe = { x: from.x + dir.x * probeStep, z: from.z + dir.z * probeStep };
    const cx = Math.floor(probe.x / cellSize);
    const cz = Math.floor(probe.z / cellSize);
    if (!isSolid(grid.get(cx, cz))) {
      return dir;
    }
  }
  return { x: 0, z: 0 };
}
