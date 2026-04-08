import { describe, it, expect } from 'vitest';
import { loadLevel } from '../../src/level/level-loader';
import { Cell } from '../../src/level/cell';
import fixture from '../fixtures/test-level.json';
describe('loadLevel', () => {
    it('parses width, height, gridSize, theme, name', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.width).toBe(5);
        expect(lvl.height).toBe(5);
        expect(lvl.gridSize).toBe(4);
        expect(lvl.theme).toBe('castle');
        expect(lvl.name).toBe('Test Level');
    });
    it('builds the wall grid from ASCII tiles', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.grid.get(0, 0)).toBe(Cell.Wall);
        expect(lvl.grid.get(4, 4)).toBe(Cell.Wall);
        expect(lvl.grid.get(1, 1)).toBe(Cell.Empty);
        expect(lvl.grid.get(2, 2)).toBe(Cell.Empty);
        expect(lvl.grid.get(3, 3)).toBe(Cell.LockedDoor);
    });
    it('parses player spawn', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.spawns.player).toEqual({ x: 1.5, z: 1.5, yaw: 0 });
    });
    it('parses enemy spawns', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.spawns.enemies).toHaveLength(1);
        expect(lvl.spawns.enemies[0]).toEqual({ type: 'green_knight', x: 2.5, z: 2.5 });
    });
    it('parses pickup spawns', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.spawns.pickups).toHaveLength(1);
        expect(lvl.spawns.pickups[0]).toEqual({ type: 'small_key', x: 1.5, z: 3.5 });
    });
    it('extracts door positions from the tiles', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.spawns.doors).toHaveLength(1);
        expect(lvl.spawns.doors[0]).toEqual({ x: 3, z: 3, locked: true });
    });
    it('parses ambient settings', () => {
        const lvl = loadLevel(fixture);
        expect(lvl.ambient.wallHeight).toBe(4);
        expect(lvl.ambient.floorColor).toBe('#2a1e12');
        expect(lvl.ambient.fogDensity).toBe(0.04);
    });
    it('throws on row length mismatch', () => {
        const bad = { ...fixture, tiles: ['###', '##', '###', '###', '###'] };
        expect(() => loadLevel(bad)).toThrow(/row length/i);
    });
    it('throws on unknown legend char', () => {
        const bad = {
            ...fixture,
            tiles: ['#####', '#.?.#', '#...#', '#...#', '#####'],
        };
        expect(() => loadLevel(bad)).toThrow(/unknown.*char/i);
    });
    it('throws when row count does not match height', () => {
        const bad = { ...fixture, tiles: ['#####', '#####'] };
        expect(() => loadLevel(bad)).toThrow(/row count/i);
    });
});
