import { describe, it, expect } from 'vitest';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { resolveMovement } from '../../src/level/collision';
import { makeAABB } from '../../src/math/aabb';

const CELL_SIZE = 1;

function buildGrid(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const g = makeGrid(w, h);
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      g.set(x, z, rows[z][x] === '#' ? Cell.Wall : Cell.Empty);
    }
  }
  return g;
}

describe('resolveMovement', () => {
  it('passes through unobstructed motion', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
      '....',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 0.5, z: 0 }, CELL_SIZE);
    expect(result.x).toBeCloseTo(1.5);
    expect(result.z).toBeCloseTo(1.0);
  });

  it('stops on X axis when wall blocks horizontal motion', () => {
    const g = buildGrid([
      '....',
      '..#.',
      '....',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 1.0, z: 0 }, CELL_SIZE);
    // Wall at cell (2,1) spans world x [2,3]. AABB max-x must stop at 2 → center.x = 1.7
    expect(result.x).toBeCloseTo(1.7);
    expect(result.z).toBeCloseTo(1.0);
  });

  it('stops on Z axis when wall blocks vertical motion', () => {
    const g = buildGrid([
      '....',
      '....',
      '..#.',
    ]);
    const aabb = makeAABB({ x: 2.5, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 0, z: 1.0 }, CELL_SIZE);
    expect(result.z).toBeCloseTo(1.7);
    expect(result.x).toBeCloseTo(2.5);
  });

  it('slides along a wall when moving diagonally into it', () => {
    // Wall on the right at x = 2
    const g = buildGrid([
      '..#.',
      '..#.',
      '..#.',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 1.0, z: 0.5 }, CELL_SIZE);
    // X is blocked at 1.7, Z slides freely to 1.5
    expect(result.x).toBeCloseTo(1.7);
    expect(result.z).toBeCloseTo(1.5);
  });

  it('slides along a wall in the other direction', () => {
    // Wall on the bottom at z = 2
    const g = buildGrid([
      '....',
      '....',
      '####',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 0.5, z: 1.0 }, CELL_SIZE);
    expect(result.x).toBeCloseTo(1.5);
    expect(result.z).toBeCloseTo(1.7);
  });

  it('handles negative motion (moving left into a wall)', () => {
    const g = buildGrid([
      '....',
      '#...',
      '....',
    ]);
    const aabb = makeAABB({ x: 2.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: -1.5, z: 0 }, CELL_SIZE);
    // Wall at x=0 spans [0,1]. AABB min x = result.x - 0.3 must be >= 1, so result.x >= 1.3
    expect(result.x).toBeCloseTo(1.3);
  });

  it('treats out-of-bounds as walls (player cannot leave the map)', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    const aabb = makeAABB({ x: 0.5, z: 0.5 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: -1, z: -1 }, CELL_SIZE);
    expect(result.x).toBeCloseTo(0.3);
    expect(result.z).toBeCloseTo(0.3);
  });
});
