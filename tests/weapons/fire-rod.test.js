import { describe, it, expect } from 'vitest';
import { FireRod, FIRE_ROD_MAGIC_COST } from '../../src/weapons/fire-rod';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { FireBolt } from '../../src/entities/projectile';
import { makeGrid } from '../../src/level/grid';
describe('FireRod', () => {
    it('cannot fire when magic < cost', () => {
        const r = new FireRod();
        const p = new Player({ x: 0, z: 0 });
        p.magic = 1;
        expect(r.canFire(p)).toBe(false);
    });
    it('fire consumes magic and spawns a FireBolt', () => {
        const g = makeGrid(10, 10);
        const w = new World(g, 1);
        const p = new Player({ x: 1, z: 1 });
        const r = new FireRod();
        r.fire(p, w);
        expect(p.magic).toBe(16 - FIRE_ROD_MAGIC_COST);
        expect(w.entities.some((e) => e instanceof FireBolt)).toBe(true);
    });
});
