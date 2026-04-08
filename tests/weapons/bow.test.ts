import { describe, it, expect } from 'vitest';
import { Bow, BOW_DAMAGE, BOW_RANGE } from '../../src/weapons/bow';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { GreenKnight } from '../../src/entities/enemy';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

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

  it('fire damages first enemy in line', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0;
    const enemy = new GreenKnight({ x: 5, z: 1 });
    w.add(p);
    w.add(enemy);
    const b = new Bow();
    b.fire(p, w);
    expect(enemy.hp).toBe(2 - BOW_DAMAGE);
  });

  it('fire is blocked by walls', () => {
    const g = makeGrid(10, 10);
    g.set(3, 1, Cell.Wall);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1.5 });
    p.yaw = 0;
    const enemy = new GreenKnight({ x: 5, z: 1.5 });
    w.add(p);
    w.add(enemy);
    const b = new Bow();
    b.fire(p, w);
    expect(enemy.hp).toBe(2);
  });

  it('fire respects max range', () => {
    const g = makeGrid(60, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0;
    const enemy = new GreenKnight({ x: 1 + BOW_RANGE + 5, z: 1 });
    w.add(p);
    w.add(enemy);
    const b = new Bow();
    b.fire(p, w);
    expect(enemy.hp).toBe(2);
  });
});
