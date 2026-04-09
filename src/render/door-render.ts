import * as THREE from 'three';
import { Door, DoorState } from '../entities/door';
import { Grid } from '../level/grid';
import { isSolid } from '../level/cell';

// Door texture is 42x30; bottom 7px is the baseboard, same ratio as walls
const DOOR_TEX_HEIGHT = 30;
const DOOR_BASEBOARD_PX = 7;
const DOOR_BASEBOARD_V = DOOR_BASEBOARD_PX / DOOR_TEX_HEIGHT;

interface DoorVisual {
  door: Door;
  mesh: THREE.Mesh;
  baseboard: THREE.Mesh;
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
    const wh = 4.0;
    const boardWidth = cs * DOOR_BASEBOARD_V;

    // Door plane — UV starts at baseboard top (skip bottom 7px)
    const doorGeo = new THREE.PlaneGeometry(cs, wh);
    const uvAttr = doorGeo.getAttribute('uv');
    // PlaneGeometry default UVs: (0,1), (1,1), (0,0), (1,0) — remap V to skip baseboard
    for (let i = 0; i < uvAttr.count; i++) {
      const v = uvAttr.getY(i);
      // Map V from [0,1] to [BASEBOARD_V, 1]
      uvAttr.setY(i, DOOR_BASEBOARD_V + v * (1 - DOOR_BASEBOARD_V));
    }
    uvAttr.needsUpdate = true;

    const doorMat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(doorGeo, doorMat);
    mesh.position.set(door.position.x, wh / 2, door.position.z);

    // Baseboard plane — flat on floor, shows bottom 7px of door texture
    const bbGeo = new THREE.PlaneGeometry(cs, boardWidth);
    const bbUvAttr = bbGeo.getAttribute('uv');
    for (let i = 0; i < bbUvAttr.count; i++) {
      const v = bbUvAttr.getY(i);
      bbUvAttr.setY(i, v * DOOR_BASEBOARD_V);
    }
    bbUvAttr.needsUpdate = true;

    const bbMat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const baseboard = new THREE.Mesh(bbGeo, bbMat);
    baseboard.rotation.x = -Math.PI / 2; // lay flat on the floor
    baseboard.position.set(door.position.x, 0.01, door.position.z);

    // Orient based on which neighbors are open (non-solid)
    const cx = door.cellX;
    const cz = door.cellZ;
    const eastOpen = !isSolid(grid.get(cx + 1, cz));
    const westOpen = !isSolid(grid.get(cx - 1, cz));
    if (eastOpen || westOpen) {
      mesh.rotation.y = Math.PI / 2;
      baseboard.rotation.z = Math.PI / 2;
    }

    this.scene.add(mesh);
    this.scene.add(baseboard);
    this.visuals.push({ door, mesh, baseboard });
  }

  update(): void {
    for (const v of this.visuals) {
      v.mesh.visible = v.door.state !== DoorState.Open;
      v.baseboard.visible = v.door.state !== DoorState.Open;
    }
  }
}
