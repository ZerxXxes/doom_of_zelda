import * as THREE from 'three';
import { Level } from '../level/level';
import { isSolid } from '../level/cell';
import { TileAtlas, tileUVForName } from './tile-atlas';

export interface LevelMesh {
  walls: THREE.Mesh;
  floor: THREE.Mesh;
  ceiling: THREE.Mesh;
}

/**
 * Build a single merged BufferGeometry per layer (walls, floor, ceiling).
 * One material per layer means three draw calls regardless of level size.
 */
export function buildLevelMesh(
  level: Level,
  texture: THREE.Texture,
  atlas: TileAtlas,
): LevelMesh {
  const cs = level.gridSize;
  const wh = level.ambient.wallHeight;

  const wallUV = tileUVForName(atlas, 'castle_stone_wall');
  const floorUV = tileUVForName(atlas, 'castle_stone_floor');
  const ceilUV = tileUVForName(atlas, 'castle_stone_ceiling');

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
    uv: { u: number; v: number; w: number; h: number },
  ) {
    positions.push(...p0, ...p1, ...p2, ...p3);
    uvs.push(uv.u, uv.v + uv.h, uv.u + uv.w, uv.v + uv.h, uv.u + uv.w, uv.v, uv.u, uv.v);
    indices.push(baseCount, baseCount + 1, baseCount + 2, baseCount, baseCount + 2, baseCount + 3);
  }

  for (let z = 0; z < level.height; z++) {
    for (let x = 0; x < level.width; x++) {
      const cell = level.grid.get(x, z);
      if (isSolid(cell)) continue;

      // Floor quad
      pushQuad(
        floorPositions, floorUVs, floorIndices, floorVertexCount,
        [x * cs,       0, z * cs],
        [(x + 1) * cs, 0, z * cs],
        [(x + 1) * cs, 0, (z + 1) * cs],
        [x * cs,       0, (z + 1) * cs],
        floorUV,
      );
      floorVertexCount += 4;

      // Ceiling quad (flipped winding so it faces down)
      pushQuad(
        ceilPositions, ceilUVs, ceilIndices, ceilVertexCount,
        [x * cs,       wh, (z + 1) * cs],
        [(x + 1) * cs, wh, (z + 1) * cs],
        [(x + 1) * cs, wh, z * cs],
        [x * cs,       wh, z * cs],
        ceilUV,
      );
      ceilVertexCount += 4;

      // West neighbor (-x)
      if (isSolid(level.grid.get(x - 1, z))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs, 0,  z * cs],
          [x * cs, 0,  (z + 1) * cs],
          [x * cs, wh, (z + 1) * cs],
          [x * cs, wh, z * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
      // East neighbor (+x)
      if (isSolid(level.grid.get(x + 1, z))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, 0,  (z + 1) * cs],
          [(x + 1) * cs, 0,  z * cs],
          [(x + 1) * cs, wh, z * cs],
          [(x + 1) * cs, wh, (z + 1) * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
      // North neighbor (-z)
      if (isSolid(level.grid.get(x, z - 1))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, 0,  z * cs],
          [x * cs,       0,  z * cs],
          [x * cs,       wh, z * cs],
          [(x + 1) * cs, wh, z * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
      // South neighbor (+z)
      if (isSolid(level.grid.get(x, z + 1))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs,       0,  (z + 1) * cs],
          [(x + 1) * cs, 0,  (z + 1) * cs],
          [(x + 1) * cs, wh, (z + 1) * cs],
          [x * cs,       wh, (z + 1) * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
    }
  }

  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
  const floorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(level.ambient.floorColor) });
  const ceilMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(level.ambient.ceilingColor) });

  return {
    walls: meshFromArrays(wallPositions, wallUVs, wallIndices, material),
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
