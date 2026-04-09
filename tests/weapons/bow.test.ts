import { describe, it, expect } from 'vitest';
import { Bow, BOW_RANGE } from '../../src/weapons/bow';
import { Arrow } from '../../src/entities/projectile';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { makeGrid } from '../../src/level/grid';

describe('Bow', () => {
  it('canFire when arrows > 0 and cooldown ready', () => {
    const b = new Bow();
    const p = new Player({ x: 0, z: 0 });
    expect(b.canFire(p)).toBe(true);
  });

  it('cannot fire when out of arrows', () => {
    const b = new Bow();
    const p = new Player({ x: 0, z: 0 });
    p.arrows = 0;
    expect(b.canFire(p)).toBe(false);
  });

  it('fire consumes one arrow', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const b = new Bow();
    b.fire(p, w);
    expect(p.arrows).toBe(9);
  });

  it('fire spawns an Arrow projectile', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0;
    const b = new Bow();
    b.fire(p, w);
    expect(w.entities.some((e) => e instanceof Arrow)).toBe(true);
  });

  it('BOW_RANGE is exported', () => {
    expect(BOW_RANGE).toBeGreaterThan(0);
  });
});
