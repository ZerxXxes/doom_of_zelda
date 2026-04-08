export interface Vec2 {
  x: number;
  z: number;
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, z: a.z - b.z };
}

export function scale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, z: a.z * s };
}

export function length(a: Vec2): number {
  return Math.sqrt(a.x * a.x + a.z * a.z);
}

export function normalize(a: Vec2): Vec2 {
  const len = length(a);
  if (len === 0) return { x: 0, z: 0 };
  return { x: a.x / len, z: a.z / len };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.z * b.z;
}

export function crossZ(a: Vec2, b: Vec2): number {
  return a.x * b.z - a.z * b.x;
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function fromYaw(yaw: number): Vec2 {
  return { x: Math.cos(yaw), z: Math.sin(yaw) };
}

export function rotate(a: Vec2, angle: number): Vec2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: a.x * c - a.z * s, z: a.x * s + a.z * c };
}
