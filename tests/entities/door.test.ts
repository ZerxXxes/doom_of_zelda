import { describe, it, expect } from 'vitest';
import { Door, DoorState } from '../../src/entities/door';
import { Player } from '../../src/entities/player';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { World } from '../../src/entities/world';

describe('Door', () => {
  it('starts closed', () => {
    const d = new Door({ x: 1.5, z: 1.5 }, false, 1, 1);
    expect(d.state).toBe(DoorState.Closed);
  });

  it('locked door without key shows locked feedback and stays closed', () => {
    const g = makeGrid(3, 3);
    g.set(1, 1, Cell.LockedDoor);
    const w = new World(g, 1);
    const d = new Door({ x: 1.5, z: 1.5 }, true, 1, 1);
    const p = new Player({ x: 0.5, z: 1.5 });
    expect(p.hasSmallKey).toBe(false);
    const result = d.tryOpen(p, w);
    expect(result).toBe('locked');
    expect(d.state).toBe(DoorState.Closed);
  });

  it('locked door with key consumes key and opens', () => {
    const g = makeGrid(3, 3);
    g.set(1, 1, Cell.LockedDoor);
    const w = new World(g, 1);
    const d = new Door({ x: 1.5, z: 1.5 }, true, 1, 1);
    const p = new Player({ x: 0.5, z: 1.5 });
    p.applyPickup('small_key');
    const result = d.tryOpen(p, w);
    expect(result).toBe('opened');
    expect(p.hasSmallKey).toBe(false);
    expect(d.state).toBe(DoorState.Opening);
  });

  it('unlocked door opens without key', () => {
    const g = makeGrid(3, 3);
    g.set(1, 1, Cell.Door);
    const w = new World(g, 1);
    const d = new Door({ x: 1.5, z: 1.5 }, false, 1, 1);
    const p = new Player({ x: 0.5, z: 1.5 });
    const result = d.tryOpen(p, w);
    expect(result).toBe('opened');
    expect(d.state).toBe(DoorState.Opening);
  });

  it('progresses Opening -> Open over animation duration', () => {
    const g = makeGrid(3, 3);
    g.set(1, 1, Cell.Door);
    const w = new World(g, 1);
    const d = new Door({ x: 1.5, z: 1.5 }, false, 1, 1);
    const p = new Player({ x: 0.5, z: 1.5 });
    d.tryOpen(p, w);
    d.update(0.6, w);
    expect(d.state).toBe(DoorState.Open);
  });

  it('marks the grid cell as Empty when fully open', () => {
    const g = makeGrid(3, 3);
    g.set(1, 1, Cell.Door);
    const w = new World(g, 1);
    const d = new Door({ x: 1.5, z: 1.5 }, false, 1, 1);
    const p = new Player({ x: 0.5, z: 1.5 });
    d.tryOpen(p, w);
    d.update(1.0, w);
    expect(g.get(1, 1)).toBe(Cell.Empty);
  });
});
