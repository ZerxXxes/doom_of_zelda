import * as THREE from 'three';
import { Decoration } from '../entities/decoration';

export class DecorationRenderer {
  private scene: THREE.Scene;
  private meshes: THREE.Sprite[] = [];
  private texture: THREE.Texture;

  constructor(scene: THREE.Scene, statueTexture: THREE.Texture) {
    this.scene = scene;
    this.texture = statueTexture;
  }

  add(decoration: Decoration): void {
    const mat = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 2.0, 1);
    sprite.position.set(decoration.position.x, 1.0, decoration.position.z);
    this.scene.add(sprite);
    this.meshes.push(sprite);
  }
}
