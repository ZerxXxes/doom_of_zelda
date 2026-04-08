# Doom of Zelda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-level browser-based 3D first-person shooter in the style of Doom (1993), themed with sprites from The Legend of Zelda: A Link to the Past.

**Architecture:** Plain class-based TypeScript with Three.js for rendering. Pure-logic modules (collision, combat math, enemy AI state machines, level loader) are isolated from Three.js so they can be unit-tested without WebGL. The game loop has 4 strict phases per frame: Input → Update → Collision → Render. Entities communicate only through a `World` interface, never direct references.

**Tech Stack:** TypeScript (strict), Three.js, Vite, Vitest, ESLint, Prettier, pnpm.

**Spec:** `docs/superpowers/specs/2026-04-08-doom-of-zelda-design.md`

---

## Conventions

- **Units:** All damage and HP values are in **half-hearts** (player max = 12 = 6 hearts).
- **Coordinates:** 2D (x, z) on horizontal plane. World units. `gridSize = 4.0` per cell.
- **Yaw:** radians. `(cos yaw, sin yaw)` is forward direction in (x, z).
- **Test runner:** `pnpm test` (Vitest). All test commands assume cwd = project root.
- **Commits:** small, frequent, conventional-commit style (`feat:`, `test:`, `chore:`, `refactor:`).

## File Structure

This plan creates files in dependency order (pure modules first, integration last):

| Layer | Files |
|---|---|
| Setup | `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.eslintrc.cjs`, `.prettierrc`, `.gitignore` |
| Math | `src/math/vec2.ts`, `src/math/aabb.ts` |
| Level | `src/level/cell.ts`, `src/level/grid.ts`, `src/level/collision.ts`, `src/level/raycast.ts`, `src/level/level.ts`, `src/level/level-loader.ts` |
| Entities | `src/entities/entity.ts`, `src/entities/world.ts`, `src/entities/player.ts`, `src/entities/projectile.ts`, `src/entities/pickup.ts`, `src/entities/door.ts`, `src/entities/enemy.ts` |
| Weapons | `src/weapons/weapon.ts`, `src/weapons/sword.ts`, `src/weapons/bow.ts`, `src/weapons/bombs.ts`, `src/weapons/fire-rod.ts` |
| Render | `src/render/renderer.ts`, `src/render/sprite-atlas.ts`, `src/render/tile-atlas.ts`, `src/render/level-mesh.ts`, `src/render/billboard.ts`, `src/render/projectile-render.ts` |
| HUD | `src/hud/hud.ts`, `src/hud/hud.css` |
| Audio | `src/audio.ts` |
| Input | `src/input.ts` |
| Game | `src/game.ts`, `src/main.ts` |
| Data | `src/data/level-01.json`, `src/render/tile-atlas.json`, `src/render/knight-atlas.json` |
| Tests | `tests/**/*.test.ts`, `tests/fixtures/test-level.json` |

---

## Phase 1: Project Setup

### Task 1: Initialize project and tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Create: `.gitignore`
- Create: `src/main.ts`

- [ ] **Step 1: Initialize git repo**

```bash
cd /home/wolfgang/git/doom_of_zelda
git init
git add SNES*.png docs/
git commit -m "chore: import sprite assets and design docs"
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
.vite/
coverage/
.DS_Store
*.log
.env
.env.local
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "doom-of-zelda",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests --ext .ts",
    "format": "prettier --write \"src/**/*.{ts,css,json}\" \"tests/**/*.ts\""
  },
  "dependencies": {
    "three": "^0.162.0"
  },
  "devDependencies": {
    "@types/three": "^0.162.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "lib": ["ES2022", "DOM"],
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/render/**', 'src/main.ts', 'src/game.ts', 'src/input.ts', 'src/hud/**'],
    },
  },
});
```

- [ ] **Step 7: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

- [ ] **Step 8: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 9: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doom of Zelda</title>
    <link rel="stylesheet" href="/src/hud/hud.css" />
    <style>
      html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }
      canvas { display: block; image-rendering: pixelated; }
    </style>
  </head>
  <body>
    <canvas id="game-canvas"></canvas>
    <div id="hud-root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 10: Create stub `src/main.ts`**

```ts
console.log('Doom of Zelda boot');
```

- [ ] **Step 11: Move sprite assets into `public/sprites/`**

```bash
mkdir -p public/sprites
git mv "SNES - The Legend of Zelda_ A Link to the Past - Enemies - Hylian Knights.png" public/sprites/hylian-knights.png
git mv "SNES - The Legend of Zelda_ A Link to the Past - Miscellaneous - HUD.png" public/sprites/hud.png
git mv "SNES - The Legend of Zelda_ A Link to the Past - Tilesets - Dungeon Tiles.png" public/sprites/dungeon-tiles.png
```

- [ ] **Step 12: Install dependencies**

```bash
pnpm install
```

Expected: lockfile created, `node_modules/` populated, no errors.

- [ ] **Step 13: Verify dev server starts**

```bash
pnpm dev &
sleep 2
curl -sf http://localhost:5173/ > /dev/null && echo OK || echo FAIL
kill %1
```

Expected: `OK` printed.

- [ ] **Step 14: Verify test runner works on empty suite**

```bash
pnpm test
```

Expected: "No test files found" — runner is functional.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + TypeScript + Three.js + Vitest project"
```

---

## Phase 2: Math Primitives (TDD)

### Task 2: `Vec2` utility

A small 2D vector helper for the (x, z) horizontal plane. Pure data, no Three.js. Used by everything downstream.

**Files:**
- Create: `src/math/vec2.ts`
- Create: `tests/math/vec2.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/math/vec2.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Vec2, add, sub, scale, length, normalize, dot, crossZ, distance, fromYaw, rotate } from '../../src/math/vec2';

describe('Vec2', () => {
  it('add() returns componentwise sum', () => {
    expect(add({ x: 1, z: 2 }, { x: 3, z: 4 })).toEqual({ x: 4, z: 6 });
  });

  it('sub() returns componentwise difference', () => {
    expect(sub({ x: 5, z: 7 }, { x: 1, z: 2 })).toEqual({ x: 4, z: 5 });
  });

  it('scale() multiplies both components by scalar', () => {
    expect(scale({ x: 2, z: 3 }, 2)).toEqual({ x: 4, z: 6 });
  });

  it('length() returns euclidean magnitude', () => {
    expect(length({ x: 3, z: 4 })).toBe(5);
  });

  it('normalize() returns unit vector for non-zero input', () => {
    const n = normalize({ x: 3, z: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.z).toBeCloseTo(0.8);
  });

  it('normalize() returns zero vector for zero input', () => {
    expect(normalize({ x: 0, z: 0 })).toEqual({ x: 0, z: 0 });
  });

  it('dot() returns scalar dot product', () => {
    expect(dot({ x: 1, z: 0 }, { x: 0, z: 1 })).toBe(0);
    expect(dot({ x: 2, z: 3 }, { x: 4, z: 5 })).toBe(23);
  });

  it('crossZ() returns scalar 2D cross', () => {
    expect(crossZ({ x: 1, z: 0 }, { x: 0, z: 1 })).toBe(1);
    expect(crossZ({ x: 0, z: 1 }, { x: 1, z: 0 })).toBe(-1);
  });

  it('distance() returns euclidean distance', () => {
    expect(distance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });

  it('fromYaw() converts yaw radians to unit vector', () => {
    const v = fromYaw(0);
    expect(v.x).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
    const u = fromYaw(Math.PI / 2);
    expect(u.x).toBeCloseTo(0);
    expect(u.z).toBeCloseTo(1);
  });

  it('rotate() rotates by angle', () => {
    const v = rotate({ x: 1, z: 0 }, Math.PI / 2);
    expect(v.x).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(1);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/math/vec2.test.ts
```
Expected: FAIL (`Cannot find module ../../src/math/vec2`).

- [ ] **Step 3: Implement `src/math/vec2.ts`**

```ts
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
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/math/vec2.test.ts
```
Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/math/vec2.ts tests/math/vec2.test.ts
git commit -m "feat: add Vec2 math utility with TDD coverage"
```

---

### Task 3: `AABB` overlap helpers

Axis-aligned bounding box used for collision. Stored as `{ center: Vec2, halfExtents: Vec2 }`.

**Files:**
- Create: `src/math/aabb.ts`
- Create: `tests/math/aabb.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/math/aabb.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { AABB, makeAABB, aabbOverlaps, aabbContainsPoint, aabbCellRange } from '../../src/math/aabb';

describe('AABB', () => {
  it('makeAABB() builds aabb from center + half-extents', () => {
    const a = makeAABB({ x: 5, z: 5 }, { x: 0.5, z: 0.5 });
    expect(a.center).toEqual({ x: 5, z: 5 });
    expect(a.halfExtents).toEqual({ x: 0.5, z: 0.5 });
  });

  it('aabbOverlaps() returns true for overlapping boxes', () => {
    const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
    const b = makeAABB({ x: 1, z: 0 }, { x: 1, z: 1 });
    expect(aabbOverlaps(a, b)).toBe(true);
  });

  it('aabbOverlaps() returns false for non-overlapping boxes', () => {
    const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
    const b = makeAABB({ x: 5, z: 5 }, { x: 1, z: 1 });
    expect(aabbOverlaps(a, b)).toBe(false);
  });

  it('aabbOverlaps() touching edges count as overlap', () => {
    const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
    const b = makeAABB({ x: 2, z: 0 }, { x: 1, z: 1 });
    expect(aabbOverlaps(a, b)).toBe(true);
  });

  it('aabbContainsPoint() checks if point is inside', () => {
    const a = makeAABB({ x: 0, z: 0 }, { x: 1, z: 1 });
    expect(aabbContainsPoint(a, { x: 0.5, z: 0.5 })).toBe(true);
    expect(aabbContainsPoint(a, { x: 2, z: 0 })).toBe(false);
  });

  it('aabbCellRange() returns inclusive integer cell bounds for cell size 1', () => {
    const a = makeAABB({ x: 5.3, z: 7.8 }, { x: 0.5, z: 0.5 });
    const r = aabbCellRange(a, 1);
    expect(r).toEqual({ minX: 4, maxX: 5, minZ: 7, maxZ: 8 });
  });

  it('aabbCellRange() respects custom cell size', () => {
    const a = makeAABB({ x: 8, z: 12 }, { x: 1, z: 1 });
    const r = aabbCellRange(a, 4);
    expect(r).toEqual({ minX: 1, maxX: 2, minZ: 2, maxZ: 3 });
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/math/aabb.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/math/aabb.ts`**

```ts
import { Vec2 } from './vec2';

export interface AABB {
  center: Vec2;
  halfExtents: Vec2;
}

export interface CellRange {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function makeAABB(center: Vec2, halfExtents: Vec2): AABB {
  return { center, halfExtents };
}

export function aabbOverlaps(a: AABB, b: AABB): boolean {
  const dx = Math.abs(a.center.x - b.center.x);
  const dz = Math.abs(a.center.z - b.center.z);
  return dx <= a.halfExtents.x + b.halfExtents.x && dz <= a.halfExtents.z + b.halfExtents.z;
}

export function aabbContainsPoint(a: AABB, p: Vec2): boolean {
  return (
    Math.abs(a.center.x - p.x) <= a.halfExtents.x &&
    Math.abs(a.center.z - p.z) <= a.halfExtents.z
  );
}

export function aabbCellRange(a: AABB, cellSize: number): CellRange {
  return {
    minX: Math.floor((a.center.x - a.halfExtents.x) / cellSize),
    maxX: Math.floor((a.center.x + a.halfExtents.x) / cellSize),
    minZ: Math.floor((a.center.z - a.halfExtents.z) / cellSize),
    maxZ: Math.floor((a.center.z + a.halfExtents.z) / cellSize),
  };
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/math/aabb.test.ts
```
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/math/aabb.ts tests/math/aabb.test.ts
git commit -m "feat: add AABB helpers with overlap and cell-range tests"
```

---

## Phase 3: Level Grid + Collision (TDD)

### Task 4: Cell types and grid container

The wall grid is a `Uint8Array` of byte-encoded cell types. This task defines the encoding and a thin `Grid` wrapper.

**Files:**
- Create: `src/level/cell.ts`
- Create: `src/level/grid.ts`
- Create: `tests/level/grid.test.ts`

- [ ] **Step 1: Write `src/level/cell.ts`**

```ts
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
  return cell === Cell.Wall || cell === Cell.Breakable;
}

export function isDoor(cell: number): boolean {
  return cell === Cell.Door || cell === Cell.LockedDoor;
}
```

- [ ] **Step 2: Write failing tests for grid**

`tests/level/grid.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Grid, makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

describe('Grid', () => {
  it('makeGrid() builds a grid of given dimensions filled with Empty', () => {
    const g = makeGrid(3, 4);
    expect(g.width).toBe(3);
    expect(g.height).toBe(4);
    expect(g.cells.length).toBe(12);
    expect(Array.from(g.cells)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('get/set cell by (x, z)', () => {
    const g = makeGrid(3, 3);
    g.set(1, 2, Cell.Wall);
    expect(g.get(1, 2)).toBe(Cell.Wall);
    expect(g.get(0, 0)).toBe(Cell.Empty);
  });

  it('get() returns Wall for out-of-bounds (treats world as walled)', () => {
    const g = makeGrid(3, 3);
    expect(g.get(-1, 0)).toBe(Cell.Wall);
    expect(g.get(0, -1)).toBe(Cell.Wall);
    expect(g.get(3, 0)).toBe(Cell.Wall);
    expect(g.get(0, 3)).toBe(Cell.Wall);
  });

  it('inBounds() returns true only for valid cells', () => {
    const g = makeGrid(3, 3);
    expect(g.inBounds(0, 0)).toBe(true);
    expect(g.inBounds(2, 2)).toBe(true);
    expect(g.inBounds(3, 0)).toBe(false);
    expect(g.inBounds(-1, 0)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests, verify failure**

```bash
pnpm test tests/level/grid.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Implement `src/level/grid.ts`**

```ts
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
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm test tests/level/grid.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/level/cell.ts src/level/grid.ts tests/level/grid.test.ts
git commit -m "feat: add cell types and Grid container"
```

---

### Task 5: Axis-separated AABB-vs-grid collision

The single most "feels right" piece of the codebase. Resolves AABB overlap with the wall grid by separating X and Z resolution so the player slides along walls instead of dead-stopping.

**Files:**
- Create: `src/level/collision.ts`
- Create: `tests/level/collision.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/level/collision.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { resolveMovement } from '../../src/level/collision';
import { makeAABB } from '../../src/math/aabb';

const CELL_SIZE = 1;

function buildGrid(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const g = makeGrid(w, h);
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      g.set(x, z, rows[z][x] === '#' ? Cell.Wall : Cell.Empty);
    }
  }
  return g;
}

describe('resolveMovement', () => {
  it('passes through unobstructed motion', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
      '....',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 0.5, z: 0 }, CELL_SIZE);
    expect(result.x).toBeCloseTo(1.5);
    expect(result.z).toBeCloseTo(1.0);
  });

  it('stops on X axis when wall blocks horizontal motion', () => {
    const g = buildGrid([
      '....',
      '..#.',
      '....',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 1.0, z: 0 }, CELL_SIZE);
    // Wall is at cell (2,1), spans world x [2, 3]. AABB max x must stop at 2.
    // So center.x max = 2 - 0.3 = 1.7
    expect(result.x).toBeCloseTo(1.7);
    expect(result.z).toBeCloseTo(1.0);
  });

  it('stops on Z axis when wall blocks vertical motion', () => {
    const g = buildGrid([
      '....',
      '....',
      '..#.',
    ]);
    const aabb = makeAABB({ x: 2.5, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 0, z: 1.0 }, CELL_SIZE);
    expect(result.z).toBeCloseTo(1.7);
    expect(result.x).toBeCloseTo(2.5);
  });

  it('slides along a wall when moving diagonally into it', () => {
    // Wall on the right at x = 2
    const g = buildGrid([
      '..#.',
      '..#.',
      '..#.',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    // Move diagonally toward the wall
    const result = resolveMovement(g, aabb, { x: 1.0, z: 0.5 }, CELL_SIZE);
    // X is blocked at 1.7, Z slides freely to 1.5
    expect(result.x).toBeCloseTo(1.7);
    expect(result.z).toBeCloseTo(1.5);
  });

  it('slides along a wall in the other direction', () => {
    // Wall on the bottom at z = 2
    const g = buildGrid([
      '....',
      '....',
      '####',
    ]);
    const aabb = makeAABB({ x: 1.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: 0.5, z: 1.0 }, CELL_SIZE);
    expect(result.x).toBeCloseTo(1.5);
    expect(result.z).toBeCloseTo(1.7);
  });

  it('handles negative motion (moving left into a wall)', () => {
    const g = buildGrid([
      '....',
      '#...',
      '....',
    ]);
    const aabb = makeAABB({ x: 2.0, z: 1.0 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: -1.5, z: 0 }, CELL_SIZE);
    // Wall at x=0 spans [0,1]. AABB min x = result.x - 0.3 must be >= 1, so result.x >= 1.3
    expect(result.x).toBeCloseTo(1.3);
  });

  it('treats out-of-bounds as walls (player cannot leave the map)', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    const aabb = makeAABB({ x: 0.5, z: 0.5 }, { x: 0.3, z: 0.3 });
    const result = resolveMovement(g, aabb, { x: -1, z: -1 }, CELL_SIZE);
    expect(result.x).toBeCloseTo(0.3);
    expect(result.z).toBeCloseTo(0.3);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/level/collision.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/level/collision.ts`**

```ts
import { Vec2 } from '../math/vec2';
import { AABB, makeAABB, aabbCellRange } from '../math/aabb';
import { Grid } from './grid';
import { isSolid } from './cell';

/**
 * Resolve a movement intent against the wall grid using axis-separated
 * collision: try X-only motion first (push back if blocked), then Z-only.
 *
 * This produces sliding behaviour: when moving diagonally into a wall, the
 * player slides along the wall instead of dead-stopping.
 *
 * Returns the new center position for the AABB.
 */
export function resolveMovement(
  grid: Grid,
  aabb: AABB,
  motion: Vec2,
  cellSize: number,
): Vec2 {
  let center = { x: aabb.center.x, z: aabb.center.z };

  // Resolve X first
  center.x += motion.x;
  let test = makeAABB(center, aabb.halfExtents);
  if (overlapsAnySolid(grid, test, cellSize)) {
    // Push out of the wall on X axis only
    center.x = pushOutX(grid, test, motion.x, cellSize);
  }

  // Then Z
  center.z += motion.z;
  test = makeAABB(center, aabb.halfExtents);
  if (overlapsAnySolid(grid, test, cellSize)) {
    center.z = pushOutZ(grid, test, motion.z, cellSize);
  }

  return center;
}

function overlapsAnySolid(grid: Grid, aabb: AABB, cellSize: number): boolean {
  const r = aabbCellRange(aabb, cellSize);
  for (let z = r.minZ; z <= r.maxZ; z++) {
    for (let x = r.minX; x <= r.maxX; x++) {
      if (isSolid(grid.get(x, z))) {
        if (cellOverlapsAabb(x, z, cellSize, aabb)) return true;
      }
    }
  }
  return false;
}

function cellOverlapsAabb(cx: number, cz: number, cellSize: number, aabb: AABB): boolean {
  const minX = cx * cellSize;
  const maxX = (cx + 1) * cellSize;
  const minZ = cz * cellSize;
  const maxZ = (cz + 1) * cellSize;
  const aMinX = aabb.center.x - aabb.halfExtents.x;
  const aMaxX = aabb.center.x + aabb.halfExtents.x;
  const aMinZ = aabb.center.z - aabb.halfExtents.z;
  const aMaxZ = aabb.center.z + aabb.halfExtents.z;
  // Strict overlap (touching edges do NOT count, so the AABB can sit
  // exactly against a wall without re-triggering collision next frame).
  return aMaxX > minX && aMinX < maxX && aMaxZ > minZ && aMinZ < maxZ;
}

function pushOutX(grid: Grid, aabb: AABB, motionX: number, cellSize: number): number {
  // Find the cell-aligned plane to push against, based on motion direction.
  const r = aabbCellRange(aabb, cellSize);
  let resultX = aabb.center.x;
  for (let z = r.minZ; z <= r.maxZ; z++) {
    for (let x = r.minX; x <= r.maxX; x++) {
      if (!isSolid(grid.get(x, z))) continue;
      if (!cellOverlapsAabb(x, z, cellSize, makeAABB({ x: resultX, z: aabb.center.z }, aabb.halfExtents))) continue;
      if (motionX > 0) {
        // Pushed back to left side of wall cell
        resultX = x * cellSize - aabb.halfExtents.x;
      } else if (motionX < 0) {
        // Pushed forward to right side of wall cell
        resultX = (x + 1) * cellSize + aabb.halfExtents.x;
      }
    }
  }
  return resultX;
}

function pushOutZ(grid: Grid, aabb: AABB, motionZ: number, cellSize: number): number {
  const r = aabbCellRange(aabb, cellSize);
  let resultZ = aabb.center.z;
  for (let z = r.minZ; z <= r.maxZ; z++) {
    for (let x = r.minX; x <= r.maxX; x++) {
      if (!isSolid(grid.get(x, z))) continue;
      if (!cellOverlapsAabb(x, z, cellSize, makeAABB({ x: aabb.center.x, z: resultZ }, aabb.halfExtents))) continue;
      if (motionZ > 0) {
        resultZ = z * cellSize - aabb.halfExtents.z;
      } else if (motionZ < 0) {
        resultZ = (z + 1) * cellSize + aabb.halfExtents.z;
      }
    }
  }
  return resultZ;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/level/collision.test.ts
```
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/level/collision.ts tests/level/collision.test.ts
git commit -m "feat: axis-separated AABB-vs-grid collision with wall sliding"
```

---

### Task 6: Wall raycast (DDA) and line of sight

Used by the Bow (hitscan), enemy line-of-sight checks, and aggro detection. Implemented as a 2D Digital Differential Analyzer that walks the grid one cell at a time until it hits a solid cell or runs out of distance.

**Files:**
- Create: `src/level/raycast.ts`
- Create: `tests/level/raycast.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/level/raycast.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { raycastWalls, lineOfSight } from '../../src/level/raycast';

const CELL_SIZE = 1;

function buildGrid(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const g = makeGrid(w, h);
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      g.set(x, z, rows[z][x] === '#' ? Cell.Wall : Cell.Empty);
    }
  }
  return g;
}

describe('raycastWalls', () => {
  it('returns null when nothing is hit', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 0.5 }, { x: 1, z: 0 }, 2, CELL_SIZE);
    expect(hit).toBeNull();
  });

  it('hits a wall in front', () => {
    const g = buildGrid([
      '..#.',
      '..#.',
      '..#.',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 1.5 }, { x: 1, z: 0 }, 5, CELL_SIZE);
    expect(hit).not.toBeNull();
    expect(hit!.cellX).toBe(2);
    expect(hit!.cellZ).toBe(1);
    expect(hit!.distance).toBeCloseTo(1.5);
  });

  it('respects max distance and returns null beyond it', () => {
    const g = buildGrid([
      '..#.',
      '..#.',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 0.5 }, { x: 1, z: 0 }, 1.0, CELL_SIZE);
    expect(hit).toBeNull();
  });

  it('handles diagonal rays', () => {
    const g = buildGrid([
      '....',
      '....',
      '...#',
    ]);
    const hit = raycastWalls(g, { x: 0.5, z: 0.5 }, { x: 1, z: 1 }, 10, CELL_SIZE);
    expect(hit).not.toBeNull();
    expect(hit!.cellX).toBe(3);
    expect(hit!.cellZ).toBe(2);
  });

  it('handles negative direction', () => {
    const g = buildGrid([
      '#...',
      '#...',
    ]);
    const hit = raycastWalls(g, { x: 2.5, z: 0.5 }, { x: -1, z: 0 }, 5, CELL_SIZE);
    expect(hit).not.toBeNull();
    expect(hit!.cellX).toBe(0);
  });
});

describe('lineOfSight', () => {
  it('returns true when no walls between', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    expect(lineOfSight(g, { x: 0.5, z: 0.5 }, { x: 3.5, z: 2.5 }, CELL_SIZE)).toBe(true);
  });

  it('returns false when a wall is between', () => {
    const g = buildGrid([
      '....',
      '..#.',
      '....',
    ]);
    expect(lineOfSight(g, { x: 0.5, z: 1.5 }, { x: 3.5, z: 1.5 }, CELL_SIZE)).toBe(false);
  });

  it('returns true when target is the same cell as origin', () => {
    const g = buildGrid([
      '....',
      '....',
    ]);
    expect(lineOfSight(g, { x: 0.5, z: 0.5 }, { x: 0.5, z: 0.5 }, CELL_SIZE)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/level/raycast.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/level/raycast.ts`**

```ts
import { Vec2, distance, normalize } from '../math/vec2';
import { Grid } from './grid';
import { isSolid } from './cell';

export interface RaycastHit {
  distance: number;
  point: Vec2;
  cellX: number;
  cellZ: number;
}

/**
 * Walks the grid using a 2D DDA (Digital Differential Analyzer).
 * Returns the first solid-cell hit within maxDist, or null.
 */
export function raycastWalls(
  grid: Grid,
  origin: Vec2,
  direction: Vec2,
  maxDist: number,
  cellSize: number,
): RaycastHit | null {
  const dir = normalize(direction);
  if (dir.x === 0 && dir.z === 0) return null;

  let cellX = Math.floor(origin.x / cellSize);
  let cellZ = Math.floor(origin.z / cellSize);

  // Distance the ray must travel to cross one cell in each axis.
  const deltaX = dir.x === 0 ? Infinity : Math.abs(cellSize / dir.x);
  const deltaZ = dir.z === 0 ? Infinity : Math.abs(cellSize / dir.z);

  // Initial side distance — distance from origin to the first X/Z grid line.
  let sideX: number;
  let sideZ: number;
  let stepX: number;
  let stepZ: number;

  if (dir.x < 0) {
    stepX = -1;
    sideX = (origin.x - cellX * cellSize) / Math.abs(dir.x);
  } else {
    stepX = 1;
    sideX = ((cellX + 1) * cellSize - origin.x) / dir.x;
  }
  if (dir.z < 0) {
    stepZ = -1;
    sideZ = (origin.z - cellZ * cellSize) / Math.abs(dir.z);
  } else {
    stepZ = 1;
    sideZ = ((cellZ + 1) * cellSize - origin.z) / dir.z;
  }

  let dist = 0;
  // Safety cap on iterations to avoid infinite loops on degenerate input.
  for (let i = 0; i < 1000; i++) {
    if (sideX < sideZ) {
      dist = sideX;
      sideX += deltaX;
      cellX += stepX;
    } else {
      dist = sideZ;
      sideZ += deltaZ;
      cellZ += stepZ;
    }
    if (dist > maxDist) return null;
    if (isSolid(grid.get(cellX, cellZ))) {
      return {
        distance: dist,
        point: { x: origin.x + dir.x * dist, z: origin.z + dir.z * dist },
        cellX,
        cellZ,
      };
    }
  }
  return null;
}

export function lineOfSight(grid: Grid, a: Vec2, b: Vec2, cellSize: number): boolean {
  const dir = { x: b.x - a.x, z: b.z - a.z };
  const dist = distance(a, b);
  if (dist === 0) return true;
  const hit = raycastWalls(grid, a, dir, dist, cellSize);
  return hit === null;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/level/raycast.test.ts
```
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/level/raycast.ts tests/level/raycast.test.ts
git commit -m "feat: DDA wall raycast and line-of-sight helpers"
```

---

## Phase 4: Level Loader (TDD)

### Task 7: Level types and JSON schema

**Files:**
- Create: `src/level/level.ts`

- [ ] **Step 1: Implement `src/level/level.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/level/level.ts
git commit -m "feat: Level and LevelJson type definitions"
```

---

### Task 8: Level loader

**Files:**
- Create: `src/level/level-loader.ts`
- Create: `tests/level/level-loader.test.ts`
- Create: `tests/fixtures/test-level.json`

- [ ] **Step 1: Create test fixture `tests/fixtures/test-level.json`**

```json
{
  "name": "Test Level",
  "theme": "castle",
  "gridSize": 4.0,
  "width": 5,
  "height": 5,
  "tiles": [
    "#####",
    "#...#",
    "#.G.#",
    "#..L#",
    "#####"
  ],
  "legend": {
    "#": { "type": "wall", "texture": "castle_stone" },
    ".": { "type": "floor" },
    "G": { "type": "floor" },
    "L": { "type": "door", "locked": true, "key": "small_key" }
  },
  "spawns": {
    "player": { "x": 1.5, "z": 1.5, "yaw": 0 },
    "enemies": [
      { "type": "green_knight", "x": 2.5, "z": 2.5 }
    ],
    "pickups": [
      { "type": "small_key", "x": 1.5, "z": 3.5 }
    ]
  },
  "ambient": {
    "wallHeight": 4.0,
    "floorColor": "#2a1e12",
    "ceilingColor": "#0a0604",
    "fogDensity": 0.04
  }
}
```

- [ ] **Step 2: Write failing tests**

`tests/level/level-loader.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadLevel } from '../../src/level/level-loader';
import { Cell } from '../../src/level/cell';
import fixture from '../fixtures/test-level.json';

describe('loadLevel', () => {
  it('parses width, height, gridSize, theme, name', () => {
    const lvl = loadLevel(fixture);
    expect(lvl.width).toBe(5);
    expect(lvl.height).toBe(5);
    expect(lvl.gridSize).toBe(4);
    expect(lvl.theme).toBe('castle');
    expect(lvl.name).toBe('Test Level');
  });

  it('builds the wall grid from ASCII tiles', () => {
    const lvl = loadLevel(fixture);
    // Border is wall
    expect(lvl.grid.get(0, 0)).toBe(Cell.Wall);
    expect(lvl.grid.get(4, 4)).toBe(Cell.Wall);
    // Inside is empty
    expect(lvl.grid.get(1, 1)).toBe(Cell.Empty);
    // 'G' enemy spawn is on a floor cell
    expect(lvl.grid.get(2, 2)).toBe(Cell.Empty);
    // 'L' is a locked door
    expect(lvl.grid.get(3, 3)).toBe(Cell.LockedDoor);
  });

  it('parses player spawn', () => {
    const lvl = loadLevel(fixture);
    expect(lvl.spawns.player).toEqual({ x: 1.5, z: 1.5, yaw: 0 });
  });

  it('parses enemy spawns', () => {
    const lvl = loadLevel(fixture);
    expect(lvl.spawns.enemies).toHaveLength(1);
    expect(lvl.spawns.enemies[0]).toEqual({ type: 'green_knight', x: 2.5, z: 2.5 });
  });

  it('parses pickup spawns', () => {
    const lvl = loadLevel(fixture);
    expect(lvl.spawns.pickups).toHaveLength(1);
    expect(lvl.spawns.pickups[0]).toEqual({ type: 'small_key', x: 1.5, z: 3.5 });
  });

  it('extracts door positions from the tiles', () => {
    const lvl = loadLevel(fixture);
    expect(lvl.spawns.doors).toHaveLength(1);
    expect(lvl.spawns.doors[0]).toEqual({ x: 3, z: 3, locked: true });
  });

  it('parses ambient settings', () => {
    const lvl = loadLevel(fixture);
    expect(lvl.ambient.wallHeight).toBe(4);
    expect(lvl.ambient.floorColor).toBe('#2a1e12');
    expect(lvl.ambient.fogDensity).toBe(0.04);
  });

  it('throws on row length mismatch', () => {
    const bad = { ...fixture, tiles: ['###', '##', '###', '###', '###'] };
    expect(() => loadLevel(bad as any)).toThrow(/row length/i);
  });

  it('throws on unknown legend char', () => {
    const bad = {
      ...fixture,
      tiles: ['#####', '#.?.#', '#...#', '#...#', '#####'],
    };
    expect(() => loadLevel(bad as any)).toThrow(/unknown.*char/i);
  });

  it('throws when row count does not match height', () => {
    const bad = { ...fixture, tiles: ['#####', '#####'] };
    expect(() => loadLevel(bad as any)).toThrow(/row count/i);
  });
});
```

- [ ] **Step 3: Run tests, verify failure**

```bash
pnpm test tests/level/level-loader.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Implement `src/level/level-loader.ts`**

```ts
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
        `Level row ${z} length ${json.tiles[z].length} does not match width ${json.width}`,
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
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm test tests/level/level-loader.test.ts
```
Expected: 10 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/level/level-loader.ts tests/level/level-loader.test.ts tests/fixtures/test-level.json
git commit -m "feat: level loader with validation and door extraction"
```

---

## Phase 5: Entity Base and World

### Task 9: `Entity` abstract base

**Files:**
- Create: `src/entities/entity.ts`

- [ ] **Step 1: Implement `src/entities/entity.ts`**

```ts
import { Vec2 } from '../math/vec2';
import { AABB, makeAABB } from '../math/aabb';
import type { World } from './world';

export abstract class Entity {
  position: Vec2;
  yaw: number;
  halfExtents: Vec2;
  alive: boolean;

  constructor(position: Vec2, halfExtents: Vec2, yaw = 0) {
    this.position = { x: position.x, z: position.z };
    this.yaw = yaw;
    this.halfExtents = { x: halfExtents.x, z: halfExtents.z };
    this.alive = true;
  }

  abstract update(dt: number, world: World): void;

  getAABB(): AABB {
    return makeAABB(this.position, this.halfExtents);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/entity.ts
git commit -m "feat: Entity abstract base class"
```

---

### Task 10: `World` interface and implementation

`World` is the runtime composite — the level grid + all live entities + helper queries. Entities only ever read/write the world through this interface, which lets us test entity logic with a fake `World`.

**Files:**
- Create: `src/entities/world.ts`
- Create: `tests/entities/world.test.ts`

- [ ] **Step 1: Write failing tests for World queries**

`tests/entities/world.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { World } from '../../src/entities/world';
import { Entity } from '../../src/entities/entity';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

class TestEntity extends Entity {
  update() {}
}

function buildGrid(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const g = makeGrid(w, h);
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      g.set(x, z, rows[z][x] === '#' ? Cell.Wall : Cell.Empty);
    }
  }
  return g;
}

describe('World', () => {
  it('starts with no entities', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    expect(w.entities).toHaveLength(0);
  });

  it('add() pushes an entity', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const e = new TestEntity({ x: 1, z: 0 }, { x: 0.3, z: 0.3 });
    w.add(e);
    expect(w.entities).toContain(e);
  });

  it('overlapCircle returns entities within radius', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const a = new TestEntity({ x: 0, z: 0 }, { x: 0.3, z: 0.3 });
    const b = new TestEntity({ x: 1, z: 0 }, { x: 0.3, z: 0.3 });
    const c = new TestEntity({ x: 5, z: 0 }, { x: 0.3, z: 0.3 });
    w.add(a);
    w.add(b);
    w.add(c);
    const r = w.overlapCircle({ x: 0, z: 0 }, 1.5);
    expect(r).toContain(a);
    expect(r).toContain(b);
    expect(r).not.toContain(c);
  });

  it('entitiesInArc returns only entities in the forward cone', () => {
    const g = buildGrid(['....', '....', '....']);
    const w = new World(g, 1);
    const front = new TestEntity({ x: 1, z: 0.5 }, { x: 0.3, z: 0.3 });
    const behind = new TestEntity({ x: -1, z: 0.5 }, { x: 0.3, z: 0.3 });
    w.add(front);
    w.add(behind);
    // Looking +x direction (forward = (1, 0))
    const arc = w.entitiesInArc({ x: 0, z: 0.5 }, { x: 1, z: 0 }, Math.PI / 4, 2);
    expect(arc).toContain(front);
    expect(arc).not.toContain(behind);
  });

  it('lineOfSight delegates to grid raycast', () => {
    const g = buildGrid(['....', '....', '....']);
    const w = new World(g, 1);
    expect(w.lineOfSight({ x: 0.5, z: 0.5 }, { x: 3.5, z: 2.5 })).toBe(true);
  });

  it('removeDead drops entities marked alive=false', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const a = new TestEntity({ x: 0, z: 0 }, { x: 0.3, z: 0.3 });
    const b = new TestEntity({ x: 1, z: 0 }, { x: 0.3, z: 0.3 });
    w.add(a);
    w.add(b);
    a.alive = false;
    w.removeDead();
    expect(w.entities).not.toContain(a);
    expect(w.entities).toContain(b);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/world.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/entities/world.ts`**

```ts
import { Vec2, sub, dot, length, normalize } from '../math/vec2';
import { Grid } from '../level/grid';
import { lineOfSight, raycastWalls, RaycastHit } from '../level/raycast';
import { Entity } from './entity';

export class World {
  grid: Grid;
  cellSize: number;
  entities: Entity[] = [];

  constructor(grid: Grid, cellSize: number) {
    this.grid = grid;
    this.cellSize = cellSize;
  }

  add(entity: Entity): void {
    this.entities.push(entity);
  }

  removeDead(): void {
    this.entities = this.entities.filter((e) => e.alive);
  }

  raycastWalls(origin: Vec2, direction: Vec2, maxDist: number): RaycastHit | null {
    return raycastWalls(this.grid, origin, direction, maxDist, this.cellSize);
  }

  lineOfSight(a: Vec2, b: Vec2): boolean {
    return lineOfSight(this.grid, a, b, this.cellSize);
  }

  overlapCircle(center: Vec2, radius: number): Entity[] {
    const r2 = radius * radius;
    return this.entities.filter((e) => {
      const dx = e.position.x - center.x;
      const dz = e.position.z - center.z;
      return dx * dx + dz * dz <= r2;
    });
  }

  entitiesInArc(
    center: Vec2,
    forward: Vec2,
    halfArcRad: number,
    radius: number,
  ): Entity[] {
    const f = normalize(forward);
    const cosLimit = Math.cos(halfArcRad);
    return this.overlapCircle(center, radius).filter((e) => {
      const toEntity = sub(e.position, center);
      const dist = length(toEntity);
      if (dist === 0) return true;
      const cosAngle = dot(toEntity, f) / dist;
      return cosAngle >= cosLimit;
    });
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/entities/world.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/world.ts tests/entities/world.test.ts
git commit -m "feat: World runtime container with spatial query helpers"
```

---

## Phase 6: Player

### Task 11: Player state and pickup effects (TDD)

This task builds the Player class focused on its **pure state** — health, magic, ammo, weapon unlocks, pickup effects, and damage intake with i-frames. Movement and weapon firing come in later tasks.

**Files:**
- Create: `src/entities/player.ts`
- Create: `tests/entities/player.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/entities/player.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Player } from '../../src/entities/player';

function newPlayer() {
  return new Player({ x: 0, z: 0 });
}

describe('Player state', () => {
  it('starts at full health, full magic, with sword unlocked', () => {
    const p = newPlayer();
    expect(p.health).toBe(12);
    expect(p.maxHealth).toBe(12);
    expect(p.magic).toBe(16);
    expect(p.maxMagic).toBe(16);
    expect(p.arrows).toBe(10);
    expect(p.bombs).toBe(5);
    expect(p.hasSmallKey).toBe(false);
    expect(p.unlockedWeapons.has(0)).toBe(true);
    expect(p.unlockedWeapons.has(1)).toBe(false);
    expect(p.currentWeapon).toBe(0);
  });
});

describe('Player.takeDamage', () => {
  it('reduces health by damage amount', () => {
    const p = newPlayer();
    p.takeDamage(2);
    expect(p.health).toBe(10);
  });

  it('triggers iframes after a hit', () => {
    const p = newPlayer();
    p.takeDamage(1);
    expect(p.iframesRemaining).toBeGreaterThan(0);
  });

  it('ignores damage during iframes', () => {
    const p = newPlayer();
    p.takeDamage(1);
    p.takeDamage(4);
    expect(p.health).toBe(11);
  });

  it('clamps health to 0', () => {
    const p = newPlayer();
    p.takeDamage(100);
    expect(p.health).toBe(0);
  });

  it('marks dead when health reaches 0', () => {
    const p = newPlayer();
    p.takeDamage(100);
    expect(p.isDead()).toBe(true);
  });

  it('iframes decrement with tickTimers', () => {
    const p = newPlayer();
    p.takeDamage(1);
    const initial = p.iframesRemaining;
    p.tickTimers(0.1);
    expect(p.iframesRemaining).toBeCloseTo(initial - 0.1);
  });
});

describe('Player.applyPickup', () => {
  it('heart adds 2 half-hearts up to max', () => {
    const p = newPlayer();
    p.takeDamage(6);
    p.applyPickup('heart');
    expect(p.health).toBe(8);
  });

  it('heart clamps to max', () => {
    const p = newPlayer();
    p.applyPickup('heart');
    expect(p.health).toBe(12);
  });

  it('heart_large fully refills', () => {
    const p = newPlayer();
    p.takeDamage(8);
    p.applyPickup('heart_large');
    expect(p.health).toBe(12);
  });

  it('magic_jar adds 8 magic up to max', () => {
    const p = newPlayer();
    p.magic = 4;
    p.applyPickup('magic_jar');
    expect(p.magic).toBe(12);
  });

  it('arrows_10 adds 10 arrows up to max', () => {
    const p = newPlayer();
    p.applyPickup('arrows_10');
    expect(p.arrows).toBe(20);
  });

  it('bombs_5 adds 5 bombs up to max', () => {
    const p = newPlayer();
    p.applyPickup('bombs_5');
    expect(p.bombs).toBe(10);
  });

  it('small_key sets hasSmallKey', () => {
    const p = newPlayer();
    p.applyPickup('small_key');
    expect(p.hasSmallKey).toBe(true);
  });

  it('weapon_bow unlocks slot 1', () => {
    const p = newPlayer();
    p.applyPickup('weapon_bow');
    expect(p.unlockedWeapons.has(1)).toBe(true);
  });

  it('weapon_bombs unlocks slot 2', () => {
    const p = newPlayer();
    p.applyPickup('weapon_bombs');
    expect(p.unlockedWeapons.has(2)).toBe(true);
  });

  it('weapon_fire_rod unlocks slot 3', () => {
    const p = newPlayer();
    p.applyPickup('weapon_fire_rod');
    expect(p.unlockedWeapons.has(3)).toBe(true);
  });
});

describe('Player.selectWeapon', () => {
  it('does nothing if weapon is not unlocked', () => {
    const p = newPlayer();
    p.selectWeapon(2);
    expect(p.currentWeapon).toBe(0);
  });

  it('switches to an unlocked weapon', () => {
    const p = newPlayer();
    p.applyPickup('weapon_bow');
    p.selectWeapon(1);
    expect(p.currentWeapon).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/player.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/entities/player.ts`**

```ts
import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { SpawnPickup } from '../level/level';

export const PLAYER_HALF_EXTENTS: Vec2 = { x: 0.3, z: 0.3 };
export const PLAYER_EYE_HEIGHT = 1.5;
export const IFRAME_DURATION = 0.8;

export type PickupType = SpawnPickup['type'];

export class Player extends Entity {
  health = 12;
  maxHealth = 12;
  magic = 16;
  maxMagic = 16;
  arrows = 10;
  maxArrows = 30;
  bombs = 5;
  maxBombs = 15;
  hasSmallKey = false;
  unlockedWeapons = new Set<number>([0]);
  currentWeapon = 0;
  iframesRemaining = 0;
  pitch = 0;

  constructor(position: Vec2, yaw = 0) {
    super(position, PLAYER_HALF_EXTENTS, yaw);
  }

  update(_dt: number, _world: World): void {
    // Movement and firing handled by Game (which has Input access).
  }

  tickTimers(dt: number): void {
    if (this.iframesRemaining > 0) {
      this.iframesRemaining = Math.max(0, this.iframesRemaining - dt);
    }
  }

  takeDamage(amount: number): void {
    if (this.iframesRemaining > 0) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health > 0) {
      this.iframesRemaining = IFRAME_DURATION;
    }
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  applyPickup(type: PickupType): void {
    switch (type) {
      case 'heart':
        this.health = Math.min(this.maxHealth, this.health + 2);
        break;
      case 'heart_large':
        this.health = this.maxHealth;
        break;
      case 'magic_jar':
        this.magic = Math.min(this.maxMagic, this.magic + 8);
        break;
      case 'arrows_10':
        this.arrows = Math.min(this.maxArrows, this.arrows + 10);
        break;
      case 'bombs_5':
        this.bombs = Math.min(this.maxBombs, this.bombs + 5);
        break;
      case 'small_key':
        this.hasSmallKey = true;
        break;
      case 'weapon_bow':
        this.unlockedWeapons.add(1);
        break;
      case 'weapon_bombs':
        this.unlockedWeapons.add(2);
        break;
      case 'weapon_fire_rod':
        this.unlockedWeapons.add(3);
        break;
    }
  }

  selectWeapon(slot: number): void {
    if (this.unlockedWeapons.has(slot)) {
      this.currentWeapon = slot;
    }
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/entities/player.test.ts
```
Expected: All ~20 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/player.ts tests/entities/player.test.ts
git commit -m "feat: Player state, damage with i-frames, pickup effects"
```

---

## Phase 7: Projectiles and Pickups

### Task 12: `Projectile` class with bomb and firebolt subtypes

**Files:**
- Create: `src/entities/projectile.ts`
- Create: `tests/entities/projectile.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/entities/projectile.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { Bomb, FireBolt, BLAST_RADIUS, BOMB_DIRECT_DAMAGE } from '../../src/entities/projectile';
import { World } from '../../src/entities/world';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';
import { Entity } from '../../src/entities/entity';

class TestTarget extends Entity {
  hp = 10;
  constructor(pos: { x: number; z: number }) {
    super(pos, { x: 0.4, z: 0.4 });
  }
  update() {}
}

describe('Bomb projectile', () => {
  it('applies gravity to vertical velocity over time', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const b = new Bomb({ x: 0, z: 0 }, { x: 0, z: 0 }, 0);
    b.heightVelocity = 4;
    b.update(0.5, w);
    // After 0.5s with gravity -12, height velocity should be 4 - 6 = -2
    expect(b.heightVelocity).toBeCloseTo(-2);
  });

  it('detonates after lifetime expires', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const b = new Bomb({ x: 1, z: 1 }, { x: 0, z: 0 }, 0);
    b.lifetime = 0.01;
    b.update(0.02, w);
    expect(b.alive).toBe(false);
  });

  it('detonation damages entities within blast radius with falloff', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const t1 = new TestTarget({ x: 0, z: 0 });
    const t2 = new TestTarget({ x: 1.5, z: 0 });
    const t3 = new TestTarget({ x: 5, z: 0 });
    w.add(t1);
    w.add(t2);
    w.add(t3);
    const b = new Bomb({ x: 0, z: 0 }, { x: 0, z: 0 }, 0);
    b.detonate(w, (target, dmg) => {
      (target as TestTarget).hp -= dmg;
    });
    expect((t1 as TestTarget).hp).toBe(10 - BOMB_DIRECT_DAMAGE);
    // t2 at half radius gets ~half damage
    expect((t2 as TestTarget).hp).toBeLessThan(10);
    expect((t2 as TestTarget).hp).toBeGreaterThan(10 - BOMB_DIRECT_DAMAGE);
    // t3 outside radius is unaffected
    expect((t3 as TestTarget).hp).toBe(10);
  });

  it('detonation destroys breakable wall cells in radius', () => {
    const g = makeGrid(5, 5);
    g.set(2, 2, Cell.Breakable);
    const w = new World(g, 1);
    const b = new Bomb({ x: 2.5, z: 2.5 }, { x: 0, z: 0 }, 0);
    b.detonate(w, () => {});
    expect(g.get(2, 2)).toBe(Cell.Empty);
  });
});

describe('FireBolt projectile', () => {
  it('moves in its direction at fire bolt speed', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const f = new FireBolt({ x: 1, z: 1 }, { x: 1, z: 0 });
    f.update(0.1, w);
    expect(f.position.x).toBeGreaterThan(1);
    expect(f.position.z).toBeCloseTo(1);
  });

  it('dies when it hits a wall', () => {
    const g = makeGrid(5, 5);
    g.set(3, 1, Cell.Wall);
    const w = new World(g, 1);
    const f = new FireBolt({ x: 1, z: 1.5 }, { x: 1, z: 0 });
    // Step it forward enough to enter the wall cell
    for (let i = 0; i < 10; i++) f.update(0.1, w);
    expect(f.alive).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/projectile.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/entities/projectile.ts`**

```ts
import { Vec2, scale, add } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Cell, isSolid } from '../level/cell';

export const BOMB_GRAVITY = -12;
export const BOMB_LIFETIME = 2.0;
export const BLAST_RADIUS = 3.0;
export const BOMB_DIRECT_DAMAGE = 8;

export const FIREBOLT_SPEED = 20;
export const FIREBOLT_DAMAGE = 4;
export const FIREBOLT_LIFETIME = 2.0;

export type DamageFn = (target: Entity, dmg: number) => void;

export class Bomb extends Entity {
  velocity: Vec2;
  heightVelocity: number;
  lifetime = BOMB_LIFETIME;
  ownerId: number;
  detonateCallback?: (world: World) => void;

  constructor(position: Vec2, velocity: Vec2, ownerId: number) {
    super(position, { x: 0.2, z: 0.2 });
    this.velocity = { ...velocity };
    this.heightVelocity = 4;
    this.ownerId = ownerId;
  }

  update(dt: number, world: World): void {
    this.heightVelocity += BOMB_GRAVITY * dt;
    this.position = add(this.position, scale(this.velocity, dt));
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      if (this.detonateCallback) this.detonateCallback(world);
      this.alive = false;
    }
  }

  detonate(world: World, damageFn: DamageFn): void {
    const r2 = BLAST_RADIUS * BLAST_RADIUS;
    for (const e of world.entities) {
      const dx = e.position.x - this.position.x;
      const dz = e.position.z - this.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 <= r2) {
        const d = Math.sqrt(d2);
        const dmg = Math.floor(BOMB_DIRECT_DAMAGE * (1 - d / BLAST_RADIUS));
        if (dmg > 0) damageFn(e, dmg);
      }
    }
    // Destroy breakable walls
    const g = world.grid;
    const cs = world.cellSize;
    const minCx = Math.floor((this.position.x - BLAST_RADIUS) / cs);
    const maxCx = Math.floor((this.position.x + BLAST_RADIUS) / cs);
    const minCz = Math.floor((this.position.z - BLAST_RADIUS) / cs);
    const maxCz = Math.floor((this.position.z + BLAST_RADIUS) / cs);
    for (let cz = minCz; cz <= maxCz; cz++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        if (g.get(cx, cz) === Cell.Breakable) {
          const ccx = (cx + 0.5) * cs;
          const ccz = (cz + 0.5) * cs;
          const dx = ccx - this.position.x;
          const dz = ccz - this.position.z;
          if (dx * dx + dz * dz <= r2) {
            g.set(cx, cz, Cell.Empty);
          }
        }
      }
    }
  }
}

export class FireBolt extends Entity {
  velocity: Vec2;
  lifetime = FIREBOLT_LIFETIME;
  damage = FIREBOLT_DAMAGE;
  ownerId: number;

  constructor(position: Vec2, direction: Vec2, ownerId = -1) {
    super(position, { x: 0.15, z: 0.15 });
    const speed = FIREBOLT_SPEED;
    const len = Math.sqrt(direction.x * direction.x + direction.z * direction.z) || 1;
    this.velocity = { x: (direction.x / len) * speed, z: (direction.z / len) * speed };
    this.ownerId = ownerId;
  }

  update(dt: number, world: World): void {
    this.position = add(this.position, scale(this.velocity, dt));
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.alive = false;
      return;
    }
    // Wall collision check
    const cs = world.cellSize;
    const cx = Math.floor(this.position.x / cs);
    const cz = Math.floor(this.position.z / cs);
    if (isSolid(world.grid.get(cx, cz))) {
      this.alive = false;
    }
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/entities/projectile.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/projectile.ts tests/entities/projectile.test.ts
git commit -m "feat: Bomb (gravity + AoE + breakable walls) and FireBolt projectiles"
```

---

### Task 13: `Pickup` entity

**Files:**
- Create: `src/entities/pickup.ts`
- Create: `tests/entities/pickup.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/entities/pickup.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Pickup } from '../../src/entities/pickup';
import { Player } from '../../src/entities/player';

describe('Pickup', () => {
  it('applies its effect to player on touch', () => {
    const p = new Player({ x: 0, z: 0 });
    p.takeDamage(4);
    const pu = new Pickup({ x: 0, z: 0 }, 'heart');
    pu.onTouch(p);
    expect(p.health).toBe(10);
    expect(pu.alive).toBe(false);
  });

  it('does not double-apply if onTouch called twice', () => {
    const p = new Player({ x: 0, z: 0 });
    p.takeDamage(4);
    const pu = new Pickup({ x: 0, z: 0 }, 'heart');
    pu.onTouch(p);
    pu.onTouch(p);
    expect(p.health).toBe(10);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/pickup.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/entities/pickup.ts`**

```ts
import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Player, PickupType } from './player';

export class Pickup extends Entity {
  pickupType: PickupType;

  constructor(position: Vec2, type: PickupType) {
    super(position, { x: 0.3, z: 0.3 });
    this.pickupType = type;
  }

  update(_dt: number, _world: World): void {
    // Stationary; collected via onTouch from Game
  }

  onTouch(player: Player): void {
    if (!this.alive) return;
    player.applyPickup(this.pickupType);
    this.alive = false;
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/entities/pickup.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/pickup.ts tests/entities/pickup.test.ts
git commit -m "feat: Pickup entity with single-use onTouch effect"
```

---

## Phase 8: Doors

### Task 14: `Door` entity with state machine

**Files:**
- Create: `src/entities/door.ts`
- Create: `tests/entities/door.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/entities/door.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/door.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/entities/door.ts`**

```ts
import { Vec2 } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Player } from './player';
import { Cell } from '../level/cell';

export const DoorState = {
  Closed: 'CLOSED',
  Opening: 'OPENING',
  Open: 'OPEN',
} as const;

export type DoorStateValue = (typeof DoorState)[keyof typeof DoorState];

export const DOOR_OPEN_DURATION = 0.5;

export type DoorOpenResult = 'locked' | 'opened';

export class Door extends Entity {
  locked: boolean;
  cellX: number;
  cellZ: number;
  state: DoorStateValue = DoorState.Closed;
  openProgress = 0;

  constructor(position: Vec2, locked: boolean, cellX: number, cellZ: number) {
    super(position, { x: 0.5, z: 0.5 });
    this.locked = locked;
    this.cellX = cellX;
    this.cellZ = cellZ;
  }

  update(dt: number, world: World): void {
    if (this.state === DoorState.Opening) {
      this.openProgress += dt / DOOR_OPEN_DURATION;
      if (this.openProgress >= 1) {
        this.openProgress = 1;
        this.state = DoorState.Open;
        world.grid.set(this.cellX, this.cellZ, Cell.Empty);
      }
    }
  }

  tryOpen(player: Player, _world: World): DoorOpenResult {
    if (this.state !== DoorState.Closed) return 'opened';
    if (this.locked) {
      if (!player.hasSmallKey) return 'locked';
      player.hasSmallKey = false;
    }
    this.state = DoorState.Opening;
    return 'opened';
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/entities/door.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/door.ts tests/entities/door.test.ts
git commit -m "feat: Door entity with locked/open state machine"
```

---

## Phase 9: Enemies

### Task 15: `Enemy` base class with state machine and pathfinding

**Files:**
- Create: `src/entities/enemy.ts`
- Create: `tests/entities/enemy.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/entities/enemy.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Enemy, EnemyState, GreenKnight, BlueKnight, RedKnight, PurpleKnight, pickGreedyDirection } from '../../src/entities/enemy';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

function buildGrid(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const g = makeGrid(w, h);
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      g.set(x, z, rows[z][x] === '#' ? Cell.Wall : Cell.Empty);
    }
  }
  return g;
}

describe('Enemy state machine', () => {
  it('starts in IDLE', () => {
    const e = new GreenKnight({ x: 1, z: 1 });
    expect(e.state).toBe(EnemyState.Idle);
  });

  it('IDLE -> CHASE when player is in aggro range and LOS clear', () => {
    const g = buildGrid([
      '....',
      '....',
      '....',
    ]);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 1, z: 1 });
    const p = new Player({ x: 2.5, z: 1 });
    w.add(e);
    w.add(p);
    e.update(0.016, w);
    expect(e.state).toBe(EnemyState.Chase);
  });

  it('IDLE stays IDLE when LOS is blocked', () => {
    const g = buildGrid([
      '....',
      '.#..',
      '....',
    ]);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 0.5, z: 1.5 });
    const p = new Player({ x: 2.5, z: 1.5 });
    w.add(e);
    w.add(p);
    e.update(0.016, w);
    expect(e.state).toBe(EnemyState.Idle);
  });

  it('CHASE -> ATTACK when in melee range', () => {
    const g = buildGrid(['...', '...', '...']);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 1, z: 1 });
    const p = new Player({ x: 1.4, z: 1 });
    w.add(e);
    w.add(p);
    e.state = EnemyState.Chase;
    e.update(0.016, w);
    expect(e.state).toBe(EnemyState.Attack);
  });

  it('takeDamage triggers HURT and reduces hp', () => {
    const e = new GreenKnight({ x: 1, z: 1 });
    e.takeDamage(1);
    expect(e.hp).toBe(1);
    expect(e.state).toBe(EnemyState.Hurt);
  });

  it('hp <= 0 transitions to DYING', () => {
    const e = new GreenKnight({ x: 1, z: 1 });
    e.takeDamage(99);
    expect(e.state).toBe(EnemyState.Dying);
    expect(e.hp).toBeLessThanOrEqual(0);
  });

  it('DYING -> alive=false after death animation', () => {
    const g = buildGrid(['....']);
    const w = new World(g, 1);
    const e = new GreenKnight({ x: 1, z: 0 });
    e.takeDamage(99);
    e.update(1.0, w);
    expect(e.alive).toBe(false);
  });
});

describe('pickGreedyDirection', () => {
  it('returns direct vector when path is open', () => {
    const g = buildGrid(['...', '...', '...']);
    const dir = pickGreedyDirection(g, 1, { x: 0.5, z: 0.5 }, { x: 2.5, z: 2.5 }, { x: 0.3, z: 0.3 });
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.z).toBeGreaterThan(0);
  });

  it('returns zero vector when fully walled in', () => {
    const g = buildGrid(['###', '#.#', '###']);
    const dir = pickGreedyDirection(g, 1, { x: 1.5, z: 1.5 }, { x: 5, z: 5 }, { x: 0.3, z: 0.3 });
    expect(dir.x).toBe(0);
    expect(dir.z).toBe(0);
  });
});

describe('Enemy tier tuning', () => {
  it('GreenKnight has 2 hp', () => {
    expect(new GreenKnight({ x: 0, z: 0 }).hp).toBe(2);
  });
  it('BlueKnight has 5 hp', () => {
    expect(new BlueKnight({ x: 0, z: 0 }).hp).toBe(5);
  });
  it('RedKnight has 4 hp and faster speed', () => {
    const r = new RedKnight({ x: 0, z: 0 });
    expect(r.hp).toBe(4);
    expect(r.speed).toBeGreaterThan(new GreenKnight({ x: 0, z: 0 }).speed);
  });
  it('PurpleKnight has 20 hp', () => {
    expect(new PurpleKnight({ x: 0, z: 0 }).hp).toBe(20);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/enemy.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/entities/enemy.ts`**

```ts
import { Vec2, sub, length, normalize, distance } from '../math/vec2';
import { Entity } from './entity';
import { World } from './world';
import { Player } from './player';
import { Grid } from '../level/grid';
import { isSolid } from '../level/cell';
import { resolveMovement } from '../level/collision';
import { makeAABB } from '../math/aabb';

export const EnemyState = {
  Idle: 'IDLE',
  Chase: 'CHASE',
  Attack: 'ATTACK',
  Hurt: 'HURT',
  Dying: 'DYING',
} as const;

export type EnemyStateValue = (typeof EnemyState)[keyof typeof EnemyState];

const HURT_DURATION = 0.15;
const DYING_DURATION = 0.5;
const ATTACK_DURATION = 0.5;

export abstract class Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  aggroRange: number;
  meleeRange: number;
  state: EnemyStateValue = EnemyState.Idle;
  stateTimer = 0;
  attackCooldown = 0;
  hasDealtAttackDamage = false;

  constructor(
    position: Vec2,
    hp: number,
    speed: number,
    damage: number,
    aggroRange: number,
    meleeRange = 1.0,
  ) {
    super(position, { x: 0.4, z: 0.4 });
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.damage = damage;
    this.aggroRange = aggroRange;
    this.meleeRange = meleeRange;
  }

  update(dt: number, world: World): void {
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    switch (this.state) {
      case EnemyState.Idle:
        this.tickIdle(world);
        break;
      case EnemyState.Chase:
        this.tickChase(dt, world);
        break;
      case EnemyState.Attack:
        this.tickAttack(dt, world);
        break;
      case EnemyState.Hurt:
        this.tickHurt(dt);
        break;
      case EnemyState.Dying:
        this.tickDying(dt);
        break;
    }
  }

  protected tickIdle(world: World): void {
    const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
    if (!player) return;
    const d = distance(this.position, player.position);
    if (d <= this.aggroRange && world.lineOfSight(this.position, player.position)) {
      this.state = EnemyState.Chase;
    }
  }

  protected tickChase(dt: number, world: World): void {
    const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
    if (!player) return;
    const d = distance(this.position, player.position);
    if (d <= this.meleeRange) {
      this.state = EnemyState.Attack;
      this.stateTimer = ATTACK_DURATION;
      this.hasDealtAttackDamage = false;
      return;
    }
    const dir = pickGreedyDirection(world.grid, world.cellSize, this.position, player.position, this.halfExtents);
    if (dir.x === 0 && dir.z === 0) return;
    const motion = { x: dir.x * this.speed * dt, z: dir.z * this.speed * dt };
    this.position = resolveMovement(world.grid, makeAABB(this.position, this.halfExtents), motion, world.cellSize);
    this.yaw = Math.atan2(dir.z, dir.x);
  }

  protected tickAttack(dt: number, world: World): void {
    this.stateTimer -= dt;
    // Deal damage at the midpoint of the attack
    if (!this.hasDealtAttackDamage && this.stateTimer <= ATTACK_DURATION / 2) {
      const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
      if (player && distance(this.position, player.position) <= this.meleeRange + 0.2) {
        player.takeDamage(this.damage);
      }
      this.hasDealtAttackDamage = true;
    }
    if (this.stateTimer <= 0) {
      this.state = EnemyState.Chase;
    }
  }

  protected tickHurt(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.state = EnemyState.Chase;
    }
  }

  protected tickDying(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.alive = false;
    }
  }

  takeDamage(amount: number): void {
    if (this.state === EnemyState.Dying) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.state = EnemyState.Dying;
      this.stateTimer = DYING_DURATION;
    } else {
      this.state = EnemyState.Hurt;
      this.stateTimer = HURT_DURATION;
    }
  }
}

export class GreenKnight extends Enemy {
  constructor(position: Vec2) {
    super(position, 2, 2.0, 1, 8, 1.0);
  }
}

export class BlueKnight extends Enemy {
  shieldChance = 0.3;
  constructor(position: Vec2) {
    super(position, 5, 2.5, 2, 10, 1.0);
  }
  isShielded(): boolean {
    // Deterministic for testing — uses hp as a coarse seed.
    return this.state === EnemyState.Attack && (this.stateTimer * 10) % 1 < this.shieldChance;
  }
}

export class RedKnight extends Enemy {
  charging = false;
  chargeTimer = 0;
  chargeDirection: Vec2 = { x: 0, z: 0 };
  constructor(position: Vec2) {
    super(position, 4, 4.5, 2, 12, 1.0);
  }
}

export class PurpleKnight extends Enemy {
  attackPattern = 0;
  spawnedMinionsAt50 = false;
  spawnedMinionsAt25 = false;
  constructor(position: Vec2) {
    super(position, 20, 3.0, 4, 9999, 1.5);
  }
}

const DIR_8: Vec2[] = [
  { x: 1, z: 0 },
  { x: 0.7071, z: 0.7071 },
  { x: 0, z: 1 },
  { x: -0.7071, z: 0.7071 },
  { x: -1, z: 0 },
  { x: -0.7071, z: -0.7071 },
  { x: 0, z: -1 },
  { x: 0.7071, z: -0.7071 },
];

export function pickGreedyDirection(
  grid: Grid,
  cellSize: number,
  from: Vec2,
  to: Vec2,
  halfExtents: Vec2,
): Vec2 {
  const desired = sub(to, from);
  const len = length(desired);
  if (len === 0) return { x: 0, z: 0 };
  const ndesired = { x: desired.x / len, z: desired.z / len };

  // Sort the 8 cardinal/diagonal directions by similarity to desired
  const sorted = [...DIR_8].sort((a, b) => {
    const da = a.x * ndesired.x + a.z * ndesired.z;
    const db = b.x * ndesired.x + b.z * ndesired.z;
    return db - da;
  });

  for (const dir of sorted) {
    // Probe the cell one step ahead in this direction
    const probe = { x: from.x + dir.x * (halfExtents.x + 0.1), z: from.z + dir.z * (halfExtents.z + 0.1) };
    const cx = Math.floor(probe.x / cellSize);
    const cz = Math.floor(probe.z / cellSize);
    if (!isSolid(grid.get(cx, cz))) {
      return dir;
    }
  }
  return { x: 0, z: 0 };
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/entities/enemy.test.ts
```
Expected: All tests pass. (If shielded test or charge specifics fail, add them as small TODOs in subsequent tasks for those tier behaviors — base machine should pass.)

- [ ] **Step 5: Commit**

```bash
git add src/entities/enemy.ts tests/entities/enemy.test.ts
git commit -m "feat: Enemy state machine with greedy pathfinding and tier subclasses"
```

---

### Task 16: Red Knight charge attack and Purple Knight boss behavior

**Files:**
- Modify: `src/entities/enemy.ts`
- Modify: `tests/entities/enemy.test.ts`

- [ ] **Step 1: Add tests for Red Knight charge**

Append to `tests/entities/enemy.test.ts`:
```ts
describe('RedKnight charge', () => {
  it('moves in a straight line when charging', () => {
    const g = buildGrid(['..........']);
    const w = new World(g, 1);
    const r = new RedKnight({ x: 1, z: 0.5 });
    const p = new Player({ x: 5, z: 0.5 });
    w.add(r);
    w.add(p);
    r.state = EnemyState.Chase;
    r.startCharge(p);
    const startX = r.position.x;
    r.update(0.5, w);
    expect(r.position.x).toBeGreaterThan(startX);
  });
});

describe('PurpleKnight boss', () => {
  it('summons minions at 50% hp', () => {
    const g = buildGrid(['..........', '..........', '..........']);
    const w = new World(g, 1);
    const boss = new PurpleKnight({ x: 5, z: 1 });
    const p = new Player({ x: 0, z: 0 });
    w.add(boss);
    w.add(p);
    boss.takeDamage(10); // 50% hp
    boss.maybeSummon(w);
    expect(w.entities.filter((e) => e instanceof GreenKnight).length).toBe(2);
  });

  it('only summons once at 50% threshold', () => {
    const g = buildGrid(['..........', '..........', '..........']);
    const w = new World(g, 1);
    const boss = new PurpleKnight({ x: 5, z: 1 });
    w.add(boss);
    boss.takeDamage(10);
    boss.maybeSummon(w);
    boss.maybeSummon(w);
    expect(w.entities.filter((e) => e instanceof GreenKnight).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/entities/enemy.test.ts
```
Expected: New tests fail.

- [ ] **Step 3: Add `startCharge` and Red Knight tick override**

In `src/entities/enemy.ts`, replace the `RedKnight` class with:

```ts
const RED_CHARGE_DURATION = 1.0;
const RED_CHARGE_MULTIPLIER = 2.0;

export class RedKnight extends Enemy {
  charging = false;
  chargeTimer = 0;
  chargeDir: Vec2 = { x: 0, z: 0 };

  constructor(position: Vec2) {
    super(position, 4, 4.5, 2, 12, 1.0);
  }

  startCharge(player: Player): void {
    this.charging = true;
    this.chargeTimer = RED_CHARGE_DURATION;
    const d = sub(player.position, this.position);
    this.chargeDir = normalize(d);
  }

  protected tickChase(dt: number, world: World): void {
    if (!this.charging) {
      const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
      if (player && distance(this.position, player.position) > this.meleeRange) {
        this.startCharge(player);
      }
    }
    if (this.charging) {
      this.chargeTimer -= dt;
      const motion = {
        x: this.chargeDir.x * this.speed * RED_CHARGE_MULTIPLIER * dt,
        z: this.chargeDir.z * this.speed * RED_CHARGE_MULTIPLIER * dt,
      };
      this.position = resolveMovement(world.grid, makeAABB(this.position, this.halfExtents), motion, world.cellSize);
      this.yaw = Math.atan2(this.chargeDir.z, this.chargeDir.x);
      if (this.chargeTimer <= 0) {
        this.charging = false;
      }
      const player = world.entities.find((e) => e instanceof Player) as Player | undefined;
      if (player && distance(this.position, player.position) <= this.meleeRange) {
        this.state = EnemyState.Attack;
        this.stateTimer = ATTACK_DURATION;
        this.hasDealtAttackDamage = false;
        this.charging = false;
      }
      return;
    }
    super.tickChase(dt, world);
  }
}
```

(The constant `ATTACK_DURATION` is already defined at the top of the file.)

- [ ] **Step 4: Add `maybeSummon` and Purple Knight overrides**

Replace the `PurpleKnight` class with:

```ts
export class PurpleKnight extends Enemy {
  attackPattern = 0;
  spawnedMinionsAt50 = false;
  spawnedMinionsAt25 = false;
  shotCooldown = 0;

  constructor(position: Vec2) {
    super(position, 20, 3.0, 4, 9999, 1.5);
  }

  maybeSummon(world: World): void {
    const half = this.maxHp / 2;
    const quarter = this.maxHp / 4;
    if (!this.spawnedMinionsAt50 && this.hp <= half) {
      this.spawnMinions(world);
      this.spawnedMinionsAt50 = true;
    } else if (!this.spawnedMinionsAt25 && this.hp <= quarter) {
      this.spawnMinions(world);
      this.spawnedMinionsAt25 = true;
    }
  }

  private spawnMinions(world: World): void {
    world.add(new GreenKnight({ x: this.position.x - 2, z: this.position.z - 2 }));
    world.add(new GreenKnight({ x: this.position.x + 2, z: this.position.z - 2 }));
  }
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm test tests/entities/enemy.test.ts
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/entities/enemy.ts tests/entities/enemy.test.ts
git commit -m "feat: Red Knight charge attack and Purple Knight minion summon"
```

---

## Phase 10: Weapons

### Task 17: `Weapon` base class and Sword

**Files:**
- Create: `src/weapons/weapon.ts`
- Create: `src/weapons/sword.ts`
- Create: `tests/weapons/sword.test.ts`

- [ ] **Step 1: Implement `src/weapons/weapon.ts`**

```ts
import { Player } from '../entities/player';
import { World } from '../entities/world';

export abstract class Weapon {
  abstract readonly name: string;
  abstract readonly cooldownSeconds: number;
  cooldownRemaining = 0;

  abstract canFire(player: Player): boolean;
  abstract fire(player: Player, world: World): void;

  tick(dt: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }
  }
}
```

- [ ] **Step 2: Write failing tests for Sword**

`tests/weapons/sword.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Sword, SWORD_DAMAGE, SWORD_RANGE } from '../../src/weapons/sword';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { GreenKnight, EnemyState } from '../../src/entities/enemy';
import { makeGrid } from '../../src/level/grid';

describe('Sword', () => {
  it('canFire when cooldown is 0', () => {
    const s = new Sword();
    const p = new Player({ x: 0, z: 0 });
    expect(s.canFire(p)).toBe(true);
  });

  it('cannot fire while on cooldown', () => {
    const s = new Sword();
    const p = new Player({ x: 0, z: 0 });
    s.cooldownRemaining = 0.1;
    expect(s.canFire(p)).toBe(false);
  });

  it('fire damages enemies in front arc', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0; // facing +x
    const enemy = new GreenKnight({ x: 2, z: 1 });
    w.add(p);
    w.add(enemy);
    const s = new Sword();
    s.fire(p, w);
    expect(enemy.hp).toBe(2 - SWORD_DAMAGE);
  });

  it('fire ignores enemies behind the player', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 5, z: 5 });
    p.yaw = 0; // facing +x
    const enemy = new GreenKnight({ x: 4, z: 5 }); // behind
    w.add(p);
    w.add(enemy);
    const s = new Sword();
    s.fire(p, w);
    expect(enemy.hp).toBe(2);
  });

  it('fire ignores enemies outside range', () => {
    const g = makeGrid(20, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const enemy = new GreenKnight({ x: 1 + SWORD_RANGE + 1, z: 1 });
    w.add(p);
    w.add(enemy);
    const s = new Sword();
    s.fire(p, w);
    expect(enemy.hp).toBe(2);
  });

  it('fire sets cooldown', () => {
    const g = makeGrid(5, 5);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const s = new Sword();
    s.fire(p, w);
    expect(s.cooldownRemaining).toBe(s.cooldownSeconds);
  });
});
```

- [ ] **Step 3: Run tests, verify failure**

```bash
pnpm test tests/weapons/sword.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Implement `src/weapons/sword.ts`**

```ts
import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Enemy } from '../entities/enemy';
import { fromYaw } from '../math/vec2';

export const SWORD_DAMAGE = 2;
export const SWORD_RANGE = 1.5;
export const SWORD_HALF_ARC = Math.PI / 4; // 45° => full arc 90°
export const SWORD_COOLDOWN = 0.4;

export class Sword extends Weapon {
  readonly name = 'Sword';
  readonly cooldownSeconds = SWORD_COOLDOWN;

  canFire(_player: Player): boolean {
    return this.cooldownRemaining <= 0;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    const forward = fromYaw(player.yaw);
    const targets = world.entitiesInArc(player.position, forward, SWORD_HALF_ARC, SWORD_RANGE);
    for (const t of targets) {
      if (t instanceof Enemy) {
        t.takeDamage(SWORD_DAMAGE);
      }
    }
    this.cooldownRemaining = this.cooldownSeconds;
  }
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm test tests/weapons/sword.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/weapons/weapon.ts src/weapons/sword.ts tests/weapons/sword.test.ts
git commit -m "feat: Weapon base class and Sword melee arc"
```

---

### Task 18: `Bow` weapon (hitscan raycast)

**Files:**
- Create: `src/weapons/bow.ts`
- Create: `tests/weapons/bow.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/weapons/bow.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Bow, BOW_DAMAGE, BOW_RANGE } from '../../src/weapons/bow';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { GreenKnight } from '../../src/entities/enemy';
import { makeGrid } from '../../src/level/grid';
import { Cell } from '../../src/level/cell';

describe('Bow', () => {
  it('canFire when arrows > 0 and cooldown ready', () => {
    const b = new Bow();
    const p = new Player({ x: 0, z: 0 });
    expect(b.canFire(p)).toBe(true);
  });

  it('cannot fire when out of arrows', () => {
    const b = new Bow();
    const p = new Player({ x: 0, z: 0 });
    p.arrows = 0;
    expect(b.canFire(p)).toBe(false);
  });

  it('fire consumes one arrow', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const b = new Bow();
    b.fire(p, w);
    expect(p.arrows).toBe(9);
  });

  it('fire damages first enemy in line', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0;
    const enemy = new GreenKnight({ x: 5, z: 1 });
    w.add(p);
    w.add(enemy);
    const b = new Bow();
    b.fire(p, w);
    expect(enemy.hp).toBe(2 - BOW_DAMAGE);
  });

  it('fire is blocked by walls', () => {
    const g = makeGrid(10, 10);
    g.set(3, 1, Cell.Wall);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1.5 });
    p.yaw = 0;
    const enemy = new GreenKnight({ x: 5, z: 1.5 });
    w.add(p);
    w.add(enemy);
    const b = new Bow();
    b.fire(p, w);
    expect(enemy.hp).toBe(2);
  });

  it('fire respects max range', () => {
    const g = makeGrid(60, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    p.yaw = 0;
    const enemy = new GreenKnight({ x: 1 + BOW_RANGE + 5, z: 1 });
    w.add(p);
    w.add(enemy);
    const b = new Bow();
    b.fire(p, w);
    expect(enemy.hp).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
pnpm test tests/weapons/bow.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/weapons/bow.ts`**

```ts
import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Enemy } from '../entities/enemy';
import { fromYaw, Vec2, sub, dot, length } from '../math/vec2';

export const BOW_DAMAGE = 2;
export const BOW_RANGE = 50;
export const BOW_COOLDOWN = 0.3;

export class Bow extends Weapon {
  readonly name = 'Bow';
  readonly cooldownSeconds = BOW_COOLDOWN;

  canFire(player: Player): boolean {
    return this.cooldownRemaining <= 0 && player.arrows > 0;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    player.arrows -= 1;
    this.cooldownRemaining = this.cooldownSeconds;

    const forward = fromYaw(player.yaw);
    const wallHit = world.raycastWalls(player.position, forward, BOW_RANGE);
    const wallDist = wallHit?.distance ?? BOW_RANGE;

    // Find closest enemy in front, before any wall hit
    let closest: { enemy: Enemy; dist: number } | null = null;
    for (const e of world.entities) {
      if (!(e instanceof Enemy)) continue;
      const toEnemy = sub(e.position, player.position);
      const distAlong = dot(toEnemy, forward);
      if (distAlong <= 0 || distAlong > wallDist) continue;
      // Project onto perpendicular to check if ray actually intersects enemy AABB
      const lateral = length({ x: toEnemy.x - forward.x * distAlong, z: toEnemy.z - forward.z * distAlong });
      if (lateral > Math.max(e.halfExtents.x, e.halfExtents.z)) continue;
      if (!closest || distAlong < closest.dist) closest = { enemy: e, dist: distAlong };
    }

    if (closest) closest.enemy.takeDamage(BOW_DAMAGE);
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
pnpm test tests/weapons/bow.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/weapons/bow.ts tests/weapons/bow.test.ts
git commit -m "feat: Bow hitscan weapon with wall and enemy detection"
```

---

### Task 19: `Bombs` and `FireRod` weapons

**Files:**
- Create: `src/weapons/bombs.ts`
- Create: `src/weapons/fire-rod.ts`
- Create: `tests/weapons/bombs.test.ts`
- Create: `tests/weapons/fire-rod.test.ts`

- [ ] **Step 1: Write failing tests for Bombs**

`tests/weapons/bombs.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Bombs } from '../../src/weapons/bombs';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { Bomb } from '../../src/entities/projectile';
import { makeGrid } from '../../src/level/grid';

describe('Bombs', () => {
  it('cannot fire when bombs = 0', () => {
    const b = new Bombs();
    const p = new Player({ x: 0, z: 0 });
    p.bombs = 0;
    expect(b.canFire(p)).toBe(false);
  });

  it('fire spawns a Bomb projectile and consumes one bomb', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const b = new Bombs();
    b.fire(p, w);
    expect(p.bombs).toBe(4);
    expect(w.entities.some((e) => e instanceof Bomb)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `src/weapons/bombs.ts`**

```ts
import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { Bomb } from '../entities/projectile';
import { fromYaw, scale } from '../math/vec2';

export const BOMB_COOLDOWN = 0.7;
export const BOMB_THROW_SPEED = 8;

export class Bombs extends Weapon {
  readonly name = 'Bombs';
  readonly cooldownSeconds = BOMB_COOLDOWN;

  canFire(player: Player): boolean {
    return this.cooldownRemaining <= 0 && player.bombs > 0;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    player.bombs -= 1;
    this.cooldownRemaining = this.cooldownSeconds;
    const forward = fromYaw(player.yaw);
    const startPos = {
      x: player.position.x + forward.x * 0.5,
      z: player.position.z + forward.z * 0.5,
    };
    const bomb = new Bomb(startPos, scale(forward, BOMB_THROW_SPEED), -1);
    bomb.detonateCallback = (w) => {
      bomb.detonate(w, (target, dmg) => {
        if ('takeDamage' in target && typeof (target as any).takeDamage === 'function') {
          (target as any).takeDamage(dmg);
        }
      });
    };
    world.add(bomb);
  }
}
```

- [ ] **Step 3: Write failing tests for Fire Rod**

`tests/weapons/fire-rod.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { FireRod, FIRE_ROD_MAGIC_COST } from '../../src/weapons/fire-rod';
import { Player } from '../../src/entities/player';
import { World } from '../../src/entities/world';
import { FireBolt } from '../../src/entities/projectile';
import { makeGrid } from '../../src/level/grid';

describe('FireRod', () => {
  it('cannot fire when magic < cost', () => {
    const r = new FireRod();
    const p = new Player({ x: 0, z: 0 });
    p.magic = 1;
    expect(r.canFire(p)).toBe(false);
  });

  it('fire consumes magic and spawns a FireBolt', () => {
    const g = makeGrid(10, 10);
    const w = new World(g, 1);
    const p = new Player({ x: 1, z: 1 });
    const r = new FireRod();
    r.fire(p, w);
    expect(p.magic).toBe(16 - FIRE_ROD_MAGIC_COST);
    expect(w.entities.some((e) => e instanceof FireBolt)).toBe(true);
  });
});
```

- [ ] **Step 4: Implement `src/weapons/fire-rod.ts`**

```ts
import { Weapon } from './weapon';
import { Player } from '../entities/player';
import { World } from '../entities/world';
import { FireBolt } from '../entities/projectile';
import { fromYaw } from '../math/vec2';

export const FIRE_ROD_MAGIC_COST = 2;
export const FIRE_ROD_COOLDOWN = 0.2;

export class FireRod extends Weapon {
  readonly name = 'Fire Rod';
  readonly cooldownSeconds = FIRE_ROD_COOLDOWN;

  canFire(player: Player): boolean {
    return this.cooldownRemaining <= 0 && player.magic >= FIRE_ROD_MAGIC_COST;
  }

  fire(player: Player, world: World): void {
    if (!this.canFire(player)) return;
    player.magic -= FIRE_ROD_MAGIC_COST;
    this.cooldownRemaining = this.cooldownSeconds;
    const forward = fromYaw(player.yaw);
    const startPos = {
      x: player.position.x + forward.x * 0.5,
      z: player.position.z + forward.z * 0.5,
    };
    world.add(new FireBolt(startPos, forward));
  }
}
```

- [ ] **Step 5: Run all weapon tests**

```bash
pnpm test tests/weapons/
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/weapons/bombs.ts src/weapons/fire-rod.ts tests/weapons/bombs.test.ts tests/weapons/fire-rod.test.ts
git commit -m "feat: Bombs (projectile) and FireRod (magic) weapons"
```

---

## Phase 11: Audio Stubs and Input

### Task 20: Audio stubs

**Files:**
- Create: `src/audio.ts`

- [ ] **Step 1: Implement `src/audio.ts`**

```ts
/**
 * Audio is no-op for the MVP. Every sound trigger goes through these
 * functions so a real implementation can be dropped in later without
 * touching call sites.
 */

export type SoundName =
  | 'sword_swing'
  | 'bow_fire'
  | 'bomb_throw'
  | 'bomb_explode'
  | 'fire_rod_cast'
  | 'knight_hurt'
  | 'knight_die'
  | 'knight_alert'
  | 'player_hurt'
  | 'player_die'
  | 'pickup_heart'
  | 'pickup_magic'
  | 'pickup_key'
  | 'pickup_weapon'
  | 'door_open'
  | 'door_locked';

export type MusicName = 'dungeon' | 'boss' | 'victory';

export function playSound(_name: SoundName): void {
  // no-op stub
}

export function playMusic(_name: MusicName): void {
  // no-op stub
}

export function stopMusic(): void {
  // no-op stub
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio.ts
git commit -m "feat: audio stub module with named sound/music hooks"
```

---

### Task 21: Input module (keyboard + mouse + pointer lock)

**Files:**
- Create: `src/input.ts`

- [ ] **Step 1: Implement `src/input.ts`**

```ts
/**
 * Global input state. Updated by DOM event listeners that the
 * Game class registers at boot. Game polls this state each frame.
 */

export interface MouseDelta {
  dx: number;
  dy: number;
}

export class Input {
  private keys = new Set<string>();
  private mouseDelta: MouseDelta = { dx: 0, dy: 0 };
  private mouseDownLeft = false;
  private mouseClickedLeft = false;
  private locked = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.attach();
  }

  private attach(): void {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    this.canvas.addEventListener('click', () => {
      if (!this.locked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.mouseDelta.dx += e.movementX;
        this.mouseDelta.dy += e.movementY;
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (!this.mouseDownLeft) this.mouseClickedLeft = true;
        this.mouseDownLeft = true;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDownLeft = false;
    });
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  /** Returns the accumulated mouse delta and resets it. */
  consumeMouseDelta(): MouseDelta {
    const d = this.mouseDelta;
    this.mouseDelta = { dx: 0, dy: 0 };
    return d;
  }

  /** True only on the frame the mouse was pressed (resets on read). */
  consumeLeftClick(): boolean {
    const c = this.mouseClickedLeft;
    this.mouseClickedLeft = false;
    return c;
  }

  isLeftDown(): boolean {
    return this.mouseDownLeft;
  }

  isLocked(): boolean {
    return this.locked;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/input.ts
git commit -m "feat: Input class with keyboard, mouse, and pointer lock"
```

---

## Phase 12: Three.js Renderer

### Task 22: Renderer setup

**Files:**
- Create: `src/render/renderer.ts`

- [ ] **Step 1: Implement `src/render/renderer.ts`**

```ts
import * as THREE from 'three';
import { AmbientSettings } from '../level/level';

export class Renderer {
  three: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  playerLight: THREE.PointLight;

  constructor(canvas: HTMLCanvasElement) {
    this.three = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.three.setPixelRatio(window.devicePixelRatio);
    this.three.setSize(window.innerWidth, window.innerHeight, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    this.playerLight = new THREE.PointLight(0xffaa66, 0.8, 10, 2);
    this.scene.add(this.playerLight);

    window.addEventListener('resize', () => this.onResize());
  }

  applyAmbient(ambient: AmbientSettings): void {
    const fogColor = new THREE.Color(ambient.floorColor);
    this.scene.fog = new THREE.Fog(fogColor, 0, 1 / ambient.fogDensity);
    this.scene.background = fogColor;
  }

  setCamera(position: { x: number; z: number }, yaw: number, pitch: number, eyeHeight: number): void {
    this.camera.position.set(position.x, eyeHeight, position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = -yaw + Math.PI / 2;
    this.camera.rotation.x = pitch;
    this.playerLight.position.copy(this.camera.position);
  }

  render(): void {
    this.three.render(this.scene, this.camera);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.three.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/render/renderer.ts
git commit -m "feat: Three.js renderer setup with fog and player light"
```

---

### Task 23: Texture loading and atlases

**Files:**
- Create: `src/render/sprite-atlas.ts`
- Create: `src/render/tile-atlas.ts`
- Create: `src/render/tile-atlas.json`
- Create: `src/render/knight-atlas.json`

- [ ] **Step 1: Implement `src/render/sprite-atlas.ts`**

```ts
import * as THREE from 'three';

export interface SpriteFrame {
  u: number;
  v: number;
  w: number;
  h: number;
}

export interface KnightAnimations {
  walk: Record<'down' | 'up' | 'left' | 'right', SpriteFrame[]>;
  attack: Record<'down' | 'up' | 'left' | 'right', SpriteFrame[]>;
  hurt: Record<'down' | 'up' | 'left' | 'right', SpriteFrame[]>;
  death: Record<'down' | 'up' | 'left' | 'right', SpriteFrame[]>;
}

export interface KnightAtlas {
  imageWidth: number;
  imageHeight: number;
  green: KnightAnimations;
  blue: KnightAnimations;
  red: KnightAnimations;
  purple: KnightAnimations;
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
```

- [ ] **Step 2: Implement `src/render/tile-atlas.ts`**

```ts
import * as THREE from 'three';
import { SpriteFrame, frameToUV } from './sprite-atlas';

export interface TileAtlas {
  imageWidth: number;
  imageHeight: number;
  tiles: Record<string, SpriteFrame>;
}

export function makeTileMaterial(texture: THREE.Texture): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
  });
}

export function tileUVForName(atlas: TileAtlas, name: string): { u: number; v: number; w: number; h: number } {
  const frame = atlas.tiles[name];
  if (!frame) throw new Error(`Tile "${name}" not found in atlas`);
  return frameToUV(frame, atlas.imageWidth, atlas.imageHeight);
}
```

- [ ] **Step 3: Create initial tile atlas JSON `src/render/tile-atlas.json`**

```json
{
  "imageWidth": 256,
  "imageHeight": 512,
  "tiles": {
    "castle_stone_wall": { "u": 0, "v": 0, "w": 16, "h": 16 },
    "castle_stone_floor": { "u": 16, "v": 0, "w": 16, "h": 16 },
    "castle_stone_ceiling": { "u": 32, "v": 0, "w": 16, "h": 16 }
  }
}
```

> **Note for the engineer:** the actual `u`, `v`, `w`, `h` values will need to be **measured by hand** from `public/sprites/dungeon-tiles.png`. Open the PNG in any image viewer that shows pixel coordinates (Photoshop, GIMP, Aseprite, even browser dev tools), pick the rectangles you want, and update this JSON. The values above are placeholders that will at least let the renderer boot — they'll just look wrong until you fix them.

- [ ] **Step 4: Create initial knight atlas JSON `src/render/knight-atlas.json`**

```json
{
  "imageWidth": 256,
  "imageHeight": 512,
  "green": {
    "walk": {
      "down":  [{ "u": 0, "v": 0, "w": 16, "h": 24 }, { "u": 16, "v": 0, "w": 16, "h": 24 }],
      "up":    [{ "u": 0, "v": 24, "w": 16, "h": 24 }, { "u": 16, "v": 24, "w": 16, "h": 24 }],
      "left":  [{ "u": 0, "v": 48, "w": 16, "h": 24 }, { "u": 16, "v": 48, "w": 16, "h": 24 }],
      "right": [{ "u": 0, "v": 72, "w": 16, "h": 24 }, { "u": 16, "v": 72, "w": 16, "h": 24 }]
    },
    "attack": {
      "down":  [{ "u": 32, "v": 0, "w": 16, "h": 24 }],
      "up":    [{ "u": 32, "v": 24, "w": 16, "h": 24 }],
      "left":  [{ "u": 32, "v": 48, "w": 16, "h": 24 }],
      "right": [{ "u": 32, "v": 72, "w": 16, "h": 24 }]
    },
    "hurt": {
      "down":  [{ "u": 48, "v": 0, "w": 16, "h": 24 }],
      "up":    [{ "u": 48, "v": 24, "w": 16, "h": 24 }],
      "left":  [{ "u": 48, "v": 48, "w": 16, "h": 24 }],
      "right": [{ "u": 48, "v": 72, "w": 16, "h": 24 }]
    },
    "death": {
      "down":  [{ "u": 64, "v": 0, "w": 16, "h": 24 }],
      "up":    [{ "u": 64, "v": 0, "w": 16, "h": 24 }],
      "left":  [{ "u": 64, "v": 0, "w": 16, "h": 24 }],
      "right": [{ "u": 64, "v": 0, "w": 16, "h": 24 }]
    }
  },
  "blue": {
    "walk": { "down": [], "up": [], "left": [], "right": [] },
    "attack": { "down": [], "up": [], "left": [], "right": [] },
    "hurt": { "down": [], "up": [], "left": [], "right": [] },
    "death": { "down": [], "up": [], "left": [], "right": [] }
  },
  "red": {
    "walk": { "down": [], "up": [], "left": [], "right": [] },
    "attack": { "down": [], "up": [], "left": [], "right": [] },
    "hurt": { "down": [], "up": [], "left": [], "right": [] },
    "death": { "down": [], "up": [], "left": [], "right": [] }
  },
  "purple": {
    "walk": { "down": [], "up": [], "left": [], "right": [] },
    "attack": { "down": [], "up": [], "left": [], "right": [] },
    "hurt": { "down": [], "up": [], "left": [], "right": [] },
    "death": { "down": [], "up": [], "left": [], "right": [] }
  }
}
```

> **Note for the engineer:** the green knight values above are guesses meant to bootstrap the renderer. The other tiers' arrays are intentionally empty — you'll need to:
> 1. Open `public/sprites/hylian-knights.png` and identify the row offsets for each tier (green/blue/red/purple).
> 2. Measure the per-frame pixel rectangles for each tier's walk/attack/hurt/death animations.
> 3. Fill in the empty arrays. The data shape (`[{u, v, w, h}]`) is fixed; only the numbers change.
> Until those are filled, only Green Knights will render correctly. Blue/Red/Purple will render as a missing-frame fallback (a magenta box, see Task 24).

- [ ] **Step 5: Commit**

```bash
git add src/render/sprite-atlas.ts src/render/tile-atlas.ts src/render/tile-atlas.json src/render/knight-atlas.json
git commit -m "feat: sprite and tile atlas loaders with placeholder coordinates"
```

---

### Task 24: Level mesh builder

**Files:**
- Create: `src/render/level-mesh.ts`

- [ ] **Step 1: Implement `src/render/level-mesh.ts`**

```ts
import * as THREE from 'three';
import { Level } from '../level/level';
import { isSolid } from '../level/cell';
import { TileAtlas, tileUVForName } from './tile-atlas';

export interface LevelMesh {
  walls: THREE.Mesh;
  floor: THREE.Mesh;
  ceiling: THREE.Mesh;
}

/**
 * Build a single merged BufferGeometry per layer (walls, floor, ceiling).
 * One material per layer means three draw calls regardless of level size.
 */
export function buildLevelMesh(
  level: Level,
  texture: THREE.Texture,
  atlas: TileAtlas,
): LevelMesh {
  const cs = level.gridSize;
  const wh = level.ambient.wallHeight;

  const wallUV = tileUVForName(atlas, 'castle_stone_wall');
  const floorUV = tileUVForName(atlas, 'castle_stone_floor');
  const ceilUV = tileUVForName(atlas, 'castle_stone_ceiling');

  const wallPositions: number[] = [];
  const wallUVs: number[] = [];
  const wallIndices: number[] = [];
  let wallVertexCount = 0;

  const floorPositions: number[] = [];
  const floorUVs: number[] = [];
  const floorIndices: number[] = [];
  let floorVertexCount = 0;

  const ceilPositions: number[] = [];
  const ceilUVs: number[] = [];
  const ceilIndices: number[] = [];
  let ceilVertexCount = 0;

  function pushQuad(positions: number[], uvs: number[], indices: number[], baseCount: number, p0: number[], p1: number[], p2: number[], p3: number[], uv: { u: number; v: number; w: number; h: number }) {
    positions.push(...p0, ...p1, ...p2, ...p3);
    uvs.push(uv.u, uv.v + uv.h, uv.u + uv.w, uv.v + uv.h, uv.u + uv.w, uv.v, uv.u, uv.v);
    indices.push(baseCount, baseCount + 1, baseCount + 2, baseCount, baseCount + 2, baseCount + 3);
  }

  for (let z = 0; z < level.height; z++) {
    for (let x = 0; x < level.width; x++) {
      const cell = level.grid.get(x, z);
      if (isSolid(cell)) continue;

      // Floor quad
      pushQuad(
        floorPositions, floorUVs, floorIndices, floorVertexCount,
        [x * cs,       0, z * cs],
        [(x + 1) * cs, 0, z * cs],
        [(x + 1) * cs, 0, (z + 1) * cs],
        [x * cs,       0, (z + 1) * cs],
        floorUV,
      );
      floorVertexCount += 4;

      // Ceiling quad (flipped winding so it faces down)
      pushQuad(
        ceilPositions, ceilUVs, ceilIndices, ceilVertexCount,
        [x * cs,       wh, (z + 1) * cs],
        [(x + 1) * cs, wh, (z + 1) * cs],
        [(x + 1) * cs, wh, z * cs],
        [x * cs,       wh, z * cs],
        ceilUV,
      );
      ceilVertexCount += 4;

      // Wall faces (only on borders adjacent to solid cells)
      const neighbors: [number, number, number, number, number, number, number, number, number, number, number, number][] = [
        // [nx, nz, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, ...] — handled below
      ];
      // West neighbor (-x)
      if (isSolid(level.grid.get(x - 1, z))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs, 0,  z * cs],
          [x * cs, 0,  (z + 1) * cs],
          [x * cs, wh, (z + 1) * cs],
          [x * cs, wh, z * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
      // East neighbor (+x)
      if (isSolid(level.grid.get(x + 1, z))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, 0,  (z + 1) * cs],
          [(x + 1) * cs, 0,  z * cs],
          [(x + 1) * cs, wh, z * cs],
          [(x + 1) * cs, wh, (z + 1) * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
      // North neighbor (-z)
      if (isSolid(level.grid.get(x, z - 1))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [(x + 1) * cs, 0,  z * cs],
          [x * cs,       0,  z * cs],
          [x * cs,       wh, z * cs],
          [(x + 1) * cs, wh, z * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
      // South neighbor (+z)
      if (isSolid(level.grid.get(x, z + 1))) {
        pushQuad(
          wallPositions, wallUVs, wallIndices, wallVertexCount,
          [x * cs,       0,  (z + 1) * cs],
          [(x + 1) * cs, 0,  (z + 1) * cs],
          [(x + 1) * cs, wh, (z + 1) * cs],
          [x * cs,       wh, (z + 1) * cs],
          wallUV,
        );
        wallVertexCount += 4;
      }
    }
  }

  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
  const floorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(level.ambient.floorColor) });
  const ceilMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(level.ambient.ceilingColor) });

  return {
    walls: meshFromArrays(wallPositions, wallUVs, wallIndices, material),
    floor: meshFromArrays(floorPositions, floorUVs, floorIndices, floorMat),
    ceiling: meshFromArrays(ceilPositions, ceilUVs, ceilIndices, ceilMat),
  };
}

function meshFromArrays(
  positions: number[],
  uvs: number[],
  indices: number[],
  material: THREE.Material,
): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/render/level-mesh.ts
git commit -m "feat: build merged BufferGeometry for level walls/floor/ceiling"
```

---

### Task 25: Billboard sprite renderer for enemies

**Files:**
- Create: `src/render/billboard.ts`

- [ ] **Step 1: Implement `src/render/billboard.ts`**

```ts
import * as THREE from 'three';
import { Enemy, EnemyState, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from '../entities/enemy';
import { KnightAtlas, KnightAnimations, frameToUV } from './sprite-atlas';
import { sub, dot, crossZ, normalize, fromYaw } from '../math/vec2';

export interface EnemyVisual {
  enemy: Enemy;
  sprite: THREE.Sprite;
  animTime: number;
}

export class BillboardManager {
  visuals: EnemyVisual[] = [];
  private texture: THREE.Texture;
  private atlas: KnightAtlas;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, texture: THREE.Texture, atlas: KnightAtlas) {
    this.scene = scene;
    this.texture = texture;
    this.atlas = atlas;
  }

  add(enemy: Enemy): void {
    const mat = new THREE.SpriteMaterial({
      map: this.texture.clone(),
      transparent: true,
      depthTest: true,
    });
    mat.map!.needsUpdate = true;
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 1.5, 1);
    this.scene.add(sprite);
    this.visuals.push({ enemy, sprite, animTime: 0 });
  }

  removeDead(): void {
    this.visuals = this.visuals.filter((v) => {
      if (!v.enemy.alive) {
        this.scene.remove(v.sprite);
        return false;
      }
      return true;
    });
  }

  update(dt: number, camera: THREE.Camera): void {
    const camPos2 = { x: camera.position.x, z: camera.position.z };

    for (const v of this.visuals) {
      v.animTime += dt;
      v.sprite.position.set(v.enemy.position.x, 0.75, v.enemy.position.z);

      const tier = this.tierKey(v.enemy);
      const animations = this.atlas[tier];
      if (!animations) continue;

      const anim = this.animationFor(v.enemy.state, animations);
      const facing = this.pickFacing(v.enemy, camPos2);
      const frames = anim[facing];

      if (frames.length === 0) {
        // Fallback: tint sprite magenta so missing frames are obvious
        (v.sprite.material as THREE.SpriteMaterial).color.set(0xff00ff);
        continue;
      }

      const frame = frames[Math.floor(v.animTime * 6) % frames.length];
      const uv = frameToUV(frame, this.atlas.imageWidth, this.atlas.imageHeight);
      this.applyUVToSprite(v.sprite, uv);
    }
  }

  private tierKey(enemy: Enemy): 'green' | 'blue' | 'red' | 'purple' {
    if (enemy instanceof GreenKnight) return 'green';
    if (enemy instanceof BlueKnight) return 'blue';
    if (enemy instanceof RedKnight) return 'red';
    if (enemy instanceof PurpleKnight) return 'purple';
    return 'green';
  }

  private animationFor(state: string, anims: KnightAnimations) {
    switch (state) {
      case EnemyState.Attack:
        return anims.attack;
      case EnemyState.Hurt:
        return anims.hurt;
      case EnemyState.Dying:
        return anims.death;
      default:
        return anims.walk;
    }
  }

  private pickFacing(enemy: Enemy, camPos: { x: number; z: number }): 'down' | 'up' | 'left' | 'right' {
    const toCam = normalize(sub(camPos, enemy.position));
    const forward = fromYaw(enemy.yaw);
    const d = dot(toCam, forward);
    const c = crossZ(toCam, forward);
    if (d > 0.7) return 'down';
    if (d < -0.7) return 'up';
    if (c > 0) return 'left';
    return 'right';
  }

  private applyUVToSprite(sprite: THREE.Sprite, uv: { u: number; v: number; w: number; h: number }): void {
    const material = sprite.material as THREE.SpriteMaterial;
    if (!material.map) return;
    material.map.offset.set(uv.u, uv.v);
    material.map.repeat.set(uv.w, uv.h);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/render/billboard.ts
git commit -m "feat: BillboardManager for enemy sprite billboards"
```

---

### Task 26: Projectile renderer

**Files:**
- Create: `src/render/projectile-render.ts`

- [ ] **Step 1: Implement `src/render/projectile-render.ts`**

```ts
import * as THREE from 'three';
import { Bomb, FireBolt } from '../entities/projectile';
import { World } from '../entities/world';

export class ProjectileRenderer {
  private bombMeshes = new Map<Bomb, THREE.Mesh>();
  private fireMeshes = new Map<FireBolt, THREE.Mesh>();
  private bombGeo = new THREE.SphereGeometry(0.2, 8, 6);
  private fireGeo = new THREE.SphereGeometry(0.15, 8, 6);
  private bombMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  private fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });

  constructor(private scene: THREE.Scene) {}

  sync(world: World): void {
    for (const e of world.entities) {
      if (e instanceof Bomb && !this.bombMeshes.has(e)) {
        const m = new THREE.Mesh(this.bombGeo, this.bombMat);
        this.scene.add(m);
        this.bombMeshes.set(e, m);
      }
      if (e instanceof FireBolt && !this.fireMeshes.has(e)) {
        const m = new THREE.Mesh(this.fireGeo, this.fireMat);
        this.scene.add(m);
        this.fireMeshes.set(e, m);
      }
    }
    for (const [b, mesh] of this.bombMeshes) {
      mesh.position.set(b.position.x, 0.5, b.position.z);
    }
    for (const [f, mesh] of this.fireMeshes) {
      mesh.position.set(f.position.x, 1.0, f.position.z);
    }
    for (const [b, mesh] of this.bombMeshes) {
      if (!b.alive) {
        this.scene.remove(mesh);
        this.bombMeshes.delete(b);
      }
    }
    for (const [f, mesh] of this.fireMeshes) {
      if (!f.alive) {
        this.scene.remove(mesh);
        this.fireMeshes.delete(f);
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/render/projectile-render.ts
git commit -m "feat: ProjectileRenderer for bombs and fire bolts"
```

---

## Phase 13: HUD

### Task 27: HUD CSS and DOM overlay

The HUD uses programmatic DOM construction (`createElement`) rather than `innerHTML`. This is intentional — it sidesteps any future XSS concerns and is friendlier to static analysis.

**Files:**
- Create: `src/hud/hud.css`
- Create: `src/hud/hud.ts`

- [ ] **Step 1: Implement `src/hud/hud.css`**

```css
#hud-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-family: monospace;
  color: #ffffff;
  text-shadow: 1px 1px 0 #000;
  image-rendering: pixelated;
}

.hud-bar {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 12px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.45);
  border: 2px solid #888;
}

.hud-hearts { display: flex; gap: 2px; }
.hud-heart {
  width: 16px; height: 16px;
  background: linear-gradient(#ff4040, #a00);
  border: 1px solid #fff;
  border-radius: 3px;
}
.hud-heart.empty { background: #222; }
.hud-heart.half { background: linear-gradient(to right, #ff4040 50%, #222 50%); }

.hud-magic-bar { width: 80px; height: 12px; background: #222; border: 1px solid #fff; }
.hud-magic-fill { height: 100%; background: linear-gradient(#40c0ff, #2050a0); }

.hud-counters { display: flex; gap: 12px; align-items: center; }
.hud-counter { display: flex; align-items: center; gap: 4px; font-size: 14px; }

.hud-weapon {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.55);
  border: 2px solid #888;
  font-size: 18px;
  text-align: center;
}

.hud-prompt {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #fff;
  font-size: 14px;
}

.hud-locked-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  color: #ff4040;
  font-weight: bold;
}

.hud-died {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  color: #ff4040;
  font-size: 48px;
}
.hud-died button {
  margin-top: 24px;
  padding: 12px 32px;
  font-size: 20px;
  font-family: monospace;
  background: #222;
  color: #fff;
  border: 2px solid #888;
  cursor: pointer;
}

.hud-viewmodel {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translateX(-50%);
}
.hud-viewmodel.sword { background: #4caf50; }
.hud-viewmodel.bow { background: #8d6e63; }
.hud-viewmodel.bombs { background: #424242; }
.hud-viewmodel.fire-rod { background: #ff5722; }

.hud-damage-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(255, 0, 0, 0.6) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}
.hud-damage-vignette.flash { opacity: 1; transition: none; }
```

- [ ] **Step 2: Implement `src/hud/hud.ts` (programmatic DOM, no innerHTML)**

```ts
import { Player } from '../entities/player';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class Hud {
  private root: HTMLElement;
  private heartsEl: HTMLElement;
  private magicFillEl: HTMLElement;
  private keyEl: HTMLElement;
  private arrowEl: HTMLElement;
  private bombEl: HTMLElement;
  private weaponEl: HTMLElement;
  private viewmodelEl: HTMLElement;
  private promptEl: HTMLElement;
  private lockedFlashEl: HTMLElement;
  private vignetteEl: HTMLElement;
  private diedEl: HTMLElement | null = null;
  private lockedFlashTimer = 0;

  constructor() {
    this.root = document.getElementById('hud-root')!;
    while (this.root.firstChild) this.root.removeChild(this.root.firstChild);

    const bar = el('div', 'hud-bar');
    this.heartsEl = el('div', 'hud-hearts');
    bar.appendChild(this.heartsEl);

    const magicBar = el('div', 'hud-magic-bar');
    this.magicFillEl = el('div', 'hud-magic-fill');
    magicBar.appendChild(this.magicFillEl);
    bar.appendChild(magicBar);

    const counters = el('div', 'hud-counters');
    const keyCounter = el('div', 'hud-counter', 'K:');
    this.keyEl = el('span', undefined, '0');
    keyCounter.appendChild(this.keyEl);
    const arrowCounter = el('div', 'hud-counter', 'A:');
    this.arrowEl = el('span', undefined, '0');
    arrowCounter.appendChild(this.arrowEl);
    const bombCounter = el('div', 'hud-counter', 'B:');
    this.bombEl = el('span', undefined, '0');
    bombCounter.appendChild(this.bombEl);
    counters.appendChild(keyCounter);
    counters.appendChild(arrowCounter);
    counters.appendChild(bombCounter);
    bar.appendChild(counters);

    this.weaponEl = el('div', 'hud-weapon', 'Sword');
    this.viewmodelEl = el('div', 'hud-viewmodel sword');
    this.promptEl = el('div', 'hud-prompt', 'Press E to open');
    this.promptEl.style.display = 'none';
    this.lockedFlashEl = el('div', 'hud-locked-flash', 'LOCKED');
    this.lockedFlashEl.style.display = 'none';
    this.vignetteEl = el('div', 'hud-damage-vignette');

    this.root.appendChild(bar);
    this.root.appendChild(this.weaponEl);
    this.root.appendChild(this.viewmodelEl);
    this.root.appendChild(this.promptEl);
    this.root.appendChild(this.lockedFlashEl);
    this.root.appendChild(this.vignetteEl);
  }

  update(dt: number, player: Player, doorPromptVisible: boolean): void {
    this.renderHearts(player.health, player.maxHealth);
    this.magicFillEl.style.width = `${(player.magic / player.maxMagic) * 100}%`;
    this.keyEl.textContent = player.hasSmallKey ? '1' : '0';
    this.arrowEl.textContent = String(player.arrows);
    this.bombEl.textContent = String(player.bombs);
    this.weaponEl.textContent = ['Sword', 'Bow', 'Bombs', 'Fire Rod'][player.currentWeapon];
    this.viewmodelEl.className = `hud-viewmodel ${['sword', 'bow', 'bombs', 'fire-rod'][player.currentWeapon]}`;
    this.promptEl.style.display = doorPromptVisible ? 'block' : 'none';

    if (this.lockedFlashTimer > 0) {
      this.lockedFlashTimer -= dt;
      this.lockedFlashEl.style.display = this.lockedFlashTimer > 0 ? 'block' : 'none';
    }

    if (player.iframesRemaining > 0) {
      this.vignetteEl.classList.add('flash');
    } else {
      this.vignetteEl.classList.remove('flash');
    }
  }

  showLocked(): void {
    this.lockedFlashTimer = 1.0;
    this.lockedFlashEl.style.display = 'block';
  }

  showDied(onRestart: () => void): void {
    if (this.diedEl) return;
    this.diedEl = el('div', 'hud-died');
    const label = el('div', undefined, 'YOU DIED');
    const btn = el('button', undefined, 'RESTART') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      onRestart();
      this.hideDied();
    });
    this.diedEl.appendChild(label);
    this.diedEl.appendChild(btn);
    this.root.appendChild(this.diedEl);
  }

  hideDied(): void {
    if (this.diedEl) {
      this.diedEl.remove();
      this.diedEl = null;
    }
  }

  private renderHearts(health: number, maxHealth: number): void {
    while (this.heartsEl.firstChild) this.heartsEl.removeChild(this.heartsEl.firstChild);
    const totalHearts = maxHealth / 2;
    for (let i = 0; i < totalHearts; i++) {
      const filledHalves = Math.max(0, Math.min(2, health - i * 2));
      const cls = filledHalves === 2 ? 'hud-heart' : filledHalves === 1 ? 'hud-heart half' : 'hud-heart empty';
      this.heartsEl.appendChild(el('div', cls));
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hud/hud.css src/hud/hud.ts
git commit -m "feat: DOM-based HUD with hearts, magic, counters, prompts"
```

---

## Phase 14: Game Integration

### Task 28: `Game` class — wire it all together

This is the integration task — every piece built so far gets connected here. The `Game` class owns the World, the renderer, the HUD, the input, the player, and the weapons. It runs the 4-phase loop each frame.

**Files:**
- Create: `src/game.ts`

- [ ] **Step 1: Implement `src/game.ts`**

```ts
import * as THREE from 'three';
import { Renderer } from './render/renderer';
import { World } from './entities/world';
import { Player, PLAYER_EYE_HEIGHT } from './entities/player';
import { Enemy, GreenKnight, BlueKnight, RedKnight, PurpleKnight } from './entities/enemy';
import { Pickup } from './entities/pickup';
import { Door } from './entities/door';
import { Bomb, FireBolt } from './entities/projectile';
import { Weapon } from './weapons/weapon';
import { Sword } from './weapons/sword';
import { Bow } from './weapons/bow';
import { Bombs } from './weapons/bombs';
import { FireRod } from './weapons/fire-rod';
import { Input } from './input';
import { Hud } from './hud/hud';
import { Level, LevelJson } from './level/level';
import { loadLevel } from './level/level-loader';
import { resolveMovement } from './level/collision';
import { makeAABB } from './math/aabb';
import { fromYaw, distance } from './math/vec2';
import { buildLevelMesh, LevelMesh } from './render/level-mesh';
import { loadTexture } from './render/sprite-atlas';
import { TileAtlas } from './render/tile-atlas';
import { KnightAtlas } from './render/sprite-atlas';
import { BillboardManager } from './render/billboard';
import { ProjectileRenderer } from './render/projectile-render';
import { playSound } from './audio';
import { aabbOverlaps } from './math/aabb';
import levelJsonRaw from './data/level-01.json';
import tileAtlasRaw from './render/tile-atlas.json';
import knightAtlasRaw from './render/knight-atlas.json';

const MOVE_SPEED = 7;
const MOUSE_SENSITIVITY = 0.0025;
const MAX_DT = 1 / 30;

export class Game {
  private renderer: Renderer;
  private input: Input;
  private hud: Hud;
  private world!: World;
  private player!: Player;
  private weapons: Weapon[] = [];
  private level!: Level;
  private levelMesh: LevelMesh | null = null;
  private billboards!: BillboardManager;
  private projectileRenderer!: ProjectileRenderer;
  private dungeonTexture!: THREE.Texture;
  private knightTexture!: THREE.Texture;
  private tileAtlas: TileAtlas;
  private knightAtlas: KnightAtlas;
  private lastTime = 0;
  private dead = false;
  private won = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.hud = new Hud();
    this.tileAtlas = tileAtlasRaw as TileAtlas;
    this.knightAtlas = knightAtlasRaw as KnightAtlas;
  }

  async start(): Promise<void> {
    this.dungeonTexture = await loadTexture('sprites/dungeon-tiles.png');
    this.knightTexture = await loadTexture('sprites/hylian-knights.png');
    this.loadLevel();
    requestAnimationFrame((t) => this.tick(t));
  }

  private loadLevel(): void {
    this.level = loadLevel(levelJsonRaw as LevelJson);
    this.world = new World(this.level.grid, this.level.gridSize);
    this.weapons = [new Sword(), new Bow(), new Bombs(), new FireRod()];

    // Spawn player
    this.player = new Player(
      { x: this.level.spawns.player.x * this.level.gridSize, z: this.level.spawns.player.z * this.level.gridSize },
      this.level.spawns.player.yaw,
    );
    this.world.add(this.player);

    // Spawn enemies
    for (const e of this.level.spawns.enemies) {
      const pos = { x: e.x * this.level.gridSize, z: e.z * this.level.gridSize };
      const enemy: Enemy =
        e.type === 'green_knight' ? new GreenKnight(pos)
        : e.type === 'blue_knight' ? new BlueKnight(pos)
        : e.type === 'red_knight' ? new RedKnight(pos)
        : new PurpleKnight(pos);
      this.world.add(enemy);
    }

    // Spawn pickups
    for (const p of this.level.spawns.pickups) {
      this.world.add(new Pickup({ x: p.x * this.level.gridSize, z: p.z * this.level.gridSize }, p.type));
    }

    // Spawn doors
    for (const d of this.level.spawns.doors) {
      const dx = (d.x + 0.5) * this.level.gridSize;
      const dz = (d.z + 0.5) * this.level.gridSize;
      this.world.add(new Door({ x: dx, z: dz }, d.locked, d.x, d.z));
    }

    // Build level geometry
    if (this.levelMesh) {
      this.renderer.scene.remove(this.levelMesh.walls);
      this.renderer.scene.remove(this.levelMesh.floor);
      this.renderer.scene.remove(this.levelMesh.ceiling);
    }
    this.levelMesh = buildLevelMesh(this.level, this.dungeonTexture, this.tileAtlas);
    this.renderer.scene.add(this.levelMesh.walls);
    this.renderer.scene.add(this.levelMesh.floor);
    this.renderer.scene.add(this.levelMesh.ceiling);
    this.renderer.applyAmbient(this.level.ambient);

    // Reset render managers
    this.billboards = new BillboardManager(this.renderer.scene, this.knightTexture, this.knightAtlas);
    this.projectileRenderer = new ProjectileRenderer(this.renderer.scene);
    for (const e of this.world.entities) {
      if (e instanceof Enemy) this.billboards.add(e);
    }

    this.dead = false;
    this.won = false;
    this.hud.hideDied();
  }

  private tick(now: number): void {
    const dtRaw = (now - this.lastTime) / 1000;
    const dt = this.lastTime === 0 ? 0 : Math.min(dtRaw, MAX_DT);
    this.lastTime = now;
    if (dt > 0) this.frame(dt);
    requestAnimationFrame((t) => this.tick(t));
  }

  private frame(dt: number): void {
    if (this.dead || this.won) {
      this.renderer.render();
      return;
    }
    this.handleInput(dt);
    this.updateEntities(dt);
    this.handleCollisions();
    this.world.removeDead();
    this.billboards.removeDead();
    this.projectileRenderer.sync(this.world);
    this.checkWinLose();
    this.render(dt);
  }

  private handleInput(dt: number): void {
    const md = this.input.consumeMouseDelta();
    this.player.yaw += md.dx * MOUSE_SENSITIVITY;
    this.player.pitch -= md.dy * MOUSE_SENSITIVITY;
    this.player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.player.pitch));

    const forward = fromYaw(this.player.yaw);
    const strafe = { x: -forward.z, z: forward.x };
    let mx = 0;
    let mz = 0;
    if (this.input.isDown('KeyW')) { mx += forward.x; mz += forward.z; }
    if (this.input.isDown('KeyS')) { mx -= forward.x; mz -= forward.z; }
    if (this.input.isDown('KeyD')) { mx += strafe.x; mz += strafe.z; }
    if (this.input.isDown('KeyA')) { mx -= strafe.x; mz -= strafe.z; }
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }
    const motion = { x: mx * MOVE_SPEED * dt, z: mz * MOVE_SPEED * dt };
    this.player.position = resolveMovement(
      this.world.grid,
      makeAABB(this.player.position, this.player.halfExtents),
      motion,
      this.world.cellSize,
    );

    // Weapon select
    if (this.input.isDown('Digit1')) this.player.selectWeapon(0);
    if (this.input.isDown('Digit2')) this.player.selectWeapon(1);
    if (this.input.isDown('Digit3')) this.player.selectWeapon(2);
    if (this.input.isDown('Digit4')) this.player.selectWeapon(3);

    // Fire
    if (this.input.isLeftDown() || this.input.isDown('Space')) {
      const w = this.weapons[this.player.currentWeapon];
      if (w.canFire(this.player)) {
        w.fire(this.player, this.world);
        playSound('sword_swing');
      }
    }

    // Door interact
    if (this.input.isDown('KeyE')) {
      const nearby = this.world.overlapCircle(this.player.position, 1.5);
      const door = nearby.find((e) => e instanceof Door) as Door | undefined;
      if (door) {
        const result = door.tryOpen(this.player, this.world);
        if (result === 'locked') {
          this.hud.showLocked();
          playSound('door_locked');
        } else {
          playSound('door_open');
        }
      }
    }
  }

  private updateEntities(dt: number): void {
    this.player.tickTimers(dt);
    for (const w of this.weapons) w.tick(dt);
    for (const e of [...this.world.entities]) {
      if (e === this.player) continue;
      e.update(dt, this.world);
      if (e instanceof PurpleKnight) e.maybeSummon(this.world);
    }
  }

  private handleCollisions(): void {
    // Pickups
    for (const e of this.world.entities) {
      if (e instanceof Pickup && aabbOverlaps(e.getAABB(), this.player.getAABB())) {
        e.onTouch(this.player);
        playSound('pickup_heart');
      }
    }
    // Bomb auto-detonate on wall hit
    for (const e of this.world.entities) {
      if (e instanceof Bomb && !e.alive && e.detonateCallback) {
        e.detonateCallback(this.world);
        e.detonateCallback = undefined;
      }
    }
  }

  private checkWinLose(): void {
    if (this.player.isDead()) {
      this.dead = true;
      playSound('player_die');
      this.hud.showDied(() => this.loadLevel());
      return;
    }
    // Win: standing on an exit cell
    const cs = this.world.cellSize;
    const cx = Math.floor(this.player.position.x / cs);
    const cz = Math.floor(this.player.position.z / cs);
    if (this.world.grid.get(cx, cz) === 4) {
      this.won = true;
    }
  }

  private render(dt: number): void {
    this.renderer.setCamera(this.player.position, this.player.yaw, this.player.pitch, PLAYER_EYE_HEIGHT);
    this.billboards.update(dt, this.renderer.camera);
    const promptVisible = !!this.world
      .overlapCircle(this.player.position, 1.5)
      .find((e) => e instanceof Door);
    this.hud.update(dt, this.player, promptVisible);
    this.renderer.render();
  }
}
```

- [ ] **Step 2: Update `src/main.ts` to boot the Game**

Replace the contents of `src/main.ts`:

```ts
import { Game } from './game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);
game.start().catch((e) => {
  console.error('Failed to start game:', e);
});
```

- [ ] **Step 3: Run the type-checker and tests to confirm nothing is broken**

```bash
pnpm exec tsc --noEmit
pnpm test
```
Expected: type check passes; all unit tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/game.ts src/main.ts
git commit -m "feat: Game class wires renderer, world, input, HUD into main loop"
```

---

## Phase 15: Level 1 Authoring

### Task 29: Hand-author `level-01.json`

This is the playable MVP level. The 32x32 ASCII grid below implements the 8-room progression from the spec: entry → corridor → cross intersection → left wing (bombs + secret) → right wing (fire rod ambush) → key chamber → boss door → boss room.

**Files:**
- Create: `src/data/level-01.json`

- [ ] **Step 1: Create `src/data/level-01.json`**

```json
{
  "name": "Hyrule Castle Dungeon",
  "theme": "castle",
  "gridSize": 4.0,
  "width": 32,
  "height": 32,
  "tiles": [
    "################################",
    "#..............................#",
    "#..p...........................#",
    "#..............................#",
    "#..GG..........................#",
    "#..............................#",
    "######D#########################",
    "#......#.......................#",
    "#..GGG.#..b....................#",
    "#......#.......................#",
    "#..GG..#.......................#",
    "#......#########################",
    "#......D...........#............",
    "#......#...........#............",
    "########..B........#............",
    "#......#...........#............",
    "#..h...#...........#............",
    "#......#...........#............",
    "########............#...........",
    "#..H...#............#...........",
    "########............#...........",
    "....................#...........",
    "#####D#######........#..........",
    "#...........#........#..........",
    "#..GBR......L........#..........",
    "#...........#........#..........",
    "#####D#######........#..........",
    "#............#####D###..........",
    "#............#......P##.........",
    "#....k.......L....X..##.........",
    "#............########.##........",
    "################################"
  ],
  "legend": {
    "#": { "type": "wall", "texture": "castle_stone" },
    ".": { "type": "floor" },
    "p": { "type": "floor" },
    "G": { "type": "floor" },
    "B": { "type": "floor" },
    "R": { "type": "floor" },
    "P": { "type": "floor" },
    "h": { "type": "floor" },
    "H": { "type": "floor" },
    "k": { "type": "floor" },
    "b": { "type": "floor" },
    "C": { "type": "wall", "texture": "castle_stone", "breakable": true },
    "D": { "type": "door", "locked": false },
    "L": { "type": "door", "locked": true, "key": "small_key" },
    "X": { "type": "exit" }
  },
  "spawns": {
    "player": { "x": 3, "z": 2, "yaw": 0 },
    "enemies": [
      { "type": "green_knight", "x": 3, "z": 4 },
      { "type": "green_knight", "x": 4, "z": 4 },
      { "type": "green_knight", "x": 3, "z": 8 },
      { "type": "green_knight", "x": 4, "z": 8 },
      { "type": "green_knight", "x": 5, "z": 8 },
      { "type": "green_knight", "x": 3, "z": 10 },
      { "type": "green_knight", "x": 4, "z": 10 },
      { "type": "blue_knight", "x": 4, "z": 24 },
      { "type": "red_knight", "x": 6, "z": 24 },
      { "type": "green_knight", "x": 5, "z": 24 },
      { "type": "purple_knight", "x": 23, "z": 29 }
    ],
    "pickups": [
      { "type": "weapon_bow", "x": 9, "z": 8 },
      { "type": "weapon_bombs", "x": 10, "z": 14 },
      { "type": "weapon_fire_rod", "x": 20, "z": 13 },
      { "type": "small_key", "x": 5, "z": 29 },
      { "type": "arrows_10", "x": 9, "z": 9 },
      { "type": "arrows_10", "x": 9, "z": 11 },
      { "type": "bombs_5", "x": 10, "z": 13 },
      { "type": "bombs_5", "x": 10, "z": 15 },
      { "type": "magic_jar", "x": 20, "z": 14 },
      { "type": "heart", "x": 4, "z": 16 },
      { "type": "heart_large", "x": 4, "z": 19 },
      { "type": "heart", "x": 22, "z": 28 }
    ]
  },
  "ambient": {
    "wallHeight": 4.0,
    "floorColor": "#2a1e12",
    "ceilingColor": "#0a0604",
    "fogDensity": 0.04
  }
}
```

> **Note for the engineer:** the ASCII grid is a starting point for hand-tuning. The letters `p`, `G`, `B`, `R`, `P`, `h`, `H`, `k`, `b`, `X` mark *where things go* in the level — they're all `floor` tiles in the legend, and the actual entity spawns are listed in `spawns`. Use the letters as visual guides while editing the grid in a text editor; the spawn coordinates need to match. The breakable wall is marked as `C` in the legend (use it where you want a bomb-able wall).
>
> When you boot the game with this level, expect rough edges in pacing and layout. Tune by playing and editing this file. The key thing is that all 8 rooms exist and the player path is connected.

- [ ] **Step 2: Sanity-test the level loads**

Add `tests/integration/level-01.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loadLevel } from '../../src/level/level-loader';
import lvl from '../../src/data/level-01.json';

describe('level-01 loads', () => {
  it('parses without throwing', () => {
    expect(() => loadLevel(lvl as any)).not.toThrow();
  });

  it('has at least one player spawn', () => {
    const l = loadLevel(lvl as any);
    expect(l.spawns.player).toBeDefined();
  });

  it('contains a purple knight (boss)', () => {
    const l = loadLevel(lvl as any);
    expect(l.spawns.enemies.some((e) => e.type === 'purple_knight')).toBe(true);
  });

  it('contains a small_key pickup', () => {
    const l = loadLevel(lvl as any);
    expect(l.spawns.pickups.some((p) => p.type === 'small_key')).toBe(true);
  });

  it('contains at least one locked door', () => {
    const l = loadLevel(lvl as any);
    expect(l.spawns.doors.some((d) => d.locked)).toBe(true);
  });
});
```

- [ ] **Step 3: Run the level test**

```bash
pnpm test tests/integration/level-01.test.ts
```
Expected: 5 tests pass. If this fails (because the ASCII grid has a row-length mismatch or unknown char), fix the grid in the JSON until it loads.

- [ ] **Step 4: Manually boot the dev server**

```bash
pnpm dev
```
Open http://localhost:5173/ in a browser, click the canvas to lock the cursor, and walk around with WASD. Expected: you can move; walls block you; cannot leave the level. Visual quality will be rough until atlases are tuned.

- [ ] **Step 5: Commit**

```bash
git add src/data/level-01.json tests/integration/level-01.test.ts
git commit -m "feat: hand-authored level-01.json with 8-room dungeon layout"
```

---

## Phase 16: Final Verification

### Task 30: Run the full test suite and verify boot

**Files:**
- (no new files; verification only)

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```
Expected: every test from previous tasks passes. The total count should be ~70+ tests across 12+ files.

- [ ] **Step 2: Run lint and type check**

```bash
pnpm lint
pnpm exec tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Build production bundle**

```bash
pnpm build
```
Expected: `dist/` directory created with `index.html`, JS, and assets. No errors.

- [ ] **Step 4: Smoke test the production build**

```bash
pnpm preview &
sleep 2
curl -sf http://localhost:4173/ > /dev/null && echo OK || echo FAIL
kill %1
```
Expected: `OK`.

- [ ] **Step 5: Manual playtest checklist**

Open the dev server (`pnpm dev`) and tick each item as you confirm it:

- [ ] WASD moves the player; mouse turns the camera (after clicking to lock).
- [ ] Player slides along walls when moving diagonally into them.
- [ ] Sword (key 1) hits enemies in front; cooldown limits spam.
- [ ] Bow (key 2) consumes arrows; arrow count decrements.
- [ ] Bombs (key 3) throw an arc that explodes after a delay.
- [ ] Fire Rod (key 4) consumes magic; magic bar decreases.
- [ ] Hearts decrement when an enemy hits you; i-frames prevent double-hits.
- [ ] Picking up a heart restores hearts.
- [ ] Picking up the small key sets `K:1` in the HUD.
- [ ] Walking up to a locked door without the key shows LOCKED.
- [ ] Walking up with the key opens it.
- [ ] Reaching 0 health shows YOU DIED + restart button.
- [ ] Restart fully resets the level.
- [ ] Defeating the Purple Knight allows progression to exit.
- [ ] Touching the exit cell stops the game (or shows victory).

If any item fails, that's a bug — diagnose and fix in a follow-up commit before declaring done.

- [ ] **Step 6: Final commit**

```bash
git status
git log --oneline
```
Expected: all changes committed; commit history reads cleanly from setup → math → level → entities → weapons → render → HUD → game integration → level data → verification.

---

## Self-Review Notes

### Spec Coverage Map

| Spec section | Covered by task(s) |
|---|---|
| Goals & non-goals | (Implicit — design spec governs, plan implements) |
| Player Experience: Movement | Task 28 (Game.handleInput) |
| Player Experience: Health/Magic/Ammo | Task 11 (Player), Task 27 (HUD) |
| Player Experience: Weapons + key mapping | Task 17–19 (weapons), Task 28 (input wiring) |
| Player Experience: HUD | Task 27 |
| Player Experience: Win/Lose | Task 28 (`checkWinLose`) |
| Stack | Task 1 (project setup) |
| Game loop 4 phases | Task 28 (`Game.frame`) |
| Directory layout | Task 1 + per-task `Files:` headers |
| `Entity` base | Task 9 |
| `Player` | Task 11 |
| `Enemy` state machine + tiers | Task 15, 16 |
| `Projectile` (Bomb / FireBolt / SwordBeam) | Task 12 (SwordBeam noted as boss-only — implemented inside Purple Knight task if/when needed) |
| `Pickup` | Task 13 |
| `Door` | Task 14 |
| `Weapon` + 4 weapons | Task 17–19 |
| `Level` / `World` | Task 7 (types), Task 10 (World) |
| Level Data Format JSON | Task 7, 8 (loader) |
| Loading flow | Task 8 |
| Three.js setup | Task 22 |
| Pixel-perfect texture filtering | Task 23 (`loadTexture`) |
| Level geometry | Task 24 |
| Sprite atlas slicing | Task 23 |
| Billboard enemies | Task 25 |
| Viewmodel placeholder | Task 27 (CSS color blocks) |
| Projectile rendering | Task 26 |
| Performance budget | (Implicit — design choices in Task 24, 25 minimize draw calls) |
| Movement & wall collision | Task 5 (collision), Task 28 (integration) |
| Damage model + i-frames | Task 11 |
| Sword arc | Task 17 |
| Bow hitscan | Task 18 |
| Bombs AoE + breakable walls | Task 12, 19 |
| Fire Rod magic projectile | Task 12, 19 |
| Enemy AI state machine | Task 15 |
| Greedy pathfinding | Task 15 (`pickGreedyDirection`) |
| Aggro with LOS | Task 15 (`tickIdle`) |
| Mini-boss Purple Knight | Task 16 |
| Death & restart | Task 28 (`Game.checkWinLose` + `loadLevel`) |
| Level 1 Design (8 rooms) | Task 29 |
| Audio stub | Task 20 |
| Testing strategy: unit tests | Tasks 2–19 (TDD coverage on pure modules) |
| Testing strategy: TDD for pure logic | Each pure-module task uses Red→Green→Refactor flow |

### Known limitations carried as TODOs in the plan

These are intentionally deferred per the design spec's "Open Questions" section, and the plan calls them out in the relevant tasks:

- Hand-measuring sprite atlas pixel offsets (Task 23) — placeholder data ships, real values pencilled in by the engineer.
- Link viewmodel sprites (Task 27) — placeholder colored rectangles ship; real Link sprites swapped in later via CSS only.
- Audio assets (Task 20) — stubs only; no playback in MVP.
- Boss sword-beam spread attack (spec mentioned but not in MVP critical path) — Task 16 adds minion summons but defers the 3-bolt spread; can be added in a follow-up commit if playtesting demands it.

### Placeholder scan

Searching the plan for placeholder phrases like "TBD", "TODO", "implement later", "fill in details" — only one place uses TODO-like language, and it is intentional:

- Task 23 hand-measured atlas coordinates: explicit "Note for the engineer" with measurement instructions, not a code TODO.
- Task 29 level layout tuning: "starting point for hand-tuning" — also explicit and intentional.

No silent placeholders, no "implement appropriate error handling," no "similar to Task N." Every step has actual content.

### Type consistency check

- `Vec2` interface defined in Task 2; used by `aabb`, `collision`, `raycast`, `world`, `entity`, `weapons`, `enemies`, `projectile`, `game`. Consistent shape `{ x, z }` everywhere.
- `Player.update(dt, world)` signature matches `Entity.update`. Player movement is driven by `Game.handleInput`, not by `Player.update`, which is correct.
- `Weapon.canFire(player)` and `fire(player, world)` consistent across Sword/Bow/Bombs/FireRod.
- `Enemy.takeDamage(amount)` consistent with `Player.takeDamage(amount)`.
- `Door.tryOpen(player, world)` returns `'locked' | 'opened'`, used by `Game.handleInput`.
- `World.overlapCircle`, `entitiesInArc`, `lineOfSight`, `raycastWalls` referenced consistently from weapons, enemies, and game.
- `PickupType` defined in `player.ts` as alias for `SpawnPickup['type']`, used by `Pickup` and `Player.applyPickup`. Consistent.
- `EnemyState.Idle/Chase/Attack/Hurt/Dying` constants used by `Enemy` and `BillboardManager`. Consistent.
- `Cell.Empty/Wall/Door/LockedDoor/Exit/Breakable` used by `level-loader`, `collision`, `raycast`, `door`, `bomb`, `level-mesh`. Consistent.

### Spec items NOT covered (gaps to confirm before execution)

- The Purple Knight's "sword beam spread" attack (3-projectile spread) is described in the spec but is not in the implementation plan. The plan implements minion-summon and inherits base attack. **Action:** the engineer should add this as a small follow-up task after Task 16 if they want strict spec parity. Alternatively, mark as a deferred MVP refinement — playtest first, then decide.
- Door re-collision after open: the door entity flips its grid cell to `Cell.Empty` on full open. This is correct per the spec.
- `SwordBeam` projectile subtype: declared in the spec as boss-only. The plan does not implement it (only `Bomb` and `FireBolt` are built). When the engineer adds the sword beam spread attack, they should reuse `FireBolt` with boss-tuned values, or add a new `SwordBeam` class — both are acceptable per the spec.

These gaps are minor and non-blocking. They can be filled in by the engineer as polish after the main 30 tasks are complete.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-08-doom-of-zelda.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
