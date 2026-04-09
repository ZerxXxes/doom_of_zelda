import * as THREE from 'three';
import { Enemy, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from '../entities/enemy';
import { sub, dot, crossZ, normalize, fromYaw } from '../math/vec2';

const ANIM_FPS = 6;

export interface KnightTextures {
  /** Walking-animation frames shown when the camera is in front of the enemy. */
  frontFrames: THREE.Texture[];
  /** Side view frames, used when the camera is on the enemy's left side. */
  sideLeftFrames: THREE.Texture[];
  /** Side view frames, pre-flipped horizontally for the enemy's right side. */
  sideRightFrames: THREE.Texture[];
  /** Back view animation frames. */
  backFrames: THREE.Texture[];
}

type Facing = 'front' | 'side-left' | 'side-right' | 'back';

interface EnemyVisual {
  enemy: Enemy;
  sprite: THREE.Sprite;
  animTime: number;
  currentFacing: Facing | null;
  currentFrameIndex: number;
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
      map: this.textures.frontFrames[0],
      transparent: true,
      depthTest: true,
      color: this.tintForTier(enemy),
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 1.7, 1);
    this.scene.add(sprite);
    this.visuals.push({
      enemy,
      sprite,
      animTime: 0,
      currentFacing: null,
      currentFrameIndex: -1,
    });
  }

  removeDead(): void {
    this.visuals = this.visuals.filter((v) => {
      if (!v.enemy.alive) {
        this.scene.remove(v.sprite);
        // Materials are per-sprite (different tints), so dispose them.
        // Textures are shared with other enemies — DO NOT dispose them here.
        v.sprite.material.dispose();
        return false;
      }
      return true;
    });
  }

  update(dt: number, camera: THREE.Camera): void {
    const camPos = { x: camera.position.x, z: camera.position.z };

    for (const v of this.visuals) {
      v.animTime += dt;
      v.sprite.position.set(v.enemy.position.x, 0.85, v.enemy.position.z);

      const facing = this.pickFacing(v.enemy, camPos);
      let frames: THREE.Texture[];
      switch (facing) {
        case 'front': frames = this.textures.frontFrames; break;
        case 'side-left': frames = this.textures.sideLeftFrames; break;
        case 'side-right': frames = this.textures.sideRightFrames; break;
        case 'back': frames = this.textures.backFrames; break;
      }
      const frameIndex = Math.floor(v.animTime * ANIM_FPS) % frames.length;

      if (facing !== v.currentFacing || frameIndex !== v.currentFrameIndex) {
        this.applyTexture(v.sprite, facing, frameIndex);
        v.currentFacing = facing;
        v.currentFrameIndex = frameIndex;
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

  private pickFacing(enemy: Enemy, camPos: { x: number; z: number }): Facing {
    const toCam = normalize(sub(camPos, enemy.position));
    const enemyForward = fromYaw(enemy.yaw);
    const d = dot(toCam, enemyForward);
    const c = crossZ(toCam, enemyForward);
    if (d > 0.5) return 'front';
    if (d < -0.5) return 'back';
    return c > 0 ? 'side-left' : 'side-right';
  }

  private applyTexture(sprite: THREE.Sprite, facing: Facing, frameIndex: number): void {
    const mat = sprite.material as THREE.SpriteMaterial;
    let frames: THREE.Texture[];
    switch (facing) {
      case 'front': frames = this.textures.frontFrames; break;
      case 'side-left': frames = this.textures.sideLeftFrames; break;
      case 'side-right': frames = this.textures.sideRightFrames; break;
      case 'back': frames = this.textures.backFrames; break;
    }
    mat.map = frames[frameIndex];
    mat.needsUpdate = true;
  }
}
