import { describe, it, expect } from 'vitest';
import { Player } from '../../src/entities/player';

function newPlayer() {
  return new Player({ x: 0, z: 0 });
}

describe('Player state', () => {
  it('starts at full health, full magic, with all weapons unlocked', () => {
    const p = newPlayer();
    expect(p.health).toBe(12);
    expect(p.maxHealth).toBe(12);
    expect(p.magic).toBe(16);
    expect(p.maxMagic).toBe(16);
    expect(p.arrows).toBe(10);
    expect(p.bombs).toBe(5);
    expect(p.hasSmallKey).toBe(false);
    expect(p.unlockedWeapons.has(0)).toBe(true);
    expect(p.unlockedWeapons.has(1)).toBe(true);
    expect(p.unlockedWeapons.has(2)).toBe(true);
    expect(p.unlockedWeapons.has(3)).toBe(true);
    expect(p.currentWeapon).toBe(0);
  });
});

describe('Player.takeDamage', () => {
  it('reduces health by damage amount', () => {
    const p = newPlayer();
    p.takeDamage(2);
    expect(p.health).toBe(10);
  });

  it('triggers iframes after a hit', () => {
    const p = newPlayer();
    p.takeDamage(1);
    expect(p.iframesRemaining).toBeGreaterThan(0);
  });

  it('ignores damage during iframes', () => {
    const p = newPlayer();
    p.takeDamage(1);
    p.takeDamage(4);
    expect(p.health).toBe(11);
  });

  it('clamps health to 0', () => {
    const p = newPlayer();
    p.takeDamage(100);
    expect(p.health).toBe(0);
  });

  it('marks dead when health reaches 0', () => {
    const p = newPlayer();
    p.takeDamage(100);
    expect(p.isDead()).toBe(true);
  });

  it('iframes decrement with tickTimers', () => {
    const p = newPlayer();
    p.takeDamage(1);
    const initial = p.iframesRemaining;
    p.tickTimers(0.1);
    expect(p.iframesRemaining).toBeCloseTo(initial - 0.1);
  });
});

describe('Player.applyPickup', () => {
  it('heart adds 2 half-hearts up to max', () => {
    const p = newPlayer();
    p.takeDamage(6);
    p.applyPickup('heart');
    expect(p.health).toBe(8);
  });

  it('heart clamps to max', () => {
    const p = newPlayer();
    p.applyPickup('heart');
    expect(p.health).toBe(12);
  });

  it('heart_large fully refills', () => {
    const p = newPlayer();
    p.takeDamage(8);
    p.applyPickup('heart_large');
    expect(p.health).toBe(12);
  });

  it('magic_jar adds 8 magic up to max', () => {
    const p = newPlayer();
    p.magic = 4;
    p.applyPickup('magic_jar');
    expect(p.magic).toBe(12);
  });

  it('arrows_10 adds 10 arrows up to max', () => {
    const p = newPlayer();
    p.applyPickup('arrows_10');
    expect(p.arrows).toBe(20);
  });

  it('bombs_4 adds 4 bombs up to max', () => {
    const p = newPlayer();
    p.applyPickup('bombs_4');
    expect(p.bombs).toBe(9);
  });

  it('rupee_1 adds 1 rupee', () => {
    const p = newPlayer();
    p.applyPickup('rupee_1');
    expect(p.rupees).toBe(1);
  });

  it('small_key sets hasSmallKey', () => {
    const p = newPlayer();
    p.applyPickup('small_key');
    expect(p.hasSmallKey).toBe(true);
  });

  it('weapon_bow unlocks slot 1', () => {
    const p = newPlayer();
    p.applyPickup('weapon_bow');
    expect(p.unlockedWeapons.has(1)).toBe(true);
  });

  it('weapon_bombs unlocks slot 2', () => {
    const p = newPlayer();
    p.applyPickup('weapon_bombs');
    expect(p.unlockedWeapons.has(2)).toBe(true);
  });

  it('weapon_fire_rod unlocks slot 3', () => {
    const p = newPlayer();
    p.applyPickup('weapon_fire_rod');
    expect(p.unlockedWeapons.has(3)).toBe(true);
  });
});

describe('Player.selectWeapon', () => {
  it('does nothing if weapon is not unlocked', () => {
    const p = newPlayer();
    p.selectWeapon(99);
    expect(p.currentWeapon).toBe(0);
  });

  it('switches to an unlocked weapon', () => {
    const p = newPlayer();
    p.applyPickup('weapon_bow');
    p.selectWeapon(1);
    expect(p.currentWeapon).toBe(1);
  });
});
