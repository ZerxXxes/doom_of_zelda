import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Enemy } from '../entities/enemy';
import { fromYaw, sub, dot, length } from '../math/vec2';

export const BOW_DAMAGE = 2;
export const BOW_RANGE = 50;
export const BOW_COOLDOWN = 0.3;

export class Bow extends Weapon {
  readonly name = 'Bow';
  readonly cooldownSeconds = BOW_COOLDOWN;

  canFire(player: Player): boolean {
    return this.cooldownRemaining <= 0 && player.arrows > 0;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    player.arrows -= 1;
    this.cooldownRemaining = this.cooldownSeconds;

    const forward = fromYaw(player.yaw);
    const wallHit = world.raycastWalls(player.position, forward, BOW_RANGE);
    const wallDist = wallHit?.distance ?? BOW_RANGE;

    let closest: { enemy: Enemy; dist: number } | null = null;
    for (const e of world.entities) {
      if (!(e instanceof Enemy)) continue;
      const toEnemy = sub(e.position, player.position);
      const distAlong = dot(toEnemy, forward);
      if (distAlong <= 0 || distAlong > wallDist) continue;
      const lateral = length({ x: toEnemy.x - forward.x * distAlong, z: toEnemy.z - forward.z * distAlong });
      if (lateral > Math.max(e.halfExtents.x, e.halfExtents.z)) continue;
      if (!closest || distAlong < closest.dist) closest = { enemy: e, dist: distAlong };
    }

    if (closest) closest.enemy.takeDamage(BOW_DAMAGE);
  }
}
