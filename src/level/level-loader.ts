import { Cell } from './cell';
import { makeGrid } from './grid';
import { Level, LevelJson, DoorSpawn } from './level';

export function loadLevel(json: LevelJson): Level {
  if (json.tiles.length !== json.height) {
    throw new Error(
      `Level row count ${json.tiles.length} does not match height ${json.height}`,
    );
  }
  for (let z = 0; z < json.tiles.length; z++) {
    if (json.tiles[z].length !== json.width) {
      throw new Error(
        `Level row length mismatch at row ${z}: got ${json.tiles[z].length}, expected width ${json.width}`,
      );
    }
  }

  const grid = makeGrid(json.width, json.height);
  const doors: DoorSpawn[] = [];

  for (let z = 0; z < json.height; z++) {
    for (let x = 0; x < json.width; x++) {
      const ch = json.tiles[z][x];
      const entry = json.legend[ch];
      if (!entry) {
        throw new Error(`Unknown legend char "${ch}" at (${x}, ${z})`);
      }
      switch (entry.type) {
        case 'wall':
          grid.set(x, z, entry.breakable ? Cell.Breakable : Cell.Wall);
          break;
        case 'floor':
          grid.set(x, z, Cell.Empty);
          break;
        case 'door':
          if (entry.locked) {
            grid.set(x, z, Cell.LockedDoor);
            doors.push({ x, z, locked: true });
          } else {
            grid.set(x, z, Cell.Door);
            doors.push({ x, z, locked: false });
          }
          break;
        case 'exit':
          grid.set(x, z, Cell.Exit);
          break;
      }
    }
  }

  return {
    name: json.name,
    theme: json.theme,
    gridSize: json.gridSize,
    width: json.width,
    height: json.height,
    grid,
    spawns: {
      player: json.spawns.player,
      enemies: json.spawns.enemies,
      pickups: json.spawns.pickups,
      doors,
    },
    ambient: json.ambient,
  };
}
