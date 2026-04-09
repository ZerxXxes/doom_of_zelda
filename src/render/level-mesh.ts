import * as THREE from 'three';
import { Level } from '../level/level';
import { isSolid } from '../level/cell';

export interface LevelTextures {
  wall: THREE.Texture;
  floor: THREE.Texture;
  ceiling: THREE.Texture;
}

export interface LevelMesh {
  walls: THREE.Mesh;
  floor: THREE.Mesh;
  ceiling: THREE.Mesh;
}

/**
 * Build a single merged BufferGeometry per layer (walls, floor, ceiling).
 * One material per layer means three draw calls regardless of level size.
 */
// Wall texture is 30px tall; bottom 7px are a baseboard that sits on the floor
const WALL_TEX_HEIGHT = 30;
const BASEBOARD_PX = 7;
const BASEBOARD_V = BASEBOARD_PX / WALL_TEX_HEIGHT; // UV fraction
const BASEBOARD_Y = 0.01; // epsilon above floor to prevent z-fighting

export function buildLevelMesh(level: Level, textures: LevelTextures): LevelMesh {
  const cs = level.gridSize;
  const wh = level.ambient.wallHeight;
  const boardWidth = cs * BASEBOARD_V; // world-space depth of the baseboard strip

  for (const tex of [textures.wall, textures.floor, textures.ceiling]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }

  const wallPositions: number[] = [];
  const wallUVs: number[] = [];
  const wallIndices: number[] = [];
  let wallVertexCount = 0;

  const floorPositions: number[] = [];
  const floorUVs: number[] = [];
  const floorIndices: number[] = [];
  let floorVertexCount = 0;

  const ceilPositions: number[] = [];
  const ceilUVs: number[] = [];
  const ceilIndices: number[] = [];
  let ceilVertexCount = 0;

  function pushQuad(
    positions: number[],
    uvs: number[],
    indices: number[],
    baseCount: number,
    p0: number[],
    p1: number[],
    p2: number[],
    p3: number[],
    uRepeat: number,
    vRepeat: number,
  ) {
    positions.push(...p0, ...p1, ...p2, ...p3);
    uvs.push(0, 0, uRepeat, 0, uRepeat, vRepeat, 0, vRepeat);
    indices.push(baseCount, baseCount + 1, baseCount + 2, baseCount, baseCount + 2, baseCount + 3);
  }

  for (let z = 0; z < level.height; z++) {
    for (let x = 0; x < level.width; x++) {
      const cell = level.grid.get(x, z);
      if (isSolid(cell)) continue;

      // Floor quad (winding reversed so normal faces +Y toward the camera)
      pushQuad(
        floorPositions, floorUVs, floorIndices, floorVertexCount,
        [x * cs,       0, (z + 1) * cs],
        [(x + 1) * cs, 0, (z + 1) * cs],
        [(x + 1) * cs, 0, z * cs],
        [x * cs,       0, z * cs],
        1, 1,
      );
      floorVertexCount += 4;

      // Ceiling quad (flipped winding so it faces down)
      pushQuad(
        ceilPositions, ceilUVs, ceilIndices, ceilVertexCount,
        [x * cs,       wh, (z + 1) * cs],
        [(x + 1) * cs, wh, (z + 1) * cs],
        [(x + 1) * cs, wh, z * cs],
        [x * cs,       wh, z * cs],
        1, 1,
      );
      ceilVertexCount += 4;

      const wallVRepeat = wh / cs;

      // West neighbor (-x) — normal must point +X (toward empty cell)
      if (isSolid(level.grid.get(x - 1, z))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs, 0,  (z + 1) * cs],
          [x * cs, 0,  z * cs],
          [x * cs, wh, z * cs],
          [x * cs, wh, (z + 1) * cs],
          1, wallVRepeat,
        );
        wallVertexCount += 4;
        // Baseboard: flat on floor, extends +X into the room
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs,             BASEBOARD_Y, z * cs],
          [x * cs,             BASEBOARD_Y, (z + 1) * cs],
          [x * cs + boardWidth, BASEBOARD_Y, (z + 1) * cs],
          [x * cs + boardWidth, BASEBOARD_Y, z * cs],
          1, BASEBOARD_V,
        );
        wallVertexCount += 4;
      }
      // East neighbor (+x)
      if (isSolid(level.grid.get(x + 1, z))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, 0,  z * cs],
          [(x + 1) * cs, 0,  (z + 1) * cs],
          [(x + 1) * cs, wh, (z + 1) * cs],
          [(x + 1) * cs, wh, z * cs],
          1, wallVRepeat,
        );
        wallVertexCount += 4;
        // Baseboard: extends -X into the room
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs - boardWidth, BASEBOARD_Y, (z + 1) * cs],
          [(x + 1) * cs - boardWidth, BASEBOARD_Y, z * cs],
          [(x + 1) * cs,              BASEBOARD_Y, z * cs],
          [(x + 1) * cs,              BASEBOARD_Y, (z + 1) * cs],
          1, BASEBOARD_V,
        );
        wallVertexCount += 4;
      }
      // North neighbor (-z) — normal must point +Z (toward empty cell)
      if (isSolid(level.grid.get(x, z - 1))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs,       0,  z * cs],
          [(x + 1) * cs, 0,  z * cs],
          [(x + 1) * cs, wh, z * cs],
          [x * cs,       wh, z * cs],
          1, wallVRepeat,
        );
        wallVertexCount += 4;
        // Baseboard: extends +Z into the room
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, BASEBOARD_Y, z * cs],
          [x * cs,       BASEBOARD_Y, z * cs],
          [x * cs,       BASEBOARD_Y, z * cs + boardWidth],
          [(x + 1) * cs, BASEBOARD_Y, z * cs + boardWidth],
          1, BASEBOARD_V,
        );
        wallVertexCount += 4;
      }
      // South neighbor (+z)
      if (isSolid(level.grid.get(x, z + 1))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, 0,  (z + 1) * cs],
          [x * cs,       0,  (z + 1) * cs],
          [x * cs,       wh, (z + 1) * cs],
          [(x + 1) * cs, wh, (z + 1) * cs],
          1, wallVRepeat,
        );
        wallVertexCount += 4;
        // Baseboard: extends -Z into the room
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs,       BASEBOARD_Y, (z + 1) * cs],
          [(x + 1) * cs, BASEBOARD_Y, (z + 1) * cs],
          [(x + 1) * cs, BASEBOARD_Y, (z + 1) * cs - boardWidth],
          [x * cs,       BASEBOARD_Y, (z + 1) * cs - boardWidth],
          1, BASEBOARD_V,
        );
        wallVertexCount += 4;
      }
    }
  }

  const wallMat = new THREE.MeshBasicMaterial({ map: textures.wall, side: THREE.FrontSide });
  const floorMat = new THREE.MeshBasicMaterial({ map: textures.floor, side: THREE.FrontSide });
  const ceilMat = new THREE.MeshBasicMaterial({ map: textures.ceiling, side: THREE.FrontSide });

  return {
    walls: meshFromArrays(wallPositions, wallUVs, wallIndices, wallMat),
    floor: meshFromArrays(floorPositions, floorUVs, floorIndices, floorMat),
    ceiling: meshFromArrays(ceilPositions, ceilUVs, ceilIndices, ceilMat),
  };
}

function meshFromArrays(
  positions: number[],
  uvs: number[],
  indices: number[],
  material: THREE.Material,
): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}
