import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { SpawnPickup } from '../level/level';

export const PLAYER_HALF_EXTENTS: Vec2 = { x: 0.15, z: 0.15 };
export const PLAYER_EYE_HEIGHT = 1.5;
export const IFRAME_DURATION = 0.8;

export type PickupType = SpawnPickup['type'];

export class Player extends Entity {
  health = 12;
  maxHealth = 12;
  magic = 16;
  maxMagic = 16;
  arrows = 10;
  maxArrows = 30;
  bombs = 5;
  maxBombs = 15;
  hasSmallKey = false;
  unlockedWeapons = new Set<number>([0]);
  currentWeapon = 0;
  iframesRemaining = 0;
  pitch = 0;

  constructor(position: Vec2, yaw = 0) {
    super(position, PLAYER_HALF_EXTENTS, yaw);
  }

  update(_dt: number, _world: World): void {
    // Movement and firing handled by Game (which has Input access).
  }

  tickTimers(dt: number): void {
    if (this.iframesRemaining > 0) {
      this.iframesRemaining = Math.max(0, this.iframesRemaining - dt);
    }
  }

  takeDamage(amount: number): void {
    if (this.iframesRemaining > 0) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health > 0) {
      this.iframesRemaining = IFRAME_DURATION;
    }
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  applyPickup(type: PickupType): void {
    switch (type) {
      case 'heart':
        this.health = Math.min(this.maxHealth, this.health + 2);
        break;
      case 'heart_large':
        this.health = this.maxHealth;
        break;
      case 'magic_jar':
        this.magic = Math.min(this.maxMagic, this.magic + 8);
        break;
      case 'arrows_10':
        this.arrows = Math.min(this.maxArrows, this.arrows + 10);
        break;
      case 'bombs_5':
        this.bombs = Math.min(this.maxBombs, this.bombs + 5);
        break;
      case 'small_key':
        this.hasSmallKey = true;
        break;
      case 'weapon_bow':
        this.unlockedWeapons.add(1);
        break;
      case 'weapon_bombs':
        this.unlockedWeapons.add(2);
        break;
      case 'weapon_fire_rod':
        this.unlockedWeapons.add(3);
        break;
    }
  }

  selectWeapon(slot: number): void {
    if (this.unlockedWeapons.has(slot)) {
      this.currentWeapon = slot;
    }
  }
}
