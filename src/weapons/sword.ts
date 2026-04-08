import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Enemy } from '../entities/enemy';
import { fromYaw } from '../math/vec2';

export const SWORD_DAMAGE = 2;
export const SWORD_RANGE = 1.5;
export const SWORD_HALF_ARC = Math.PI / 4; // 45° => full arc 90°
export const SWORD_COOLDOWN = 0.4;

export class Sword extends Weapon {
  readonly name = 'Sword';
  readonly cooldownSeconds = SWORD_COOLDOWN;

  canFire(_player: Player): boolean {
    return this.cooldownRemaining <= 0;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    const forward = fromYaw(player.yaw);
    const targets = world.entitiesInArc(player.position, forward, SWORD_HALF_ARC, SWORD_RANGE);
    for (const t of targets) {
      if (t instanceof Enemy) {
        t.takeDamage(SWORD_DAMAGE);
      }
    }
    this.cooldownRemaining = this.cooldownSeconds;
  }
}
