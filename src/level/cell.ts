export const Cell = {
  Empty: 0,
  Wall: 1,
  Door: 2,
  LockedDoor: 3,
  Exit: 4,
  Breakable: 5,
} as const;

export type CellType = (typeof Cell)[keyof typeof Cell];

export function isSolid(cell: number): boolean {
  return (
    cell === Cell.Wall ||
    cell === Cell.Breakable ||
    cell === Cell.Door ||
    cell === Cell.LockedDoor
  );
}

export function isDoor(cell: number): boolean {
  return cell === Cell.Door || cell === Cell.LockedDoor;
}
