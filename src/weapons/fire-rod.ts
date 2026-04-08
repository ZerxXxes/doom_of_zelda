import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { FireBolt } from '../entities/projectile';
import { fromYaw } from '../math/vec2';

export const FIRE_ROD_MAGIC_COST = 2;
export const FIRE_ROD_COOLDOWN = 0.2;

export class FireRod extends Weapon {
  readonly name = 'Fire Rod';
  readonly cooldownSeconds = FIRE_ROD_COOLDOWN;

  canFire(player: Player): boolean {
    return this.cooldownRemaining <= 0 && player.magic >= FIRE_ROD_MAGIC_COST;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    player.magic -= FIRE_ROD_MAGIC_COST;
    this.cooldownRemaining = this.cooldownSeconds;
    const forward = fromYaw(player.yaw);
    const startPos = {
      x: player.position.x + forward.x * 0.5,
      z: player.position.z + forward.z * 0.5,
    };
    world.add(new FireBolt(startPos, forward));
  }
}
