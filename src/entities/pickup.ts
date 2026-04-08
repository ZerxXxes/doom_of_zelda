import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Player, PickupType } from './player';

export class Pickup extends Entity {
  pickupType: PickupType;

  constructor(position: Vec2, type: PickupType) {
    super(position, { x: 0.3, z: 0.3 });
    this.pickupType = type;
  }

  update(_dt: number, _world: World): void {
    // Stationary; collected via onTouch from Game
  }

  onTouch(player: Player): void {
    if (!this.alive) return;
    player.applyPickup(this.pickupType);
    this.alive = false;
  }
}
