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

    // Update bombs
    for (const [b, sprite] of this.bombVisuals) {
      // Y position from the bomb's actual height
      sprite.position.set(b.position.x, b.height + 0.3, b.position.z);

      const mat = sprite.material as THREE.SpriteMaterial;
      let frameIndex: number;

      if (b.detonated) {
        // Explosion: frames 7-15
        const progress = 1 - (b.explosionTimer / Bomb.EXPLOSION_DURATION);
        frameIndex = 7 + Math.min(Math.floor(progress * 9), 8);
        sprite.scale.set(2.5, 2.5, 1);
      } else if (!b.grounded) {
        // Flying: show frame 0
        frameIndex = 0;
        sprite.scale.set(1.0, 1.0, 1);
      } else {
        // Grounded with fuse burning
        const fuseProgress = 1 - (b.fuseTimer / BOMB_FUSE_DURATION); // 0 to 1
        if (fuseProgress < 0.5) {
          // First half: static bomb
          frameIndex = 0;
        } else {
          // Second half: blink through frames 1-6
          const blinkTime = (fuseProgress - 0.5) * BOMB_FUSE_DURATION;
          frameIndex = 1 + (Math.floor(blinkTime * 10) % 6);
        }
        sprite.scale.set(1.0, 1.0, 1);
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
