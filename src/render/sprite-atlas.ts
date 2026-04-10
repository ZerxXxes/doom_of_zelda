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

/**
 * Slice a horizontal sprite strip into N frames using canvas pixel copying.
 * Unlike sliceSpriteStrip (which uses UV offset/repeat and can bleed at
 * non-pixel-aligned boundaries), this creates an independent CanvasTexture
 * per frame with exact pixel boundaries.
 */
export function sliceSpriteStripExact(
  image: HTMLImageElement | HTMLCanvasElement,
  frameCount: number,
): THREE.Texture[] {
  const totalW = image.width;
  const h = image.height;
  const frameW = Math.floor(totalW / frameCount);
  const frames: THREE.Texture[] = [];
  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = frameW;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, i * frameW, 0, frameW, h, 0, 0, frameW, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    frames.push(tex);
  }
  return frames;
}

/**
 * Load an image, apply magenta color keying, return the processed canvas.
 */
export function loadImageColorKeyed(
  url: string,
  keyR = 255, keyG = 0, keyB = 255, tolerance = 16,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no 2d context')); return; }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        if (Math.abs(px[i] - keyR) <= tolerance && Math.abs(px[i+1] - keyG) <= tolerance && Math.abs(px[i+2] - keyB) <= tolerance) {
          px[i+3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Auto-detect and slice a horizontal sprite strip with variable-width frames.
 * Frames are separated by fully-transparent columns (after color keying).
 * Each frame is extracted to its own CanvasTexture at its actual pixel size.
 */
export function autoSliceSpriteStrip(canvas: HTMLCanvasElement): THREE.Texture[] {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;

  // Scan for frame boundaries: columns where ALL pixels are transparent
  const isEmptyCol = (col: number): boolean => {
    for (let y = 0; y < height; y++) {
      if (px[(y * width + col) * 4 + 3] > 0) return false;
    }
    return true;
  };

  // Collect frame rectangles (x offset + width)
  const rects: { x: number; w: number }[] = [];
  let inFrame = false;
  let frameStart = 0;
  for (let col = 0; col < width; col++) {
    const empty = isEmptyCol(col);
    if (!empty && !inFrame) {
      inFrame = true;
      frameStart = col;
    } else if (empty && inFrame) {
      inFrame = false;
      rects.push({ x: frameStart, w: col - frameStart });
    }
  }
  if (inFrame) {
    rects.push({ x: frameStart, w: width - frameStart });
  }

  // Create one CanvasTexture per frame at its actual pixel dimensions
  const textures: THREE.Texture[] = [];
  for (const rect of rects) {
    const fCanvas = document.createElement('canvas');
    fCanvas.width = rect.w;
    fCanvas.height = height;
    const fCtx = fCanvas.getContext('2d')!;
    fCtx.drawImage(canvas, rect.x, 0, rect.w, height, 0, 0, rect.w, height);
    const tex = new THREE.CanvasTexture(fCanvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
  }

  return textures;
}

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Slice a sprite sheet using explicit pixel rectangles per frame.
 * Each frame is extracted to its own CanvasTexture at the rect's exact size.
 */
export function sliceByRects(
  canvas: HTMLCanvasElement,
  rects: FrameRect[],
): THREE.Texture[] {
  return rects.map((r) => {
    const fCanvas = document.createElement('canvas');
    fCanvas.width = r.w;
    fCanvas.height = r.h;
    const ctx = fCanvas.getContext('2d')!;
    ctx.drawImage(canvas, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    const tex = new THREE.CanvasTexture(fCanvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/**
 * Normalize an array of textures to the same canvas size (max width × max height).
 * Each frame is bottom-center aligned so the character's feet stay fixed
 * while the sword/weapon moves in the extra space above.
 */
export function normalizeFrames(textures: THREE.Texture[]): THREE.Texture[] {
  let maxW = 0;
  let maxH = 0;
  for (const tex of textures) {
    const img = tex.image as HTMLCanvasElement | HTMLImageElement;
    maxW = Math.max(maxW, img.width);
    maxH = Math.max(maxH, img.height);
  }
  return textures.map((tex) => {
    const img = tex.image as HTMLCanvasElement | HTMLImageElement;
    if (img.width === maxW && img.height === maxH) return tex;
    const canvas = document.createElement('canvas');
    canvas.width = maxW;
    canvas.height = maxH;
    const ctx = canvas.getContext('2d')!;
    // Bottom-center aligned: extra space goes above the sprite
    const offsetX = Math.floor((maxW - img.width) / 2);
    const offsetY = maxH - img.height;
    ctx.drawImage(img, offsetX, offsetY);
    const newTex = new THREE.CanvasTexture(canvas);
    newTex.magFilter = THREE.NearestFilter;
    newTex.minFilter = THREE.NearestFilter;
    newTex.generateMipmaps = false;
    newTex.colorSpace = THREE.SRGBColorSpace;
    return newTex;
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
