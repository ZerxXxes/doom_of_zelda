import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Arrow } from '../entities/projectile';
import { fromYaw } from '../math/vec2';

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
    const startPos = {
      x: player.position.x + forward.x * 0.5,
      z: player.position.z + forward.z * 0.5,
    };
    world.add(new Arrow(startPos, forward));
  }
}
