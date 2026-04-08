import { describe, it, expect } from 'vitest';
import { World } from '../../src/entities/world';
import { Entity } from '../../src/entities/entity';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

class TestEntity extends Entity {
  update() {}
}

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

describe('World', () => {
  it('starts with no entities', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    expect(w.entities).toHaveLength(0);
  });

  it('add() pushes an entity', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const e = new TestEntity({ x: 1, z: 0 }, { x: 0.3, z: 0.3 });
    w.add(e);
    expect(w.entities).toContain(e);
  });

  it('overlapCircle returns entities within radius', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const a = new TestEntity({ x: 0, z: 0 }, { x: 0.3, z: 0.3 });
    const b = new TestEntity({ x: 1, z: 0 }, { x: 0.3, z: 0.3 });
    const c = new TestEntity({ x: 5, z: 0 }, { x: 0.3, z: 0.3 });
    w.add(a);
    w.add(b);
    w.add(c);
    const r = w.overlapCircle({ x: 0, z: 0 }, 1.5);
    expect(r).toContain(a);
    expect(r).toContain(b);
    expect(r).not.toContain(c);
  });

  it('entitiesInArc returns only entities in the forward cone', () => {
    const g = buildGrid(['....', '....', '....']);
    const w = new World(g, 1);
    const front = new TestEntity({ x: 1, z: 0.5 }, { x: 0.3, z: 0.3 });
    const behind = new TestEntity({ x: -1, z: 0.5 }, { x: 0.3, z: 0.3 });
    w.add(front);
    w.add(behind);
    const arc = w.entitiesInArc({ x: 0, z: 0.5 }, { x: 1, z: 0 }, Math.PI / 4, 2);
    expect(arc).toContain(front);
    expect(arc).not.toContain(behind);
  });

  it('lineOfSight delegates to grid raycast', () => {
    const g = buildGrid(['....', '....', '....']);
    const w = new World(g, 1);
    expect(w.lineOfSight({ x: 0.5, z: 0.5 }, { x: 3.5, z: 2.5 })).toBe(true);
  });

  it('removeDead drops entities marked alive=false', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const a = new TestEntity({ x: 0, z: 0 }, { x: 0.3, z: 0.3 });
    const b = new TestEntity({ x: 1, z: 0 }, { x: 0.3, z: 0.3 });
    w.add(a);
    w.add(b);
    a.alive = false;
    w.removeDead();
    expect(w.entities).not.toContain(a);
    expect(w.entities).toContain(b);
  });
});
