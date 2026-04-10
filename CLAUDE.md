# CLAUDE.md — Project instructions for AI assistants

## Project

Doom of Zelda — browser-based 3D Doom-style FPS with Zelda: A Link to the Past sprites. TypeScript + Three.js + Vite.

## Commands

```bash
npm run dev        # Dev server (http://localhost:5173)
npm run build      # tsc --noEmit && vite build
npm test           # vitest run (123 tests)
npm run lint       # eslint src tests --ext .ts
```

Always run `npx tsc --noEmit` and `npm test` after changes to verify nothing breaks.

## Code Conventions

- **Strict TypeScript** with `noUnusedLocals`, `noUnusedParameters`. Prefix unused params with `_`.
- **No innerHTML.** All DOM construction uses `document.createElement` + `textContent`.
- **Sprite magenta color keying.** SNES sprites use #FF00FF backgrounds. Load with `loadTextureColorKeyed()` for Three.js textures or `colorKeyToDataURL()` for DOM images. Tolerance is 16.
- **Two solidity functions.** `isSolid(cell)` = walls + breakable (used by level mesh). `isBlocking(cell)` = walls + breakable + doors (used by collision + raycast). Don't mix them up.
- **Coordinates.** Level JSON uses grid-cell coordinates. Multiply by `gridSize` (4.0) to get world units. `fromYaw(0)` = +X direction. Player right = +Z.
- **Half-hearts.** All damage/HP values are in half-hearts. Player max = 12 (6 hearts).
- **Use `npm`** not pnpm (pnpm is not available on this machine).

## Architecture

```
Input → Player intent → Entity.update → Collision → Render → HUD
```

- Pure logic modules (`math/`, `level/`, `entities/`, `weapons/`) have **zero Three.js imports**. Keep it that way.
- Entities only see the world through the `World` interface. Never reference `Game` from an entity.
- Level mesh = 3 merged BufferGeometries (walls, floor, ceiling). Rebuilt only on bomb detonation.
- Wall face winding: each wall face normal must point **toward the empty cell** (toward the player). If a wall is invisible from one direction, the winding is wrong.

## Sprite System

- **Knight animations:** 4 front + 3 side + 4 back frames per facing. Loaded with `loadTextureColorKeyed`, normalized to consistent canvas size per facing via `normalizeFrames()` (bottom-aligned). Side frames are flipped for right-side view.
- **Variable-width sprite strips** (e.g. bomb animation): Use `sliceByRects()` with explicit pixel coordinates, NOT equal-width slicing. The bomb strip has frames ranging from 14px to 44px wide.
- **Pickup sprites:** Static pickups use single textures. Rupees use 3-frame animated strips sliced with `autoSliceSpriteStrip()`.
- **New sprites** go in `public/sprites/`. Vite serves them statically at `/sprites/<filename>`.

## Level Editing

Levels are in `src/data/level-01.json`. The ASCII `tiles` grid is human-readable. Rules:
- Every row must be exactly `width` characters
- Every character must exist in the `legend`
- Spawn x/z are in grid cells (not world units)
- Doors are auto-extracted from `D`/`L` tiles (don't put them in spawns)
- Currently only one level — `game.ts` imports it statically

## Testing

- Tests mirror the source structure: `src/level/collision.ts` ↔ `tests/level/collision.test.ts`
- Pure logic gets unit tests. Rendering/input/HUD are tested manually.
- Use Vitest with `globals: true` — `describe`, `it`, `expect` are in scope without imports from vitest in test files (though imports are fine too).

## Known Limitations

- Audio is stubbed (no-op). Call sites exist via `playSound()`/`playMusic()`.
- Only one level. Multi-level support would need dynamic level loading in `game.ts`.
- Only blue knight sprites exist. Other tiers use color tinting.
- Purple Knight boss only has melee + minion summon (no ranged sword-beam attack).
- Sword lvl2-5 sprites exist but upgrades aren't implemented.
