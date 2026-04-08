import { Grid } from './grid';

export interface AmbientSettings {
  wallHeight: number;
  floorColor: string;
  ceilingColor: string;
  fogDensity: number;
}

export interface SpawnPlayer {
  x: number;
  z: number;
  yaw: number;
}

export interface SpawnEnemy {
  type: 'green_knight' | 'blue_knight' | 'red_knight' | 'purple_knight';
  x: number;
  z: number;
}

export interface SpawnPickup {
  type:
    | 'heart'
    | 'heart_large'
    | 'magic_jar'
    | 'arrows_10'
    | 'bombs_5'
    | 'small_key'
    | 'weapon_bow'
    | 'weapon_bombs'
    | 'weapon_fire_rod';
  x: number;
  z: number;
}

export interface DoorSpawn {
  x: number;
  z: number;
  locked: boolean;
}

export interface Level {
  name: string;
  theme: string;
  gridSize: number;
  width: number;
  height: number;
  grid: Grid;
  spawns: {
    player: SpawnPlayer;
    enemies: SpawnEnemy[];
    pickups: SpawnPickup[];
    doors: DoorSpawn[];
  };
  ambient: AmbientSettings;
}

export interface LevelJson {
  name: string;
  theme: string;
  gridSize: number;
  width: number;
  height: number;
  tiles: string[];
  legend: Record<string, LegendEntry>;
  spawns: {
    player: SpawnPlayer;
    enemies: SpawnEnemy[];
    pickups: SpawnPickup[];
  };
  ambient: AmbientSettings;
}

export interface LegendEntry {
  type: 'wall' | 'floor' | 'door' | 'exit';
  texture?: string;
  breakable?: boolean;
  locked?: boolean;
  key?: string;
}
