import { describe, it, expect } from 'vitest';
import { add, sub, scale, length, normalize, dot, crossZ, distance, fromYaw, rotate } from '../../src/math/vec2';
describe('Vec2', () => {
    it('add() returns componentwise sum', () => {
        expect(add({ x: 1, z: 2 }, { x: 3, z: 4 })).toEqual({ x: 4, z: 6 });
    });
    it('sub() returns componentwise difference', () => {
        expect(sub({ x: 5, z: 7 }, { x: 1, z: 2 })).toEqual({ x: 4, z: 5 });
    });
    it('scale() multiplies both components by scalar', () => {
        expect(scale({ x: 2, z: 3 }, 2)).toEqual({ x: 4, z: 6 });
    });
    it('length() returns euclidean magnitude', () => {
        expect(length({ x: 3, z: 4 })).toBe(5);
    });
    it('normalize() returns unit vector for non-zero input', () => {
        const n = normalize({ x: 3, z: 4 });
        expect(n.x).toBeCloseTo(0.6);
        expect(n.z).toBeCloseTo(0.8);
    });
    it('normalize() returns zero vector for zero input', () => {
        expect(normalize({ x: 0, z: 0 })).toEqual({ x: 0, z: 0 });
    });
    it('dot() returns scalar dot product', () => {
        expect(dot({ x: 1, z: 0 }, { x: 0, z: 1 })).toBe(0);
        expect(dot({ x: 2, z: 3 }, { x: 4, z: 5 })).toBe(23);
    });
    it('crossZ() returns scalar 2D cross', () => {
        expect(crossZ({ x: 1, z: 0 }, { x: 0, z: 1 })).toBe(1);
        expect(crossZ({ x: 0, z: 1 }, { x: 1, z: 0 })).toBe(-1);
    });
    it('distance() returns euclidean distance', () => {
        expect(distance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
    });
    it('fromYaw() converts yaw radians to unit vector', () => {
        const v = fromYaw(0);
        expect(v.x).toBeCloseTo(1);
        expect(v.z).toBeCloseTo(0);
        const u = fromYaw(Math.PI / 2);
        expect(u.x).toBeCloseTo(0);
        expect(u.z).toBeCloseTo(1);
    });
    it('rotate() rotates by angle', () => {
        const v = rotate({ x: 1, z: 0 }, Math.PI / 2);
        expect(v.x).toBeCloseTo(0);
        expect(v.z).toBeCloseTo(1);
    });
});
