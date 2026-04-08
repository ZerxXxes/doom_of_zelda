import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Player } from './player';
import { Cell } from '../level/cell';

export const DoorState = {
  Closed: 'CLOSED',
  Opening: 'OPENING',
  Open: 'OPEN',
} as const;

export type DoorStateValue = (typeof DoorState)[keyof typeof DoorState];

export const DOOR_OPEN_DURATION = 0.5;

export type DoorOpenResult = 'locked' | 'opened';

export class Door extends Entity {
  locked: boolean;
  cellX: number;
  cellZ: number;
  state: DoorStateValue = DoorState.Closed;
  openProgress = 0;

  constructor(position: Vec2, locked: boolean, cellX: number, cellZ: number) {
    super(position, { x: 0.5, z: 0.5 });
    this.locked = locked;
    this.cellX = cellX;
    this.cellZ = cellZ;
  }

  update(dt: number, world: World): void {
    if (this.state === DoorState.Opening) {
      this.openProgress += dt / DOOR_OPEN_DURATION;
      if (this.openProgress >= 1) {
        this.openProgress = 1;
        this.state = DoorState.Open;
        world.grid.set(this.cellX, this.cellZ, Cell.Empty);
      }
    }
  }

  tryOpen(player: Player, _world: World): DoorOpenResult {
    if (this.state !== DoorState.Closed) return 'opened';
    if (this.locked) {
      if (!player.hasSmallKey) return 'locked';
      player.hasSmallKey = false;
    }
    this.state = DoorState.Opening;
    return 'opened';
  }
}
