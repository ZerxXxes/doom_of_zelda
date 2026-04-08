// Stub — full implementation in Task 10.
// Defined now so Entity can have a type-only import dependency.
import { Grid } from '../level/grid';

export class World {
  grid: Grid;
  cellSize: number;
  entities: unknown[] = [];

  constructor(grid: Grid, cellSize: number) {
    this.grid = grid;
    this.cellSize = cellSize;
  }
}
