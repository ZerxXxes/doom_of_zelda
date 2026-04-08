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
