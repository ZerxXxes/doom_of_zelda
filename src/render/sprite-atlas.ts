import * as THREE from 'three';

export interface SpriteFrame {
  u: number;
  v: number;
  w: number;
  h: number;
}

export async function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

export function frameToUV(frame: SpriteFrame, atlasW: number, atlasH: number): { u: number; v: number; w: number; h: number } {
  return {
    u: frame.u / atlasW,
    v: 1 - (frame.v + frame.h) / atlasH,
    w: frame.w / atlasW,
    h: frame.h / atlasH,
  };
}
