import { Vec2 } from './vec2';

export interface AABB {
  center: Vec2;
  halfExtents: Vec2;
}

export interface CellRange {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function makeAABB(center: Vec2, halfExtents: Vec2): AABB {
  return { center, halfExtents };
}

export function aabbOverlaps(a: AABB, b: AABB): boolean {
  const dx = Math.abs(a.center.x - b.center.x);
  const dz = Math.abs(a.center.z - b.center.z);
  return dx <= a.halfExtents.x + b.halfExtents.x && dz <= a.halfExtents.z + b.halfExtents.z;
}

export function aabbContainsPoint(a: AABB, p: Vec2): boolean {
  return (
    Math.abs(a.center.x - p.x) <= a.halfExtents.x &&
    Math.abs(a.center.z - p.z) <= a.halfExtents.z
  );
}

export function aabbCellRange(a: AABB, cellSize: number): CellRange {
  return {
    minX: Math.floor((a.center.x - a.halfExtents.x) / cellSize),
    maxX: Math.floor((a.center.x + a.halfExtents.x) / cellSize),
    minZ: Math.floor((a.center.z - a.halfExtents.z) / cellSize),
    maxZ: Math.floor((a.center.z + a.halfExtents.z) / cellSize),
  };
}
