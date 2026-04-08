import { describe, it, expect } from 'vitest';
import {
  EnemyState,
  GreenKnight,
  BlueKnight,
  RedKnight,
  PurpleKnight,
  pickGreedyDirection,
} from '../../src/entities/enemy';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

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

describe('Enemy state machine', () => {
  it('starts in IDLE', () => {
    const e = new GreenKnight({ x: 1, z: 1 });
    expect(e.state).toBe(EnemyState.Idle);
  });

  it('IDLE -> CHASE when player is in aggro range and LOS clear', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 1, z: 1 });
    const p = new Player({ x: 2.5, z: 1 });
    w.add(e);
    w.add(p);
    e.update(0.016, w);
    expect(e.state).toBe(EnemyState.Chase);
  });

  it('IDLE stays IDLE when LOS is blocked', () => {
    const g = buildGrid([
      '....',
      '.#..',
      '....',
    ]);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 0.5, z: 1.5 });
    const p = new Player({ x: 2.5, z: 1.5 });
    w.add(e);
    w.add(p);
    e.update(0.016, w);
    expect(e.state).toBe(EnemyState.Idle);
  });

  it('CHASE -> ATTACK when in melee range', () => {
    const g = buildGrid(['...', '...', '...']);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 1, z: 1 });
    const p = new Player({ x: 1.4, z: 1 });
    w.add(e);
    w.add(p);
    e.state = EnemyState.Chase;
    e.update(0.016, w);
    expect(e.state).toBe(EnemyState.Attack);
  });

  it('takeDamage triggers HURT and reduces hp', () => {
    const e = new GreenKnight({ x: 1, z: 1 });
    e.takeDamage(1);
    expect(e.hp).toBe(1);
    expect(e.state).toBe(EnemyState.Hurt);
  });

  it('hp <= 0 transitions to DYING', () => {
    const e = new GreenKnight({ x: 1, z: 1 });
    e.takeDamage(99);
    expect(e.state).toBe(EnemyState.Dying);
    expect(e.hp).toBeLessThanOrEqual(0);
  });

  it('DYING -> alive=false after death animation', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 1, z: 0 });
    e.takeDamage(99);
    e.update(1.0, w);
    expect(e.alive).toBe(false);
  });
});

describe('pickGreedyDirection', () => {
  it('returns direct vector when path is open', () => {
    const g = buildGrid(['...', '...', '...']);
    const dir = pickGreedyDirection(g, 1, { x: 0.5, z: 0.5 }, { x: 2.5, z: 2.5 }, { x: 0.3, z: 0.3 });
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.z).toBeGreaterThan(0);
  });

  it('returns zero vector when fully walled in', () => {
    const g = buildGrid(['###', '#.#', '###']);
    const dir = pickGreedyDirection(g, 1, { x: 1.5, z: 1.5 }, { x: 5, z: 5 }, { x: 0.3, z: 0.3 });
    expect(dir.x).toBe(0);
    expect(dir.z).toBe(0);
  });
});

describe('Enemy tier tuning', () => {
  it('GreenKnight has 2 hp', () => {
    expect(new GreenKnight({ x: 0, z: 0 }).hp).toBe(2);
  });
  it('BlueKnight has 5 hp', () => {
    expect(new BlueKnight({ x: 0, z: 0 }).hp).toBe(5);
  });
  it('RedKnight has 4 hp and faster speed', () => {
    const r = new RedKnight({ x: 0, z: 0 });
    expect(r.hp).toBe(4);
    expect(r.speed).toBeGreaterThan(new GreenKnight({ x: 0, z: 0 }).speed);
  });
  it('PurpleKnight has 20 hp', () => {
    expect(new PurpleKnight({ x: 0, z: 0 }).hp).toBe(20);
  });
});
