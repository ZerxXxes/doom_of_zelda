import * as THREE from 'three';
import { Bomb, FireBolt, BOMB_LIFETIME } from '../entities/projectile';
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
    // Add new bombs as sprites
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

    // Update bomb sprite positions and animation frames
    for (const [b, sprite] of this.bombVisuals) {
      sprite.position.set(b.position.x, 0.5, b.position.z);

      const mat = sprite.material as THREE.SpriteMaterial;
      let frameIndex: number;

      if (b.detonated) {
        // Explosion phase: frames 7-15 over EXPLOSION_DURATION
        const explosionProgress = 1 - (b.explosionTimer / Bomb.EXPLOSION_DURATION);
        frameIndex = 7 + Math.min(Math.floor(explosionProgress * 9), 8); // frames 7-15
        sprite.scale.set(2.5, 2.5, 1); // explosion is bigger
      } else {
        const elapsed = BOMB_LIFETIME - b.lifetime;
        const progress = elapsed / BOMB_LIFETIME; // 0 to 1
        if (progress < 0.6) {
          // Sitting: frame 0
          frameIndex = 0;
        } else {
          // Blinking: cycle through frames 1-6
          const blinkElapsed = elapsed - BOMB_LIFETIME * 0.6;
          frameIndex = 1 + (Math.floor(blinkElapsed * 10) % 6); // frames 1-6 at 10fps
        }
        sprite.scale.set(1.0, 1.0, 1);
      }

      mat.map = this.bombFrames[Math.min(frameIndex, this.bombFrames.length - 1)];
      mat.needsUpdate = true;
    }

    // Update fire bolt positions
    for (const [f, mesh] of this.fireMeshes) {
      mesh.position.set(f.position.x, 1.0, f.position.z);
    }

    // Remove dead bombs
    for (const [b, sprite] of this.bombVisuals) {
      if (!b.alive) {
        this.scene.remove(sprite);
        sprite.material.dispose();
        this.bombVisuals.delete(b);
      }
    }
    // Remove dead fire bolts
    for (const [f, mesh] of this.fireMeshes) {
      if (!f.alive) {
        this.scene.remove(mesh);
        this.fireMeshes.delete(f);
      }
    }
  }
}
