import { describe, it, expect } from 'vitest';
import { Bomb, FireBolt, BLAST_RADIUS, BOMB_DIRECT_DAMAGE, BOMB_GRAVITY } from '../../src/entities/projectile';
import { World } from '../../src/entities/world';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { Entity } from '../../src/entities/entity';

class TestTarget extends Entity {
  hp = 10;
  constructor(pos: { x: number; z: number }) {
    super(pos, { x: 0.4, z: 0.4 });
  }
  update() {}
}

describe('Bomb projectile', () => {
  it('applies gravity to vertical velocity over time', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const b = new Bomb({ x: 0, z: 0 }, { x: 0, z: 0 }, 0);
    b.heightVelocity = 4;
    b.update(0.5, w);
    // After 0.5s with BOMB_GRAVITY: 4 + (-15 * 0.5) = 4 - 7.5 = -3.5
    expect(b.heightVelocity).toBeCloseTo(4 + BOMB_GRAVITY * 0.5);
  });

  it('detonates after landing and fuse burns, then enters explosion phase', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const b = new Bomb({ x: 1, z: 1 }, { x: 0, z: 0 }, 0);
    // Manually settle the bomb on the ground and set fuse almost expired
    b.grounded = true;
    b.fuseTimer = 0.01;
    b.update(0.02, w);
    // Bomb is now detonated but still alive during explosion animation
    expect(b.detonated).toBe(true);
    expect(b.alive).toBe(true);
    // After explosion duration elapses, bomb becomes dead
    b.update(Bomb.EXPLOSION_DURATION + 0.01, w);
    expect(b.alive).toBe(false);
  });

  it('detonation damages entities within blast radius with falloff', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const t1 = new TestTarget({ x: 0, z: 0 });
    const t2 = new TestTarget({ x: 1.5, z: 0 });
    const t3 = new TestTarget({ x: BLAST_RADIUS + 2, z: 0 });
    w.add(t1);
    w.add(t2);
    w.add(t3);
    const b = new Bomb({ x: 0, z: 0 }, { x: 0, z: 0 }, 0);
    b.detonate(w, (target, dmg) => {
      (target as TestTarget).hp -= dmg;
    });
    expect(t1.hp).toBe(10 - BOMB_DIRECT_DAMAGE);
    expect(t2.hp).toBeLessThan(10);
    expect(t2.hp).toBeGreaterThan(10 - BOMB_DIRECT_DAMAGE);
    expect(t3.hp).toBe(10);
  });

  it('detonation destroys breakable wall cells in radius', () => {
    const g = makeGrid(5, 5);
    g.set(2, 2, Cell.Breakable);
    const w = new World(g, 1);
    const b = new Bomb({ x: 2.5, z: 2.5 }, { x: 0, z: 0 }, 0);
    b.detonate(w, () => {});
    expect(g.get(2, 2)).toBe(Cell.Empty);
  });
});

describe('FireBolt projectile', () => {
  it('moves in its direction at fire bolt speed', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const f = new FireBolt({ x: 1, z: 1 }, { x: 1, z: 0 });
    f.update(0.1, w);
    expect(f.position.x).toBeGreaterThan(1);
    expect(f.position.z).toBeCloseTo(1);
  });

  it('dies when it hits a wall', () => {
    const g = makeGrid(5, 5);
    g.set(3, 1, Cell.Wall);
    const w = new World(g, 1);
    const f = new FireBolt({ x: 1, z: 1.5 }, { x: 1, z: 0 });
    for (let i = 0; i < 10; i++) f.update(0.1, w);
    expect(f.alive).toBe(false);
  });
});
