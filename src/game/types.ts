export type GameMode = 'missions' | 'survival' | 'freeflight';

export type DifficultyMode = 'beginner' | 'standard' | 'ace';

export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

export type CameraMode = 'chase' | 'action' | 'cockpit';

export type JetLivery = 'obsidian' | 'viper' | 'arctic';

export type EnemyArchetype = 'interceptor' | 'flanker' | 'gunship';

export type CollectibleKind = 'repair' | 'fuel' | 'missile' | 'star';

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

export interface MissionDefinition {
  id: number;
  title: string;
  briefing: string;
  enemyCount: number;
  checkpointCount: number;
  waves: number;
  timeLimitSec: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  difficulty: DifficultyMode;
  autoTargetEnabled: boolean;
  missionIndex: number;
  missionTitle: string;
  objectiveText: string;
  cameraMode: CameraMode;
  speedKnots: number;
  altitudeMeters: number;
  headingDeg: number;
  pitchDeg: number;
  bankDeg: number;
  throttlePct: number;
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  missiles: number;
  maxMissiles: number;
  gunHeat: number;
  afterburner: boolean;
  maneuverReady: boolean;
  takeoffActive: boolean;
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
  incomingWarning: boolean;
  incomingDistance: number | null;
  lowHealthWarning: boolean;
  lowFuelWarning: boolean;
  lockState: 'none' | 'acquiring' | 'locked';
  lockProgress: number;
  lockedTargetCallsign: string | null;
  lockedTargetDist: number | null;
  leadTarget: { screenX: number; screenY: number; distance: number } | null;
  damageFlash: number;
  hitMarker: boolean;
  combatFeedback: { text: string; kind: 'hit' | 'crit' | 'kill' } | null;
  bannerMessage: string | null;
  targets: ProjectedTarget[];
  nextCheckpoint: ProjectedCheckpoint | null;
  radarBlips: RadarBlip[];
  shotsFired: number;
  shotsHit: number;
  defeatReason: string | null;
}

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
