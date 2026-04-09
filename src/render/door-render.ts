import * as THREE from 'three';
import { Door, DoorState } from '../entities/door';
import { Grid } from '../level/grid';
import { isSolid } from '../level/cell';

interface DoorVisual {
  door: Door;
  mesh: THREE.Mesh;
}

export class DoorRenderer {
  private visuals: DoorVisual[] = [];
  private texture: THREE.Texture;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, texture: THREE.Texture) {
    this.scene = scene;
    this.texture = texture;
  }

  add(door: Door, grid: Grid, cellSize: number): void {
    const cs = cellSize;
    const wh = 4.0; // wall height — matches level ambient.wallHeight
    const geo = new THREE.PlaneGeometry(cs, wh);
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // Position at door cell center, half wall-height up
    mesh.position.set(door.position.x, wh / 2, door.position.z);

    // Orient based on which neighbors are open (non-solid)
    const cx = door.cellX;
    const cz = door.cellZ;
    const eastOpen = !isSolid(grid.get(cx + 1, cz));
    const westOpen = !isSolid(grid.get(cx - 1, cz));
    if (eastOpen || westOpen) {
      // Door faces east-west: rotate 90° around Y
      mesh.rotation.y = Math.PI / 2;
    }
    // Default PlaneGeometry faces +Z; if north/south are open, no rotation needed

    this.scene.add(mesh);
    this.visuals.push({ door, mesh });
  }

  update(): void {
    for (const v of this.visuals) {
      // Hide door mesh when fully open
      v.mesh.visible = v.door.state !== DoorState.Open;
    }
  }
}
