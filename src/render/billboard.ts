import * as THREE from 'three';
import { Enemy, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from '../entities/enemy';
import { sub, dot, crossZ, normalize, fromYaw } from '../math/vec2';

export interface KnightTextures {
  front: THREE.Texture;
  side: THREE.Texture;
  back: THREE.Texture;
}

interface EnemyVisual {
  enemy: Enemy;
  sprite: THREE.Sprite;
  // Track which texture is currently assigned so we only swap when facing changes
  currentFacing: 'front' | 'side-left' | 'side-right' | 'back' | null;
}

export class BillboardManager {
  visuals: EnemyVisual[] = [];
  private textures: KnightTextures;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, textures: KnightTextures) {
    this.scene = scene;
    this.textures = textures;
  }

  add(enemy: Enemy): void {
    const mat = new THREE.SpriteMaterial({
      map: this.textures.front.clone(),
      transparent: true,
      depthTest: true,
      color: this.tintForTier(enemy),
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 1.7, 1);
    this.scene.add(sprite);
    this.visuals.push({ enemy, sprite, currentFacing: null });
  }

  removeDead(): void {
    this.visuals = this.visuals.filter((v) => {
      if (!v.enemy.alive) {
        this.scene.remove(v.sprite);
        if (v.sprite.material instanceof THREE.SpriteMaterial && v.sprite.material.map) {
          v.sprite.material.map.dispose();
        }
        v.sprite.material.dispose();
        return false;
      }
      return true;
    });
  }

  update(_dt: number, camera: THREE.Camera): void {
    const camPos = { x: camera.position.x, z: camera.position.z };

    for (const v of this.visuals) {
      v.sprite.position.set(v.enemy.position.x, 0.85, v.enemy.position.z);

      const facing = this.pickFacing(v.enemy, camPos);
      if (facing !== v.currentFacing) {
        this.applyFacing(v.sprite, facing);
        v.currentFacing = facing;
      }
    }
  }

  private tintForTier(enemy: Enemy): THREE.Color {
    if (enemy instanceof GreenKnight) return new THREE.Color(0.6, 1.0, 0.6);
    if (enemy instanceof BlueKnight) return new THREE.Color(1.0, 1.0, 1.0);
    if (enemy instanceof RedKnight) return new THREE.Color(1.0, 0.6, 0.6);
    if (enemy instanceof PurpleKnight) return new THREE.Color(1.0, 0.6, 1.0);
    return new THREE.Color(1, 1, 1);
  }

  private pickFacing(enemy: Enemy, camPos: { x: number; z: number }): 'front' | 'side-left' | 'side-right' | 'back' {
    const toCam = normalize(sub(camPos, enemy.position));
    const enemyForward = fromYaw(enemy.yaw);
    const d = dot(toCam, enemyForward);
    const c = crossZ(toCam, enemyForward);
    // d > 0.5  => camera in front of enemy => front sprite
    // d < -0.5 => camera behind enemy       => back sprite
    // otherwise => side sprite (left or right depending on cross sign)
    if (d > 0.5) return 'front';
    if (d < -0.5) return 'back';
    return c > 0 ? 'side-left' : 'side-right';
  }

  private applyFacing(sprite: THREE.Sprite, facing: 'front' | 'side-left' | 'side-right' | 'back'): void {
    const mat = sprite.material as THREE.SpriteMaterial;
    if (mat.map) mat.map.dispose();

    let tex: THREE.Texture;
    let flipped = false;
    switch (facing) {
      case 'front':
        tex = this.textures.front.clone();
        break;
      case 'back':
        tex = this.textures.back.clone();
        break;
      case 'side-left':
        tex = this.textures.side.clone();
        break;
      case 'side-right':
        tex = this.textures.side.clone();
        flipped = true;
        break;
    }
    tex.needsUpdate = true;
    if (flipped) {
      tex.repeat.x = -1;
      tex.offset.x = 1;
    }
    mat.map = tex;
    mat.needsUpdate = true;
  }
}
