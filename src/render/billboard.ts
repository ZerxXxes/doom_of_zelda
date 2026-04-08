import * as THREE from 'three';
import { Enemy, EnemyState, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from '../entities/enemy';
import { KnightAtlas, KnightAnimations, frameToUV } from './sprite-atlas';
import { sub, dot, crossZ, normalize, fromYaw } from '../math/vec2';

export interface EnemyVisual {
  enemy: Enemy;
  sprite: THREE.Sprite;
  animTime: number;
}

export class BillboardManager {
  visuals: EnemyVisual[] = [];
  private texture: THREE.Texture;
  private atlas: KnightAtlas;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, texture: THREE.Texture, atlas: KnightAtlas) {
    this.scene = scene;
    this.texture = texture;
    this.atlas = atlas;
  }

  add(enemy: Enemy): void {
    const mat = new THREE.SpriteMaterial({
      map: this.texture.clone(),
      transparent: true,
      depthTest: true,
    });
    if (mat.map) mat.map.needsUpdate = true;
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 1.5, 1);
    this.scene.add(sprite);
    this.visuals.push({ enemy, sprite, animTime: 0 });
  }

  removeDead(): void {
    this.visuals = this.visuals.filter((v) => {
      if (!v.enemy.alive) {
        this.scene.remove(v.sprite);
        return false;
      }
      return true;
    });
  }

  update(dt: number, camera: THREE.Camera): void {
    const camPos2 = { x: camera.position.x, z: camera.position.z };

    for (const v of this.visuals) {
      v.animTime += dt;
      v.sprite.position.set(v.enemy.position.x, 0.75, v.enemy.position.z);

      const tier = this.tierKey(v.enemy);
      const animations = this.atlas[tier];
      if (!animations) continue;

      const anim = this.animationFor(v.enemy.state, animations);
      const facing = this.pickFacing(v.enemy, camPos2);
      const frames = anim[facing];

      if (frames.length === 0) {
        // Fallback: tint sprite magenta so missing frames are obvious
        (v.sprite.material as THREE.SpriteMaterial).color.set(0xff00ff);
        continue;
      }

      const frame = frames[Math.floor(v.animTime * 6) % frames.length];
      const uv = frameToUV(frame, this.atlas.imageWidth, this.atlas.imageHeight);
      this.applyUVToSprite(v.sprite, uv);
    }
  }

  private tierKey(enemy: Enemy): 'green' | 'blue' | 'red' | 'purple' {
    if (enemy instanceof GreenKnight) return 'green';
    if (enemy instanceof BlueKnight) return 'blue';
    if (enemy instanceof RedKnight) return 'red';
    if (enemy instanceof PurpleKnight) return 'purple';
    return 'green';
  }

  private animationFor(state: string, anims: KnightAnimations) {
    switch (state) {
      case EnemyState.Attack:
        return anims.attack;
      case EnemyState.Hurt:
        return anims.hurt;
      case EnemyState.Dying:
        return anims.death;
      default:
        return anims.walk;
    }
  }

  private pickFacing(enemy: Enemy, camPos: { x: number; z: number }): 'down' | 'up' | 'left' | 'right' {
    const toCam = normalize(sub(camPos, enemy.position));
    const forward = fromYaw(enemy.yaw);
    const d = dot(toCam, forward);
    const c = crossZ(toCam, forward);
    if (d > 0.7) return 'down';
    if (d < -0.7) return 'up';
    if (c > 0) return 'left';
    return 'right';
  }

  private applyUVToSprite(sprite: THREE.Sprite, uv: { u: number; v: number; w: number; h: number }): void {
    const material = sprite.material as THREE.SpriteMaterial;
    if (!material.map) return;
    material.map.offset.set(uv.u, uv.v);
    material.map.repeat.set(uv.w, uv.h);
  }
}
