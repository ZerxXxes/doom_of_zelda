import * as THREE from 'three';
import { Bomb, FireBolt, BOMB_FUSE_DURATION } from '../entities/projectile';
import { World } from '../entities/world';

export class ProjectileRenderer {
  private bombVisuals = new Map<Bomb, THREE.Sprite>();
  private fireMeshes = new Map<FireBolt, THREE.Mesh>();
  private bombFrames: THREE.Texture[];
  private fireGeo = new THREE.SphereGeometry(0.15, 8, 6);
  private fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });

  constructor(private scene: THREE.Scene, bombFrames: THREE.Texture[]) {
    this.bombFrames = bombFrames;
  }

  sync(world: World): void {
    // Add new bombs
    for (const e of world.entities) {
      if (e instanceof Bomb && !this.bombVisuals.has(e)) {
        const mat = new THREE.SpriteMaterial({
          map: this.bombFrames[0],
          transparent: true,
          depthTest: true,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.0, 1.0, 1);
        this.scene.add(sprite);
        this.bombVisuals.set(e, sprite);
      }
      if (e instanceof FireBolt && !this.fireMeshes.has(e)) {
        const m = new THREE.Mesh(this.fireGeo, this.fireMat);
        this.scene.add(m);
        this.fireMeshes.set(e, m);
      }
    }

    // Update bombs — 16 frames: 0-7 bomb blink, 8-15 explosion
    for (const [b, sprite] of this.bombVisuals) {
      sprite.position.set(b.position.x, b.height + 0.3, b.position.z);

      const mat = sprite.material as THREE.SpriteMaterial;
      let frameIndex: number;

      if (b.detonated) {
        // Explosion phase: cycle through frames 8-15
        const progress = 1 - (b.explosionTimer / Bomb.EXPLOSION_DURATION);
        frameIndex = 8 + Math.min(Math.floor(progress * 8), 7);
        sprite.scale.set(2.5, 2.5, 1);
      } else if (!b.grounded) {
        // Flying through the air: static bomb frame 0
        frameIndex = 0;
        sprite.scale.set(0.8, 0.8, 1);
      } else {
        // Grounded, fuse burning
        const fuseProgress = 1 - (b.fuseTimer / BOMB_FUSE_DURATION); // 0→1
        if (fuseProgress < 0.4) {
          // First 40%: static bomb
          frameIndex = 0;
        } else {
          // Last 60%: blink through frames 0-7 (increasingly fast)
          const blinkTime = (fuseProgress - 0.4) / 0.6; // 0→1 within blink phase
          const blinkSpeed = 4 + blinkTime * 12; // accelerate from 4fps to 16fps
          const elapsed = (fuseProgress - 0.4) * BOMB_FUSE_DURATION;
          frameIndex = Math.floor(elapsed * blinkSpeed) % 8;
        }
        sprite.scale.set(0.8, 0.8, 1);
      }

      mat.map = this.bombFrames[Math.min(frameIndex, this.bombFrames.length - 1)];
      mat.needsUpdate = true;
    }

    // Update fire bolts
    for (const [f, mesh] of this.fireMeshes) {
      mesh.position.set(f.position.x, 1.0, f.position.z);
    }

    // Remove dead
    for (const [b, sprite] of this.bombVisuals) {
      if (!b.alive) {
        this.scene.remove(sprite);
        sprite.material.dispose();
        this.bombVisuals.delete(b);
      }
    }
    for (const [f, mesh] of this.fireMeshes) {
      if (!f.alive) {
        this.scene.remove(mesh);
        this.fireMeshes.delete(f);
      }
    }
  }
}
