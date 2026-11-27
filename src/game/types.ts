/**
 * Shared types for Sky Warrior Dominion.
 *
 * This is the contract file: the simulation (`rules`), the 3D renderer,
 * the HUD and the title screen all import from here, so nothing in this
 * file may change shape without updating every consumer. Field names,
 * unions and optionality below are the public API — add new fields with
 * care, never rename or retype an existing one.
 *
 * Sections, top to bottom:
 *   1. Mode / difficulty / phase unions — the game's top-level state
 *   2. Vectors and player input
 *   3. Simulation state (player, enemies, checkpoints, collectibles)
 *   4. Projected / radar data handed to the HUD each frame
 *   5. Missions and the per-frame HUD snapshot
 *   6. World obstacles and the end-of-run summary
 */

// ---------------------------------------------------------------------------
// 1. Top-level game state
// ---------------------------------------------------------------------------

/** Which game mode is selected on the title screen. */
export type GameMode = 'missions' | 'survival' | 'freeflight';

/** Combat difficulty — scales enemy count, damage and time limits. */
export type DifficultyMode = 'beginner' | 'standard' | 'ace';

/** Where the game is in its lifecycle. */
export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

/** Chase / action / cockpit camera. */
export type CameraMode = 'chase' | 'action' | 'cockpit';

/** Paint scheme for the player's F-22X. */
export type JetLivery = 'obsidian' | 'viper' | 'arctic';

/** Enemy behaviour family. */
export type EnemyArchetype = 'interceptor' | 'flanker' | 'gunship';

/** What a floating pickup grants when collected. */
export type CollectibleKind = 'repair' | 'fuel' | 'missile' | 'star';

// ---------------------------------------------------------------------------
// 2. Vectors and player input
// ---------------------------------------------------------------------------

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FlightInput {
  pitch: number; // -1 (nose down) to +1 (nose up)
  roll: number; // -1 (bank left) to +1 (bank right)
  yaw: number; // -1 (yaw left) to +1 (yaw right)
  throttleDelta: number; // -1 to +1
  boost: boolean;
  fireGun: boolean;
  fireMissile: boolean;
  maneuver: boolean; // Barrel roll + flare countermeasures
}

// ---------------------------------------------------------------------------
// 3. Simulation state
// ---------------------------------------------------------------------------

export interface PlayerFlightState {
  pos: Vec3;
  // Orientation stored as Euler-friendly yaw/pitch/roll in radians or quaternion in 3D,
  // pure rules track forward/up/right basis or heading/pitch/bank angles:
  heading: number; // radians, 0 = -Z
  pitch: number; // radians
  bank: number; // radians
  speed: number; // m/s (world units/s)
  throttle: number; // 0..1
  health: number; // 0..100
  maxHealth: number;
  fuel: number; // 0..100
  maxFuel: number;
  missiles: number;
  maxMissiles: number;
  missileReloadTimer: number;
  flaresCooldown: number;
  maneuverTimer: number; // > 0 during barrel roll
  maneuverCooldown: number;
  gunHeat: number; // 0..1
  afterburnerActive: boolean;
  takeoffTimer: number; // > 0 during runway takeoff cinematic
  collisionCooldown: number; // > 0 grace period after terrain/building bounce
}

export interface EnemyUnitState {
  id: number;
  archetype: EnemyArchetype;
  callsign: string;
  pos: Vec3;
  heading: number;
  pitch: number;
  bank: number;
  speed: number;
  health: number;
  maxHealth: number;
  fireCooldown: number;
  telegraphTimer: number; // > 0 before firing heavy burst
  aiPhaseOffset: number;
  evadeTimer: number; // > 0 during reactive jink/barrel evasion
  alive: boolean;
  dyingTimer: number; // > 0 during KO spiral/explosion dissolve
  hitFlashTimer: number;
}

export interface CheckpointState {
  id: number;
  pos: Vec3;
  radius: number;
  collected: boolean;
  order: number;
}

export interface CollectibleState {
  id: number;
  kind: CollectibleKind;
  pos: Vec3;
  radius: number;
  collected: boolean;
  bobPhase: number;
}

// ---------------------------------------------------------------------------
// 4. Projected / radar data (simulation -> HUD, rebuilt every frame)
// ---------------------------------------------------------------------------

export interface ProjectedTarget {
  id: number;
  callsign: string;
  archetype: EnemyArchetype;
  screenX: number; // 0..1 normalized viewport
  screenY: number; // 0..1 normalized viewport
  inFront: boolean;
  dirX?: number; // normalized screen direction when offscreen
  dirY?: number;
  distance: number;
  healthRatio: number;
  isLockedTarget: boolean;
  lockProgress: number; // 0..1
}

export interface ProjectedCheckpoint {
  id: number;
  screenX: number;
  screenY: number;
  inFront: boolean;
  distance: number;
  order: number;
}

export interface RadarBlip {
  id: number;
  dx: number; // normalized -1..1 relative to player heading
  dz: number; // normalized -1..1 relative to player heading
  kind: 'enemy' | 'checkpoint' | 'collectible' | 'missile';
  isLocked?: boolean;
}

// ---------------------------------------------------------------------------
// 5. Missions and the HUD snapshot
// ---------------------------------------------------------------------------

export interface MissionDefinition {
  id: number;
  title: string;
  briefing: string;
  enemyCount: number;
  checkpointCount: number;
  waves: number;
  timeLimitSec: number;
}

/**
 * Everything the HUD needs, in one immutable-ish snapshot per frame.
 * Grouped: identity / flight telemetry / combat state / mission progress /
 * warnings & lock / feedback / projected world objects / run stats.
 * `gunOverheated` is derived from `gunHeat` reaching its cap; the HUD
 * shows OVERHEAT (and blocks firing) while it is true.
 */
export interface HudSnapshot {
  // Identity & run context
  phase: GamePhase;
  mode: GameMode;
  difficulty: DifficultyMode;
  autoTargetEnabled: boolean;
  missionIndex: number;
  missionTitle: string;
  objectiveText: string;
  cameraMode: CameraMode;

  // Flight telemetry
  speedKnots: number;
  altitudeMeters: number;
  headingDeg: number;
  pitchDeg: number;
  bankDeg: number;
  throttlePct: number;

  // Aircraft state
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  missiles: number;
  maxMissiles: number;
  gunHeat: number;
  gunOverheated: boolean;
  afterburner: boolean;
  maneuverReady: boolean;
  takeoffActive: boolean;

  // Score & mission progress
  score: number;
  bestScore: number;
  combo: number;
  comboTimer: number;
  kills: number;
  wave: number;
  totalWaves: number;
  elapsedSec: number;
  timeRemainingSec: number | null;
  checkpointsCleared: number;
  checkpointsTotal: number;

  // Warnings & missile lock
  incomingWarning: boolean;
  incomingDistance: number | null;
  lowHealthWarning: boolean;
  lowFuelWarning: boolean;
  lockState: 'none' | 'acquiring' | 'locked';
  lockProgress: number;
  lockedTargetCallsign: string | null;
  lockedTargetDist: number | null;
  leadTarget: { screenX: number; screenY: number; distance: number } | null;

  // Transient feedback
  damageFlash: number;
  hitMarker: boolean;
  combatFeedback: { text: string; kind: 'hit' | 'crit' | 'kill' } | null;
  bannerMessage: string | null;

  // Projected world objects
  targets: ProjectedTarget[];
  nextCheckpoint: ProjectedCheckpoint | null;
  radarBlips: RadarBlip[];

  // Run stats (for the end-of-run screen)
  shotsFired: number;
  shotsHit: number;
  defeatReason: string | null;
}

// ---------------------------------------------------------------------------
// 6. World obstacles and the end-of-run summary
// ---------------------------------------------------------------------------

export interface BuildingObstacle {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  topY: number;
}

export interface RunSummary {
  outcome: 'victory' | 'defeat';
  mode: GameMode;
  difficulty: DifficultyMode;
  missionTitle: string;
  score: number;
  bestScore: number;
  rank: 'S' | 'A' | 'B' | 'C';
  kills: number;
  wave: number;
  elapsedSec: number;
  accuracyPct: number;
  checkpointsCleared: number;
  checkpointsTotal: number;
  defeatReason: string | null;
}
