import { Vec2 } from '../math/vec2';
import { AABB, makeAABB, aabbCellRange } from '../math/aabb';
import { Grid } from './grid';
import { isBlocking } from './cell';

/**
 * Resolve a movement intent against the wall grid using axis-separated
 * collision: try X-only motion first (push back if blocked), then Z-only.
 *
 * This produces sliding behaviour: when moving diagonally into a wall, the
 * player slides along the wall instead of dead-stopping.
 *
 * Returns the new center position for the AABB.
 */
export function resolveMovement(
  grid: Grid,
  aabb: AABB,
  motion: Vec2,
  cellSize: number,
): Vec2 {
  const center = { x: aabb.center.x, z: aabb.center.z };

  // Resolve X first
  center.x += motion.x;
  let test = makeAABB(center, aabb.halfExtents);
  if (overlapsAnySolid(grid, test, cellSize)) {
    center.x = pushOutX(grid, test, motion.x, cellSize);
  }

  // Then Z
  center.z += motion.z;
  test = makeAABB(center, aabb.halfExtents);
  if (overlapsAnySolid(grid, test, cellSize)) {
    center.z = pushOutZ(grid, test, motion.z, cellSize);
  }

  return center;
}

function overlapsAnySolid(grid: Grid, aabb: AABB, cellSize: number): boolean {
  const r = aabbCellRange(aabb, cellSize);
  for (let z = r.minZ; z <= r.maxZ; z++) {
    for (let x = r.minX; x <= r.maxX; x++) {
      if (isBlocking(grid.get(x, z))) {
        if (cellOverlapsAabb(x, z, cellSize, aabb)) return true;
      }
    }
  }
  return false;
}

function cellOverlapsAabb(cx: number, cz: number, cellSize: number, aabb: AABB): boolean {
  const minX = cx * cellSize;
  const maxX = (cx + 1) * cellSize;
  const minZ = cz * cellSize;
  const maxZ = (cz + 1) * cellSize;
  const aMinX = aabb.center.x - aabb.halfExtents.x;
  const aMaxX = aabb.center.x + aabb.halfExtents.x;
  const aMinZ = aabb.center.z - aabb.halfExtents.z;
  const aMaxZ = aabb.center.z + aabb.halfExtents.z;
  // Strict overlap (touching edges do NOT count, so the AABB can sit
  // exactly against a wall without re-triggering collision next frame).
  return aMaxX > minX && aMinX < maxX && aMaxZ > minZ && aMinZ < maxZ;
}

function pushOutX(grid: Grid, aabb: AABB, motionX: number, cellSize: number): number {
  const r = aabbCellRange(aabb, cellSize);
  let resultX = aabb.center.x;
  for (let z = r.minZ; z <= r.maxZ; z++) {
    for (let x = r.minX; x <= r.maxX; x++) {
      if (!isBlocking(grid.get(x, z))) continue;
      if (!cellOverlapsAabb(x, z, cellSize, makeAABB({ x: resultX, z: aabb.center.z }, aabb.halfExtents))) continue;
      if (motionX > 0) {
        resultX = x * cellSize - aabb.halfExtents.x;
      } else if (motionX < 0) {
        resultX = (x + 1) * cellSize + aabb.halfExtents.x;
      }
    }
  }
  return resultX;
}

function pushOutZ(grid: Grid, aabb: AABB, motionZ: number, cellSize: number): number {
  const r = aabbCellRange(aabb, cellSize);
  let resultZ = aabb.center.z;
  for (let z = r.minZ; z <= r.maxZ; z++) {
    for (let x = r.minX; x <= r.maxX; x++) {
      if (!isBlocking(grid.get(x, z))) continue;
      if (!cellOverlapsAabb(x, z, cellSize, makeAABB({ x: aabb.center.x, z: resultZ }, aabb.halfExtents))) continue;
      if (motionZ > 0) {
        resultZ = z * cellSize - aabb.halfExtents.z;
      } else if (motionZ < 0) {
        resultZ = (z + 1) * cellSize + aabb.halfExtents.z;
      }
    }
  }
  return resultZ;
}
