import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';

export class Decoration extends Entity {
  decorationType: string;

  constructor(position: Vec2, type: string) {
    super(position, { x: 0.1, z: 0.1 }); // tiny AABB, no gameplay collision
    this.decorationType = type;
  }

  update(_dt: number, _world: World): void {
    // Static — no behavior
  }
}
