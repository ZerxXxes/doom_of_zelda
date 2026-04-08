import { Vec2 } from '../math/vec2';
import { AABB, makeAABB } from '../math/aabb';
import type { World } from './world';

export abstract class Entity {
  position: Vec2;
  yaw: number;
  halfExtents: Vec2;
  alive: boolean;

  constructor(position: Vec2, halfExtents: Vec2, yaw = 0) {
    this.position = { x: position.x, z: position.z };
    this.yaw = yaw;
    this.halfExtents = { x: halfExtents.x, z: halfExtents.z };
    this.alive = true;
  }

  abstract update(dt: number, world: World): void;

  getAABB(): AABB {
    return makeAABB(this.position, this.halfExtents);
  }
}
