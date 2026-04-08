import { Player } from '../entities/player';
import { World } from '../entities/world';

export abstract class Weapon {
  abstract readonly name: string;
  abstract readonly cooldownSeconds: number;
  cooldownRemaining = 0;

  abstract canFire(player: Player): boolean;
  abstract fire(player: Player, world: World): void;

  tick(dt: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }
  }
}
