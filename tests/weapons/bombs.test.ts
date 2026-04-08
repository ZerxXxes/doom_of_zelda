import { describe, it, expect } from 'vitest';
import { Bombs } from '../../src/weapons/bombs';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { Bomb } from '../../src/entities/projectile';
import { makeGrid } from '../../src/level/grid';

describe('Bombs', () => {
  it('cannot fire when bombs = 0', () => {
    const b = new Bombs();
    const p = new Player({ x: 0, z: 0 });
    p.bombs = 0;
    expect(b.canFire(p)).toBe(false);
  });

  it('fire spawns a Bomb projectile and consumes one bomb', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const b = new Bombs();
    b.fire(p, w);
    expect(p.bombs).toBe(4);
    expect(w.entities.some((e) => e instanceof Bomb)).toBe(true);
  });
});
