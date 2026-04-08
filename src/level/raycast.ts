import { Vec2, distance, normalize } from '../math/vec2';
import { Grid } from './grid';
import { isSolid } from './cell';

export interface RaycastHit {
  distance: number;
  point: Vec2;
  cellX: number;
  cellZ: number;
}

/**
 * Walks the grid using a 2D DDA (Digital Differential Analyzer).
 * Returns the first solid-cell hit within maxDist, or null.
 */
export function raycastWalls(
  grid: Grid,
  origin: Vec2,
  direction: Vec2,
  maxDist: number,
  cellSize: number,
): RaycastHit | null {
  const dir = normalize(direction);
  if (dir.x === 0 && dir.z === 0) return null;

  let cellX = Math.floor(origin.x / cellSize);
  let cellZ = Math.floor(origin.z / cellSize);

  // Distance the ray must travel to cross one cell in each axis.
  const deltaX = dir.x === 0 ? Infinity : Math.abs(cellSize / dir.x);
  const deltaZ = dir.z === 0 ? Infinity : Math.abs(cellSize / dir.z);

  // Initial side distance — distance from origin to the first X/Z grid line.
  let sideX: number;
  let sideZ: number;
  let stepX: number;
  let stepZ: number;

  if (dir.x < 0) {
    stepX = -1;
    sideX = (origin.x - cellX * cellSize) / Math.abs(dir.x);
  } else {
    stepX = 1;
    sideX = ((cellX + 1) * cellSize - origin.x) / dir.x;
  }
  if (dir.z < 0) {
    stepZ = -1;
    sideZ = (origin.z - cellZ * cellSize) / Math.abs(dir.z);
  } else {
    stepZ = 1;
    sideZ = ((cellZ + 1) * cellSize - origin.z) / dir.z;
  }

  let dist = 0;
  // Safety cap to avoid infinite loops on degenerate input.
  for (let i = 0; i < 1000; i++) {
    if (Math.abs(sideX - sideZ) < 1e-9) {
      // Exact diagonal: ray passes through a grid corner shared by four cells.
      // Step X first and check; if solid, report it. Otherwise step Z too.
      dist = sideX;
      sideX += deltaX;
      sideZ += deltaZ;
      cellX += stepX;
      if (dist > maxDist) return null;
      if (isSolid(grid.get(cellX, cellZ))) {
        return {
          distance: dist,
          point: { x: origin.x + dir.x * dist, z: origin.z + dir.z * dist },
          cellX,
          cellZ,
        };
      }
      cellZ += stepZ;
    } else if (sideX < sideZ) {
      dist = sideX;
      sideX += deltaX;
      cellX += stepX;
    } else {
      dist = sideZ;
      sideZ += deltaZ;
      cellZ += stepZ;
    }
    if (dist > maxDist) return null;
    if (isSolid(grid.get(cellX, cellZ))) {
      return {
        distance: dist,
        point: { x: origin.x + dir.x * dist, z: origin.z + dir.z * dist },
        cellX,
        cellZ,
      };
    }
  }
  return null;
}

export function lineOfSight(grid: Grid, a: Vec2, b: Vec2, cellSize: number): boolean {
  const dir = { x: b.x - a.x, z: b.z - a.z };
  const dist = distance(a, b);
  if (dist === 0) return true;
  const hit = raycastWalls(grid, a, dir, dist, cellSize);
  return hit === null;
}
