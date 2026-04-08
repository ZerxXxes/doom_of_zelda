import { describe, it, expect } from 'vitest';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { raycastWalls, lineOfSight } from '../../src/level/raycast';

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

describe('raycastWalls', () => {
  it('returns null when nothing is hit', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 0.5 }, { x: 1, z: 0 }, 2, CELL_SIZE);
    expect(hit).toBeNull();
  });

  it('hits a wall in front', () => {
    const g = buildGrid([
      '..#.',
      '..#.',
      '..#.',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 1.5 }, { x: 1, z: 0 }, 5, CELL_SIZE);
    expect(hit).not.toBeNull();
    expect(hit!.cellX).toBe(2);
    expect(hit!.cellZ).toBe(1);
    expect(hit!.distance).toBeCloseTo(1.5);
  });

  it('respects max distance and returns null beyond it', () => {
    const g = buildGrid([
      '..#.',
      '..#.',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 0.5 }, { x: 1, z: 0 }, 1.0, CELL_SIZE);
    expect(hit).toBeNull();
  });

  it('handles diagonal rays', () => {
    const g = buildGrid([
      '....',
      '....',
      '...#',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 0.5 }, { x: 1, z: 1 }, 10, CELL_SIZE);
    expect(hit).not.toBeNull();
    expect(hit!.cellX).toBe(3);
    expect(hit!.cellZ).toBe(2);
  });

  it('handles negative direction', () => {
    const g = buildGrid([
      '#...',
      '#...',
    ]);
    const hit = raycastWalls(g, { x: 2.5, z: 0.5 }, { x: -1, z: 0 }, 5, CELL_SIZE);
    expect(hit).not.toBeNull();
    expect(hit!.cellX).toBe(0);
  });
});

describe('lineOfSight', () => {
  it('returns true when no walls between', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    expect(lineOfSight(g, { x: 0.5, z: 0.5 }, { x: 3.5, z: 2.5 }, CELL_SIZE)).toBe(true);
  });

  it('returns false when a wall is between', () => {
    const g = buildGrid([
      '....',
      '..#.',
      '....',
    ]);
    expect(lineOfSight(g, { x: 0.5, z: 1.5 }, { x: 3.5, z: 1.5 }, CELL_SIZE)).toBe(false);
  });

  it('returns true when target is the same cell as origin', () => {
    const g = buildGrid([
      '....',
      '....',
    ]);
    expect(lineOfSight(g, { x: 0.5, z: 0.5 }, { x: 0.5, z: 0.5 }, CELL_SIZE)).toBe(true);
  });
});
