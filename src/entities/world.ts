import { Vec2, sub, dot, length, normalize } from '../math/vec2';
import { Grid } from '../level/grid';
import { lineOfSight, raycastWalls, RaycastHit } from '../level/raycast';
import { Entity } from './entity';

export class World {
  grid: Grid;
  cellSize: number;
  entities: Entity[] = [];

  constructor(grid: Grid, cellSize: number) {
    this.grid = grid;
    this.cellSize = cellSize;
  }

  add(entity: Entity): void {
    this.entities.push(entity);
  }

  removeDead(): void {
    this.entities = this.entities.filter((e) => e.alive);
  }

  raycastWalls(origin: Vec2, direction: Vec2, maxDist: number): RaycastHit | null {
    return raycastWalls(this.grid, origin, direction, maxDist, this.cellSize);
  }

  lineOfSight(a: Vec2, b: Vec2): boolean {
    return lineOfSight(this.grid, a, b, this.cellSize);
  }

  overlapCircle(center: Vec2, radius: number): Entity[] {
    const r2 = radius * radius;
    return this.entities.filter((e) => {
      const dx = e.position.x - center.x;
      const dz = e.position.z - center.z;
      return dx * dx + dz * dz <= r2;
    });
  }

  entitiesInArc(
    center: Vec2,
    forward: Vec2,
    halfArcRad: number,
    radius: number,
  ): Entity[] {
    const f = normalize(forward);
    const cosLimit = Math.cos(halfArcRad);
    return this.overlapCircle(center, radius).filter((e) => {
      const toEntity = sub(e.position, center);
      const dist = length(toEntity);
      if (dist === 0) return true;
      const cosAngle = dot(toEntity, f) / dist;
      return cosAngle >= cosLimit;
    });
  }
}
