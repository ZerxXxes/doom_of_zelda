import * as THREE from 'three';
import { Bomb, FireBolt, Arrow, BOMB_FUSE_DURATION, FIREBOLT_LIFETIME } from '../entities/projectile';
import { World } from '../entities/world';

export class ProjectileRenderer {
  private bombVisuals = new Map<Bomb, THREE.Sprite>();
  private fireVisuals = new Map<FireBolt, THREE.Sprite>();
  private arrowVisuals = new Map<Arrow, THREE.Sprite>();
  private bombFrames: THREE.Texture[];
  private fireFrames: THREE.Texture[];
  private arrowTex: THREE.Texture;
  private arrowStuckTex: THREE.Texture;

  constructor(
    private scene: THREE.Scene,
    bombFrames: THREE.Texture[],
    fireFrames: THREE.Texture[],
    arrowTex: THREE.Texture,
    arrowStuckTex: THREE.Texture,
  ) {
    this.bombFrames = bombFrames;
    this.fireFrames = fireFrames;
    this.arrowTex = arrowTex;
    this.arrowStuckTex = arrowStuckTex;
  }

  sync(world: World, camera: THREE.Camera): void {
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
      if (e instanceof FireBolt && !this.fireVisuals.has(e)) {
        const mat = new THREE.SpriteMaterial({
          map: this.fireFrames[0],
          transparent: true,
          depthTest: true,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.6, 0.6, 1);
        this.scene.add(sprite);
        this.fireVisuals.set(e, sprite);
      }
      if (e instanceof Arrow && !this.arrowVisuals.has(e)) {
        const mat = new THREE.SpriteMaterial({
          map: this.arrowTex,
          transparent: true,
          depthTest: true,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.4, 0.8, 1);
        this.scene.add(sprite);
        this.arrowVisuals.set(e, sprite);
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

    // Update fire bolts — flicker between two frames
    for (const [f, sprite] of this.fireVisuals) {
      sprite.position.set(f.position.x, 1.0, f.position.z);
      const elapsed = FIREBOLT_LIFETIME - f.lifetime;
      const frameIdx = Math.floor(elapsed * 8) % this.fireFrames.length;
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.map = this.fireFrames[frameIdx];
      mat.needsUpdate = true;
    }

    // Update arrows — rotate sprite so arrowhead points in flight direction on screen
    const _arrowPos = new THREE.Vector3();
    const _tipPos = new THREE.Vector3();
    for (const [a, sprite] of this.arrowVisuals) {
      sprite.position.set(a.position.x, 1.0, a.position.z);
      const mat = sprite.material as THREE.SpriteMaterial;
      if (a.stuck && mat.map !== this.arrowStuckTex) {
        mat.map = this.arrowStuckTex;
        mat.needsUpdate = true;
        sprite.scale.set(0.4, 0.6, 1);
      }
      // Project flight direction onto screen to compute sprite rotation
      _arrowPos.set(a.position.x, 1.0, a.position.z).project(camera);
      _tipPos.set(
        a.position.x + a.flightDir.x * 0.5,
        1.0,
        a.position.z + a.flightDir.z * 0.5,
      ).project(camera);
      const dx = _tipPos.x - _arrowPos.x;
      const dy = _tipPos.y - _arrowPos.y;
      // Arrow image has tip at top (screen +Y = angle π/2 from +X)
      mat.rotation = Math.atan2(dy, dx) - Math.PI / 2;
    }

    // Remove dead
    for (const [b, sprite] of this.bombVisuals) {
      if (!b.alive) {
        this.scene.remove(sprite);
        sprite.material.dispose();
        this.bombVisuals.delete(b);
      }
    }
    for (const [f, sprite] of this.fireVisuals) {
      if (!f.alive) {
        this.scene.remove(sprite);
        sprite.material.dispose();
        this.fireVisuals.delete(f);
      }
    }
    for (const [a, sprite] of this.arrowVisuals) {
      if (!a.alive) {
        this.scene.remove(sprite);
        sprite.material.dispose();
        this.arrowVisuals.delete(a);
      }
    }
  }
}
