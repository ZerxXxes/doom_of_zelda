import { describe, it, expect } from 'vitest';
import { Pickup } from '../../src/entities/pickup';
import { Player } from '../../src/entities/player';
describe('Pickup', () => {
    it('applies its effect to player on touch', () => {
        const p = new Player({ x: 0, z: 0 });
        p.takeDamage(4);
        const pu = new Pickup({ x: 0, z: 0 }, 'heart');
        pu.onTouch(p);
        expect(p.health).toBe(10);
        expect(pu.alive).toBe(false);
    });
    it('does not double-apply if onTouch called twice', () => {
        const p = new Player({ x: 0, z: 0 });
        p.takeDamage(4);
        const pu = new Pickup({ x: 0, z: 0 }, 'heart');
        pu.onTouch(p);
        pu.onTouch(p);
        expect(p.health).toBe(10);
    });
});
