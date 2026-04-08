import * as THREE from 'three';
import { Bomb, FireBolt } from '../entities/projectile';
import { World } from '../entities/world';

export class ProjectileRenderer {
  private bombMeshes = new Map<Bomb, THREE.Mesh>();
  private fireMeshes = new Map<FireBolt, THREE.Mesh>();
  private bombGeo = new THREE.SphereGeometry(0.2, 8, 6);
  private fireGeo = new THREE.SphereGeometry(0.15, 8, 6);
  private bombMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  private fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });

  constructor(private scene: THREE.Scene) {}

  sync(world: World): void {
    for (const e of world.entities) {
      if (e instanceof Bomb && !this.bombMeshes.has(e)) {
        const m = new THREE.Mesh(this.bombGeo, this.bombMat);
        this.scene.add(m);
        this.bombMeshes.set(e, m);
      }
      if (e instanceof FireBolt && !this.fireMeshes.has(e)) {
        const m = new THREE.Mesh(this.fireGeo, this.fireMat);
        this.scene.add(m);
        this.fireMeshes.set(e, m);
      }
    }
    for (const [b, mesh] of this.bombMeshes) {
      mesh.position.set(b.position.x, 0.5, b.position.z);
    }
    for (const [f, mesh] of this.fireMeshes) {
      mesh.position.set(f.position.x, 1.0, f.position.z);
    }
    for (const [b, mesh] of this.bombMeshes) {
      if (!b.alive) {
        this.scene.remove(mesh);
        this.bombMeshes.delete(b);
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
