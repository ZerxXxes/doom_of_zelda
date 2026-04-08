import { describe, it, expect } from 'vitest';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

describe('Grid', () => {
  it('makeGrid() builds a grid of given dimensions filled with Empty', () => {
    const g = makeGrid(3, 4);
    expect(g.width).toBe(3);
    expect(g.height).toBe(4);
    expect(g.cells.length).toBe(12);
    expect(Array.from(g.cells)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('get/set cell by (x, z)', () => {
    const g = makeGrid(3, 3);
    g.set(1, 2, Cell.Wall);
    expect(g.get(1, 2)).toBe(Cell.Wall);
    expect(g.get(0, 0)).toBe(Cell.Empty);
  });

  it('get() returns Wall for out-of-bounds (treats world as walled)', () => {
    const g = makeGrid(3, 3);
    expect(g.get(-1, 0)).toBe(Cell.Wall);
    expect(g.get(0, -1)).toBe(Cell.Wall);
    expect(g.get(3, 0)).toBe(Cell.Wall);
    expect(g.get(0, 3)).toBe(Cell.Wall);
  });

  it('inBounds() returns true only for valid cells', () => {
    const g = makeGrid(3, 3);
    expect(g.inBounds(0, 0)).toBe(true);
    expect(g.inBounds(2, 2)).toBe(true);
    expect(g.inBounds(3, 0)).toBe(false);
    expect(g.inBounds(-1, 0)).toBe(false);
  });
});
