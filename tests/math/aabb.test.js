import { describe, it, expect } from 'vitest';
import { makeAABB, aabbOverlaps, aabbContainsPoint, aabbCellRange } from '../../src/math/aabb';
describe('AABB', () => {
    it('makeAABB() builds aabb from center + half-extents', () => {
        const a = makeAABB({ x: 5, z: 5 }, { x: 0.5, z: 0.5 });
        expect(a.center).toEqual({ x: 5, z: 5 });
        expect(a.halfExtents).toEqual({ x: 0.5, z: 0.5 });
    });
    it('aabbOverlaps() returns true for overlapping boxes', () => {
        const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
        const b = makeAABB({ x: 1, z: 0 }, { x: 1, z: 1 });
        expect(aabbOverlaps(a, b)).toBe(true);
    });
    it('aabbOverlaps() returns false for non-overlapping boxes', () => {
        const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
        const b = makeAABB({ x: 5, z: 5 }, { x: 1, z: 1 });
        expect(aabbOverlaps(a, b)).toBe(false);
    });
    it('aabbOverlaps() touching edges count as overlap', () => {
        const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
        const b = makeAABB({ x: 2, z: 0 }, { x: 1, z: 1 });
        expect(aabbOverlaps(a, b)).toBe(true);
    });
    it('aabbContainsPoint() checks if point is inside', () => {
        const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
        expect(aabbContainsPoint(a, { x: 0.5, z: 0.5 })).toBe(true);
        expect(aabbContainsPoint(a, { x: 2, z: 0 })).toBe(false);
    });
    it('aabbCellRange() returns inclusive integer cell bounds for cell size 1', () => {
        const a = makeAABB({ x: 5.3, z: 7.8 }, { x: 0.5, z: 0.5 });
        const r = aabbCellRange(a, 1);
        expect(r).toEqual({ minX: 4, maxX: 5, minZ: 7, maxZ: 8 });
    });
    it('aabbCellRange() respects custom cell size', () => {
        const a = makeAABB({ x: 8, z: 12 }, { x: 1, z: 1 });
        const r = aabbCellRange(a, 4);
        expect(r).toEqual({ minX: 1, maxX: 2, minZ: 2, maxZ: 3 });
    });
});
