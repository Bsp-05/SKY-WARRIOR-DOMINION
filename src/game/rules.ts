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

export const WORLD_RADIUS = 2400;
export const OCEAN_LEVEL = 0;
export const MIN_FLIGHT_ALTITUDE = 8;
export const MAX_FLIGHT_ALTITUDE = 780;

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

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function normalizeAngle(rad: number): number {
  let a = rad;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/**
 * Deterministic multi-island + volcanic mountain height function shared
 * between the 3D terrain mesh and flight collision physics.
 */
export function sampleTerrainHeight(x: number, z: number): number {
  // Flat runway plateau around (-60..60, -140..140) on the main Citadel Island
  const runwayDistX = Math.max(0, Math.abs(x) - 55);
  const runwayDistZ = Math.max(0, Math.abs(z - 40) - 190);
  const runwayFlatFactor = Math.exp(-(runwayDistX * runwayDistX + runwayDistZ * runwayDistZ) / 9500);

  // Island 1: Central Citadel & Airbase Island around (0, 0)
  const dCenter = Math.hypot(x, z);
  const island1 = Math.max(0, 1 - dCenter / 560);

  // Island 2: Volcanic Peak North-West (-820, -680)
  const dVolcano = Math.hypot(x + 820, z + 680);
  const volcanoBase = Math.max(0, 1 - dVolcano / 520);
  const volcanoPeak = Math.pow(volcanoBase, 1.55) * 265;

  // Island 3: Twin Spires East (860, -360)
  const dEast = Math.hypot(x - 860, z + 360);
  const eastBase = Math.max(0, 1 - dEast / 440);
  const eastPeak = Math.pow(eastBase, 1.45) * 195;

  // Island 4: Southern Atoll Ridge (-460, 880)
  const dSouth = Math.hypot(x + 460, z - 880);
  const southBase = Math.max(0, 1 - dSouth / 460);
  const southPeak = Math.pow(southBase, 1.5) * 165;

  // Island 5: Distant Canyon Massif (780, 760)
  const dSE = Math.hypot(x - 780, z - 760);
  const seBase = Math.max(0, 1 - dSE / 480);
  const sePeak = Math.pow(seBase, 1.6) * 215;

  // Organic multi-octave ridges
  const ridge1 = Math.sin(x * 0.0085 + 0.4) * Math.cos(z * 0.0078 - 0.3) * 22;
  const ridge2 = Math.sin(x * 0.021 - z * 0.017) * 11;
  const ridge3 = Math.cos(x * 0.043 + z * 0.039) * 4.5;

  const island1Height = Math.pow(island1, 1.35) * 32;
  const landMask = Math.max(island1, volcanoBase, eastBase, southBase, seBase);

  let h =
    -14 +
    island1Height +
    volcanoPeak +
    eastPeak +
    southPeak +
    sePeak +
    (ridge1 + ridge2 + ridge3) * Math.min(1, landMask * 2.2);

  // Carve smooth crater at top of NW Volcano
  if (dVolcano < 95) {
    const craterFactor = 1 - dVolcano / 95;
    h -= craterFactor * craterFactor * 52;
  }

  // Keep central runway & city plateau level at y = 14
  if (runwayFlatFactor > 0.02) {
    h = lerp(h, 14, clamp(runwayFlatFactor * 1.15, 0, 1));
  }

  return h;
}

export function getForwardVector(heading: number, pitch: number, out: Vec3 = { x: 0, y: 0, z: 0 }): Vec3 {
  const cosP = Math.cos(pitch);
  out.x = -Math.sin(heading) * cosP;
  out.y = Math.sin(pitch);
  out.z = -Math.cos(heading) * cosP;
  return out;
}

export function createInitialPlayerState(
  skipTakeoff = false,
  difficulty: DifficultyMode = 'beginner'
): PlayerFlightState {
  const maxMissiles = DIFFICULTY_CONFIG[difficulty].maxMissiles;
  if (skipTakeoff) {
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
  return {
    pos: { x: 0, y: 18.2, z: 210 },
    heading: 0,
    pitch: 0.01,
    bank: 0,
    speed: 48,
    throttle: 0.85,
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
    afterburnerActive: true,
    takeoffTimer: 2.6,
    collisionCooldown: 0,
  };
}

export function stepPlayerFlight(
  state: PlayerFlightState,
  input: FlightInput,
  dt: number,
  mode: GameMode,
  difficulty: DifficultyMode = 'beginner'
): { terrainCrash: boolean; fuelDepleted: boolean; terrainScraped: boolean } {
  const clampedDt = Math.min(dt, 0.05);
  const diffCfg = DIFFICULTY_CONFIG[difficulty];

  // Cooldowns & regeneration
  if (state.flaresCooldown > 0) state.flaresCooldown = Math.max(0, state.flaresCooldown - clampedDt);
  if (state.maneuverCooldown > 0) state.maneuverCooldown = Math.max(0, state.maneuverCooldown - clampedDt);
  if (state.maneuverTimer > 0) state.maneuverTimer = Math.max(0, state.maneuverTimer - clampedDt);
  if (state.collisionCooldown > 0) state.collisionCooldown = Math.max(0, state.collisionCooldown - clampedDt);

  if (state.missiles < state.maxMissiles) {
    state.missileReloadTimer += clampedDt;
    if (state.missileReloadTimer >= diffCfg.missileReloadSec) {
      state.missiles += 1;
      state.missileReloadTimer = 0;
    }
  } else {
    state.missileReloadTimer = 0;
  }

  // Trigger evasive barrel roll maneuver
  if (input.maneuver && state.maneuverCooldown <= 0 && state.takeoffTimer <= 0) {
    state.maneuverTimer = 0.65;
    state.maneuverCooldown = 3.2;
    state.flaresCooldown = 1.5;
  }

  // Runway cinematic takeoff phase (first 2.6s when launching from main menu)
  if (state.takeoffTimer > 0) {
    state.takeoffTimer = Math.max(0, state.takeoffTimer - clampedDt);
    const progress = 1 - state.takeoffTimer / 2.6;
    state.speed = lerp(55, 148, progress);
    state.afterburnerActive = true;
    // Rotate nose up after halfway down the runway
    const targetPitch = progress > 0.35 ? lerp(0.01, 0.24, (progress - 0.35) / 0.65) : 0.01;
    state.pitch = damp(state.pitch, targetPitch, 5.5, clampedDt);
    state.bank = damp(state.bank, 0, 6, clampedDt);

    const fwd = getForwardVector(state.heading, state.pitch);
    state.pos.x += fwd.x * state.speed * clampedDt;
    state.pos.y += fwd.y * state.speed * clampedDt;
    state.pos.z += fwd.z * state.speed * clampedDt;
    state.pos.y = Math.max(state.pos.y, 18.2);
    return { terrainCrash: false, fuelDepleted: false, terrainScraped: false };
  }

  // Throttle & Afterburner Boost
  state.throttle = clamp(state.throttle + input.throttleDelta * clampedDt * 0.65, 0.25, 1.0);
  const canBoost = state.fuel > 2 && input.boost;
  state.afterburnerActive = canBoost;

  const baseTargetSpeed = lerp(75, 175, state.throttle);
  const targetSpeed = canBoost ? 245 : baseTargetSpeed;
  // Pitch affects airspeed slightly (diving speeds up, climbing slows slightly)
  const pitchGravityFactor = -Math.sin(state.pitch) * 26;
  state.speed = damp(state.speed, clamp(targetSpeed + pitchGravityFactor, 60, 275), 2.8, clampedDt);

  // Fuel consumption (Free Flight slowly regenerates fuel so exploration never ends abruptly)
  if (mode === 'freeflight') {
    state.fuel = clamp(state.fuel + (canBoost ? -1.5 : 3.5) * clampedDt, 15, state.maxFuel);
  } else {
    const burnRate = canBoost ? 2.8 : 0.32 + state.throttle * 0.45;
    state.fuel = Math.max(0, state.fuel - burnRate * clampedDt);
  }

  // Gun heat management
  if (input.fireGun) {
    state.gunHeat = clamp(state.gunHeat + clampedDt * 0.36, 0, 1);
  } else {
    state.gunHeat = clamp(state.gunHeat - clampedDt * 0.45, 0, 1);
  }

  // Smooth aerodynamic angular control
  const pitchRate = 1.45;
  const rollRate = 2.65;
  const yawRate = 0.85;

  state.pitch = clamp(state.pitch + input.pitch * pitchRate * clampedDt, -1.18, 1.18);

  if (state.maneuverTimer > 0) {
    // High-speed barrel roll
    state.bank = normalizeAngle(state.bank + Math.PI * 3.1 * clampedDt);
  } else if (Math.abs(input.roll) > 0.02) {
    state.bank = clamp(state.bank - input.roll * rollRate * clampedDt, -1.35, 1.35);
  } else {
    // Gentle self-leveling stability assist when stick is released
    state.bank = damp(state.bank, 0, 2.2, clampedDt);
  }

  // Coordinated turn: banking smoothly induces heading change + direct rudder yaw
  const bankTurn = Math.sin(state.bank) * 0.92;
  state.heading = normalizeAngle(state.heading + (bankTurn + -input.yaw * yawRate) * clampedDt);

  // Advance world position along forward vector
  const fwd = getForwardVector(state.heading, state.pitch);
  state.pos.x += fwd.x * state.speed * clampedDt;
  state.pos.y += fwd.y * state.speed * clampedDt;
  state.pos.z += fwd.z * state.speed * clampedDt;

  // Soft ceiling boundary
  if (state.pos.y > MAX_FLIGHT_ALTITUDE) {
    state.pos.y = MAX_FLIGHT_ALTITUDE;
    if (state.pitch > 0) state.pitch = damp(state.pitch, 0, 4, clampedDt);
  }

  // Soft outer perimeter turn-back (prevents flying off into empty void)
  const distFromOrigin = Math.hypot(state.pos.x, state.pos.z);
  if (distFromOrigin > WORLD_RADIUS - 180) {
    const angleToCenter = Math.atan2(state.pos.x, state.pos.z);
    const diff = normalizeAngle(angleToCenter - state.heading);
    state.heading = normalizeAngle(state.heading + diff * clampedDt * 1.8);
    state.pos.x = (state.pos.x / distFromOrigin) * Math.min(distFromOrigin, WORLD_RADIUS);
    state.pos.z = (state.pos.z / distFromOrigin) * Math.min(distFromOrigin, WORLD_RADIUS);
  }

  // Safe Terrain / Ocean clearance check (never instant-crashes unfairly; bounces gently with cooldown)
  const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(state.pos.x, state.pos.z));
  let terrainCrash = false;
  let terrainScraped = false;
  if (state.pos.y < groundY + 5.5) {
    state.pos.y = groundY + 11.5;
    state.pitch = Math.max(0.24, state.pitch);
    state.bank = damp(state.bank, 0, 5, clampedDt);
    if (mode !== 'freeflight' && state.collisionCooldown <= 0) {
      state.collisionCooldown = 1.4;
      state.health = Math.max(0, state.health - diffCfg.scrapeDmg);
      terrainScraped = true;
      if (state.health <= 0) terrainCrash = true;
    }
  }

  return {
    terrainCrash,
    fuelDepleted: mode !== 'freeflight' && state.fuel <= 0,
    terrainScraped,
  };
}

/**
 * Selects and locks onto enemy targets.
 * - When `autoTargetEnabled` is true: automatically selects the nearest active enemy
 *   (prioritizing reasonable targeting range up to 2200m, or nearest active fallback),
 *   switches immediately when the current target is destroyed, and automatically acquires
 *   missile lock without requiring manual boresight aiming.
 * - When `autoTargetEnabled` is false: uses forward-cone manual targeting.
 */
export function evaluateTargetLock(
  player: PlayerFlightState,
  enemies: EnemyUnitState[],
  currentLockedId: number | null,
  currentLockProgress: number,
  dt: number,
  difficulty: DifficultyMode = 'beginner',
  autoTargetEnabled = false
): { lockedId: number | null; lockProgress: number; isLocked: boolean } {
  const fwd = getForwardVector(player.heading, player.pitch);
  const lockRate = DIFFICULTY_CONFIG[difficulty].lockRate;
  let bestEnemy: EnemyUnitState | null = null;
  let bestScore = -Infinity;

  if (autoTargetEnabled) {
    let bestInRange: EnemyUnitState | null = null;
    let bestInRangeScore = -Infinity;
    let nearestAny: EnemyUnitState | null = null;
    let nearestAnyDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.pos.x - player.pos.x;
      const dy = enemy.pos.y - player.pos.y;
      const dz = enemy.pos.z - player.pos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 4) continue;

      if (dist < nearestAnyDist) {
        nearestAnyDist = dist;
        nearestAny = enemy;
      }

      if (dist <= 2200) {
        // Favor nearest active hostile; small forward bias & stickiness prevent target flicker
        const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
        const stickiness = enemy.id === currentLockedId ? 180 : 0;
        const forwardBonus = dot * 120;
        const score = -dist + forwardBonus + stickiness;
        if (score > bestInRangeScore) {
          bestInRangeScore = score;
          bestInRange = enemy;
        }
      }
    }

    bestEnemy = bestInRange ?? nearestAny;
  } else {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.pos.x - player.pos.x;
      const dy = enemy.pos.y - player.pos.y;
      const dz = enemy.pos.z - player.pos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 1850 || dist < 8) continue;

      const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
      if (dot < 0.70) continue; // ~45 deg wide half-cone for reliable tracking

      const stickiness = enemy.id === currentLockedId ? 0.1 : 0;
      const score = dot - dist / 5500 + stickiness;
      if (score > bestScore) {
        bestScore = score;
        bestEnemy = enemy;
      }
    }
  }

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

/**
 * Smoothly steers the player's jet toward the auto-selected enemy while respecting
 * manual stick/keyboard override and avoiding terrain, ocean, and skyscrapers.
 */
export function applyAssistedPursuit(
  player: PlayerFlightState,
  target: EnemyUnitState | null,
  input: FlightInput,
  obstacles: BuildingObstacle[],
  dt: number,
  enabled: boolean
): void {
  if (!enabled || !target || !target.alive || player.takeoffTimer > 0 || player.maneuverTimer > 0) {
    return;
  }
  const clampedDt = Math.min(dt, 0.05);

  // Manual joystick / keyboard steering smoothly overrides pursuit assistance
  const manualMag = clamp(
    Math.max(Math.abs(input.pitch), Math.abs(input.roll), Math.abs(input.yaw)),
    0,
    1
  );
  const assistWeight = manualMag > 0.12 ? clamp(1 - (manualMag - 0.12) / 0.42, 0, 1) : 1;
  if (assistWeight <= 0.01) return;

  const dx = target.pos.x - player.pos.x;
  const dy = target.pos.y - player.pos.y;
  const dz = target.pos.z - player.pos.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 25) return;

  // Gentle predictive lead toward enemy path
  const leadTime = clamp(dist / 450, 0.05, 0.75);
  const tFwd = getForwardVector(target.heading, target.pitch);
  let aimX = target.pos.x + tFwd.x * target.speed * leadTime;
  let aimY = target.pos.y + tFwd.y * target.speed * leadTime;
  let aimZ = target.pos.z + tFwd.z * target.speed * leadTime;

  // Terrain & Building clearance lookahead along current + target flight path
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
        // Gentle horizontal nudge away from building center
        const rightX = Math.cos(player.heading);
        const rightZ = -Math.sin(player.heading);
        const sideDot = (player.pos.x - b.x) * rightX + (player.pos.z - b.z) * rightZ;
        avoidTurnBias += sideDot >= 0 ? -0.45 : 0.45;
      }
    }
  }

  // Clamp pursuit altitude safely above terrain & skyscrapers
  aimY = Math.max(aimY, minSafeY);

  const ax = aimX - player.pos.x;
  const ay = aimY - player.pos.y;
  const az = aimZ - player.pos.z;
  const aDist = Math.max(1, Math.hypot(ax, ay, az));

  const desiredHeading = Math.atan2(-ax, -az);
  let desiredPitch = clamp(Math.asin(clamp(ay / aDist, -0.88, 0.88)), -0.62, 0.68);
  if (player.pos.y < minSafeY) {
    // Force gentle climb if below safe clearance envelope
    desiredPitch = Math.max(desiredPitch, clamp((minSafeY - player.pos.y) * 0.02 + 0.22, 0.22, 0.55));
  }

  const headingDiff = normalizeAngle(desiredHeading - player.heading);
  const maxTurnStep = 1.08 * assistWeight * clampedDt;
  const turnStep = clamp(headingDiff + avoidTurnBias * clampedDt, -maxTurnStep, maxTurnStep);
  player.heading = normalizeAngle(player.heading + turnStep);

  const pitchDiff = desiredPitch - player.pitch;
  const maxPitchStep = 0.85 * assistWeight * clampedDt;
  player.pitch = clamp(player.pitch + clamp(pitchDiff, -maxPitchStep, maxPitchStep), -1.15, 1.15);

  // Subtle coordinated roll into turn when stick is idle
  if (Math.abs(input.roll) <= 0.08) {
    const targetBank = clamp(-headingDiff * 0.85, -0.75, 0.75) * assistWeight;
    player.bank = damp(player.bank, targetBank, 2.8, clampedDt);
  }
}

export interface AimAssistSolution {
  targetId: number;
  interceptPos: Vec3;
  aimDir: Vec3;
  distance: number;
}

/**
 * Computes predicted lead intercept point and soft gimbal aim vector
 * for the best enemy inside the forward gun envelope.
 */
export function computeAimAssistLead(
  player: PlayerFlightState,
  enemies: EnemyUnitState[],
  preferredEnemyId: number | null,
  bulletSpeed: number,
  difficulty: DifficultyMode = 'beginner'
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

  const rawDist = Math.hypot(
    bestEnemy.pos.x - player.pos.x,
    bestEnemy.pos.y - player.pos.y,
    bestEnemy.pos.z - player.pos.z
  );
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

  // Blend player boresight forward vector toward exact lead vector by difficulty assist strength
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

/**
 * Distinct AI movement & engagement policies for the 3 enemy archetypes:
 * - Interceptor: Fast pursuit chaser trying to line up behind/ahead of player
 * - Flanker: High-speed lateral orbiter executing swooping flanking arcs
 * - Gunship: Heavy armored patrol craft maintaining tactical altitude over landmarks
 */
export function stepEnemyAI(
  enemy: EnemyUnitState,
  player: PlayerFlightState,
  timeElapsed: number,
  dt: number,
  hasAttackToken: boolean
): { wantsToFire: boolean; fireSpread: number } {
  const clampedDt = Math.min(dt, 0.05);

  if (enemy.hitFlashTimer > 0) {
    enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - clampedDt);
  }

  if (!enemy.alive) {
    // KO spinning descent before removal; detonate immediately on ground contact
    enemy.dyingTimer = Math.max(0, enemy.dyingTimer - clampedDt);
    enemy.bank += clampedDt * 7.5;
    enemy.pitch = clamp(enemy.pitch - clampedDt * 0.8, -1.2, 0.2);
    const fwd = getForwardVector(enemy.heading, enemy.pitch);
    enemy.pos.x += fwd.x * enemy.speed * 0.85 * clampedDt;
    enemy.pos.y += fwd.y * enemy.speed * 0.85 * clampedDt;
    enemy.pos.z += fwd.z * enemy.speed * 0.85 * clampedDt;
    const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(enemy.pos.x, enemy.pos.z));
    if (enemy.pos.y <= groundY + 4) {
      enemy.pos.y = groundY + 4;
      enemy.dyingTimer = 0;
    }
    return { wantsToFire: false, fireSpread: 0 };
  }

  if (enemy.evadeTimer > 0) {
    enemy.evadeTimer = Math.max(0, enemy.evadeTimer - clampedDt);
  }

  const dx = player.pos.x - enemy.pos.x;
  const dy = player.pos.y - enemy.pos.y;
  const dz = player.pos.z - enemy.pos.z;
  const distToPlayer = Math.hypot(dx, dy, dz);

  let targetX = player.pos.x;
  let targetY = player.pos.y;
  let targetZ = player.pos.z;
  let desiredSpeed = 105;
  let turnRate = 1.15;

  if (enemy.archetype === 'interceptor') {
    // Pursuit chaser: aims slightly ahead of player if closing, or breaks off if too close
    desiredSpeed = distToPlayer > 400 ? 132 : 108;
    turnRate = 1.45;
    if (distToPlayer < 130) {
      // Breakaway climb after pass
      targetX = enemy.pos.x + Math.sin(enemy.aiPhaseOffset + timeElapsed * 0.6) * 450;
      targetY = Math.max(160, player.pos.y + 90);
      targetZ = enemy.pos.z + Math.cos(enemy.aiPhaseOffset + timeElapsed * 0.6) * 450;
    } else {
      const playerFwd = getForwardVector(player.heading, player.pitch);
      targetX = player.pos.x + playerFwd.x * 35;
      targetY = player.pos.y + playerFwd.y * 35;
      targetZ = player.pos.z + playerFwd.z * 35;
    }
  } else if (enemy.archetype === 'flanker') {
    // Orbiter: maintains ~360m lateral offset circle and swoops inward periodically
    desiredSpeed = 124;
    turnRate = 1.3;
    const orbitAngle = timeElapsed * 0.55 + enemy.aiPhaseOffset;
    const orbitRadius = 260 + Math.sin(timeElapsed * 0.9 + enemy.aiPhaseOffset) * 140;
    targetX = player.pos.x + Math.cos(orbitAngle) * orbitRadius;
    targetZ = player.pos.z + Math.sin(orbitAngle) * orbitRadius;
    targetY = clamp(player.pos.y + Math.sin(orbitAngle * 1.3) * 75, 85, 380);
  } else {
    // Gunship: heavy figure-8 patrol sweeping toward player when within 950m
    desiredSpeed = 82;
    turnRate = 0.65;
    const t = timeElapsed * 0.25 + enemy.aiPhaseOffset;
    if (distToPlayer > 750) {
      targetX = player.pos.x + Math.cos(t) * 240;
      targetZ = player.pos.z + Math.sin(t) * 240;
      targetY = clamp(player.pos.y + 40, 140, 340);
    } else {
      targetX = Math.sin(t) * 650;
      targetZ = Math.sin(t * 2) * 420;
      targetY = 185 + Math.cos(t) * 45;
    }
  }

  if (enemy.evadeTimer > 0 && enemy.archetype !== 'gunship') {
    // Reactive evasive jink + corkscrew climb/dive when under fire
    desiredSpeed = 148;
    turnRate = 2.05;
    const jinkSign = Math.sin(timeElapsed * 5.2 + enemy.aiPhaseOffset) >= 0 ? 1 : -1;
    const rx = Math.cos(enemy.heading) * jinkSign;
    const rz = -Math.sin(enemy.heading) * jinkSign;
    targetX = enemy.pos.x + rx * 280;
    targetZ = enemy.pos.z + rz * 280;
    targetY = clamp(enemy.pos.y + Math.cos(timeElapsed * 4.2 + enemy.aiPhaseOffset) * 110, 95, 420);
  }

  const tx = targetX - enemy.pos.x;
  const ty = targetY - enemy.pos.y;
  const tz = targetZ - enemy.pos.z;
  const tDist = Math.max(1, Math.hypot(tx, ty, tz));

  const desiredHeading = Math.atan2(-tx, -tz);
  const desiredPitch = clamp(Math.asin(clamp(ty / tDist, -0.95, 0.95)), -0.75, 0.75);

  const headingDiff = normalizeAngle(desiredHeading - enemy.heading);
  const maxTurn = turnRate * clampedDt;
  enemy.heading = normalizeAngle(enemy.heading + clamp(headingDiff, -maxTurn, maxTurn));
  enemy.pitch = damp(enemy.pitch, desiredPitch, 2.5, clampedDt);
  const desiredBank =
    enemy.evadeTimer > 0 && enemy.archetype !== 'gunship'
      ? Math.sin(timeElapsed * 7.5 + enemy.aiPhaseOffset) * 1.25
      : clamp(-headingDiff * 1.6, -1.15, 1.15);
  enemy.bank = damp(enemy.bank, desiredBank, 4.5, clampedDt);
  enemy.speed = damp(enemy.speed, desiredSpeed, 2.2, clampedDt);

  const fwd = getForwardVector(enemy.heading, enemy.pitch);
  enemy.pos.x += fwd.x * enemy.speed * clampedDt;
  enemy.pos.y += fwd.y * enemy.speed * clampedDt;
  enemy.pos.z += fwd.z * enemy.speed * clampedDt;

  // Keep enemies safely above terrain & mountains
  const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(enemy.pos.x, enemy.pos.z));
  if (enemy.pos.y < groundY + 45) {
    enemy.pos.y = groundY + 45;
    enemy.pitch = Math.max(0.15, enemy.pitch);
  }
  if (enemy.pos.y > MAX_FLIGHT_ALTITUDE - 60) {
    enemy.pos.y = MAX_FLIGHT_ALTITUDE - 60;
  }

  // Attack decision gated by token pool & alignment
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

export function generateCheckpoints(count: number): CheckpointState[] {
  const anchors: Vec3[] = [
    { x: 0, y: 125, z: -340 },
    { x: -240, y: 155, z: -560 },
    { x: -560, y: 240, z: -640 },
    { x: -120, y: 170, z: -780 },
    { x: 420, y: 190, z: -520 },
    { x: 760, y: 235, z: -320 },
    { x: 520, y: 175, z: 420 },
    { x: -320, y: 155, z: 620 },
  ];
  const result: CheckpointState[] = [];
  for (let i = 0; i < count; i++) {
    const base = anchors[i % anchors.length];
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

export function generateCollectibles(): CollectibleState[] {
  const placements: Array<{ kind: CollectibleState['kind']; pos: Vec3 }> = [
    { kind: 'star', pos: { x: 0, y: 110, z: -220 } },
    { kind: 'fuel', pos: { x: -320, y: 140, z: -420 } },
    { kind: 'repair', pos: { x: -720, y: 270, z: -620 } },
    { kind: 'missile', pos: { x: 420, y: 160, z: -320 } },
    { kind: 'star', pos: { x: 840, y: 240, z: -260 } },
    { kind: 'fuel', pos: { x: 480, y: 150, z: 540 } },
    { kind: 'repair', pos: { x: -340, y: 145, z: 620 } },
    { kind: 'missile', pos: { x: -180, y: 120, z: 220 } },
  ];
  return placements.map((item, idx) => ({
    id: idx + 1,
    kind: item.kind,
    pos: { ...item.pos },
    radius: 22,
    collected: false,
    bobPhase: idx * 0.9,
  }));
}

export function checkSphereCollision(a: Vec3, b: Vec3, radiusSum: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz <= radiusSum * radiusSum;
}

/**
 * Continuous swept segment-to-sphere collision check to prevent high-velocity
 * machine gun bullets or missiles from tunneling through aircraft between frames.
 */
export function checkSegmentSphereCollision(
  p0: Vec3,
  p1: Vec3,
  center: Vec3,
  radiusSum: number
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
  jetRadius = 4.2
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

export function computeMissionRank(
  outcome: 'victory' | 'defeat',
  accuracyPct: number,
  healthRemaining: number,
  kills: number
): 'S' | 'A' | 'B' | 'C' {
  if (outcome === 'defeat') return 'C';
  const score = (healthRemaining >= 70 ? 2 : healthRemaining >= 40 ? 1 : 0) + (accuracyPct >= 35 ? 1 : 0) + (kills >= 4 ? 1 : 0);
  if (score >= 4) return 'S';
  if (score >= 3) return 'A';
  if (score >= 1) return 'B';
  return 'C';
}

export function resolveSafeCameraPosition(
  anchor: Vec3,
  desiredCam: Vec3,
  obstacles: Array<{ x: number; z: number; halfW: number; halfD: number; topY: number }>
): Vec3 {
  let outX = desiredCam.x;
  let outY = desiredCam.y;
  let outZ = desiredCam.z;

  // Sample 5 points along ray from anchor -> desiredCam to guarantee terrain & building clearance
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
        // Pull camera slightly closer or lift above rooftop cleanly
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

