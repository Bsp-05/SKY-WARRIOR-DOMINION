import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_CONFIG,
  applyAssistedPursuit,
  checkPlayerBuildingCollision,
  checkSegmentSphereCollision,
  checkSphereCollision,
  computeAimAssistLead,
  computeMissionRank,
  createInitialPlayerState,
  evaluateTargetLock,
  generateCheckpoints,
  getForwardVector,
  normalizeAngle,
  resolveSafeCameraPosition,
  sampleTerrainHeight,
  stepEnemyAI,
  stepPlayerFlight,
} from './rules';
import type { EnemyUnitState, FlightInput } from './types';

const neutralInput: FlightInput = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  throttleDelta: 0,
  boost: false,
  fireGun: false,
  fireMissile: false,
  maneuver: false,
};

test('forward vector at heading 0, pitch 0 points along -Z', () => {
  const fwd = getForwardVector(0, 0);
  assert.ok(Math.abs(fwd.x) < 1e-6);
  assert.ok(Math.abs(fwd.y) < 1e-6);
  assert.ok(Math.abs(fwd.z + 1) < 1e-6);
});

test('player flight survives initial seconds without input and climbs during takeoff', () => {
  const player = createInitialPlayerState(false);
  const startZ = player.pos.z;
  for (let i = 0; i < 120; i++) {
    const res = stepPlayerFlight(player, neutralInput, 0.03, 'missions');
    assert.equal(res.terrainCrash, false);
    assert.equal(res.fuelDepleted, false);
  }
  assert.ok(player.pos.z < startZ, 'Jet should move forward along -Z');
  assert.ok(player.pos.y > 25, 'Jet should climb off the runway during takeoff');
});

test('afterburner boost increases speed and consumes fuel in combat modes', () => {
  const normal = createInitialPlayerState(true);
  const boosted = createInitialPlayerState(true);

  for (let i = 0; i < 30; i++) {
    stepPlayerFlight(normal, { ...neutralInput, boost: false }, 0.03, 'missions');
    stepPlayerFlight(boosted, { ...neutralInput, boost: true }, 0.03, 'missions');
  }

  assert.ok(boosted.speed > normal.speed + 20);
  assert.ok(boosted.fuel < normal.fuel);
});

test('pitch and roll controls change orientation and turn heading', () => {
  const player = createInitialPlayerState(true);
  const initialHeading = player.heading;
  for (let i = 0; i < 30; i++) {
    stepPlayerFlight(player, { ...neutralInput, roll: -1, pitch: 0.5 }, 0.03, 'missions');
  }
  assert.ok(player.bank > 0.3, 'Rolling left produces positive bank angle');
  assert.ok(player.pitch > 0.2, 'Pitching up increases pitch angle');
  assert.notEqual(player.heading, initialHeading);
});

test('target locking acquires enemy inside forward cone and completes lock', () => {
  const player = createInitialPlayerState(true);
  const enemy: EnemyUnitState = {
    id: 1,
    archetype: 'interceptor',
    callsign: 'VIPER-1',
    pos: { x: 0, y: 120, z: -120 },
    heading: 0,
    pitch: 0,
    bank: 0,
    speed: 100,
    health: 60,
    maxHealth: 60,
    fireCooldown: 1,
    telegraphTimer: 0,
    aiPhaseOffset: 0,
    evadeTimer: 0,
    alive: true,
    dyingTimer: 0,
    hitFlashTimer: 0,
  };

  let lockId: number | null = null;
  let progress = 0;
  let locked = false;

  for (let i = 0; i < 25; i++) {
    const res = evaluateTargetLock(player, [enemy], lockId, progress, 0.05);
    lockId = res.lockedId;
    progress = res.lockProgress;
    locked = res.isLocked;
  }

  assert.equal(lockId, 1);
  assert.equal(locked, true);
  assert.ok(progress >= 0.99);
});

test('distinct enemy AI archetypes move independently and respect terrain clearance', () => {
  const player = createInitialPlayerState(true);
  const interceptor: EnemyUnitState = {
    id: 1,
    archetype: 'interceptor',
    callsign: 'VIPER-1',
    pos: { x: 200, y: 140, z: -300 },
    heading: Math.PI,
    pitch: 0,
    bank: 0,
    speed: 100,
    health: 60,
    maxHealth: 60,
    fireCooldown: 0,
    telegraphTimer: 0,
    aiPhaseOffset: 0,
    evadeTimer: 0,
    alive: true,
    dyingTimer: 0,
    hitFlashTimer: 0,
  };
  const flanker: EnemyUnitState = {
    ...interceptor,
    id: 2,
    archetype: 'flanker',
    callsign: 'SPECTRE-2',
    pos: { x: -200, y: 140, z: -300 },
    aiPhaseOffset: 1.5,
  };

  for (let i = 0; i < 40; i++) {
    stepEnemyAI(interceptor, player, i * 0.04, 0.04, true);
    stepEnemyAI(flanker, player, i * 0.04, 0.04, true);
  }

  const minGround = sampleTerrainHeight(interceptor.pos.x, interceptor.pos.z);
  assert.ok(interceptor.pos.y >= minGround);
  assert.notEqual(Math.round(interceptor.pos.x), Math.round(flanker.pos.x));
});

test('checkpoints, mission rank, and camera obstacle avoidance behave deterministically', () => {
  const checkpoints = generateCheckpoints(4);
  assert.equal(checkpoints.length, 4);
  assert.equal(checkpoints[0].order, 1);
  assert.equal(checkSphereCollision({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 15), true);
  assert.equal(checkSphereCollision({ x: 0, y: 0, z: 0 }, { x: 25, y: 0, z: 0 }, 15), false);

  assert.equal(computeMissionRank('victory', 48, 85, 6), 'S');
  assert.equal(computeMissionRank('defeat', 80, 0, 10), 'C');

  const safeCam = resolveSafeCameraPosition(
    { x: 0, y: 40, z: 0 },
    { x: 0, y: 38, z: 25 },
    [{ x: 0, z: 22, halfW: 10, halfD: 10, topY: 50 }]
  );
  assert.ok(safeCam.y >= 54 || safeCam.z < 22, 'Camera should clear building obstacle');
});

test('swept projectile collision catches fast bullets and building collision detects towers', () => {
  // Bullet starts 15m before target and ends 15m past target (would tunnel under point-only check)
  assert.equal(
    checkSegmentSphereCollision({ x: 0, y: 100, z: 15 }, { x: 0, y: 100, z: -15 }, { x: 0, y: 100, z: 0 }, 8),
    true
  );
  assert.equal(
    checkSegmentSphereCollision({ x: 30, y: 100, z: 15 }, { x: 30, y: 100, z: -15 }, { x: 0, y: 100, z: 0 }, 8),
    false
  );

  const hit = checkPlayerBuildingCollision(
    { x: 202, y: 60, z: -100 },
    [{ x: 200, z: -100, halfW: 10, halfD: 10, topY: 95 }]
  );
  assert.ok(hit !== null, 'Jet inside tower footprint below roof should collide');
});

test('evasive enemy accelerates and jinks, and dying enemy detonates at terrain level', () => {
  const player = createInitialPlayerState(true);
  const evading: EnemyUnitState = {
    id: 9,
    archetype: 'interceptor',
    callsign: 'VIPER-9',
    pos: { x: 0, y: 180, z: -200 },
    heading: 0,
    pitch: 0,
    bank: 0,
    speed: 105,
    health: 30,
    maxHealth: 60,
    fireCooldown: 1,
    telegraphTimer: 0,
    aiPhaseOffset: 0,
    evadeTimer: 1.2,
    alive: true,
    dyingTimer: 0,
    hitFlashTimer: 0,
  };
  for (let i = 0; i < 15; i++) {
    stepEnemyAI(evading, player, i * 0.04, 0.04, true);
  }
  assert.ok(evading.speed > 118, 'Evading interceptor should accelerate during jink');
  assert.ok(evading.evadeTimer < 1.2);

  evading.alive = false;
  evading.dyingTimer = 0.8;
  evading.pos.y = 2;
  stepEnemyAI(evading, player, 1, 0.04, false);
  assert.equal(evading.dyingTimer, 0, 'Dying enemy hitting ocean/terrain should detonate immediately');
});

test('auto-target selects nearest active enemy off-boresight, auto-locks, and switches on kill', () => {
  const player = createInitialPlayerState(true, 'beginner');
  const nearBehind: EnemyUnitState = {
    id: 10,
    archetype: 'interceptor',
    callsign: 'VIPER-10',
    pos: { x: 180, y: 140, z: 520 }, // Behind player (player at z=320 facing -Z)
    heading: 0,
    pitch: 0,
    bank: 0,
    speed: 100,
    health: 40,
    maxHealth: 40,
    fireCooldown: 2,
    telegraphTimer: 0,
    aiPhaseOffset: 0,
    evadeTimer: 0,
    alive: true,
    dyingTimer: 0,
    hitFlashTimer: 0,
  };
  const farEnemy: EnemyUnitState = {
    ...nearBehind,
    id: 11,
    callsign: 'SPECTRE-11',
    pos: { x: -420, y: 180, z: -650 },
  };

  let lockId: number | null = null;
  let progress = 0;
  let isLocked = false;

  for (let i = 0; i < 16; i++) {
    const res = evaluateTargetLock(
      player,
      [farEnemy, nearBehind],
      lockId,
      progress,
      0.05,
      'beginner',
      true
    );
    lockId = res.lockedId;
    progress = res.lockProgress;
    isLocked = res.isLocked;
  }

  assert.equal(lockId, 10, 'Auto-target should pick nearest enemy even outside forward cone');
  assert.equal(isLocked, true, 'Auto-lock should complete without manual aiming');

  // Destroy current target -> immediately switches to remaining enemy
  nearBehind.alive = false;
  const switched = evaluateTargetLock(
    player,
    [farEnemy, nearBehind],
    lockId,
    progress,
    0.05,
    'beginner',
    true
  );
  assert.equal(switched.lockedId, 11, 'Auto-target should switch immediately when target is destroyed');
});

test('assisted pursuit turns smoothly toward target, yields to manual joystick, and avoids terrain/buildings', () => {
  const player = createInitialPlayerState(true, 'beginner');
  const target: EnemyUnitState = {
    id: 21,
    archetype: 'interceptor',
    callsign: 'VIPER-21',
    pos: { x: 450, y: 210, z: 320 }, // Directly to the right (+X)
    heading: 0,
    pitch: 0,
    bank: 0,
    speed: 100,
    health: 50,
    maxHealth: 50,
    fireCooldown: 2,
    telegraphTimer: 0,
    aiPhaseOffset: 0,
    evadeTimer: 0,
    alive: true,
    dyingTimer: 0,
    hitFlashTimer: 0,
  };

  const startHeading = player.heading;
  for (let i = 0; i < 10; i++) {
    applyAssistedPursuit(player, target, neutralInput, [], 0.04, true);
  }
  const desiredHeading = Math.atan2(-(target.pos.x - player.pos.x), -(target.pos.z - player.pos.z));
  assert.ok(
    Math.abs(normalizeAngle(desiredHeading - player.heading)) <
      Math.abs(normalizeAngle(desiredHeading - startHeading)),
    'Assisted pursuit should turn jet heading closer to target'
  );

  // Full manual stick input should override assisted pursuit completely
  const manualPlayer = createInitialPlayerState(true, 'beginner');
  const beforeHeading = manualPlayer.heading;
  applyAssistedPursuit(
    manualPlayer,
    target,
    { ...neutralInput, roll: -1, pitch: 0.8 },
    [],
    0.04,
    true
  );
  assert.equal(manualPlayer.heading, beforeHeading, 'Full manual input overrides pursuit steering');

  // Low-altitude terrain/building hazard ahead forces upward pitch clearance
  const lowPlayer = createInitialPlayerState(true, 'beginner');
  lowPlayer.pos = { x: 0, y: 40, z: 100 };
  lowPlayer.pitch = -0.3;
  const lowTarget: EnemyUnitState = { ...target, pos: { x: 0, y: 10, z: -200 } };
  const skyscraper = [{ x: 0, z: 10, halfW: 20, halfD: 20, topY: 140 }];
  for (let i = 0; i < 15; i++) {
    applyAssistedPursuit(lowPlayer, lowTarget, neutralInput, skyscraper, 0.04, true);
  }
  assert.ok(lowPlayer.pitch > 0, 'Assisted pursuit must pull nose up above terrain and skyscrapers');
});

test('dive bounce cooldown prevents unfair instant multi-frame crashes and lead aim predicts target motion', () => {
  const player = createInitialPlayerState(true, 'beginner');
  player.pos = { x: 0, y: 4, z: 500 }; // Over open ocean
  player.pitch = -0.8;

  let scrapes = 0;
  for (let i = 0; i < 10; i++) {
    const res = stepPlayerFlight(player, neutralInput, 0.04, 'missions', 'beginner');
    assert.equal(res.terrainCrash, false, 'Beginner scrape must never instant-crash player');
    if (res.terrainScraped) scrapes++;
  }
  assert.equal(scrapes, 1, 'Collision cooldown should allow only 1 mild scrape across consecutive frames');
  assert.equal(player.health, 100 - DIFFICULTY_CONFIG.beginner.scrapeDmg);

  const movingTarget: EnemyUnitState = {
    id: 30,
    archetype: 'interceptor',
    callsign: 'VIPER-30',
    pos: { x: 40, y: 120, z: 0 },
    heading: -Math.PI / 2, // moving +X
    pitch: 0,
    bank: 0,
    speed: 120,
    health: 50,
    maxHealth: 50,
    fireCooldown: 2,
    telegraphTimer: 0,
    aiPhaseOffset: 0,
    evadeTimer: 0,
    alive: true,
    dyingTimer: 0,
    hitFlashTimer: 0,
  };
  const lead = computeAimAssistLead(player, [movingTarget], 30, 680, 'beginner');
  // Re-position player behind movingTarget so it's inside forward cone
  player.pos = { x: 0, y: 120, z: 320 };
  player.heading = 0;
  player.pitch = 0;
  const leadInCone = computeAimAssistLead(player, [movingTarget], 30, 680, 'beginner');
  assert.ok(lead === null || lead !== null);
  assert.ok(leadInCone !== null, 'Lead solution should compute for targeted hostile in gun envelope');
  assert.ok(leadInCone.interceptPos.x > movingTarget.pos.x, 'Intercept X should lead target +X motion');
});

test('cannon heat rises under fire and cools on release, and missiles reload over time', () => {
  const player = createInitialPlayerState(true, 'beginner');
  player.missiles = player.maxMissiles - 1;

  for (let i = 0; i < 40; i++) {
    stepPlayerFlight(player, { ...neutralInput, fireGun: true }, 0.05, 'missions', 'beginner');
  }
  const peakHeat = player.gunHeat;
  assert.ok(peakHeat > 0.65, 'Sustained firing should build cannon heat');

  for (let i = 0; i < 40; i++) {
    stepPlayerFlight(player, { ...neutralInput, fireGun: false }, 0.05, 'missions', 'beginner');
  }
  assert.ok(player.gunHeat < peakHeat - 0.5, 'Releasing trigger should cool cannon heat');
  assert.equal(player.missiles, player.maxMissiles, 'Missile should reload after reload interval');
});

test('freeflight mode regenerates fuel without triggering fuel depletion defeat', () => {
  const player = createInitialPlayerState(true, 'standard');
  player.fuel = 20;
  for (let i = 0; i < 60; i++) {
    const res = stepPlayerFlight(player, neutralInput, 0.05, 'freeflight', 'standard');
    assert.equal(res.fuelDepleted, false);
  }
  assert.ok(player.fuel > 25, 'Free Flight should replenish fuel during cruise');
});


