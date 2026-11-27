// ---------------------------------------------------------------------------
// Sky Warrior Dominion — pure game rules
// ---------------------------------------------------------------------------
// This module holds every piece of gameplay logic that can be reasoned
// about without a renderer: flight physics, weapons, fuel, enemy AI,
// targeting, terrain, collisions and mission scoring.
//
// Design notes for future readers:
//  * Nothing in here touches the DOM, WebGL, audio or input devices. The
//    engine feeds this module a `FlightInput` and a delta-time each frame
//    and reads back the mutated player / enemy state.
//  * All state mutation is explicit and in-place: the engine owns the
//    objects, these functions advance them. That keeps the hot loop free
//    of allocations (apart from the few small result objects returned).
//  * Every frame-rate-sensitive step clamps `dt` to 0.05s first, so a
//    hitch or a tab switch can never teleport a jet through a mountain.
//  * Difficulty is data, not branching: one `DifficultyConfig` per mode
//    drives damage, lock speed, reload time and enemy aggression, so
//    tuning a mode means editing one table row, not hunting through code.
// ---------------------------------------------------------------------------

import type {
  BuildingObstacle,
  CheckpointState,
  CollectibleState,
  DifficultyMode,
  EnemyArchetype,
  EnemyUnitState,
  FlightInput,
  GameMode,
  MissionDefinition,
  PlayerFlightState,
  Vec3,
} from './types';

// --- World limits -----------------------------------------------------------

/** Half-width of the playable ocean / island area, in metres. */
export const WORLD_RADIUS = 2400;
/** Sea level; terrain below this is ocean and the ground floor is 0. */
export const OCEAN_LEVEL = 0;
/** Lowest altitude a jet is allowed to sustain in normal flight. */
export const MIN_FLIGHT_ALTITUDE = 8;
/** Soft ceiling — the jet is gently levelled off above this height. */
export const MAX_FLIGHT_ALTITUDE = 780;

// --- Difficulty -------------------------------------------------------------

export interface DifficultyConfig {
  label: string;
  desc: string;
  enemyHpMult: number;
  playerCannonDmg: number;
  playerMissileDmg: number;
  bulletHitRadiusBonus: number;
  missileHitRadius: number;
  lockRate: number;
  aimAssistDot: number;
  aimAssistStrength: number;
  enemyCannonDmg: number;
  enemyMissileDmg: number;
  enemyMissileSpeed: number;
  enemyMissileCooldown: number;
  enemyMissileTurn: number;
  scrapeDmg: number;
  timeMult: number;
  maxMissiles: number;
  missileReloadSec: number;
}

/**
 * One tuning row per difficulty. Beginner is forgiving (strong lock-on,
 * heavy aim assist, gentle enemies, slow reload pressure); Ace is the
 * opposite — tougher enemies, faster incoming missiles and a longer
 * missile reload, in exchange for the same airframe.
 */
export const DIFFICULTY_CONFIG: Record<DifficultyMode, DifficultyConfig> = {
  beginner: {
    label: 'Beginner',
    desc: 'Stronger lock-on, cannon aim assist, gentle enemy fire & forgiving collisions.',
    enemyHpMult: 0.72,
    playerCannonDmg: 30,
    playerMissileDmg: 90,
    bulletHitRadiusBonus: 5.5,
    missileHitRadius: 28,
    lockRate: 1.75,
    aimAssistDot: 0.84,
    aimAssistStrength: 0.9,
    enemyCannonDmg: 4,
    enemyMissileDmg: 10,
    enemyMissileSpeed: 120,
    enemyMissileCooldown: 16.0,
    enemyMissileTurn: 0.9,
    scrapeDmg: 6,
    timeMult: 1.35,
    maxMissiles: 8,
    missileReloadSec: 3.0,
  },
  standard: {
    label: 'Standard',
    desc: 'Balanced aerial combat with guided missile tracking and fair evasion windows.',
    enemyHpMult: 0.9,
    playerCannonDmg: 24,
    playerMissileDmg: 85,
    bulletHitRadiusBonus: 3.5,
    missileHitRadius: 24,
    lockRate: 1.35,
    aimAssistDot: 0.89,
    aimAssistStrength: 0.65,
    enemyCannonDmg: 6,
    enemyMissileDmg: 15,
    enemyMissileSpeed: 145,
    enemyMissileCooldown: 12.5,
    enemyMissileTurn: 1.3,
    scrapeDmg: 12,
    timeMult: 1.1,
    maxMissiles: 6,
    missileReloadSec: 3.6,
  },
  ace: {
    label: 'Ace',
    desc: 'Aggressive enemy waves, faster missiles and precision dogfighting.',
    enemyHpMult: 1.1,
    playerCannonDmg: 20,
    playerMissileDmg: 80,
    bulletHitRadiusBonus: 1.5,
    missileHitRadius: 20,
    lockRate: 1.05,
    aimAssistDot: 0.93,
    aimAssistStrength: 0.35,
    enemyCannonDmg: 8,
    enemyMissileDmg: 22,
    enemyMissileSpeed: 175,
    enemyMissileCooldown: 9.0,
    enemyMissileTurn: 1.7,
    scrapeDmg: 18,
    timeMult: 1.0,
    maxMissiles: 6,
    missileReloadSec: 4.5,
  },
};

// --- Missions ---------------------------------------------------------------

export const MISSIONS: MissionDefinition[] = [
  {
    id: 0,
    title: 'Operation Sunset Vigil',
    briefing:
      'Sweep the coastal archipelago, clear aerial recon checkpoints, and neutralize hostile interceptor patrols.',
    enemyCount: 4,
    checkpointCount: 4,
    waves: 2,
    timeLimitSec: 210,
  },
  {
    id: 1,
    title: 'Citadel Airspace Defense',
    briefing:
      'Defend the Solaris Citadel skyline against coordinated Spectre flankers and heavy Goliath gunships.',
    enemyCount: 6,
    checkpointCount: 5,
    waves: 3,
    timeLimitSec: 240,
  },
  {
    id: 2,
    title: 'Dominion Strike',
    briefing:
      'Break the enemy vanguard across the volcanic peaks in a full-scale supersonic engagement.',
    enemyCount: 8,
    checkpointCount: 6,
    waves: 3,
    timeLimitSec: 270,
  },
];

// --- Small math helpers -----------------------------------------------------

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Wraps any angle into (-PI, PI]. */
export function normalizeAngle(rad: number): number {
  let a = rad;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Frame-rate-independent exponential approach toward a target value. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Euclidean distance between two points. Kept internal; hot paths inline it. */
function distanceBetween(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Counts a timer down toward zero, never below it. Returns the new value. */
function tickDown(timer: number, dt: number): number {
  return timer > 0 ? Math.max(0, timer - dt) : timer;
}

// --- Terrain ----------------------------------------------------------------

/**
 * How far a point sits inside a circular island falloff: 1 at the centre,
 * fading linearly to 0 at the island's edge, and 0 beyond it.
 */
function islandFalloff(x: number, z: number, centreX: number, centreZ: number, radius: number): number {
  return Math.max(0, 1 - Math.hypot(x - centreX, z - centreZ) / radius);
}

/**
 * Deterministic multi-island + volcanic mountain height function, shared
 * between the 3D terrain mesh and flight collision physics. It must stay
 * a pure function of (x, z): the mesh and the physics must always agree
 * about where the ground is, or jets would clip through visible hills.
 *
 * Layout (all heights in metres, sea level is 0):
 *  - a flat runway plateau on the central Citadel island, pinned at y = 14
 *  - a volcanic peak to the north-west, with a crater carved into its top
 *  - twin spires to the east, a southern atoll ridge, and a south-east
 *    canyon massif, each a smooth powered falloff
 *  - low-amplitude multi-octave ridges for organic variation on land
 */
export function sampleTerrainHeight(x: number, z: number): number {
  // Runway plateau: distance outside the flat rectangle around (0, 40).
  const outsideRunwayX = Math.max(0, Math.abs(x) - 55);
  const outsideRunwayZ = Math.max(0, Math.abs(z - 40) - 190);
  const runwayFlatFactor = Math.exp(
    -(outsideRunwayX * outsideRunwayX + outsideRunwayZ * outsideRunwayZ) / 9500,
  );

  // Island falloffs — each one is 1 at its centre and 0 at its shoreline.
  const centre = islandFalloff(x, z, 0, 0, 560); // Central Citadel & Airbase
  const volcano = islandFalloff(x, z, -820, -680, 520); // Volcanic Peak NW
  const east = islandFalloff(x, z, 860, -360, 440); // Twin Spires East
  const south = islandFalloff(x, z, -460, 880, 460); // Southern Atoll Ridge
  const southEast = islandFalloff(x, z, 780, 760, 480); // Distant Canyon Massif

  // Powered peaks: the exponent sharpens each island into a mountain.
  const volcanoPeak = Math.pow(volcano, 1.55) * 265;
  const eastPeak = Math.pow(east, 1.45) * 195;
  const southPeak = Math.pow(south, 1.5) * 165;
  const southEastPeak = Math.pow(southEast, 1.6) * 215;
  const centreHeight = Math.pow(centre, 1.35) * 32;

  // Organic ridges, masked so they only roughen land, never the ocean.
  const landMask = Math.max(centre, volcano, east, south, southEast);
  const ridge =
    (Math.sin(x * 0.0085 + 0.4) * Math.cos(z * 0.0078 - 0.3) * 22 +
      Math.sin(x * 0.021 - z * 0.017) * 11 +
      Math.cos(x * 0.043 + z * 0.039) * 4.5) *
    Math.min(1, landMask * 2.2);

  let height = -14 + centreHeight + volcanoPeak + eastPeak + southPeak + southEastPeak + ridge;

  // Carve a smooth crater into the top of the north-west volcano.
  const volcanoDist = Math.hypot(x + 820, z + 680);
  if (volcanoDist < 95) {
    const craterFactor = 1 - volcanoDist / 95;
    height -= craterFactor * craterFactor * 52;
  }

  // Blend the central runway and city plateau flat to y = 14.
  if (runwayFlatFactor > 0.02) {
    height = lerp(height, 14, clamp(runwayFlatFactor * 1.15, 0, 1));
  }

  return height;
}

// --- Orientation ------------------------------------------------------------

/**
 * Forward unit vector for a heading (yaw, 0 = facing -Z) and pitch
 * (positive = nose up). Writes into `out` when supplied so callers in
 * the hot loop can reuse one vector instead of allocating per frame.
 */
export function getForwardVector(
  heading: number,
  pitch: number,
  out: Vec3 = { x: 0, y: 0, z: 0 },
): Vec3 {
  const cosP = Math.cos(pitch);
  out.x = -Math.sin(heading) * cosP;
  out.y = Math.sin(pitch);
  out.z = -Math.cos(heading) * cosP;
  return out;
}

// --- Player setup -----------------------------------------------------------

/** Shared defaults for a fresh player state; the two spawn modes differ below. */
function basePlayerState(difficulty: DifficultyMode): PlayerFlightState {
  const maxMissiles = DIFFICULTY_CONFIG[difficulty].maxMissiles;
  return {
    pos: { x: 0, y: 120, z: 320 },
    heading: 0,
    pitch: 0.02,
    bank: 0,
    speed: 135,
    throttle: 0.65,
    health: 100,
    maxHealth: 100,
    fuel: 100,
    maxFuel: 100,
    missiles: maxMissiles,
    maxMissiles,
    missileReloadTimer: 0,
    flaresCooldown: 0,
    maneuverTimer: 0,
    maneuverCooldown: 0,
    gunHeat: 0,
    afterburnerActive: false,
    takeoffTimer: 0,
    collisionCooldown: 0,
  };
}

export function createInitialPlayerState(
  skipTakeoff = false,
  difficulty: DifficultyMode = 'beginner',
): PlayerFlightState {
  const state = basePlayerState(difficulty);

  if (skipTakeoff) {
    // Airborne start (used by tests and Free Flight): already at cruise.
    return state;
  }

  // Runway start: slow, nose level, afterburner lit for the takeoff roll.
  state.pos = { x: 0, y: 18.2, z: 210 };
  state.pitch = 0.01;
  state.speed = 48;
  state.throttle = 0.85;
  state.afterburnerActive = true;
  state.takeoffTimer = 2.6;
  return state;
}

// --- Player flight step -----------------------------------------------------

/** Counts every player cooldown / active-timer down by one frame. */
function tickPlayerCooldowns(state: PlayerFlightState, dt: number): void {
  state.flaresCooldown = tickDown(state.flaresCooldown, dt);
  state.maneuverCooldown = tickDown(state.maneuverCooldown, dt);
  state.maneuverTimer = tickDown(state.maneuverTimer, dt);
  state.collisionCooldown = tickDown(state.collisionCooldown, dt);
}

/**
 * Missile reload: while below capacity the reload timer accumulates and
 * one missile is restored each `missileReloadSec`. At full capacity the
 * timer is parked at zero so a fresh volley starts from a clean clock.
 */
function reloadPlayerMissiles(
  state: PlayerFlightState,
  dt: number,
  cfg: DifficultyConfig,
): void {
  if (state.missiles < state.maxMissiles) {
    state.missileReloadTimer += dt;
    if (state.missileReloadTimer >= cfg.missileReloadSec) {
      state.missiles += 1;
      state.missileReloadTimer = 0;
    }
  } else {
    state.missileReloadTimer = 0;
  }
}

/**
 * The runway cinematic (first 2.6s after launching from the menu):
 * speed ramps up the runway, the nose rotates up after the halfway
 * point, and the jet lifts off. No fuel, heat or steering applies yet.
 */
function runTakeoffPhase(state: PlayerFlightState, dt: number): void {
  state.takeoffTimer = Math.max(0, state.takeoffTimer - dt);
  const progress = 1 - state.takeoffTimer / 2.6;
  state.speed = lerp(55, 148, progress);
  state.afterburnerActive = true;

  // Rotate the nose up once past a third of the runway.
  const targetPitch = progress > 0.35 ? lerp(0.01, 0.24, (progress - 0.35) / 0.65) : 0.01;
  state.pitch = damp(state.pitch, targetPitch, 5.5, dt);
  state.bank = damp(state.bank, 0, 6, dt);

  const fwd = getForwardVector(state.heading, state.pitch);
  state.pos.x += fwd.x * state.speed * dt;
  state.pos.y += fwd.y * state.speed * dt;
  state.pos.z += fwd.z * state.speed * dt;
  state.pos.y = Math.max(state.pos.y, 18.2);
}

/**
 * Throttle and afterburner. Boost is only available while there is fuel
 * to burn; it raises the target speed well above the throttle curve.
 * Diving adds a little speed, climbing bleeds a little, via gravity.
 * Returns whether the afterburner is lit this frame.
 */
function updateThrottleAndSpeed(
  state: PlayerFlightState,
  input: FlightInput,
  dt: number,
): boolean {
  state.throttle = clamp(state.throttle + input.throttleDelta * dt * 0.65, 0.25, 1.0);
  const canBoost = state.fuel > 2 && input.boost;
  state.afterburnerActive = canBoost;

  const baseTargetSpeed = lerp(75, 175, state.throttle);
  const targetSpeed = canBoost ? 245 : baseTargetSpeed;
  const pitchGravityFactor = -Math.sin(state.pitch) * 26;
  state.speed = damp(state.speed, clamp(targetSpeed + pitchGravityFactor, 60, 275), 2.8, dt);
  return canBoost;
}

/**
 * Fuel burn. In Free Flight the tank slowly regenerates during cruise
 * (and drains slowly under boost) so exploration never ends abruptly;
 * everywhere else fuel only ever decreases, and hitting zero ends the
 * mission via the `fuelDepleted` flag returned by `stepPlayerFlight`.
 */
function updatePlayerFuel(
  state: PlayerFlightState,
  mode: GameMode,
  canBoost: boolean,
  dt: number,
): void {
  if (mode === 'freeflight') {
    state.fuel = clamp(state.fuel + (canBoost ? -1.5 : 3.5) * dt, 15, state.maxFuel);
  } else {
    const burnRate = canBoost ? 2.8 : 0.32 + state.throttle * 0.45;
    state.fuel = Math.max(0, state.fuel - burnRate * dt);
  }
}

/** Cannon heat: builds while the trigger is held, cools when released. */
function updateGunHeat(state: PlayerFlightState, input: FlightInput, dt: number): void {
  if (input.fireGun) {
    state.gunHeat = clamp(state.gunHeat + dt * 0.36, 0, 1);
  } else {
    state.gunHeat = clamp(state.gunHeat - dt * 0.45, 0, 1);
  }
}

/**
 * Aerodynamic steering: pitch from the stick, bank from roll (with a
 * gentle self-levelling assist when the stick is released, or a full
 * barrel roll while a maneuver is active), then a coordinated turn —
 * banking induces heading change, plus direct rudder yaw — and finally
 * the position advance along the forward vector.
 */
function steerPlayer(state: PlayerFlightState, input: FlightInput, dt: number): void {
  const pitchRate = 1.45;
  const rollRate = 2.65;
  const yawRate = 0.85;

  state.pitch = clamp(state.pitch + input.pitch * pitchRate * dt, -1.18, 1.18);

  if (state.maneuverTimer > 0) {
    // High-speed barrel roll.
    state.bank = normalizeAngle(state.bank + Math.PI * 3.1 * dt);
  } else if (Math.abs(input.roll) > 0.02) {
    state.bank = clamp(state.bank - input.roll * rollRate * dt, -1.35, 1.35);
  } else {
    state.bank = damp(state.bank, 0, 2.2, dt);
  }

  const bankTurn = Math.sin(state.bank) * 0.92;
  state.heading = normalizeAngle(state.heading + (bankTurn + -input.yaw * yawRate) * dt);

  const fwd = getForwardVector(state.heading, state.pitch);
  state.pos.x += fwd.x * state.speed * dt;
  state.pos.y += fwd.y * state.speed * dt;
  state.pos.z += fwd.z * state.speed * dt;
}

/** Soft ceiling and the outer perimeter turn-back. */
function enforceFlightBounds(state: PlayerFlightState, dt: number): void {
  if (state.pos.y > MAX_FLIGHT_ALTITUDE) {
    state.pos.y = MAX_FLIGHT_ALTITUDE;
    if (state.pitch > 0) state.pitch = damp(state.pitch, 0, 4, dt);
  }

  // Past the edge of the world, gently steer back toward the centre
  // instead of letting the jet fly off into empty void.
  const distFromOrigin = Math.hypot(state.pos.x, state.pos.z);
  if (distFromOrigin > WORLD_RADIUS - 180) {
    const angleToCenter = Math.atan2(state.pos.x, state.pos.z);
    const diff = normalizeAngle(angleToCenter - state.heading);
    state.heading = normalizeAngle(state.heading + diff * dt * 1.8);
    state.pos.x = (state.pos.x / distFromOrigin) * Math.min(distFromOrigin, WORLD_RADIUS);
    state.pos.z = (state.pos.z / distFromOrigin) * Math.min(distFromOrigin, WORLD_RADIUS);
  }
}

/**
 * Terrain / ocean contact. This deliberately never instant-crashes on
 * a graze: the jet is bounced up to a safe clearance, the nose is
 * raised, and — outside Free Flight — one scrape of damage is applied
 * per collision-cooldown window. Only a scrape that drops health to
 * zero counts as a crash.
 */
function checkTerrainContact(
  state: PlayerFlightState,
  mode: GameMode,
  cfg: DifficultyConfig,
  dt: number,
): { terrainCrash: boolean; terrainScraped: boolean } {
  const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(state.pos.x, state.pos.z));
  let terrainCrash = false;
  let terrainScraped = false;

  if (state.pos.y < groundY + 5.5) {
    state.pos.y = groundY + 11.5;
    state.pitch = Math.max(0.24, state.pitch);
    state.bank = damp(state.bank, 0, 5, dt);
    if (mode !== 'freeflight' && state.collisionCooldown <= 0) {
      state.collisionCooldown = 1.4;
      state.health = Math.max(0, state.health - cfg.scrapeDmg);
      terrainScraped = true;
      if (state.health <= 0) terrainCrash = true;
    }
  }

  return { terrainCrash, terrainScraped };
}

export function stepPlayerFlight(
  state: PlayerFlightState,
  input: FlightInput,
  dt: number,
  mode: GameMode,
  difficulty: DifficultyMode = 'beginner',
): { terrainCrash: boolean; fuelDepleted: boolean; terrainScraped: boolean } {
  const clampedDt = Math.min(dt, 0.05);
  const diffCfg = DIFFICULTY_CONFIG[difficulty];

  tickPlayerCooldowns(state, clampedDt);
  reloadPlayerMissiles(state, clampedDt, diffCfg);

  // Trigger an evasive barrel-roll maneuver (also pops flares).
  if (input.maneuver && state.maneuverCooldown <= 0 && state.takeoffTimer <= 0) {
    state.maneuverTimer = 0.65;
    state.maneuverCooldown = 3.2;
    state.flaresCooldown = 1.5;
  }

  if (state.takeoffTimer > 0) {
    runTakeoffPhase(state, clampedDt);
    return { terrainCrash: false, fuelDepleted: false, terrainScraped: false };
  }

  const canBoost = updateThrottleAndSpeed(state, input, clampedDt);
  updatePlayerFuel(state, mode, canBoost, clampedDt);
  updateGunHeat(state, input, clampedDt);
  steerPlayer(state, input, clampedDt);
  enforceFlightBounds(state, clampedDt);
  const contact = checkTerrainContact(state, mode, diffCfg, clampedDt);

  return {
    terrainCrash: contact.terrainCrash,
    fuelDepleted: mode !== 'freeflight' && state.fuel <= 0,
    terrainScraped: contact.terrainScraped,
  };
}

// --- Target locking ---------------------------------------------------------

/**
 * Auto-target scoring: nearest wins, with a forward bias so the jet
 * prefers enemies roughly ahead, and stickiness so the lock does not
 * flicker between two equidistant targets.
 */
function scoreAutoTarget(
  enemy: EnemyUnitState,
  player: PlayerFlightState,
  fwd: Vec3,
  currentLockedId: number | null,
): number {
  const dx = enemy.pos.x - player.pos.x;
  const dy = enemy.pos.y - player.pos.y;
  const dz = enemy.pos.z - player.pos.z;
  const dist = Math.hypot(dx, dy, dz);
  const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
  const stickiness = enemy.id === currentLockedId ? 180 : 0;
  return -dist + dot * 120 + stickiness;
}

/** Picks the best auto-target: nearest in range, else nearest anywhere. */
function pickAutoTarget(
  player: PlayerFlightState,
  enemies: EnemyUnitState[],
  fwd: Vec3,
  currentLockedId: number | null,
): EnemyUnitState | null {
  let bestInRange: EnemyUnitState | null = null;
  let bestInRangeScore = -Infinity;
  let nearestAny: EnemyUnitState | null = null;
  let nearestAnyDist = Infinity;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = distanceBetween(enemy.pos, player.pos);
    if (dist < 4) continue;

    if (dist < nearestAnyDist) {
      nearestAnyDist = dist;
      nearestAny = enemy;
    }

    if (dist <= 2200) {
      const score = scoreAutoTarget(enemy, player, fwd, currentLockedId);
      if (score > bestInRangeScore) {
        bestInRangeScore = score;
        bestInRange = enemy;
      }
    }
  }

  return bestInRange ?? nearestAny;
}

/** Picks the best manual target inside the forward cone (~45° half-angle). */
function pickManualTarget(
  player: PlayerFlightState,
  enemies: EnemyUnitState[],
  fwd: Vec3,
  currentLockedId: number | null,
): EnemyUnitState | null {
  let bestEnemy: EnemyUnitState | null = null;
  let bestScore = -Infinity;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.pos.x - player.pos.x;
    const dy = enemy.pos.y - player.pos.y;
    const dz = enemy.pos.z - player.pos.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 1850 || dist < 8) continue;

    const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
    if (dot < 0.7) continue;

    const stickiness = enemy.id === currentLockedId ? 0.1 : 0;
    const score = dot - dist / 5500 + stickiness;
    if (score > bestScore) {
      bestScore = score;
      bestEnemy = enemy;
    }
  }

  return bestEnemy;
}

/**
 * Selects and locks onto enemy targets.
 * - When `autoTargetEnabled` is true: automatically selects the nearest
 *   active enemy (prioritizing reasonable targeting range up to 2200m,
 *   or nearest active fallback), switches immediately when the current
 *   target is destroyed, and automatically acquires missile lock without
 *   requiring manual boresight aiming.
 * - When `autoTargetEnabled` is false: uses forward-cone manual targeting.
 *
 * Lock progress accumulates while the same target stays selected and
 * restarts from the first frame's worth when the target changes.
 */
export function evaluateTargetLock(
  player: PlayerFlightState,
  enemies: EnemyUnitState[],
  currentLockedId: number | null,
  currentLockProgress: number,
  dt: number,
  difficulty: DifficultyMode = 'beginner',
  autoTargetEnabled = false,
): { lockedId: number | null; lockProgress: number; isLocked: boolean } {
  const fwd = getForwardVector(player.heading, player.pitch);
  const lockRate = DIFFICULTY_CONFIG[difficulty].lockRate;

  const bestEnemy = autoTargetEnabled
    ? pickAutoTarget(player, enemies, fwd, currentLockedId)
    : pickManualTarget(player, enemies, fwd, currentLockedId);

  if (!bestEnemy) {
    return { lockedId: null, lockProgress: 0, isLocked: false };
  }

  const nextProgress =
    bestEnemy.id === currentLockedId
      ? clamp(currentLockProgress + dt * lockRate, 0, 1)
      : clamp(dt * lockRate, 0, 1);

  return {
    lockedId: bestEnemy.id,
    lockProgress: nextProgress,
    isLocked: nextProgress >= 0.99,
  };
}

// --- Assisted pursuit -------------------------------------------------------

/**
 * How much pursuit assistance survives the player's own stick input:
 * full assist at rest, fading to zero once the stick is pushed hard.
 * Returns 0..1 (1 = full assist).
 */
function pursuitAssistWeight(input: FlightInput): number {
  const manualMag = clamp(
    Math.max(Math.abs(input.pitch), Math.abs(input.roll), Math.abs(input.yaw)),
    0,
    1,
  );
  return manualMag > 0.12 ? clamp(1 - (manualMag - 0.12) / 0.42, 0, 1) : 1;
}

/**
 * Scans the flight path ahead (65m / 130m / 210m) for terrain and
 * buildings and returns the lowest safe altitude plus a horizontal
 * nudge away from any building the jet is about to clip.
 */
function scanPursuitClearance(
  player: PlayerFlightState,
  obstacles: BuildingObstacle[],
): { minSafeY: number; avoidTurnBias: number } {
  const pFwd = getForwardVector(player.heading, player.pitch);
  let minSafeY = Math.max(OCEAN_LEVEL + 48, sampleTerrainHeight(player.pos.x, player.pos.z) + 48);
  let avoidTurnBias = 0;

  for (const lookDist of [65, 130, 210]) {
    const lx = player.pos.x + pFwd.x * lookDist;
    const lz = player.pos.z + pFwd.z * lookDist;
    minSafeY = Math.max(minSafeY, sampleTerrainHeight(lx, lz) + 52);

    for (const b of obstacles) {
      const bdx = lx - b.x;
      const bdz = lz - b.z;
      const clearanceW = b.halfW + 32;
      const clearanceD = b.halfD + 32;
      if (Math.abs(bdx) < clearanceW && Math.abs(bdz) < clearanceD && player.pos.y < b.topY + 46) {
        minSafeY = Math.max(minSafeY, b.topY + 46);
        // Gentle horizontal nudge away from the building centre.
        const rightX = Math.cos(player.heading);
        const rightZ = -Math.sin(player.heading);
        const sideDot = (player.pos.x - b.x) * rightX + (player.pos.z - b.z) * rightZ;
        avoidTurnBias += sideDot >= 0 ? -0.45 : 0.45;
      }
    }
  }

  return { minSafeY, avoidTurnBias };
}

/**
 * Smoothly steers the player's jet toward the auto-selected enemy while
 * respecting manual stick/keyboard override and avoiding terrain, ocean,
 * and skyscrapers.
 */
export function applyAssistedPursuit(
  player: PlayerFlightState,
  target: EnemyUnitState | null,
  input: FlightInput,
  obstacles: BuildingObstacle[],
  dt: number,
  enabled: boolean,
): void {
  if (!enabled || !target || !target.alive || player.takeoffTimer > 0 || player.maneuverTimer > 0) {
    return;
  }
  const clampedDt = Math.min(dt, 0.05);

  const assistWeight = pursuitAssistWeight(input);
  if (assistWeight <= 0.01) return;

  const dx = target.pos.x - player.pos.x;
  const dy = target.pos.y - player.pos.y;
  const dz = target.pos.z - player.pos.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 25) return;

  // Gentle predictive lead toward the enemy's path.
  const leadTime = clamp(dist / 450, 0.05, 0.75);
  const tFwd = getForwardVector(target.heading, target.pitch);
  let aimX = target.pos.x + tFwd.x * target.speed * leadTime;
  let aimY = target.pos.y + tFwd.y * target.speed * leadTime;
  let aimZ = target.pos.z + tFwd.z * target.speed * leadTime;

  const { minSafeY, avoidTurnBias } = scanPursuitClearance(player, obstacles);

  // Clamp pursuit altitude safely above terrain and skyscrapers.
  aimY = Math.max(aimY, minSafeY);

  const ax = aimX - player.pos.x;
  const ay = aimY - player.pos.y;
  const az = aimZ - player.pos.z;
  const aDist = Math.max(1, Math.hypot(ax, ay, az));

  const desiredHeading = Math.atan2(-ax, -az);
  let desiredPitch = clamp(Math.asin(clamp(ay / aDist, -0.88, 0.88)), -0.62, 0.68);
  if (player.pos.y < minSafeY) {
    // Force a gentle climb if below the safe clearance envelope.
    desiredPitch = Math.max(desiredPitch, clamp((minSafeY - player.pos.y) * 0.02 + 0.22, 0.22, 0.55));
  }

  const headingDiff = normalizeAngle(desiredHeading - player.heading);
  const maxTurnStep = 1.08 * assistWeight * clampedDt;
  const turnStep = clamp(headingDiff + avoidTurnBias * clampedDt, -maxTurnStep, maxTurnStep);
  player.heading = normalizeAngle(player.heading + turnStep);

  const pitchDiff = desiredPitch - player.pitch;
  const maxPitchStep = 0.85 * assistWeight * clampedDt;
  player.pitch = clamp(player.pitch + clamp(pitchDiff, -maxPitchStep, maxPitchStep), -1.15, 1.15);

  // Subtle coordinated roll into the turn when the stick is idle.
  if (Math.abs(input.roll) <= 0.08) {
    const targetBank = clamp(-headingDiff * 0.85, -0.75, 0.75) * assistWeight;
    player.bank = damp(player.bank, targetBank, 2.8, clampedDt);
  }
}

// --- Aim assist -------------------------------------------------------------

export interface AimAssistSolution {
  targetId: number;
  interceptPos: Vec3;
  aimDir: Vec3;
  distance: number;
}

/**
 * Computes predicted lead intercept point and soft gimbal aim vector
 * for the best enemy inside the forward gun envelope.
 *
 * The preferred (locked) target gets a slightly wider acceptance cone
 * and a scoring bonus; the returned aim direction blends the player's
 * boresight toward the exact lead vector by the difficulty's assist
 * strength, so Beginner feels guided and Ace feels nearly manual.
 */
export function computeAimAssistLead(
  player: PlayerFlightState,
  enemies: EnemyUnitState[],
  preferredEnemyId: number | null,
  bulletSpeed: number,
  difficulty: DifficultyMode = 'beginner',
): AimAssistSolution | null {
  const fwd = getForwardVector(player.heading, player.pitch);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  let bestEnemy: EnemyUnitState | null = null;
  let bestScore = -Infinity;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.pos.x - player.pos.x;
    const dy = enemy.pos.y - player.pos.y;
    const dz = enemy.pos.z - player.pos.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 1150 || dist < 12) continue;

    const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
    const minDot = enemy.id === preferredEnemyId ? Math.min(cfg.aimAssistDot, 0.78) : cfg.aimAssistDot;
    if (dot < minDot) continue;

    const pref = enemy.id === preferredEnemyId ? 0.14 : 0;
    const score = dot - dist / 4500 + pref;
    if (score > bestScore) {
      bestScore = score;
      bestEnemy = enemy;
    }
  }

  if (!bestEnemy) return null;

  const rawDist = distanceBetween(bestEnemy.pos, player.pos);
  const flightTime = clamp(rawDist / bulletSpeed, 0.02, 1.4);
  const eFwd = getForwardVector(bestEnemy.heading, bestEnemy.pitch);
  const ix = bestEnemy.pos.x + eFwd.x * bestEnemy.speed * flightTime;
  const iy = bestEnemy.pos.y + eFwd.y * bestEnemy.speed * flightTime;
  const iz = bestEnemy.pos.z + eFwd.z * bestEnemy.speed * flightTime;

  const toIx = ix - player.pos.x;
  const toIy = iy - player.pos.y;
  const toIz = iz - player.pos.z;
  const len = Math.max(1, Math.hypot(toIx, toIy, toIz));
  const dirX = toIx / len;
  const dirY = toIy / len;
  const dirZ = toIz / len;

  // Blend boresight toward the exact lead vector by assist strength.
  const bx = lerp(fwd.x, dirX, cfg.aimAssistStrength);
  const by = lerp(fwd.y, dirY, cfg.aimAssistStrength);
  const bz = lerp(fwd.z, dirZ, cfg.aimAssistStrength);
  const bLen = Math.max(1e-5, Math.hypot(bx, by, bz));

  return {
    targetId: bestEnemy.id,
    interceptPos: { x: ix, y: iy, z: iz },
    aimDir: { x: bx / bLen, y: by / bLen, z: bz / bLen },
    distance: Math.round(rawDist),
  };
}

// --- Enemy stats ------------------------------------------------------------

export function getEnemyMaxHealth(archetype: EnemyArchetype): number {
  switch (archetype) {
    case 'interceptor':
      return 60;
    case 'flanker':
      return 90;
    case 'gunship':
      return 160;
  }
}

export function getEnemyScoreValue(archetype: EnemyArchetype): number {
  switch (archetype) {
    case 'interceptor':
      return 250;
    case 'flanker':
      return 400;
    case 'gunship':
      return 750;
  }
}

// --- Enemy AI ---------------------------------------------------------------

interface EnemySteeringGoal {
  targetX: number;
  targetY: number;
  targetZ: number;
  desiredSpeed: number;
  turnRate: number;
}

/**
 * A destroyed enemy spins down toward the ground; on contact with
 * terrain or ocean it detonates immediately (`dyingTimer = 0`).
 */
function stepDyingEnemy(enemy: EnemyUnitState, dt: number): void {
  enemy.dyingTimer = Math.max(0, enemy.dyingTimer - dt);
  enemy.bank += dt * 7.5;
  enemy.pitch = clamp(enemy.pitch - dt * 0.8, -1.2, 0.2);
  const fwd = getForwardVector(enemy.heading, enemy.pitch);
  enemy.pos.x += fwd.x * enemy.speed * 0.85 * dt;
  enemy.pos.y += fwd.y * enemy.speed * 0.85 * dt;
  enemy.pos.z += fwd.z * enemy.speed * 0.85 * dt;
  const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(enemy.pos.x, enemy.pos.z));
  if (enemy.pos.y <= groundY + 4) {
    enemy.pos.y = groundY + 4;
    enemy.dyingTimer = 0;
  }
}

/**
 * Distinct movement & engagement policies for the three archetypes:
 * - Interceptor: fast pursuit chaser, aiming slightly ahead of the
 *   player when closing, breaking off into a climb after a close pass.
 * - Flanker: high-speed lateral orbiter, holding a ~360m offset circle
 *   and swooping inward periodically.
 * - Gunship: heavy armoured patrol craft on a figure-8 sweep, closing
 *   toward the player only once within 950m.
 */
function pickArchetypeGoal(
  enemy: EnemyUnitState,
  player: PlayerFlightState,
  timeElapsed: number,
  distToPlayer: number,
): EnemySteeringGoal {
  if (enemy.archetype === 'interceptor') {
    if (distToPlayer < 130) {
      // Breakaway climb after a pass.
      return {
        targetX: enemy.pos.x + Math.sin(enemy.aiPhaseOffset + timeElapsed * 0.6) * 450,
        targetY: Math.max(160, player.pos.y + 90),
        targetZ: enemy.pos.z + Math.cos(enemy.aiPhaseOffset + timeElapsed * 0.6) * 450,
        desiredSpeed: distToPlayer > 400 ? 132 : 108,
        turnRate: 1.45,
      };
    }
    // Pursue a point slightly ahead of the player.
    const playerFwd = getForwardVector(player.heading, player.pitch);
    return {
      targetX: player.pos.x + playerFwd.x * 35,
      targetY: player.pos.y + playerFwd.y * 35,
      targetZ: player.pos.z + playerFwd.z * 35,
      desiredSpeed: distToPlayer > 400 ? 132 : 108,
      turnRate: 1.45,
    };
  }

  if (enemy.archetype === 'flanker') {
    const orbitAngle = timeElapsed * 0.55 + enemy.aiPhaseOffset;
    const orbitRadius = 260 + Math.sin(timeElapsed * 0.9 + enemy.aiPhaseOffset) * 140;
    return {
      targetX: player.pos.x + Math.cos(orbitAngle) * orbitRadius,
      targetY: clamp(player.pos.y + Math.sin(orbitAngle * 1.3) * 75, 85, 380),
      targetZ: player.pos.z + Math.sin(orbitAngle) * orbitRadius,
      desiredSpeed: 124,
      turnRate: 1.3,
    };
  }

  // Gunship.
  const t = timeElapsed * 0.25 + enemy.aiPhaseOffset;
  if (distToPlayer > 750) {
    return {
      targetX: player.pos.x + Math.cos(t) * 240,
      targetY: clamp(player.pos.y + 40, 140, 340),
      targetZ: player.pos.z + Math.sin(t) * 240,
      desiredSpeed: 82,
      turnRate: 0.65,
    };
  }
  return {
    targetX: Math.sin(t) * 650,
    targetY: 185 + Math.cos(t) * 45,
    targetZ: Math.sin(t * 2) * 420,
    desiredSpeed: 82,
    turnRate: 0.65,
  };
}

/**
 * Reactive evasive jink + corkscrew climb/dive when under fire.
 * Gunships are too heavy to jink, so they ignore this override.
 */
function applyEvadeOverride(
  enemy: EnemyUnitState,
  timeElapsed: number,
): EnemySteeringGoal {
  const jinkSign = Math.sin(timeElapsed * 5.2 + enemy.aiPhaseOffset) >= 0 ? 1 : -1;
  const rx = Math.cos(enemy.heading) * jinkSign;
  const rz = -Math.sin(enemy.heading) * jinkSign;
  return {
    targetX: enemy.pos.x + rx * 280,
    targetY: clamp(enemy.pos.y + Math.cos(timeElapsed * 4.2 + enemy.aiPhaseOffset) * 110, 95, 420),
    targetZ: enemy.pos.z + rz * 280,
    desiredSpeed: 148,
    turnRate: 2.05,
  };
}

export function stepEnemyAI(
  enemy: EnemyUnitState,
  player: PlayerFlightState,
  timeElapsed: number,
  dt: number,
  hasAttackToken: boolean,
): { wantsToFire: boolean; fireSpread: number } {
  const clampedDt = Math.min(dt, 0.05);

  if (enemy.hitFlashTimer > 0) {
    enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - clampedDt);
  }

  if (!enemy.alive) {
    stepDyingEnemy(enemy, clampedDt);
    return { wantsToFire: false, fireSpread: 0 };
  }

  if (enemy.evadeTimer > 0) {
    enemy.evadeTimer = Math.max(0, enemy.evadeTimer - clampedDt);
  }

  const dx = player.pos.x - enemy.pos.x;
  const dy = player.pos.y - enemy.pos.y;
  const dz = player.pos.z - enemy.pos.z;
  const distToPlayer = Math.hypot(dx, dy, dz);

  let goal = pickArchetypeGoal(enemy, player, timeElapsed, distToPlayer);
  if (enemy.evadeTimer > 0 && enemy.archetype !== 'gunship') {
    goal = applyEvadeOverride(enemy, timeElapsed);
  }

  // Steer toward the goal point: limited turn rate on heading, damped
  // pitch, and a bank that leans into the turn (or corkscrews while
  // evading), then advance along the forward vector.
  const tx = goal.targetX - enemy.pos.x;
  const ty = goal.targetY - enemy.pos.y;
  const tz = goal.targetZ - enemy.pos.z;
  const tDist = Math.max(1, Math.hypot(tx, ty, tz));

  const desiredHeading = Math.atan2(-tx, -tz);
  const desiredPitch = clamp(Math.asin(clamp(ty / tDist, -0.95, 0.95)), -0.75, 0.75);

  const headingDiff = normalizeAngle(desiredHeading - enemy.heading);
  const maxTurn = goal.turnRate * clampedDt;
  enemy.heading = normalizeAngle(enemy.heading + clamp(headingDiff, -maxTurn, maxTurn));
  enemy.pitch = damp(enemy.pitch, desiredPitch, 2.5, clampedDt);
  const desiredBank =
    enemy.evadeTimer > 0 && enemy.archetype !== 'gunship'
      ? Math.sin(timeElapsed * 7.5 + enemy.aiPhaseOffset) * 1.25
      : clamp(-headingDiff * 1.6, -1.15, 1.15);
  enemy.bank = damp(enemy.bank, desiredBank, 4.5, clampedDt);
  enemy.speed = damp(enemy.speed, goal.desiredSpeed, 2.2, clampedDt);

  const fwd = getForwardVector(enemy.heading, enemy.pitch);
  enemy.pos.x += fwd.x * enemy.speed * clampedDt;
  enemy.pos.y += fwd.y * enemy.speed * clampedDt;
  enemy.pos.z += fwd.z * enemy.speed * clampedDt;

  // Keep enemies safely above terrain and mountains, below the ceiling.
  const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(enemy.pos.x, enemy.pos.z));
  if (enemy.pos.y < groundY + 45) {
    enemy.pos.y = groundY + 45;
    enemy.pitch = Math.max(0.15, enemy.pitch);
  }
  if (enemy.pos.y > MAX_FLIGHT_ALTITUDE - 60) {
    enemy.pos.y = MAX_FLIGHT_ALTITUDE - 60;
  }

  // Attack decision, gated by the token pool, range and alignment.
  // A short telegraph delay gives the player a fair evasion window.
  if (enemy.fireCooldown > 0) {
    enemy.fireCooldown = Math.max(0, enemy.fireCooldown - clampedDt);
  }

  const dotToPlayer = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / Math.max(1, distToPlayer);
  const canEngage =
    hasAttackToken &&
    distToPlayer < (enemy.archetype === 'gunship' ? 780 : 620) &&
    dotToPlayer > (enemy.archetype === 'gunship' ? 0.55 : 0.78);

  let wantsToFire = false;
  if (canEngage && enemy.fireCooldown <= 0) {
    if (enemy.telegraphTimer <= 0) {
      enemy.telegraphTimer = enemy.archetype === 'gunship' ? 0.55 : 0.35;
    } else {
      enemy.telegraphTimer -= clampedDt;
      if (enemy.telegraphTimer <= 0) {
        wantsToFire = true;
        enemy.fireCooldown =
          enemy.archetype === 'interceptor' ? 2.4 : enemy.archetype === 'flanker' ? 2.1 : 1.75;
      }
    }
  } else {
    enemy.telegraphTimer = 0;
  }

  return {
    wantsToFire,
    fireSpread: enemy.archetype === 'gunship' ? 0.045 : 0.025,
  };
}

// --- World pickups ----------------------------------------------------------

/** Fixed checkpoint anchors, cycled if a mission asks for more than eight. */
const CHECKPOINT_ANCHORS: Vec3[] = [
  { x: 0, y: 125, z: -340 },
  { x: -240, y: 155, z: -560 },
  { x: -560, y: 240, z: -640 },
  { x: -120, y: 170, z: -780 },
  { x: 420, y: 190, z: -520 },
  { x: 760, y: 235, z: -320 },
  { x: 520, y: 175, z: 420 },
  { x: -320, y: 155, z: 620 },
];

export function generateCheckpoints(count: number): CheckpointState[] {
  const result: CheckpointState[] = [];
  for (let i = 0; i < count; i++) {
    const base = CHECKPOINT_ANCHORS[i % CHECKPOINT_ANCHORS.length];
    result.push({
      id: i + 1,
      pos: { ...base },
      radius: 56,
      collected: false,
      order: i + 1,
    });
  }
  return result;
}

/** Fixed collectible placements: stars, fuel, repairs and missile packs. */
const COLLECTIBLE_PLACEMENTS: Array<{ kind: CollectibleState['kind']; pos: Vec3 }> = [
  { kind: 'star', pos: { x: 0, y: 110, z: -220 } },
  { kind: 'fuel', pos: { x: -320, y: 140, z: -420 } },
  { kind: 'repair', pos: { x: -720, y: 270, z: -620 } },
  { kind: 'missile', pos: { x: 420, y: 160, z: -320 } },
  { kind: 'star', pos: { x: 840, y: 240, z: -260 } },
  { kind: 'fuel', pos: { x: 480, y: 150, z: 540 } },
  { kind: 'repair', pos: { x: -340, y: 145, z: 620 } },
  { kind: 'missile', pos: { x: -180, y: 120, z: 220 } },
];

export function generateCollectibles(): CollectibleState[] {
  return COLLECTIBLE_PLACEMENTS.map((item, idx) => ({
    id: idx + 1,
    kind: item.kind,
    pos: { ...item.pos },
    radius: 22,
    collected: false,
    bobPhase: idx * 0.9,
  }));
}

// --- Collisions -------------------------------------------------------------

export function checkSphereCollision(a: Vec3, b: Vec3, radiusSum: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz <= radiusSum * radiusSum;
}

/**
 * Continuous swept segment-to-sphere collision check to prevent
 * high-velocity machine gun bullets or missiles from tunneling through
 * aircraft between frames. Falls back to a point check for a
 * zero-length segment.
 */
export function checkSegmentSphereCollision(
  p0: Vec3,
  p1: Vec3,
  center: Vec3,
  radiusSum: number,
): boolean {
  const abx = p1.x - p0.x;
  const aby = p1.y - p0.y;
  const abz = p1.z - p0.z;
  const abLenSq = abx * abx + aby * aby + abz * abz;
  if (abLenSq <= 1e-8) {
    return checkSphereCollision(p0, center, radiusSum);
  }
  const acx = center.x - p0.x;
  const acy = center.y - p0.y;
  const acz = center.z - p0.z;
  const t = clamp((acx * abx + acy * aby + acz * abz) / abLenSq, 0, 1);
  const closestX = p0.x + abx * t;
  const closestY = p0.y + aby * t;
  const closestZ = p0.z + abz * t;
  const dx = closestX - center.x;
  const dy = closestY - center.y;
  const dz = closestZ - center.z;
  return dx * dx + dy * dy + dz * dz <= radiusSum * radiusSum;
}

export function checkPlayerBuildingCollision(
  pos: Vec3,
  obstacles: Array<{ x: number; z: number; halfW: number; halfD: number; topY: number }>,
  jetRadius = 4.2,
): { x: number; z: number; halfW: number; halfD: number; topY: number } | null {
  for (const b of obstacles) {
    if (
      pos.y < b.topY + jetRadius * 0.5 &&
      Math.abs(pos.x - b.x) < b.halfW + jetRadius &&
      Math.abs(pos.z - b.z) < b.halfD + jetRadius
    ) {
      return b;
    }
  }
  return null;
}

// --- Scoring ----------------------------------------------------------------

/**
 * Mission rank from the end-of-mission report. A defeat is always C.
 * Otherwise one point each for good health (>=70 gives 2, >=40 gives 1),
 * accuracy >= 35% and at least 4 kills: 4 points is S, 3 is A, 1–2 is B.
 */
export function computeMissionRank(
  outcome: 'victory' | 'defeat',
  accuracyPct: number,
  healthRemaining: number,
  kills: number,
): 'S' | 'A' | 'B' | 'C' {
  if (outcome === 'defeat') return 'C';
  const score =
    (healthRemaining >= 70 ? 2 : healthRemaining >= 40 ? 1 : 0) +
    (accuracyPct >= 35 ? 1 : 0) +
    (kills >= 4 ? 1 : 0);
  if (score >= 4) return 'S';
  if (score >= 3) return 'A';
  if (score >= 1) return 'B';
  return 'C';
}

// --- Camera -----------------------------------------------------------------

/**
 * Pushes a desired camera position out of terrain and buildings.
 * Five samples along the ray from the anchor to the desired camera
 * guarantee clearance: if a sample would sit inside the ground or a
 * rooftop, the camera is either lifted above it (small lift) or
 * pulled back toward the anchor (large lift).
 */
export function resolveSafeCameraPosition(
  anchor: Vec3,
  desiredCam: Vec3,
  obstacles: Array<{ x: number; z: number; halfW: number; halfD: number; topY: number }>,
): Vec3 {
  let outX = desiredCam.x;
  let outY = desiredCam.y;
  let outZ = desiredCam.z;

  for (let s = 1; s <= 5; s++) {
    const t = s / 5;
    const px = lerp(anchor.x, outX, t);
    const pz = lerp(anchor.z, outZ, t);
    const py = lerp(anchor.y, outY, t);

    const groundMin = Math.max(OCEAN_LEVEL + 3.5, sampleTerrainHeight(px, pz) + 4.5);
    if (py < groundMin && t > 0.4) {
      outY = Math.max(outY, groundMin + 1.5);
    }

    for (const b of obstacles) {
      if (
        Math.abs(px - b.x) < b.halfW + 4.5 &&
        Math.abs(pz - b.z) < b.halfD + 4.5 &&
        py < b.topY + 4.5
      ) {
        // Pull the camera slightly closer, or lift it above the rooftop.
        if (b.topY + 6 - outY < 28) {
          outY = Math.max(outY, b.topY + 6);
        } else {
          const pull = Math.max(0.32, t - 0.16);
          outX = lerp(anchor.x, desiredCam.x, pull);
          outZ = lerp(anchor.z, desiredCam.z, pull);
        }
      }
    }
  }

  return { x: outX, y: outY, z: outZ };
}
