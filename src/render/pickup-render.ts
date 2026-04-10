import * as THREE from 'three';
import { Pickup } from '../entities/pickup';

interface PickupVisual {
  pickup: Pickup;
  sprite: THREE.Sprite;
  frames?: THREE.Texture[]; // for animated pickups (rupees)
  animTime: number;
}

export class PickupRenderer {
  private visuals: PickupVisual[] = [];
  private texMap: Map<string, THREE.Texture>;
  private animMap: Map<string, THREE.Texture[]>;
  private scene: THREE.Scene;

  constructor(
    scene: THREE.Scene,
    texMap: Map<string, THREE.Texture>,
    animMap: Map<string, THREE.Texture[]>,
  ) {
    this.scene = scene;
    this.texMap = texMap;
    this.animMap = animMap;
  }

  add(pickup: Pickup): void {
    const frames = this.animMap.get(pickup.pickupType);
    const tex = frames ? frames[0] : this.texMap.get(pickup.pickupType);
    if (!tex) return; // no sprite for this pickup type

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(mat);
    // Rupees are tall and thin; other pickups are roughly square
    if (frames) {
      sprite.scale.set(0.4, 0.8, 1);
    } else {
      sprite.scale.set(0.8, 0.8, 1);
    }
    sprite.position.set(pickup.position.x, 0.5, pickup.position.z);
    this.scene.add(sprite);
    this.visuals.push({ pickup, sprite, frames, animTime: 0 });
  }

  update(dt: number): void {
    for (const v of this.visuals) {
      if (!v.pickup.alive) continue;
      // Animate rupees
      if (v.frames && v.frames.length > 1) {
        v.animTime += dt;
        const idx = Math.floor(v.animTime * 4) % v.frames.length; // 4 fps shimmer
        const mat = v.sprite.material as THREE.SpriteMaterial;
        mat.map = v.frames[idx];
        mat.needsUpdate = true;
      }
      // Gentle hover bob
      v.sprite.position.y = 0.5 + Math.sin(v.animTime * 2) * 0.1;
    }
  }

  removeDead(): void {
    this.visuals = this.visuals.filter((v) => {
      if (!v.pickup.alive) {
        this.scene.remove(v.sprite);
        v.sprite.material.dispose();
        return false;
      }
      return true;
    });
  }
}
