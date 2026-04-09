import * as THREE from 'three';
import { Door, DoorState } from '../entities/door';

export interface DoorTextures {
  locked: THREE.Texture;
  unlocked: THREE.Texture;
  open: THREE.Texture;
}

interface DoorVisual {
  door: Door;
  sprite: THREE.Sprite;
  currentState: string | null;
}

export class DoorRenderer {
  private visuals: DoorVisual[] = [];
  private textures: DoorTextures;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, textures: DoorTextures) {
    this.scene = scene;
    this.textures = textures;
  }

  add(door: Door): void {
    const mat = new THREE.SpriteMaterial({
      map: this.textures.locked,
      transparent: true,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(mat);
    // Doors should be roughly wall-sized (fill the grid cell)
    sprite.scale.set(3.5, 3.5, 1);
    sprite.position.set(door.position.x, 1.75, door.position.z);
    this.scene.add(sprite);
    this.visuals.push({ door, sprite, currentState: null });
  }

  update(): void {
    for (const v of this.visuals) {
      const state = v.door.state;
      if (state !== v.currentState) {
        const mat = v.sprite.material as THREE.SpriteMaterial;
        if (state === DoorState.Open || state === DoorState.Opening) {
          mat.map = this.textures.open;
        } else if (v.door.locked) {
          mat.map = this.textures.locked;
        } else {
          mat.map = this.textures.unlocked;
        }
        mat.needsUpdate = true;
        v.currentState = state;
      }

      // When fully open, we could hide the sprite entirely or keep the open archway visible.
      // Keep it visible — it provides visual context for where the door was.
    }
  }
}
