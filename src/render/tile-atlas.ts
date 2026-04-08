import * as THREE from 'three';
import { SpriteFrame, frameToUV } from './sprite-atlas';

export interface TileAtlas {
  imageWidth: number;
  imageHeight: number;
  tiles: Record<string, SpriteFrame>;
}

export function makeTileMaterial(texture: THREE.Texture): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
  });
}

export function tileUVForName(atlas: TileAtlas, name: string): { u: number; v: number; w: number; h: number } {
  const frame = atlas.tiles[name];
  if (!frame) throw new Error(`Tile "${name}" not found in atlas`);
  return frameToUV(frame, atlas.imageWidth, atlas.imageHeight);
}
