import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Bomb } from '../entities/projectile';
import { Enemy } from '../entities/enemy';
import { fromYaw, scale } from '../math/vec2';

export const BOMB_COOLDOWN = 0.7;
export const BOMB_THROW_SPEED = 8;

export class Bombs extends Weapon {
  readonly name = 'Bombs';
  readonly cooldownSeconds = BOMB_COOLDOWN;

  canFire(player: Player): boolean {
    return this.cooldownRemaining <= 0 && player.bombs > 0;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    player.bombs -= 1;
    this.cooldownRemaining = this.cooldownSeconds;
    const forward = fromYaw(player.yaw);
    const startPos = {
      x: player.position.x + forward.x * 0.5,
      z: player.position.z + forward.z * 0.5,
    };
    const bomb = new Bomb(startPos, scale(forward, BOMB_THROW_SPEED), -1);
    bomb.detonateCallback = (w) => {
      bomb.detonate(w, (target, dmg) => {
        if (target instanceof Enemy) target.takeDamage(dmg);
        else if (target instanceof Player) target.takeDamage(dmg);
      });
    };
    world.add(bomb);
  }
}
