import { describe, it, expect } from 'vitest';
import { Sword, SWORD_DAMAGE, SWORD_RANGE } from '../../src/weapons/sword';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { GreenKnight } from '../../src/entities/enemy';
import { makeGrid } from '../../src/level/grid';

describe('Sword', () => {
  it('canFire when cooldown is 0', () => {
    const s = new Sword();
    const p = new Player({ x: 0, z: 0 });
    expect(s.canFire(p)).toBe(true);
  });

  it('cannot fire while on cooldown', () => {
    const s = new Sword();
    const p = new Player({ x: 0, z: 0 });
    s.cooldownRemaining = 0.1;
    expect(s.canFire(p)).toBe(false);
  });

  it('fire damages enemies in front arc', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0; // facing +x
    const enemy = new GreenKnight({ x: 2, z: 1 });
    w.add(p);
    w.add(enemy);
    const s = new Sword();
    s.fire(p, w);
    expect(enemy.hp).toBe(2 - SWORD_DAMAGE);
  });

  it('fire ignores enemies behind the player', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 5, z: 5 });
    p.yaw = 0; // facing +x
    const enemy = new GreenKnight({ x: 4, z: 5 }); // behind
    w.add(p);
    w.add(enemy);
    const s = new Sword();
    s.fire(p, w);
    expect(enemy.hp).toBe(2);
  });

  it('fire ignores enemies outside range', () => {
    const g = makeGrid(20, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const enemy = new GreenKnight({ x: 1 + SWORD_RANGE + 1, z: 1 });
    w.add(p);
    w.add(enemy);
    const s = new Sword();
    s.fire(p, w);
    expect(enemy.hp).toBe(2);
  });

  it('fire sets cooldown', () => {
    const g = makeGrid(5, 5);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const s = new Sword();
    s.fire(p, w);
    expect(s.cooldownRemaining).toBe(s.cooldownSeconds);
  });
});
