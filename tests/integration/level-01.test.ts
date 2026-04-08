import { describe, it, expect } from 'vitest';
import { loadLevel } from '../../src/level/level-loader';
import lvl from '../../src/data/level-01.json';
import type { LevelJson } from '../../src/level/level';

describe('level-01 loads', () => {
  it('parses without throwing', () => {
    expect(() => loadLevel(lvl as LevelJson)).not.toThrow();
  });

  it('has at least one player spawn', () => {
    const l = loadLevel(lvl as LevelJson);
    expect(l.spawns.player).toBeDefined();
  });

  it('contains a purple knight (boss)', () => {
    const l = loadLevel(lvl as LevelJson);
    expect(l.spawns.enemies.some((e) => e.type === 'purple_knight')).toBe(true);
  });

  it('contains a small_key pickup', () => {
    const l = loadLevel(lvl as LevelJson);
    expect(l.spawns.pickups.some((p) => p.type === 'small_key')).toBe(true);
  });

  it('contains at least one locked door', () => {
    const l = loadLevel(lvl as LevelJson);
    expect(l.spawns.doors.some((d) => d.locked)).toBe(true);
  });
});
