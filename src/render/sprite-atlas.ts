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

/**
 * Load a texture and replace pixels matching the color key with alpha=0.
 * Used for sprite sheets where the background is a single solid color
 * (e.g. SNES sprites that use #FF00FF magenta as a transparency key).
 */
export async function loadTextureColorKeyed(
  url: string,
  keyR = 255,
  keyG = 0,
  keyB = 255,
  tolerance = 16,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2d canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        if (
          Math.abs(r - keyR) <= tolerance &&
          Math.abs(g - keyG) <= tolerance &&
          Math.abs(b - keyB) <= tolerance
        ) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);

      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`Failed to load image at ${url}`));
    img.src = url;
  });
}

/**
 * Slice a horizontal sprite strip into N equal-width frame textures.
 * Each returned texture shares the same underlying image but uses
 * offset/repeat to show only its portion.
 */
export function sliceSpriteStrip(baseTexture: THREE.Texture, frameCount: number): THREE.Texture[] {
  const frames: THREE.Texture[] = [];
  const frameWidth = 1 / frameCount;
  for (let i = 0; i < frameCount; i++) {
    const tex = baseTexture.clone();
    tex.repeat.set(frameWidth, 1);
    tex.offset.set(i * frameWidth, 0);
    tex.needsUpdate = true;
    frames.push(tex);
  }
  return frames;
}

export function frameToUV(frame: SpriteFrame, atlasW: number, atlasH: number): { u: number; v: number; w: number; h: number } {
  return {
    u: frame.u / atlasW,
    v: 1 - (frame.v + frame.h) / atlasH,
    w: frame.w / atlasW,
    h: frame.h / atlasH,
  };
}
