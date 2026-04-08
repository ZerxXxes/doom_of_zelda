# Doom of Zelda — Design Spec

**Date:** 2026-04-08
**Status:** Design approved, pending implementation plan
**Author:** Brainstorming session with Claude

## Overview

Doom of Zelda is a browser-based 3D first-person shooter built in the style of id Software's *Doom* (1993), visually themed with sprites from Nintendo's *The Legend of Zelda: A Link to the Past* (SNES, 1991). The MVP is a single self-contained dungeon level that proves out the core feel and the Zelda-in-Doom aesthetic.

This is a faithful Doom-1 style shooter, not a Zelda-flavored action-RPG. Mechanics, pace, level structure, and combat loop all follow Doom; Zelda contributes the visual theme, item palette, and HUD language.

## Goals

- Deliver one complete, playable 10-15 minute dungeon level.
- Capture the Doom 1 combat loop: circle-strafing, weapon-juggling, ammo-conservation tension.
- Visually present the Zelda aesthetic convincingly in first-person 3D.
- Run at 60fps in modern browsers on 5-year-old hardware.
- Boot in under 3 seconds from a cold tab.
- Keep the codebase small enough for one person to hold in their head.

## Non-goals

- Multiple levels, episodes, or a campaign.
- Save system, progression, or persistence across sessions.
- Multiplayer.
- Audio on ship (hooks exposed for later).
- A full Zelda bestiary — MVP uses Hylian Knights only (colors = enemy tiers).
- Mobile controls — keyboard + mouse only.
- Accurate physics — Doom-style 2D wall-sliding collision only.
- A level editor — hand-written JSON is authoring-adequate for one level.

## Core Gameplay Loop

1. Player enters the dungeon armed with a sword.
2. Explores rooms, fighting Hylian Knight enemies.
3. Discovers the Bow, Bombs, and Fire Rod across the dungeon, each expanding tactical options.
4. Finds the small key that unlocks the boss door.
5. Defeats the mini-boss (a Purple Knight).
6. Touches the exit portal to win.

Death returns to the start of the dungeon. No checkpoints.

## Player Experience

- **Movement:** Doom-fast. WASD for translation, mouse for look (engaged via Pointer Lock API — clicking the canvas locks the pointer; Escape releases it). Left mouse click or Space to fire. Movement is strictly on the horizontal plane — no jumping, no crouching. Camera Y stays at player eye level; mouse Y tilts camera pitch for looking at things but does not affect aim.
- **Health:** 6 hearts (12 half-hearts) maximum, starting full. Hit damage ranges from ½ to 2 hearts depending on enemy tier. All damage values in this spec are expressed in **half-hearts** (so "4 damage" = 2 hearts).
- **Magic:** 16-unit magic gauge for Fire Rod ammo, starting full.
- **Ammo:** Arrows (start 10, max 30), Bombs (start 5, max 15). Sword and Fire Rod do not use ammo counts (Fire Rod uses magic).
- **Weapons:** Sword (key `1`), Bow (key `2`), Bombs (key `3`), Fire Rod (key `4`). Number keys select; keys are 1-indexed for the player, internally stored as 0-indexed weapon slots (key `1` → slot `0`). The sword is always unlocked; other weapons unlock on pickup.
- **HUD:** Authentic ALTTP overlay — hearts at top-left, magic meter, current item slot, key/arrow/bomb counters.
- **Win condition:** Reach the exit portal in the boss room.
- **Lose condition:** Health reaches 0. DOM overlay shows "YOU DIED" with a restart button.

## Technical Architecture

### Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript (strict mode) | Type safety; matches modern web tooling. |
| Build/dev | Vite | Fast HMR, zero-config for TS + assets. |
| Rendering | Three.js | Mature, well-documented WebGL library. |
| Physics | Custom 2D AABB vs. wall grid | Doom needs this, not a real physics engine. |
| Tests | Vitest | Native Vite integration, fast TS runner. |
| Package manager | pnpm | Fast, disk-efficient. (User may substitute npm/yarn.) |

No runtime dependencies beyond Three.js. Dev dependencies: Vite, TypeScript, Vitest, ESLint, Prettier.

### Architectural approach

Plain class-based TypeScript. A small, flat class hierarchy maps cleanly to the domain. No ECS, no physics engine, no state management library. Entity-Component-System was considered and rejected: it adds structural overhead that a single-level MVP doesn't need, and the refactor path from classes to ECS is straightforward if the game ever grows.

### Game loop

The loop runs inside `requestAnimationFrame`. Each frame executes four phases in strict order:

1. **Input** — poll keyboard (WASD, 1-4, Space, E for interact) and mouse (look delta, left click).
2. **Update** — tick every entity with a fixed `dt` (seconds since last frame, clamped to ≤ 1/30 to prevent tunneling on tab-switch lag spikes).
3. **Collision** — resolve entity-vs-wall and projectile-vs-entity overlaps.
4. **Render** — Three.js draws the scene; DOM HUD is updated with current player state.

Entities never mutate each other directly; they do it through a `World` view passed in each tick, which exposes `raycastWalls()`, `lineOfSight()`, `overlapCircle()`, `entitiesInArc()`, and `spawnProjectile()`. This keeps the dependency graph acyclic and makes entity logic testable in isolation. Full interface is listed in the `Level` / `World` section below.

## Directory Layout

```
doom_of_zelda/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── sprites/                      # raw PNGs, served unprocessed
│       ├── hylian-knights.png
│       ├── hud.png
│       └── dungeon-tiles.png
├── src/
│   ├── main.ts                       # entry: boots Game
│   ├── game.ts                       # Game class, main loop
│   ├── input.ts                      # keyboard + mouse state
│   ├── audio.ts                      # playSound/playMusic stubs (no-op)
│   ├── render/
│   │   ├── renderer.ts               # Three.js setup, camera, lighting
│   │   ├── billboard.ts              # sprite-facing-camera helper
│   │   ├── level-mesh.ts             # builds wall/floor/ceiling geometry
│   │   └── sprite-atlas.ts           # slices PNGs into per-frame UVs
│   ├── entities/
│   │   ├── entity.ts                 # base: position, AABB, update()
│   │   ├── player.ts                 # movement, weapons, health
│   │   ├── enemy.ts                  # base knight + tier subclasses
│   │   ├── projectile.ts             # bombs, fire-rod bolts, boss beams
│   │   ├── pickup.ts                 # key, hearts, ammo, magic, weapons
│   │   └── door.ts                   # Door entity + interaction logic
│   ├── weapons/
│   │   ├── weapon.ts                 # base: cooldown, ammo, fire()
│   │   ├── sword.ts
│   │   ├── bow.ts
│   │   ├── bombs.ts
│   │   └── fire-rod.ts
│   ├── level/
│   │   ├── level.ts                  # runtime level state
│   │   ├── level-loader.ts           # parses JSON → Level
│   │   └── collision.ts              # 2D AABB vs wall grid
│   ├── hud/
│   │   ├── hud.ts                    # DOM overlay builder
│   │   └── hud.css                   # ALTTP HUD styling
│   └── data/
│       └── level-01.json             # the single MVP level
└── tests/
    ├── level/
    │   ├── collision.test.ts
    │   └── level-loader.test.ts
    ├── weapons/
    │   └── weapon.test.ts
    ├── entities/
    │   ├── enemy.test.ts
    │   ├── player.test.ts
    │   └── door.test.ts
    └── fixtures/
        └── test-level.json
```

## Core Domain Model

### `Entity` (abstract base)

```ts
abstract class Entity {
  position: Vector2;        // x, z — horizontal plane only
  yaw: number;              // facing angle, radians
  halfExtents: Vector2;     // AABB half-sizes for collision
  alive: boolean;
  abstract update(dt: number, world: World): void;
}
```

All in-world things extend `Entity`. There is no Y component because the game is strictly 2.5D — entity height is a fixed per-type constant used only by the renderer.

### `Player extends Entity`

State:
- `health: number` — half-hearts, 0–12.
- `magic: number` — 0–16.
- `arrows: number` — 0–30.
- `bombs: number` — 0–15.
- `hasSmallKey: boolean`.
- `currentWeapon: number` — index into the weapons array.
- `unlockedWeapons: Set<number>` — starts with {0} (sword only).
- `iframesRemaining: number` — seconds of invulnerability left.

`Player.update(dt, world)` reads input via a module-level `Input` singleton, computes movement intent, resolves movement against walls, handles weapon firing cooldowns, and decrements timers. The camera rides on the player — `camera.position = player.position + eyeHeight`, `camera.yaw = player.yaw`, camera pitch comes from mouse Y.

### `Enemy extends Entity`

Base knight class with shared state (`hp`, `target`, `aggroRange`, `meleeRange`, `speed`, `damage`, `spriteAtlasKey`, `state`). Enemy `hp` is in the same half-heart unit as player health and all damage values, so arithmetic is uniform across the game. Tiny state machine:

```
IDLE   → CHASE (player in aggro range AND line-of-sight)
CHASE  → ATTACK (player in attack range)
ATTACK → CHASE (after attack completes)
*      → HURT (took damage; brief stun ~150ms) → CHASE
hp ≤ 0 → DYING (play death animation, no collisions, no attacks)
DYING  → (entity removed by Game sweep after 0.5s)
```

The `alive` field stays `true` during `DYING` so the death animation can play; it flips to `false` when the animation timer elapses, and `Game` removes the entity on the next frame-end sweep.

Four subclasses, one per color tier. Each subclass just tweaks tuning constants and overrides `attack()`. All HP and damage values below are in half-hearts:

| Tier | HP | Speed | Damage | AggroRange | Notes |
|---|---|---|---|---|---|
| Green Knight | 2 | 2.0 | 1 (½ heart) | 8 | Basic melee grunt. Spawns in groups. Dies to 1 sword or 1 bow hit. |
| Blue Knight | 5 | 2.5 | 2 (1 heart) | 10 | ~30% of attack frames have a raised shield that reflects arrows. Dies to 3 sword hits. |
| Red Knight | 4 | 4.5 | 2 (1 heart) | 12 | After aggroing, charges at 2× speed in a straight line for ~1s, then pauses. Telegraphed. |
| Purple Knight (boss) | 20 | 3.0 | 4 (2 hearts) | ∞ (room) | Three attacks — see Mini-boss section. |

### `Projectile extends Entity`

Lightweight fields: `velocity`, `damage`, `owner`, `lifetime`, `hitbox`, optional `aoeRadius`, optional `gravity`. Subtypes for the MVP:

- **Bomb** — arcs (parabolic with gravity `-12 u/s²`), lifetime 2s or first-impact, explodes with `aoeRadius = 3.0` and damage falloff. Explosions also destroy breakable wall cells whose center is within the explosion radius.
- **FireBolt** — flies straight at high speed (no gravity), lifetime 2s, first-hit kills the projectile.
- **SwordBeam** — boss-only. Flies straight, lifetime 2s, first-hit kills the projectile. Behaves mechanically like a `FireBolt` with boss-tuned damage.

The Bow does NOT spawn a projectile — it uses a hitscan raycast (see Combat section). This is an explicit design choice; projectile arrows can be added later if hitscan proves unsatisfying.

On spawn, the projectile is added to the world entity list. On collision or lifetime expiry it marks itself `alive = false`, and `Game` sweeps dead entities at the end of the frame.

### `Pickup extends Entity`

Stationary, no update logic. On touch (player AABB overlaps pickup AABB), the pickup mutates the player state and destroys itself.

| Pickup type | Effect |
|---|---|
| `heart` | +2 half-hearts (1 heart), clamped to max 12 |
| `heart_large` | +10 half-hearts (full refill), clamped to max 12 — the rare "secret room" reward |
| `magic_jar` | +8 magic, clamped to max 16 |
| `arrows_10` | +10 arrows, clamped to max 30 |
| `bombs_5` | +5 bombs, clamped to max 15 |
| `small_key` | sets `hasSmallKey = true` |
| `weapon_bow` | unlocks weapon slot 1 (key `2`) |
| `weapon_bombs` | unlocks weapon slot 2 (key `3`) |
| `weapon_fire_rod` | unlocks weapon slot 3 (key `4`) |

### `Door extends Entity`

Dual-nature: a door occupies a grid cell (collision-blocking until opened) AND exists as an entity (so it can animate and check interaction conditions). State: `position`, `locked`, `requiredKey`, `openProgress` (0–1 for animation), `state: CLOSED | OPENING | OPEN`.

- When the player's AABB is within ~1 unit of a closed door, the game shows a small "press E to open" prompt on the HUD.
- Pressing `E` on a door:
  - If `locked` and the player lacks the key → play `door_locked` sound stub, show "LOCKED" HUD message for 1 second. No state change.
  - If `locked` and the player has the key → consume the key (`hasSmallKey = false`), transition to `OPENING`.
  - If unlocked → transition to `OPENING`.
- `OPENING` → `OPEN` over 0.5s (slide-up animation). While `OPEN`, the grid cell is marked passable; collision is bypassed for this cell.
- Doors do not re-close. There is no need — the level has no backtracking hazards.

### `Weapon` (owned by `Player`, not an entity)

```ts
abstract class Weapon {
  abstract name: string;
  abstract cooldownSeconds: number;
  cooldownRemaining: number;
  abstract canFire(player: Player): boolean;    // checks ammo, cooldown
  abstract fire(player: Player, world: World): void;
  tick(dt: number): void;                        // decrement cooldown
}
```

Subclasses: `Sword`, `Bow`, `Bombs`, `FireRod`.

### `Level` / `World`

`Level` is the static map loaded from JSON — wall grid, spawn list, theme name, ambient settings. `World` is the runtime composite: the level + all currently-alive entities + helper methods.

`World` exposes:
- `raycastWalls(origin, direction, maxDist): RaycastHit | null`
- `lineOfSight(a, b): boolean` — shortcut for an LOS check between two points.
- `overlapCircle(center, radius): Entity[]` — used for AoE and aggro detection.
- `entitiesInArc(center, forward, halfArc, radius): Entity[]` — used for sword hits.
- `spawnProjectile(projectile: Projectile): void`
- `player: Player` — the one player reference.

Entities only ever read/write the world through this interface — never direct references to `Game` or each other. This is what makes isolated testing practical.

## Level Data Format

One level per JSON file. Grid-based (Wolfenstein 3D style) rather than sector-based (Doom style) — simpler to author, easier to visualize, sufficient for the MVP.

### Schema

```jsonc
{
  "name": "Hyrule Castle Dungeon",
  "theme": "castle",
  "gridSize": 4.0,
  "width": 32,
  "height": 32,
  "tiles": [
    "################################",
    "#..............##..............#",
    "#..G..G........##..........R...#",
    "#..............D..............##",
    "// ... 28 more rows"
  ],
  "legend": {
    "#": { "type": "wall", "texture": "castle_stone" },
    ".": { "type": "floor" },
    "B": { "type": "wall", "texture": "castle_stone", "breakable": true },
    "D": { "type": "door", "locked": false },
    "L": { "type": "door", "locked": true, "key": "small_key" },
    "X": { "type": "exit" }
  },
  "spawns": {
    "player": { "x": 2.5, "z": 2.5, "yaw": 0 },
    "enemies": [
      { "type": "green_knight", "x": 6.5, "z": 4.5 }
    ],
    "pickups": [
      { "type": "small_key", "x": 18.5, "z": 6.5 }
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

The ASCII `tiles` array is the key authoring affordance — a level designer can read the file and mentally visualize the level immediately. One char per cell, one string per row.

### Loading

`level-loader.ts` runs once at startup and again on each restart:

1. Parses JSON, validates dimensions (every row must be `width` chars long; any unknown legend char is an error).
2. Builds a `Uint8Array` wall grid where each byte encodes the cell type: `0=empty`, `1=wall`, `2=door`, `3=locked door`, `4=exit`, `5=breakable wall`.
3. Returns a `Level` object containing the grid, spawn list (player, enemies, pickups), door positions, theme, and ambient settings.
4. `Game` uses the `Level` to (a) build the static wall/floor/ceiling mesh via `level-mesh.ts`, (b) instantiate one `Player` at the player spawn, (c) instantiate one `Enemy` subclass per enemy spawn, (d) instantiate one `Pickup` per pickup spawn, and (e) instantiate one `Door` entity per door cell.

## Rendering Approach

### Three.js setup

- **Renderer:** `WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })`.
- **Camera:** `PerspectiveCamera(75, w/h, 0.1, 200)` — 75° FOV matches Doom.
- **Scene fog:** distance fog using the level's `floorColor` + `fogDensity`. Doubles as a depth cue and hides the far edges.
- **Lighting:** ambient light ~0.6, a weak point light following the player for muzzle-flash effect. Walls use `MeshBasicMaterial` (unlit) because the pixel art is pre-shaded.
- **Pixel-perfect textures:** every loaded texture gets `magFilter = NearestFilter`, `minFilter = NearestFilter`, `generateMipmaps = false`. Critical for retro look.

### Level geometry

`level-mesh.ts` constructs the static geometry once at load time. For each empty cell, a floor quad and a ceiling quad are added. For each wall-empty boundary, a vertical wall face is added. All walls merge into one `BufferGeometry` with one shared material — the entire level renders in 3 draw calls (walls, floor, ceiling).

Hidden wall faces (walls adjacent to other walls) are skipped to keep the triangle count down.

Wall and floor UVs are read from a **texture atlas** — the dungeon-tiles PNG pre-sliced into named rectangles in a JSON file:

```jsonc
// src/render/tile-atlas.json
{
  "castle_stone_wall": { "u": 0,  "v": 0,  "w": 16, "h": 16 },
  "castle_stone_floor": { "u": 16, "v": 0,  "w": 16, "h": 16 }
}
```

Offsets are measured by hand when we look at the actual PNG during implementation.

### Sprite atlas for enemies

`sprite-atlas.ts` loads the Hylian Knights PNG once and exposes a lookup table:

```ts
SPRITE_ATLAS.knight.green.walk.down    // → array of {u,v,w,h} per frame
SPRITE_ATLAS.knight.green.attack.left  // → array of {u,v,w,h} per frame
// ... etc
```

Populated from a hand-written JSON (`src/render/knight-atlas.json`) with pixel coordinates measured from the actual sprite sheet during implementation. Supports `walk`, `attack`, `hurt`, `death` animations in 4 facing directions (down, up, left, right), for each of 4 tiers (green, blue, red, purple).

### Billboarded enemies

Each enemy is rendered as a `Sprite` (Three.js built-in that always faces the camera). Each frame, for each enemy, the renderer computes which directional frame to show — **based on the angle between the camera→enemy vector and the enemy's facing direction**, not the camera's rotation:

```ts
const toCam = camera.position.sub(enemy.position).normalize();
const enemyForward = vec2FromYaw(enemy.yaw);
const dot = toCam.dot(enemyForward);
const cross = crossZ(toCam, enemyForward);
// dot > 0.7 → front (show 'down' row)
// dot < -0.7 → back (show 'up' row)
// cross > 0 → left side; cross < 0 → right side
```

Quantizes to 4 facings; upgradeable to 8 if desired. The animation frame within a facing is `currentFrame % frames.length` driven by a per-enemy animation timer.

Because ALTTP sprites are drawn in 3/4 top-down perspective, the billboards will look slightly "tilted forward" when viewed horizontally in first-person. We compensate with a ~10° tilt-back on the billboard X-axis (tunable constant) so knights appear more upright.

### Viewmodel (the weapon visible in the player's hand)

Rendered as a DOM image positioned via CSS, not a 3D object in the scene. Swapping animation frames is just a `background-position` change. Four viewmodels: sword swing, bow draw, bomb throw, fire-rod idle.

**Sourcing:** the viewmodel sprites are NOT included in the assets provided so far — we need Link item-use sprites from ALTTP. **Placeholder approach for MVP:** render solid-color rectangles (green for sword, brown for bow, etc.) that animate upward on fire. Fully playable; can be swapped for real sprites later with no code change beyond the CSS.

### Projectile rendering

Small billboarded sprites. Arrow = thin tan plane, bomb = dark sphere sprite, fire-bolt = bright orange square. For MVP these can be plain colored planes (no pixel art needed) — perfectly Doom-appropriate.

### Performance budget

At a 32x32 grid with ~20 simultaneous enemies:
- Draw calls: ~3 (level) + 1 per enemy + ~5 projectiles ≈ 30 total. Trivial for WebGL.
- Triangles: ~2000 (level) + ~40 (enemies/projectiles) ≈ ~2500 total. Trivial.
- Textures: 3 atlases (dungeon tiles, knights, HUD) + a few small viewmodel images ≈ 5 MB total.
- Target: 60fps on 5-year-old integrated-GPU laptop.

## Combat, Collision & AI

### Movement & wall collision

Player velocity is computed from WASD inputs (`forward = (cos yaw, sin yaw)`, `strafe = forward rotated 90°`), normalized, scaled by `MOVE_SPEED = 7` world units/sec.

**Axis-separated collision resolution** — the critical feel detail:

1. Move player by `velocity * dt`.
2. Check AABB vs all wall cells within a 2-cell radius.
3. If overlap is on the X axis only, push back on X.
4. If overlap is on the Z axis only, push back on Z.
5. If both, resolve the two axes independently so the player slides along the wall.

This wall-sliding behavior is the single most important "feels right" detail in a Doom clone. Dead-stopping on walls feels terrible.

Collision uses the wall grid directly — each AABB check is `O(cells in radius)`, typically 4-9 lookups. No broad-phase needed.

### Damage model

**Player:**
- Health in half-hearts, 0–12.
- Taking damage triggers **0.8s of invulnerability frames** during which the player sprite flashes and cannot be hit again.
- Hits knock the player back ~0.5 units away from the damage source.

**Enemies:**
- No i-frames; they have more HP instead.
- Brief "hurt flash" (sprite tinted white) for 150ms after taking damage. Cosmetic.
- Knockback on hit — bigger for bombs, smaller for sword/bow/fire-rod.

### Weapon hit detection

All damage values below are in **half-hearts** (the same unit as enemy HP).

**Sword — instant arc melee:**
```
cooldown: 0.4s
ammo: none
range: 1.5 units
arc: 90° cone in front of player
damage: 2 (= 1 heart)
implementation:
  for each enemy within 1.5 units:
    if angle between (enemy-player) and player-forward < 45°:
      damage enemy by SWORD_DAMAGE
      knockback enemy 0.3 units away from player
```
Can hit multiple enemies in one swing. Kills a Green Knight in 1 hit (2 HP), a Blue in 3 hits, a Red in 2 hits, the Purple boss in 10 hits.

**Bow — hitscan raycast:**
```
cooldown: 0.3s
ammo: 1 arrow per shot
damage: 2 (= 1 heart)
implementation:
  raycast from camera forward against walls and enemies (max range 50 units)
  first hit takes BOW_DAMAGE
  if hit enemy is a Blue Knight in its shielded-attack window:
    spawn spark effect at hit location, no damage, no ammo refunded
```
Instant, satisfying, trivial to aim. Roughly 30% of Blue Knight attack frames are shielded — those hits are blocked by the shield.

**Bombs — arced projectile with AoE:**
```
cooldown: 0.7s
ammo: 1 bomb per throw
direct hit damage: 8 (= 4 hearts) at blast center, falls off linearly to 0 at BLAST_RADIUS
implementation:
  spawn Bomb projectile at (player position + forward * 0.5 + up * 0.5)
  velocity = forward * 8 + up * 4
  apply gravity (-12 units/sec²) each tick
  lifetime: 2s or first wall/floor impact → detonate
  on detonate:
    BLAST_RADIUS = 3.0
    for each entity (including player) within BLAST_RADIUS:
      dist = distance from blast center
      dmg = floor(8 * max(0, 1 - dist / BLAST_RADIUS))
      apply dmg and strong knockback (2 units away from blast)
    for each breakable-wall cell whose center is within BLAST_RADIUS:
      convert the cell to empty in the wall grid and rebuild that chunk of the mesh
```
Bombs hurt the player too — Zelda-accurate consequence for sloppy throws.

**Fire Rod — fast straight projectile:**
```
cooldown: 0.2s
ammo: 2 magic per shot (of 16 max)
damage: 4 (= 2 hearts)
implementation:
  spawn FireBolt traveling forward at 20 units/sec
  on first hit against enemy: deal FIRE_ROD_DAMAGE
  on hit against wall: fizzle
  pierces no enemies; dies on first hit
```
The "plasma rifle" — high DPS but burns through magic fast. Kills Green in 1 hit, Blue in 2 hits, Red in 1 hit, Purple in 5 hits.

### Enemy AI

**State machine:**
```
IDLE (wander or stand)
  → CHASE (player within aggroRange AND lineOfSight clear)

CHASE (pathfind toward player)
  → ATTACK (player within meleeRange)

ATTACK (play attack animation, deal damage at peak frame, commit)
  → CHASE (after attack window)

*     → HURT (took damage; brief stun ~150ms) → CHASE
hp≤0  → DEAD (play death animation, remove entity after 0.5s)
```

**Pathfinding:** greedy direction picker, not A*. Each CHASE tick:

```
desiredDir = normalize(player.pos - self.pos)
tryMove(desiredDir * speed * dt)
if blocked:
  // fall back: pick the 8-dir neighbor closest to desiredDir that's walkable
  for each of 8 directions sorted by similarity to desiredDir:
    if cell in that direction is walkable:
      tryMove(thatDir * speed * dt); break
```

This can get stuck in concave pockets, but the dungeon rooms are hand-crafted to avoid that. If stuck spots appear in playtesting we upgrade to A* for the problem enemies only.

**Aggro with line-of-sight:** enemies only enter CHASE when the player is within `aggroRange` AND `world.lineOfSight(self.pos, player.pos)` returns true. Enemies in rooms the player hasn't entered don't start running through walls.

### Mini-boss: Purple Knight

Spawns alone in the final room (behind the locked door). 20 HP. Three attacks, selected semi-randomly (weighted):

1. **Slash charge (40%)** — 0.5s telegraph glow, then charges at 2× speed for 1.5s. Telegraphed, dodgeable.
2. **Sword beam spread (40%)** — fires 3 `FireBolt`-like projectiles in a 30° spread. Forces strafing and cover use.
3. **Summon minions (20%)** — gated: triggers once at 50% HP and once at 25% HP. Spawns 2 Green Knights at fixed points in the room. Not in the random rotation; only at those HP thresholds.

Between attacks, the boss chases the player at base speed (3.0). When defeated: drops the small key (if the player somehow hasn't gotten it yet), and the exit portal in the room activates.

### Death & restart

Health ≤ 0 → full-screen DOM overlay with "YOU DIED" and a restart button. Clicking restart does a **full level reset**: re-parse `level-01.json`, rebuild all spawn entities from scratch (all previously-killed enemies respawn), reset player state (full health, full magic, starting ammo, sword-only loadout, no key), leave the Three.js scene in place but replace the level mesh. No checkpoints, no lives.

## Level 1 Design

The single MVP level is "Hyrule Castle Dungeon" on a 32x32 grid (~15 minutes first playthrough). Planned room progression:

1. **Entry chamber** — sword already equipped, 2 Green Knights. Teaches melee.
2. **Corridor + guard room** — 3-4 Greens, Bow pickup + arrows. Teaches ranged.
3. **Cross intersection** — 1 Blue Knight, more arrows. Branch left/right.
4. **Left wing — bomb supply** — Bomb pickup and extra bomb ammo. A cracked wall (breakable) opens a small secret corridor containing a `heart_large` (full heart refill). Teaches bombs and secret hunting. No permanent max-HP increase — stays consistent with the "no persistence" non-goal.
5. **Right wing — magic room** — Fire Rod pickup, magic jar. Two Red Knights ambush on entry.
6. **Key chamber** — small key guarded by a mixed group (2 Green, 1 Blue, 1 Red). Combines everything learned.
7. **Locked door → boss room** — Purple Knight mini-boss in a large circular chamber.
8. **Exit portal** — spawns on boss defeat. Touch to win.

Pickup placement guarantees: Bow before first Blue Knight. Bombs before the breakable wall. Fire Rod before the boss room.

## Audio (Stub)

`audio.ts` exposes `playSound(name)` and `playMusic(name)` as no-op functions for MVP. All firing sites are written so audio can be added later by replacing the stubs with Web Audio API or HTMLAudio calls — no caller changes needed.

Sound trigger points wired in but silent:
- `bow_fire`, `sword_swing`, `bomb_throw`, `bomb_explode`, `fire_rod_cast`
- `knight_hurt`, `knight_die`, `knight_alert`
- `player_hurt`, `player_die`
- `pickup_heart`, `pickup_magic`, `pickup_key`, `pickup_weapon`
- `door_open`, `door_locked`

## Testing Strategy

### What gets unit tests

Pure, deterministic, in-code logic. Specifically:

1. **Level loader** — JSON → Level conversion, including error paths (malformed, missing fields, mismatched row lengths, unknown legend chars).
2. **Collision** — AABB overlap, axis-separated wall resolution, wall raycast, tunneling prevention at high `dt`, open-door passability.
3. **Combat math** — sword arc check, bomb AoE falloff (including damage-at-distance math), weapon cooldown gating, breakable-wall destruction by bomb.
4. **Enemy state machine** — transitions triggered by a fake `World` with canned raycast responses; DYING timer removes entity.
5. **Player state** — damage intake with i-frames, pickup effects (each pickup type), weapon switching/unlocking, key consumption.
6. **Door logic** — locked-without-key rejection, unlock-consumes-key, open animation progress, passability after open.
7. **Pathfinding direction picker** — open path, blocked path, fully walled-in.

### What does NOT get unit tests

- Three.js rendering output (eyes, not assertions).
- Input handling (needs real browser + real mouse).
- Frame pacing / perceived movement speed (playtest-tuned).
- Weapon/combat "feel" (playtest-tuned).
- HUD visual polish (eyes).

### Infrastructure

- **Runner:** Vitest.
- **Pure logic modules do not import Three.js.** They use plain `{x, z}` objects or a tiny custom `Vec2` interface. Three.js types only appear at the render boundary. This keeps tests fast and WebGL-independent.
- **Fixtures:** `tests/fixtures/test-level.json` — a tiny 5x5 grid for loader tests.
- **Test file layout mirrors source:** `src/level/collision.ts` ↔ `tests/level/collision.test.ts`.
- **Coverage goal:** ~80% on modules listed above. No coverage gate on render/input modules.

### TDD for implementation

Implementation of pure-logic modules uses `superpowers:test-driven-development`:
1. Write failing test for a single behavior.
2. Write smallest code that passes.
3. Refactor.
4. Move to next behavior.

Rendering/integration modules are built directly and iterated manually — TDD offers little value there.

### Manual playtest checklist

Not automated, but captured here so we don't forget:

- [ ] Can complete the level on first playthrough without dying.
- [ ] Can complete the level dying twice — confirms difficulty margin.
- [ ] Sword feels satisfying to hit with.
- [ ] Strafing works naturally (muscle memory transfer from Doom).
- [ ] The small key is findable without a walkthrough.
- [ ] The breakable-wall secret is discoverable with bombs.
- [ ] The mini-boss feels hard but fair.
- [ ] HUD is readable at 1280x720, 1920x1080, 2560x1440.
- [ ] Game boots in under 3 seconds from a cold tab.
- [ ] Runs at a steady 60fps on a 5-year-old laptop.

## Open Questions / Deferred Decisions

Items explicitly deferred past the MVP:

- **Link viewmodel sprites** — placeholder colored rectangles for MVP; real ALTTP Link item-use sprites to be sourced later. Code change limited to CSS once assets arrive.
- **8-directional billboards** — starts at 4 to match the ALTTP sprite sheets' 4 cardinal directions. If we want the smoother 8-way look later, we can mirror left/right frames to synthesize the 45° angles.
- **Audio** — stubs in place; actual sound effects and music deferred post-MVP.
- **Hitscan vs projectile arrows** — hitscan is the MVP choice. Revisit only if playtesting reveals it feels off (projectile path already exists in the `Projectile` infrastructure if we need to swap).

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ALTTP top-down sprites look weird on first-person billboards | High | Medium | Tunable billboard tilt-back constant; worst case, accept the "tiny overhead knight" aesthetic as a stylistic feature. |
| Greedy pathfinding gets enemies stuck | Medium | Medium | Hand-craft rooms to avoid concave traps; upgrade to A* for specific enemies if needed. |
| Collision tunneling at lag spikes | Medium | High | Clamp `dt` to 1/30; swept-AABB for projectiles if standard resolution proves insufficient. |
| Performance on low-end hardware | Low | Low | Scope is modest (thousands of tris, ~30 draw calls). Budget analysis suggests heavy headroom. |
| Missing viewmodel sprites blocks MVP ship | Medium | Low | Placeholder colored-rectangle viewmodels are explicitly part of the plan. |

## Success Criteria

The MVP is successful if all of the following are true:

1. A new player can start the game in a browser, play through the dungeon, and win — without needing to read documentation.
2. The combat loop feels recognizably Doom-like: strafing, weapon-juggling, ammo tension.
3. The visual presentation is recognizably Zelda: the ALTTP HUD reads correctly, the knights are clearly the ALTTP Hylian Knights, the dungeon walls feel like a Zelda dungeon.
4. The game runs at ≥ 60fps on 5-year-old integrated-GPU hardware.
5. The codebase is ≤ 3000 lines of TypeScript (excluding tests and data), so future iteration is cheap.
