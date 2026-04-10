# Doom of Zelda

A browser-based 3D first-person shooter built in the style of **Doom** (1993), visually themed with sprites from **The Legend of Zelda: A Link to the Past** (SNES, 1991).

Mechanics, pace, and combat loop follow Doom; Zelda contributes the visual theme, item palette, and HUD language.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click the canvas to start.

## Controls

| Key | Action |
|-----|--------|
| WASD | Move / strafe |
| Mouse | Look around |
| Left Click / Space | Fire weapon |
| 1-4 | Switch weapon (Sword / Bow / Bombs / Fire Rod) |
| E | Interact (open doors) |
| Escape | Release mouse cursor |

## Weapons

| # | Weapon | Ammo | Behavior |
|---|--------|------|----------|
| 1 | Sword | Unlimited | Melee arc, hits multiple enemies in a 90-degree cone |
| 2 | Bow | Arrows | Fires a visible arrow projectile; sticks in walls |
| 3 | Bombs | Bombs | Arcs through the air, bounces once, then blinks and explodes with AoE damage |
| 4 | Fire Rod | Magic | Rapid-fire flickering flame projectile |

## Enemies

Four tiers of Hylian Knights (all using tinted blue knight sprites):

| Tier | HP | Behavior |
|------|-----|----------|
| Green | 2 | Basic melee grunt |
| Blue | 5 | Has a shield that can reflect arrows |
| Red | 4 | Charges at double speed |
| Purple (Boss) | 20 | Summons Green Knight minions at 50% and 25% HP |

## Level Format

Levels are JSON files in `src/data/`. The grid is an ASCII character map:

```
"tiles": [
  "################################",
  "#..............................#",
  "#..........D...................#",
  "#............C.................#",
  "################################"
]
```

| Char | Cell type |
|------|-----------|
| `#` | Wall |
| `.` | Floor |
| `C` | Breakable wall (bomb-destructible) |
| `D` | Unlocked door |
| `L` | Locked door (needs small_key) |
| `X` | Exit (level end) |

Entity spawns use grid-cell coordinates (multiplied by `gridSize` at runtime):

```json
"enemies": [{ "type": "green_knight", "x": 8, "z": 3 }],
"pickups": [{ "type": "rupee_5", "x": 15, "z": 9 }],
"decorations": [{ "type": "statue", "x": 5, "z": 5 }]
```

Doors are auto-detected from `D`/`L` tiles in the grid.

**Enemy types:** `green_knight`, `blue_knight`, `red_knight`, `purple_knight`

**Pickup types:** `heart`, `heart_large`, `magic_jar`, `arrows_5`, `arrows_10`, `bombs_4`, `bombs_8`, `small_key`, `rupee_1`, `rupee_5`, `rupee_10`, `weapon_bow`, `weapon_bombs`, `weapon_fire_rod`

**Decoration types:** `statue`

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict mode) |
| Rendering | Three.js |
| Build | Vite |
| Tests | Vitest |
| Package manager | npm |

Single runtime dependency: `three`. ~3,600 lines of source, 123 unit tests.

## Project Structure

```
src/
  main.ts              Entry point
  game.ts              Game loop (Input -> Update -> Collision -> Render)
  input.ts             Keyboard + mouse + pointer lock
  audio.ts             Sound/music stubs (no-op for now)
  math/                Vec2, AABB helpers
  level/               Cell types, grid, collision, raycast, level loader
  entities/            Entity base, Player, Enemy (4 tiers), Projectile, Pickup, Door, Decoration
  weapons/             Weapon base, Sword, Bow, Bombs, FireRod
  render/              Three.js renderer, billboard sprites, level mesh, projectile/pickup/door/decoration renderers
  hud/                 DOM-based HUD with sprite icons
  data/                Level JSON files
tests/                 Unit tests mirroring src/ structure
public/sprites/        All PNG sprite assets
```

## Scripts

```bash
npm run dev        # Development server with HMR
npm run build      # Type-check + production build
npm run preview    # Preview production build
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
npm run lint       # ESLint
npm run format     # Prettier
```

## Architecture Notes

- **Pure logic is isolated from rendering.** Math, collision, raycast, entity state machines, and weapons have zero Three.js imports and are fully unit-testable.
- **Entities communicate through a `World` interface** (raycastWalls, lineOfSight, overlapCircle, entitiesInArc). No entity holds a reference to Game.
- **Level geometry is built as merged BufferGeometry** (3 draw calls for walls/floor/ceiling regardless of level size).
- **Enemy sprites are billboarded** with 4-direction facing (front/back/side-left/side-right) and per-tier color tinting from a single blue knight sprite set.
- **Sprite backgrounds use magenta (#FF00FF) color keying**, converted to alpha at load time via canvas processing.
- **The game loop runs 4 phases per frame:** Input -> Update -> Collision -> Render, with dt clamped to 1/30 to prevent tunneling on tab-switch lag spikes.
