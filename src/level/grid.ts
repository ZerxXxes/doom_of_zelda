import { Cell } from './cell';

export interface Grid {
  width: number;
  height: number;
  cells: Uint8Array;
  get(x: number, z: number): number;
  set(x: number, z: number, value: number): void;
  inBounds(x: number, z: number): boolean;
}

export function makeGrid(width: number, height: number): Grid {
  const cells = new Uint8Array(width * height);

  return {
    width,
    height,
    cells,
    get(x: number, z: number): number {
      if (x < 0 || x >= width || z < 0 || z >= height) return Cell.Wall;
      return cells[z * width + x];
    },
    set(x: number, z: number, value: number): void {
      if (x < 0 || x >= width || z < 0 || z >= height) return;
      cells[z * width + x] = value;
    },
    inBounds(x: number, z: number): boolean {
      return x >= 0 && x < width && z >= 0 && z < height;
    },
  };
}
