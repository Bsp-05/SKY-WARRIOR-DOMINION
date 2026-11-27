/**
 * SKY WARRIOR: DOMINION — flight game engine.
 *
 * Owns the Three.js scene, the player F-22X rig, enemy AI squadrons,
 * cannons / guided missiles, checkpoints, collectibles, the three camera
 * modes, and the per-frame HUD snapshot handed to the React shell.
 *
 * Public surface (constructor, setLivery, startGame, pauseGame,
 * resumeGame, returnToTitle, cycleCamera, setCameraMode, prepareShot,
 * setAutoTargetEnabled, toggleAutoTarget, setTouchJoystick,
 * setTouchButton, dispose, and the `sound` field) is part of the
 * contract with the rest of the app — it must not change shape.
 * Everything below the public methods is internal and may be
 * reorganised freely.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SoundEngine } from './audio';
import {
  createCheckpointRingModel,
  createCollectibleModel,
  createEnemyJetModel,
  createFighterJetModel,
  createMissileModel,
  type EnemyModelRig,
  type FighterJetRig,
} from './models';
import {
  DIFFICULTY_CONFIG,
  MISSIONS,
  OCEAN_LEVEL,
  applyAssistedPursuit,
  checkPlayerBuildingCollision,
  checkSegmentSphereCollision,
  checkSphereCollision,
  clamp,
  computeAimAssistLead,
  computeMissionRank,
  createInitialPlayerState,
  damp,
  evaluateTargetLock,
  generateCheckpoints,
  generateCollectibles,
  getEnemyMaxHealth,
  getEnemyScoreValue,
  getForwardVector,
  lerp,
  resolveSafeCameraPosition,
  sampleTerrainHeight,
  stepEnemyAI,
  stepPlayerFlight,
} from './rules';
import { createProceduralTextures, type ProceduralTextureSet } from './textures';
import type {
  CameraMode,
  CheckpointState,
  CollectibleState,
  DifficultyMode,
  EnemyArchetype,
  EnemyUnitState,
  FlightInput,
  GameMode,
  GamePhase,
  HudSnapshot,
  JetLivery,
  PlayerFlightState,
  ProjectedCheckpoint,
  ProjectedTarget,
  RadarBlip,
  RunSummary,
  Vec3,
} from './types';
import { createOpenWorld, type WorldHandles } from './world';

/* ------------------------------------------------------------------ */
/* Module-level scratch objects (reused every frame to avoid GC churn) */
/* ------------------------------------------------------------------ */

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _vPrev = new THREE.Vector3();
const _vProj = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/** One pooled tracer round, rendered through a shared InstancedMesh. */
interface BulletSlot {
  active: boolean;
  fromPlayer: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

/** One pooled soft particle (explosion debris, smoke, contrails). */
interface ParticleSlot {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  age: number;
  maxAge: number;
  startScale: number;
  endScale: number;
  color: THREE.Color;
}

/** One pooled expanding explosion ring. */
interface ShockwaveSlot {
  active: boolean;
  age: number;
  maxAge: number;
  maxScale: number;
  mesh: THREE.Mesh;
}

/** One pooled guided missile (8 player slots, 4 enemy slots). */
interface ActiveMissile {
  active: boolean;
  fromPlayer: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  targetEnemyId: number | null;
  life: number;
  mesh: THREE.Group;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onRunEnd: (summary: RunSummary) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onMuteChange?: (muted: boolean) => void;
}

/**
 * Sniff out software rasterisers (SwiftShader / llvmpipe). On those the
 * engine drops antialiasing, shadows and the compile step, and paces
 * frames with a GPU fence instead of requestAnimationFrame so the tab
 * stays responsive.
 */
function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/* ================================================================== */
/* FlightGameEngine                                                    */
/* ================================================================== */

export class FlightGameEngine {
  /* ---- wiring ---------------------------------------------------- */
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private isMobileDevice: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextureSet;
  private world: WorldHandles;
  public sound: SoundEngine;

  /* ---- player ---------------------------------------------------- */
  private playerRig: FighterJetRig;
  private livery: JetLivery = 'obsidian';

  /* ---- run / mission state --------------------------------------- */
  private phase: GamePhase = 'title';
  private mode: GameMode = 'missions';
  private difficulty: DifficultyMode = 'beginner';
  private missionIndex = 0;
  private cameraMode: CameraMode = 'chase';
  private player: PlayerFlightState = createInitialPlayerState(false, 'beginner');
  private enemies: EnemyUnitState[] = [];
  private enemyRigs = new Map<number, EnemyModelRig>();
  private checkpoints: CheckpointState[] = [];
  private checkpointMeshes = new Map<number, THREE.Group>();
  private collectibles: CollectibleState[] = [];
  private collectibleMeshes = new Map<number, THREE.Group>();

  private nextEntityId = 1;
  private score = 0;
  private bestScore = 0;
  private combo = 1;
  private comboTimer = 0;
  private kills = 0;
  private wave = 1;
  private totalWaves = 2;
  private elapsedSec = 0;
  private timeRemainingSec: number | null = null;
  private shotsFired = 0;
  private shotsHit = 0;
  private defeatReason: string | null = null;

  /* ---- combat / feedback state ----------------------------------- */
  private autoTargetEnabled = true;
  private lockedTargetId: number | null = null;
  private lockProgress = 0;
  private gunFireTimer = 0;
  private gunOverheated = false;
  private muzzleFlashTimers: [number, number] = [0, 0];
  private enemyMissileCooldown = 14.0;
  private survivalSpawnTimer = 0;
  private trauma = 0;
  private hitstopTimer = 0;
  private damageFlash = 0;
  private hitMarkerTimer = 0;
  private combatFeedback: { text: string; kind: 'hit' | 'crit' | 'kill'; timer: number } | null = null;
  private bannerMessage: string | null = null;
  private bannerTimer = 0;
  private muzzleToggle = 0;
  private hudEmitAccum = 0;
  private titleClock = 0;
  private clockTime = 0;

  /* ---- smoothed camera state ------------------------------------- */
  private camPos = new THREE.Vector3(-45, 162, 345);
  private camLook = new THREE.Vector3(-45, 155, 300);

  /* ---- pooled projectiles / particles ---------------------------- */
  private readonly MAX_BULLETS = 160;
  private bullets: BulletSlot[] = [];
  private bulletMesh!: THREE.InstancedMesh;

  private readonly MAX_PARTICLES = 420;
  private particles: ParticleSlot[] = [];
  private particleMesh!: THREE.InstancedMesh;
  private particleCursor = 0;

  private shockwaves: ShockwaveSlot[] = [];
  private missiles: ActiveMissile[] = [];

  /* ---- input ------------------------------------------------------ */
  private keys = new Set<string>();
  private touchJoyX = 0;
  private touchJoyY = 0;
  private touchButtons = {
    fireGun: false,
    fireMissile: false,
    boost: false,
    maneuver: false,
  };
  private missileJustPressed = false;
  private maneuverJustPressed = false;
  private mouseGunDown = false;
  private mouseThrottleImpulse = 0;

  /* ---- loop / lifecycle ------------------------------------------ */
  private frameId = 0;
  private lastTimestamp = 0;
  private disposed = false;
  private resizeObserver: ResizeObserver;

  /* ================================================================== */
  /* Construction                                                         */
  /* ================================================================== */

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.sound = new SoundEngine();

    try {
      const saved = localStorage.getItem('sky_warrior_best_score');
      if (saved) this.bestScore = Number(saved) || 0;
    } catch {
      // Ignore storage errors
    }

    this.isSoftwareGl = detectSoftwareGl();
    this.isMobileDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches || (navigator.maxTouchPoints ?? 0) > 0);

    this.renderer = this.createRenderer(container);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      64,
      this.renderer.domElement.width / Math.max(1, this.renderer.domElement.height),
      0.5,
      6500
    );
    // Aspect is fixed up right away from the real container size.
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);
    this.world = createOpenWorld(this.scene, this.textures, this.isSoftwareGl);

    this.playerRig = createFighterJetModel(this.livery, this.textures, this.isSoftwareGl);
    this.scene.add(this.playerRig.root);

    this.buildBulletPool();
    this.buildParticlePool();
    this.buildShockwavePool();
    this.buildMissilePool();

    this.setupTitleShowcase();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.attachEventListeners();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.lastTimestamp = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  /** Renderer + canvas sizing. Software GL gets no AA / shadows. */
  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, this.isMobileDevice ? 1.5 : 2)
    );
    renderer.shadowMap.enabled = !this.isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);
    return renderer;
  }

  /** Pooled tracer rounds rendered as one InstancedMesh. */
  private buildBulletPool(): void {
    const bulletGeo = new THREE.BoxGeometry(0.28, 0.28, 4.8);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.bulletMesh = new THREE.InstancedMesh(bulletGeo, bulletMat, this.MAX_BULLETS);
    this.bulletMesh.frustumCulled = false;
    this.scene.add(this.bulletMesh);
    for (let i = 0; i < this.MAX_BULLETS; i++) {
      this.bullets.push({
        active: false,
        fromPlayer: true,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
      });
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.bulletMesh.setMatrixAt(i, _dummy.matrix);
      this.bulletMesh.setColorAt(i, _color.setHex(0xfef08a));
    }
    this.bulletMesh.instanceMatrix.needsUpdate = true;
  }

  /** Pooled soft low-alpha particles (explosions, smoke, contrails). */
  private buildParticlePool(): void {
    const pGeo = new THREE.IcosahedronGeometry(1, 1);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.MAX_PARTICLES);
    this.particleMesh.frustumCulled = false;
    this.scene.add(this.particleMesh);
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        age: 0,
        maxAge: 1,
        startScale: 1,
        endScale: 0,
        color: new THREE.Color(0xffffff),
      });
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummy.matrix);
      this.particleMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
  }

  /** Pooled expanding explosion shockwave rings. */
  private buildShockwavePool(): void {
    const shockGeo = new THREE.RingGeometry(0.75, 1.0, 24);
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfdba74,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(shockGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.shockwaves.push({ active: false, age: 0, maxAge: 0.55, maxScale: 32, mesh });
    }
  }

  /** Pooled guided missiles: slots 0-7 belong to the player, 8-11 to enemies. */
  private buildMissilePool(): void {
    for (let i = 0; i < 12; i++) {
      const mesh = createMissileModel(i >= 8);
      mesh.visible = false;
      this.scene.add(mesh);
      this.missiles.push({
        active: false,
        fromPlayer: i < 8,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        targetEnemyId: null,
        life: 0,
        mesh,
      });
    }
  }

  private attachEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.renderer.domElement.addEventListener('contextmenu', this.handleContextMenu);
    this.renderer.domElement.addEventListener('wheel', this.handleWheel, { passive: true });
  }

  /* ================================================================== */
  /* Title showcase                                                       */
  /* ================================================================== */

  private setupTitleShowcase(): void {
    this.phase = 'title';
    document.body.dataset.state = 'title';
    this.clearDynamicActors();
    this.player = createInitialPlayerState(true);
    // Open-water sunset showcase position well clear of skyscrapers
    this.player.pos = { x: -45, y: 158, z: 325 };
    this.player.heading = -0.38;
    this.player.bank = 0.2;
    this.player.pitch = 0.04;
    this.player.afterburnerActive = true;
    this.syncPlayerRigTransform(0.016);

    this.camPos.set(this.player.pos.x - 15, this.player.pos.y + 4.8, this.player.pos.z + 18);
    this.camLook.set(this.player.pos.x - 2, this.player.pos.y + 0.6, this.player.pos.z - 4);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.fov = 52;
    this.camera.updateProjectionMatrix();

    this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
    this.emitHud();
  }

  /* ================================================================== */
  /* Public session API                                                   */
  /* ================================================================== */

  public setLivery(livery: JetLivery): void {
    if (this.livery === livery) return;
    this.livery = livery;
    this.scene.remove(this.playerRig.root);
    this.disposeGroupResources(this.playerRig.root);
    this.playerRig = createFighterJetModel(livery, this.textures, this.isSoftwareGl);
    this.scene.add(this.playerRig.root);
    this.syncPlayerRigTransform(0.016);
  }

  public startGame(
    mode: GameMode,
    missionIndex = 0,
    skipTakeoff = false,
    difficulty: DifficultyMode = this.difficulty
  ): void {
    if (!skipTakeoff) {
      this.sound.unlock();
    }
    this.mode = mode;
    this.difficulty = difficulty;
    this.missionIndex = clamp(missionIndex, 0, MISSIONS.length - 1);
    this.clearDynamicActors();

    const diffCfg = DIFFICULTY_CONFIG[difficulty];
    this.player = createInitialPlayerState(skipTakeoff, difficulty);
    this.resetRunCounters();
    this.enemyMissileCooldown = diffCfg.enemyMissileCooldown * 0.9;
    this.survivalSpawnTimer = 0;
    this.resetTransientInput();

    if (mode === 'missions') {
      const m = MISSIONS[this.missionIndex];
      this.totalWaves = m.waves;
      this.timeRemainingSec = Math.round(m.timeLimitSec * diffCfg.timeMult);
      this.checkpoints = generateCheckpoints(m.checkpointCount);
      this.spawnCheckpoints();
      this.spawnWaveEnemies(Math.ceil(m.enemyCount / m.waves), 1);
      this.showBanner(`${m.title.toUpperCase()} — WAVE 1`, 2.6);
    } else if (mode === 'survival') {
      this.totalWaves = 99;
      this.timeRemainingSec = null;
      this.spawnWaveEnemies(3, 1);
      this.showBanner('SURVIVAL WAVE 1 — ENGAGE HOSTILES', 2.6);
    } else {
      this.totalWaves = 1;
      this.timeRemainingSec = null;
      this.checkpoints = generateCheckpoints(8);
      this.spawnCheckpoints();
      this.showBanner('FREE FLIGHT — SOLARIS ARCHIPELAGO', 2.6);
    }

    this.collectibles = generateCollectibles();
    this.spawnCollectibleMeshes();

    this.syncPlayerRigTransform(0.016);
    this.frameCameraBehindPlayer(23, 6.4, 45, 1.8);

    // Immediately auto-select nearest hostile if auto-target is enabled
    const initialLock = evaluateTargetLock(
      this.player,
      this.enemies,
      null,
      0,
      0.016,
      this.difficulty,
      this.autoTargetEnabled
    );
    this.lockedTargetId = initialLock.lockedId;
    this.lockProgress = initialLock.lockProgress;

    this.phase = 'playing';
    document.body.dataset.state = 'playing';
    this.callbacks.onPhaseChange('playing');
    this.emitHud();
  }

  /** Zero the per-run score / combat counters for a fresh run. */
  private resetRunCounters(): void {
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.kills = 0;
    this.wave = 1;
    this.elapsedSec = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.defeatReason = null;
    this.lockedTargetId = null;
    this.lockProgress = 0;
    this.trauma = 0;
    this.hitstopTimer = 0;
    this.damageFlash = 0;
    this.hitMarkerTimer = 0;
    this.combatFeedback = null;
    this.muzzleFlashTimers = [0, 0];
    this.gunOverheated = false;
  }

  /** Clear held keys / buttons so a fresh run never inherits stale input. */
  private resetTransientInput(): void {
    this.keys.clear();
    this.mouseGunDown = false;
    this.mouseThrottleImpulse = 0;
    this.missileJustPressed = false;
    this.maneuverJustPressed = false;
    this.touchButtons = {
      fireGun: false,
      fireMissile: false,
      boost: false,
      maneuver: false,
    };
  }

  /** Place the smoothed camera behind the jet, looking ahead along its nose. */
  private frameCameraBehindPlayer(
    backDist: number,
    height: number,
    lookDist: number,
    lookHeight: number
  ): void {
    const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
    this.camPos.set(
      this.player.pos.x - fwd.x * backDist,
      this.player.pos.y + height,
      this.player.pos.z - fwd.z * backDist
    );
    this.camLook.set(
      this.player.pos.x + fwd.x * lookDist,
      this.player.pos.y + lookHeight,
      this.player.pos.z + fwd.z * lookDist
    );
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.updateMatrixWorld();
  }

  public pauseGame(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    document.body.dataset.state = 'paused';
    this.resetTransientInput();
    this.sound.updateEngine(false, 0, false, 0, 0);
    this.callbacks.onPhaseChange('paused');
    this.emitHud();
  }

  public resumeGame(): void {
    if (this.phase !== 'paused') return;
    this.sound.unlock();
    this.phase = 'playing';
    document.body.dataset.state = 'playing';
    this.lastTimestamp = performance.now();
    this.callbacks.onPhaseChange('playing');
    this.emitHud();
  }

  public returnToTitle(): void {
    this.sound.updateEngine(false, 0, false, 0, 0);
    this.setupTitleShowcase();
    this.callbacks.onPhaseChange('title');
  }

  public cycleCamera(): CameraMode {
    const order: CameraMode[] = ['chase', 'action', 'cockpit'];
    const next = order[(order.indexOf(this.cameraMode) + 1) % order.length];
    return this.setCameraMode(next);
  }

  public setCameraMode(mode: CameraMode): CameraMode {
    this.cameraMode = mode;
    this.playerRig.root.visible = mode !== 'cockpit';
    this.updateCamera(0.016);
    this.emitHud();
    return mode;
  }

  /**
   * Canned camera framings used by the marketing / screenshot flow.
   * 'start' returns to the title screen, 'takeoff' plays the runway
   * roll, 'play' / 'cockpit' drop the jet mid-air in front of hostiles.
   */
  public prepareShot(shot: string): void {
    if (shot === 'start') {
      this.returnToTitle();
      return;
    }
    if (shot === 'takeoff') {
      this.startGame('missions', 0, false, 'beginner');
      this.setCameraMode('chase');
      for (let i = 0; i < 45; i++) {
        this.stepSimulation(0.03);
      }
      this.updateCamera(0.03);
      this.emitHud();
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (shot === 'play' || shot === 'cockpit') {
      this.startGame('missions', 0, true, 'beginner');
      this.player.pos = { x: -18, y: 128, z: 245 };
      this.player.heading = 0.08;
      this.player.pitch = 0.03;
      this.player.bank = -0.14;
      this.player.afterburnerActive = true;
      this.player.speed = 165;
      if (this.enemies.length > 0) {
        const target = this.enemies[0];
        target.pos = { x: -58, y: 148, z: 95 };
        target.heading = 0.25;
        target.bank = -0.35;
        this.lockedTargetId = target.id;
        this.lockProgress = 1.0;
      }
      if (this.enemies.length > 1) {
        const second = this.enemies[1];
        second.pos = { x: 75, y: 168, z: 25 };
        second.heading = -0.45;
        second.bank = 0.4;
      }
      if (this.checkpoints.length > 0) {
        this.checkpoints[0].pos = { x: 16, y: 122, z: 10 };
        const ringMesh = this.checkpointMeshes.get(this.checkpoints[0].id);
        if (ringMesh) {
          ringMesh.position.set(16, 122, 10);
          ringMesh.lookAt(this.player.pos.x, this.player.pos.y, this.player.pos.z);
        }
      }
      this.syncPlayerRigTransform(0.016);
      const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
      this.camPos.set(
        this.player.pos.x - fwd.x * 20,
        this.player.pos.y - fwd.y * 20 + 5.2,
        this.player.pos.z - fwd.z * 20
      );
      this.camLook.set(
        this.player.pos.x + fwd.x * 55,
        this.player.pos.y + fwd.y * 55 + 1.4,
        this.player.pos.z + fwd.z * 55
      );
      this.setCameraMode(shot === 'cockpit' ? 'cockpit' : 'chase');
      this.renderer.render(this.scene, this.camera);
    }
  }

  public setAutoTargetEnabled(enabled: boolean): void {
    this.autoTargetEnabled = enabled;
    if (!enabled) {
      this.lockProgress = 0;
    }
    this.showBanner(enabled ? 'AUTO TARGET · LOCK & PURSUIT ON' : 'AUTO TARGET · MANUAL MODE', 1.6);
    this.emitHud();
  }

  public toggleAutoTarget(): boolean {
    this.setAutoTargetEnabled(!this.autoTargetEnabled);
    return this.autoTargetEnabled;
  }

  public setTouchJoystick(x: number, y: number): void {
    this.touchJoyX = clamp(x, -1, 1);
    this.touchJoyY = clamp(y, -1, 1);
  }

  public setTouchButton(btn: keyof FlightGameEngine['touchButtons'], pressed: boolean): void {
    this.sound.unlock();
    if (btn === 'fireMissile' && pressed && !this.touchButtons.fireMissile) {
      this.missileJustPressed = true;
    }
    if (btn === 'maneuver' && pressed && !this.touchButtons.maneuver) {
      this.maneuverJustPressed = true;
    }
    this.touchButtons[btn] = pressed;
  }

  /* ================================================================== */
  /* Cleanup helpers                                                      */
  /* ================================================================== */

  /** Dispose every geometry / material under a group (shared textures survive). */
  private disposeGroupResources(group: THREE.Object3D): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  /** Remove every dynamic actor (enemies, rings, pickups, projectiles). */
  private clearDynamicActors(): void {
    for (const rig of this.enemyRigs.values()) {
      this.scene.remove(rig.root);
      this.disposeGroupResources(rig.root);
    }
    this.enemyRigs.clear();
    this.enemies = [];

    for (const m of this.checkpointMeshes.values()) {
      this.scene.remove(m);
      this.disposeGroupResources(m);
    }
    this.checkpointMeshes.clear();
    this.checkpoints = [];

    for (const c of this.collectibleMeshes.values()) {
      this.scene.remove(c);
      this.disposeGroupResources(c);
    }
    this.collectibleMeshes.clear();
    this.collectibles = [];

    for (const b of this.bullets) b.active = false;
    for (const p of this.particles) p.active = false;
    for (const s of this.shockwaves) {
      s.active = false;
      s.mesh.visible = false;
    }
    for (const m of this.missiles) {
      m.active = false;
      m.mesh.visible = false;
    }
    this.playerRig.root.visible = true;
  }

  /* ================================================================== */
  /* Spawning                                                             */
  /* ================================================================== */

  private spawnCheckpoints(): void {
    for (const cp of this.checkpoints) {
      const mesh = createCheckpointRingModel(cp.order);
      mesh.position.set(cp.pos.x, cp.pos.y, cp.pos.z);
      mesh.lookAt(0, cp.pos.y, 0);
      this.scene.add(mesh);
      this.checkpointMeshes.set(cp.id, mesh);
    }
  }

  private spawnCollectibleMeshes(): void {
    for (const col of this.collectibles) {
      const mesh = createCollectibleModel(col.kind);
      mesh.position.set(col.pos.x, col.pos.y, col.pos.z);
      this.scene.add(mesh);
      this.collectibleMeshes.set(col.id, mesh);
    }
  }

  private spawnWaveEnemies(count: number, waveNum: number): void {
    const archetypes: EnemyArchetype[] = ['interceptor', 'flanker', 'gunship'];
    const callsignPrefixes: Record<EnemyArchetype, string> = {
      interceptor: 'VIPER',
      flanker: 'SPECTRE',
      gunship: 'GOLIATH',
    };

    const diffCfg = DIFFICULTY_CONFIG[this.difficulty];
    const hpScale = (1 + Math.min(0.6, (waveNum - 1) * 0.12)) * diffCfg.enemyHpMult;
    const speedBonus = Math.min(24, (waveNum - 1) * 4);
    const cooldownBonus = this.difficulty === 'beginner' ? 1.1 : this.difficulty === 'standard' ? 0.5 : 0;

    for (let i = 0; i < count; i++) {
      const id = this.nextEntityId++;
      const archIdx = waveNum === 1 && i === 0 ? 0 : (i + waveNum - 1) % archetypes.length;
      const archetype = archetypes[archIdx];
      const angle = (i / Math.max(1, count)) * Math.PI * 1.15 - Math.PI * 0.57 + this.player.heading;
      const dist = 480 + (i % 3) * 140;
      const sx = clamp(this.player.pos.x - Math.sin(angle) * dist, -1700, 1700);
      const sz = clamp(this.player.pos.z - Math.cos(angle) * dist, -1700, 1700);
      const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(sx, sz));
      const sy = Math.max(groundY + 110, 135 + (i % 3) * 28);

      const maxHp = Math.max(25, Math.round(getEnemyMaxHealth(archetype) * hpScale));
      const unit: EnemyUnitState = {
        id,
        archetype,
        callsign: `${callsignPrefixes[archetype]}-${id}`,
        pos: { x: sx, y: sy, z: sz },
        heading: Math.atan2(sx - this.player.pos.x, sz - this.player.pos.z),
        pitch: 0,
        bank: 0,
        speed: (archetype === 'gunship' ? 74 : 102) + speedBonus,
        health: maxHp,
        maxHealth: maxHp,
        fireCooldown: Math.max(1.2, 2.0 - (waveNum - 1) * 0.12) + cooldownBonus + (i % 3) * 0.65,
        telegraphTimer: 0,
        aiPhaseOffset: i * 1.35,
        evadeTimer: 0,
        alive: true,
        dyingTimer: 0,
        hitFlashTimer: 0,
      };
      this.enemies.push(unit);

      const rig = createEnemyJetModel(archetype);
      rig.root.position.set(sx, sy, sz);
      this.scene.add(rig.root);
      this.enemyRigs.set(id, rig);
    }
  }

  private showBanner(msg: string, duration = 2.5): void {
    this.bannerMessage = msg;
    this.bannerTimer = duration;
  }

  /* ================================================================== */
  /* Input                                                                */
  /* ================================================================== */

  /** Merge keyboard, mouse, touch joystick and touch buttons into one input frame. */
  private readInput(): FlightInput {
    let pitch = this.touchJoyY;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) pitch += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) pitch -= 1;

    let roll = this.touchJoyX;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) roll += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) roll -= 1;

    let yaw = 0;
    if (this.keys.has('KeyE')) yaw += 1;
    if (this.keys.has('KeyQ')) yaw -= 1;

    let throttleDelta = this.mouseThrottleImpulse;
    this.mouseThrottleImpulse = 0;
    if (this.keys.has('Equal') || this.keys.has('BracketRight')) throttleDelta += 1;
    if (this.keys.has('Minus') || this.keys.has('BracketLeft')) throttleDelta -= 1;

    const boost =
      this.touchButtons.boost ||
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.keys.has('KeyB');

    const fireGun =
      this.touchButtons.fireGun ||
      this.mouseGunDown ||
      this.keys.has('Space') ||
      this.keys.has('KeyJ');

    // Edge-triggered actions are consumed here so a single press fires once.
    const fireMissile = this.missileJustPressed;
    const maneuver = this.maneuverJustPressed;
    this.missileJustPressed = false;
    this.maneuverJustPressed = false;

    return {
      pitch: clamp(pitch, -1, 1),
      roll: clamp(roll, -1, 1),
      yaw: clamp(yaw, -1, 1),
      throttleDelta: clamp(throttleDelta, -3, 3),
      boost,
      fireGun,
      fireMissile,
      maneuver,
    };
  }

  /* ================================================================== */
  /* Particles & explosions                                               */
  /* ================================================================== */

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    maxAge: number,
    startScale: number,
    endScale: number,
    hexColor: number
  ): void {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % this.MAX_PARTICLES;
    p.active = true;
    p.pos.set(x, y, z);
    p.vel.set(vx, vy, vz);
    p.age = 0;
    p.maxAge = maxAge;
    p.startScale = startScale;
    p.endScale = endScale;
    p.color.setHex(hexColor);
  }

  private spawnShockwave(pos: { x: number; y: number; z: number }, maxScale = 34): void {
    const slot = this.shockwaves.find((s) => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.age = 0;
    slot.maxAge = 0.55;
    slot.maxScale = maxScale;
    slot.mesh.visible = true;
    slot.mesh.position.set(pos.x, pos.y, pos.z);
    slot.mesh.lookAt(this.camera.position);
    slot.mesh.scale.setScalar(2);
  }

  private spawnExplosion(pos: { x: number; y: number; z: number }, scale = 1): void {
    this.spawnShockwave(pos, 34 * scale);
    const count = Math.round(26 * scale);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (22 + Math.random() * 68) * scale;
      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.cos(phi) * speed;
      const vz = Math.sin(phi) * Math.sin(theta) * speed;
      const isCore = i < count * 0.5;
      this.spawnParticle(
        pos.x,
        pos.y,
        pos.z,
        vx,
        vy,
        vz,
        isCore ? 0.5 + Math.random() * 0.35 : 0.95 + Math.random() * 0.65,
        (isCore ? 2.4 : 4.2) * scale,
        (isCore ? 8.5 : 13.5) * scale,
        isCore ? (i % 3 === 0 ? 0xfef08a : 0xf97316) : 0x334155
      );
    }
  }

  /* ================================================================== */
  /* Weapons                                                              */
  /* ================================================================== */

  /** Fire one cannon round from the alternating muzzle, with aim-assist lead. */
  private firePlayerCannons(): void {
    if (this.gunOverheated || this.player.gunHeat >= 0.98) {
      if (!this.gunOverheated) {
        this.gunOverheated = true;
        this.showBanner('CANNON OVERHEAT — COOLING', 1.4);
      }
      return;
    }
    const bulletSpeed = 680;
    const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
    const assist = computeAimAssistLead(
      this.player,
      this.enemies,
      this.lockedTargetId,
      bulletSpeed,
      this.difficulty
    );
    const dirX = assist ? assist.aimDir.x : fwd.x;
    const dirY = assist ? assist.aimDir.y : fwd.y;
    const dirZ = assist ? assist.aimDir.z : fwd.z;

    const idx = this.muzzleToggle % 2;
    const muzzle = this.playerRig.gunMuzzles[idx];
    this.muzzleToggle++;
    muzzle.getWorldPosition(_vB);
    this.muzzleFlashTimers[idx] = 0.055;

    for (const slot of this.bullets) {
      if (!slot.active) {
        slot.active = true;
        slot.fromPlayer = true;
        slot.pos.copy(_vB);
        slot.vel.set(
          dirX * bulletSpeed + (Math.random() - 0.5) * 3,
          dirY * bulletSpeed + (Math.random() - 0.5) * 3,
          dirZ * bulletSpeed + (Math.random() - 0.5) * 3
        );
        slot.life = 1.65;
        this.shotsFired++;
        this.sound.playCannonShot();
        break;
      }
    }
  }

  private fireEnemyBullet(enemy: EnemyUnitState, spread: number): void {
    const dx = this.player.pos.x - enemy.pos.x;
    const dy = this.player.pos.y - enemy.pos.y;
    const dz = this.player.pos.z - enemy.pos.z;
    const len = Math.max(1, Math.hypot(dx, dy, dz));

    for (const slot of this.bullets) {
      if (!slot.active) {
        slot.active = true;
        slot.fromPlayer = false;
        slot.pos.set(enemy.pos.x, enemy.pos.y, enemy.pos.z);
        slot.vel.set(
          (dx / len + (Math.random() - 0.5) * spread) * 290,
          (dy / len + (Math.random() - 0.5) * spread) * 290,
          (dz / len + (Math.random() - 0.5) * spread) * 290
        );
        slot.life = 2.4;
        break;
      }
    }
  }

  private launchPlayerMissile(): void {
    if (this.player.missiles <= 0) return;
    const slot = this.missiles.find((m) => m.fromPlayer && !m.active);
    if (!slot) return;

    this.player.missiles--;
    this.shotsFired++;
    const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
    slot.active = true;
    slot.pos.set(
      this.player.pos.x + (this.player.missiles % 2 === 0 ? -2.4 : 2.4),
      this.player.pos.y - 1.0,
      this.player.pos.z
    );
    const launchSpeed = Math.max(260, this.player.speed + 145);
    slot.vel.set(fwd.x * launchSpeed, fwd.y * launchSpeed, fwd.z * launchSpeed);

    slot.targetEnemyId = this.acquireMissileTarget(fwd);
    slot.life = 6.0;
    slot.mesh.visible = true;
    slot.mesh.position.copy(slot.pos);
    this.sound.playMissileLaunch();
    this.trauma = Math.min(1, this.trauma + 0.14);
  }

  /**
   * Pick a missile target: the locked / auto-selected enemy when one is
   * good enough, otherwise the best-scoring hostile ahead of the jet.
   */
  private acquireMissileTarget(fwd: Vec3): number | null {
    let targetId: number | null =
      this.autoTargetEnabled && this.lockedTargetId !== null
        ? this.lockedTargetId
        : this.lockedTargetId !== null && this.lockProgress >= 0.35
        ? this.lockedTargetId
        : null;
    if (targetId !== null) return targetId;

    let bestScore = -Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.pos.x - this.player.pos.x;
      const dy = e.pos.y - this.player.pos.y;
      const dz = e.pos.z - this.player.pos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 10 || dist > 2000) continue;
      const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
      if (dot > 0.52) {
        const score = dot - dist / 4500;
        if (score > bestScore) {
          bestScore = score;
          targetId = e.id;
        }
      }
    }
    return targetId;
  }

  private launchEnemyMissile(enemy: EnemyUnitState): void {
    const slot = this.missiles.find((m) => !m.fromPlayer && !m.active);
    if (!slot) return;

    const diffCfg = DIFFICULTY_CONFIG[this.difficulty];
    slot.active = true;
    slot.pos.set(enemy.pos.x, enemy.pos.y - 1.5, enemy.pos.z);
    _vA.set(
      this.player.pos.x - enemy.pos.x,
      this.player.pos.y - enemy.pos.y,
      this.player.pos.z - enemy.pos.z
    ).normalize();
    slot.vel.copy(_vA).multiplyScalar(diffCfg.enemyMissileSpeed);
    slot.targetEnemyId = null;
    slot.life = 6.0;
    slot.mesh.visible = true;
    slot.mesh.position.copy(slot.pos);
    this.sound.playIncomingAlert();
    this.showBanner('INCOMING MISSILE — EVADE!', 2.2);
  }

  /* ================================================================== */
  /* Damage, scoring & run end                                            */
  /* ================================================================== */

  private damageEnemy(enemy: EnemyUnitState, amount: number, isMissile: boolean): void {
    if (!enemy.alive) return;
    enemy.health -= amount;
    enemy.hitFlashTimer = 0.08;
    this.hitMarkerTimer = 0.16;
    this.shotsHit++;

    if (enemy.health <= 0) {
      this.registerKill(enemy, isMissile);
    } else {
      if (enemy.evadeTimer <= 0 && enemy.archetype !== 'gunship') {
        enemy.evadeTimer = 1.25;
      }
      this.combatFeedback = {
        text: isMissile ? `MISSILE HIT -${amount} DMG` : `HIT -${amount} DMG`,
        kind: isMissile ? 'crit' : 'hit',
        timer: isMissile ? 0.85 : 0.45,
      };
      this.sound.playHitImpact();
    }
  }

  /** Score, combo, best-score persistence and feedback for a destroyed hostile. */
  private registerKill(enemy: EnemyUnitState, isMissile: boolean): void {
    enemy.health = 0;
    enemy.alive = false;
    enemy.dyingTimer = 0.85;
    this.kills++;
    const basePts = getEnemyScoreValue(enemy.archetype);
    const pts = basePts * this.combo;
    this.score += pts;
    this.combo = Math.min(5, this.combo + 1);
    this.comboTimer = 8.0;

    this.persistBestScore();
    this.hitstopTimer = isMissile ? 0.045 : 0.025;
    this.trauma = Math.min(1, this.trauma + 0.36);
    this.spawnExplosion(enemy.pos, 1.45);
    this.sound.playExplosion(true);
    this.combatFeedback = {
      text: `TARGET DESTROYED · ${enemy.callsign} (+${pts})`,
      kind: 'kill',
      timer: 1.65,
    };
    if (this.lockedTargetId === enemy.id) {
      const nextLock = evaluateTargetLock(
        this.player,
        this.enemies,
        null,
        0,
        0.016,
        this.difficulty,
        this.autoTargetEnabled
      );
      this.lockedTargetId = nextLock.lockedId;
      this.lockProgress = nextLock.lockProgress;
    }
  }

  private persistBestScore(): void {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try {
        localStorage.setItem('sky_warrior_best_score', String(this.bestScore));
      } catch {
        // Ignore
      }
    }
  }

  private damagePlayer(amount: number, reason: string): void {
    if (this.mode === 'freeflight' || this.player.maneuverTimer > 0) return;
    this.player.health = Math.max(0, this.player.health - amount);
    this.damageFlash = 1.0;
    this.trauma = Math.min(1, this.trauma + 0.35);
    this.sound.playPlayerDamage();

    if (this.player.health <= 0) {
      this.finishRun('defeat', reason);
    }
  }

  private finishRun(outcome: 'victory' | 'defeat', reason: string | null = null): void {
    if (this.phase === 'victory' || this.phase === 'defeat') return;
    this.phase = outcome;
    this.defeatReason = reason;
    document.body.dataset.state = 'gameover';
    this.sound.updateEngine(false, 0, false, 0, 0);

    const checkpointsCleared = this.checkpoints.filter((c) => c.collected).length;
    if (outcome === 'victory') {
      const timeBonus = this.timeRemainingSec ? Math.round(this.timeRemainingSec * 12) : 0;
      const ringBonus = checkpointsCleared * 250;
      this.score += 1000 + timeBonus + ringBonus;
      this.persistBestScore();
      this.sound.playVictory();
    } else {
      this.spawnExplosion(this.player.pos, 1.8);
      this.sound.playExplosion(true);
      this.sound.playDefeat();
    }

    this.callbacks.onPhaseChange(outcome);
    const accuracyPct = this.shotsFired > 0 ? Math.min(100, Math.round((this.shotsHit / this.shotsFired) * 100)) : 0;
    const rank = computeMissionRank(outcome, accuracyPct, this.player.health, this.kills);

    this.callbacks.onRunEnd({
      outcome,
      mode: this.mode,
      difficulty: this.difficulty,
      missionTitle:
        this.mode === 'missions'
          ? MISSIONS[this.missionIndex].title
          : this.mode === 'survival'
          ? 'Endless Survival'
          : 'Free Flight',
      score: this.score,
      bestScore: this.bestScore,
      rank,
      kills: this.kills,
      wave: this.wave,
      elapsedSec: Math.round(this.elapsedSec),
      accuracyPct,
      checkpointsCleared,
      checkpointsTotal: this.checkpoints.length,
      defeatReason: reason,
    });
    this.emitHud();
  }

  /* ================================================================== */
  /* Simulation — one fixed step                                          */
  /* ================================================================== */

  private stepSimulation(dt: number): void {
    this.clockTime += dt;
    this.decayFeedbackTimers(dt);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    this.elapsedSec += dt;
    if (this.timeRemainingSec !== null && this.player.takeoffTimer <= 0) {
      this.timeRemainingSec = Math.max(0, this.timeRemainingSec - dt);
      if (this.timeRemainingSec <= 0) {
        this.finishRun('defeat', 'Mission timer expired before objectives were cleared.');
        return;
      }
    }

    const diffCfg = DIFFICULTY_CONFIG[this.difficulty];
    const input = this.readInput();

    // Gun-heat latch: once tripped (>= 0.98) the cannon stays locked out
    // until heat has cooled back down to <= 0.45.
    this.clearOverheatIfCooled();
    const flightInput = this.gunOverheated ? { ...input, fireGun: false } : input;
    const prevManeuver = this.player.maneuverTimer;
    const flightOutcome = stepPlayerFlight(this.player, flightInput, dt, this.mode, this.difficulty);
    this.tripOverheatIfHot();

    if (prevManeuver <= 0 && this.player.maneuverTimer > 0) {
      this.sound.playManeuver();
      this.spawnManeuverBurst();
    }

    if (flightOutcome.terrainCrash) {
      this.finishRun('defeat', 'Aircraft lost in terrain impact.');
      return;
    }
    if (flightOutcome.terrainScraped) {
      this.damageFlash = 0.65;
      this.showBanner('LOW ALTITUDE — PULL UP!', 1.5);
    }
    if (flightOutcome.fuelDepleted) {
      this.finishRun('defeat', 'Fuel reserves exhausted.');
      return;
    }

    if (!this.handleBuildingCollision(diffCfg)) return;

    this.spawnWingtipRibbons();
    this.animateControlSurfaces(input, dt);

    // Smooth landing gear retraction after liftoff
    const gearScale = this.player.takeoffTimer > 1.0 ? 1 : clamp(this.player.takeoffTimer / 1.0, 0, 1);
    this.playerRig.landingGear.visible = gearScale > 0.05;
    this.playerRig.landingGear.scale.set(1, gearScale, 1);

    // Assisted Pursuit gently turns toward auto-selected target when player isn't overriding stick
    const pursuitTarget = this.enemies.find((e) => e.id === this.lockedTargetId && e.alive) ?? null;
    applyAssistedPursuit(
      this.player,
      pursuitTarget,
      input,
      this.world.buildingObstacles,
      dt,
      this.autoTargetEnabled && this.mode !== 'freeflight'
    );

    this.syncPlayerRigTransform(dt);

    // Weapons
    if (this.gunFireTimer > 0) this.gunFireTimer -= dt;
    if (input.fireGun && !this.gunOverheated && this.player.takeoffTimer <= 0 && this.gunFireTimer <= 0) {
      this.firePlayerCannons();
      this.gunFireTimer = 0.08;
    }

    if (input.fireMissile && this.player.takeoffTimer <= 0) {
      this.launchPlayerMissile();
    }

    const lockRes = evaluateTargetLock(
      this.player,
      this.enemies,
      this.lockedTargetId,
      this.lockProgress,
      dt,
      this.difficulty,
      this.autoTargetEnabled
    );
    this.lockedTargetId = lockRes.lockedId;
    this.lockProgress = lockRes.lockProgress;

    this.sound.updateEngine(
      true,
      clamp((this.player.speed - 60) / 180, 0, 1),
      this.player.afterburnerActive,
      dt,
      this.lockProgress
    );

    const aliveEnemies = this.stepEnemySquadron(dt);
    this.stepEnemyMissileTimer(dt, diffCfg, aliveEnemies);
    this.stepBulletPool(dt, diffCfg);
    this.stepMissilePool(dt, diffCfg);
    this.stepCheckpointRings(dt);
    this.stepCollectiblePods(dt);
    this.checkWaveProgress(aliveEnemies, dt);
  }

  /** Decay all the short-lived feedback timers each frame. */
  private decayFeedbackTimers(dt: number): void {
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 2.8);
    if (this.hitMarkerTimer > 0) this.hitMarkerTimer = Math.max(0, this.hitMarkerTimer - dt);
    if (this.combatFeedback) {
      this.combatFeedback.timer -= dt;
      if (this.combatFeedback.timer <= 0) this.combatFeedback = null;
    }
    if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - dt * 1.9);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerMessage = null;
    }
    for (let i = 0; i < 2; i++) {
      if (this.muzzleFlashTimers[i] > 0) {
        this.muzzleFlashTimers[i] = Math.max(0, this.muzzleFlashTimers[i] - dt);
      }
      this.playerRig.muzzleFlashes[i].visible = this.muzzleFlashTimers[i] > 0;
    }
  }

  private clearOverheatIfCooled(): void {
    if (this.gunOverheated && this.player.gunHeat <= 0.45) {
      this.gunOverheated = false;
    }
  }

  private tripOverheatIfHot(): void {
    if (!this.gunOverheated && this.player.gunHeat >= 0.98) {
      this.gunOverheated = true;
      this.showBanner('CANNON OVERHEAT — COOLING', 1.4);
    }
  }

  private spawnManeuverBurst(): void {
    for (let i = 0; i < 10; i++) {
      this.spawnParticle(
        this.player.pos.x,
        this.player.pos.y - 1,
        this.player.pos.z,
        (Math.random() - 0.5) * 48,
        -14 - Math.random() * 18,
        (Math.random() - 0.5) * 48,
        0.95,
        0.9,
        2.2,
        0xfef08a
      );
    }
  }

  /**
   * Physical skyscraper / tower collision: shove the jet out of the
   * building footprint, lift it above the roofline and pitch it up.
   * Returns false when the hit ended the run (caller must stop stepping).
   */
  private handleBuildingCollision(diffCfg: (typeof DIFFICULTY_CONFIG)[DifficultyMode]): boolean {
    if (this.player.takeoffTimer > 0) return true;
    const hitBuilding = checkPlayerBuildingCollision(this.player.pos, this.world.buildingObstacles);
    if (!hitBuilding) return true;

    const dx = this.player.pos.x - hitBuilding.x;
    const dz = this.player.pos.z - hitBuilding.z;
    const dist = Math.max(1, Math.hypot(dx, dz));
    this.player.pos.x = hitBuilding.x + (dx / dist) * (hitBuilding.halfW + 10);
    this.player.pos.z = hitBuilding.z + (dz / dist) * (hitBuilding.halfD + 10);
    this.player.pos.y = Math.max(this.player.pos.y, hitBuilding.topY + 8);
    this.player.pitch = Math.max(0.22, this.player.pitch);
    if (this.mode !== 'freeflight' && this.player.collisionCooldown <= 0) {
      this.player.collisionCooldown = 1.4;
      this.spawnExplosion(this.player.pos, 0.65);
      this.showBanner('TOWER CLEARANCE — PULL UP!', 1.5);
      this.damagePlayer(diffCfg.scrapeDmg, 'Aircraft lost in urban tower impact.');
      if (this.phase !== 'playing') return false;
    }
    return true;
  }

  /** Crisp wingtip condensation ribbons when banking hard or boosting. */
  private spawnWingtipRibbons(): void {
    if (
      !((this.player.afterburnerActive && this.player.takeoffTimer <= 0) || Math.abs(this.player.bank) > 0.55)
    ) {
      return;
    }
    const rx = Math.cos(this.player.heading) * 5.6;
    const rz = -Math.sin(this.player.heading) * 5.6;
    const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
    this.spawnParticle(
      this.player.pos.x + rx - fwd.x * 2.5,
      this.player.pos.y,
      this.player.pos.z + rz - fwd.z * 2.5,
      -fwd.x * 8,
      -fwd.y * 8,
      -fwd.z * 8,
      0.26,
      0.16,
      0.38,
      0xe2e8f0
    );
    this.spawnParticle(
      this.player.pos.x - rx - fwd.x * 2.5,
      this.player.pos.y,
      this.player.pos.z - rz - fwd.z * 2.5,
      -fwd.x * 8,
      -fwd.y * 8,
      -fwd.z * 8,
      0.26,
      0.16,
      0.38,
      0xe2e8f0
    );
  }

  /** Ease ailerons / elevators / rudders toward the current stick deflection. */
  private animateControlSurfaces(input: FlightInput, dt: number): void {
    const rig = this.playerRig;
    rig.leftAileron.rotation.x = damp(rig.leftAileron.rotation.x, input.roll * 0.48, 12, dt);
    rig.rightAileron.rotation.x = damp(rig.rightAileron.rotation.x, -input.roll * 0.48, 12, dt);
    rig.leftElevator.rotation.x = damp(rig.leftElevator.rotation.x, -input.pitch * 0.42, 12, dt);
    rig.rightElevator.rotation.x = damp(rig.rightElevator.rotation.x, -input.pitch * 0.42, 12, dt);
    rig.leftRudder.rotation.y = damp(rig.leftRudder.rotation.y, input.yaw * 0.42, 12, dt);
    rig.rightRudder.rotation.y = damp(rig.rightRudder.rotation.y, input.yaw * 0.42, 12, dt);
  }

  /**
   * Step every enemy's AI (at most 3 attack tokens per frame), sync rigs,
   * and remove fully-dead units. Returns the number of enemies alive
   * at the start of the frame — the wave logic's source of truth.
   */
  private stepEnemySquadron(dt: number): number {
    let activeAttackTokens = 3;
    let aliveEnemies = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.alive) aliveEnemies++;

      const canAttack = activeAttackTokens > 0 && this.player.takeoffTimer <= 0 && this.mode !== 'freeflight';
      const aiRes = stepEnemyAI(enemy, this.player, this.elapsedSec, dt, canAttack);
      if (aiRes.wantsToFire) {
        activeAttackTokens--;
        this.fireEnemyBullet(enemy, aiRes.fireSpread);
      }

      const rig = this.enemyRigs.get(enemy.id);
      if (rig) {
        this.syncEnemyRig(rig, enemy, dt);
      }

      if (!enemy.alive && enemy.dyingTimer <= 0) {
        this.spawnExplosion(enemy.pos, 1.0);
        if (rig) {
          this.scene.remove(rig.root);
          this.disposeGroupResources(rig.root);
          this.enemyRigs.delete(enemy.id);
        }
        this.enemies.splice(i, 1);
      }
    }
    return aliveEnemies;
  }

  /** Pose one enemy rig, flicker its flame, show telegraphs and hit flashes. */
  private syncEnemyRig(rig: EnemyModelRig, enemy: EnemyUnitState, dt: number): void {
    rig.root.position.set(enemy.pos.x, enemy.pos.y, enemy.pos.z);
    _euler.set(enemy.pitch, enemy.heading, enemy.bank, 'YXZ');
    rig.root.quaternion.setFromEuler(_euler);
    const flicker = 0.85 + Math.sin(this.clockTime * 35 + enemy.id) * 0.25;
    rig.flameMesh.scale.set(1, 1, flicker);

    // Telegraph glow before enemy fires + Gunship turret tracking
    const teleMat = rig.telegraphGlow.material as THREE.MeshBasicMaterial;
    teleMat.opacity = enemy.telegraphTimer > 0 ? 0.85 : 0;
    if (rig.turretGroup && enemy.alive) {
      rig.turretGroup.rotation.y += dt * 1.4;
    }

    // Death spiral smoke ribbon
    if (!enemy.alive) {
      this.spawnParticle(enemy.pos.x, enemy.pos.y, enemy.pos.z, 0, 2, 0, 0.55, 1.5, 4.5, 0x334155);
    }

    for (const mat of rig.bodyMaterials) {
      if (enemy.hitFlashTimer > 0) {
        mat.emissive.setHex(0xffffff);
        mat.emissiveIntensity = 1.8;
      } else {
        mat.emissiveIntensity = 0.22;
        mat.emissive.setHex(
          enemy.archetype === 'interceptor' ? 0x7f1d1d : enemy.archetype === 'flanker' ? 0x0284c7 : 0xb45309
        );
      }
    }
  }

  /** Periodic enemy missile launches (never during takeoff or free flight). */
  private stepEnemyMissileTimer(
    dt: number,
    diffCfg: (typeof DIFFICULTY_CONFIG)[DifficultyMode],
    aliveEnemies: number
  ): void {
    if (this.mode === 'freeflight' || aliveEnemies <= 0 || this.player.takeoffTimer > 0) return;
    this.enemyMissileCooldown -= dt;
    if (this.enemyMissileCooldown > 0) return;
    const attacker = this.enemies.find((e) => e.alive);
    if (attacker) this.launchEnemyMissile(attacker);
    this.enemyMissileCooldown =
      this.mode === 'survival'
        ? Math.max(7.5, diffCfg.enemyMissileCooldown - this.wave * 0.4)
        : diffCfg.enemyMissileCooldown;
  }

  /** Step tracer rounds with continuous swept segment-sphere collision. */
  private stepBulletPool(dt: number, diffCfg: (typeof DIFFICULTY_CONFIG)[DifficultyMode]): void {
    for (let i = 0; i < this.MAX_BULLETS; i++) {
      const b = this.bullets[i];
      if (!b.active) {
        _dummy.scale.set(0, 0, 0);
        _dummy.updateMatrix();
        this.bulletMesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        continue;
      }

      _vPrev.copy(b.pos);
      b.pos.addScaledVector(b.vel, dt);

      const groundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(b.pos.x, b.pos.z));
      if (b.pos.y <= groundY) {
        b.active = false;
        this.spawnParticle(b.pos.x, groundY + 1, b.pos.z, 0, 12, 0, 0.32, 1.5, 4.5, 0xfdba74);
        continue;
      }

      if (b.fromPlayer) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const hitRadius = (enemy.archetype === 'gunship' ? 15 : 11) + diffCfg.bulletHitRadiusBonus;
          if (checkSegmentSphereCollision(_vPrev, b.pos, enemy.pos, hitRadius)) {
            b.active = false;
            this.damageEnemy(enemy, diffCfg.playerCannonDmg, false);
            this.spawnParticle(b.pos.x, b.pos.y, b.pos.z, 0, 0, 0, 0.25, 1.8, 4.4, 0xfef08a);
            break;
          }
        }
      } else {
        if (checkSegmentSphereCollision(_vPrev, b.pos, this.player.pos, 7.0)) {
          b.active = false;
          this.damagePlayer(diffCfg.enemyCannonDmg, 'Shot down by hostile cannon fire.');
        }
      }

      if (b.active) {
        _dummy.position.copy(b.pos);
        _vC.copy(b.pos).add(b.vel);
        _dummy.lookAt(_vC);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        this.bulletMesh.setMatrixAt(i, _dummy.matrix);
        this.bulletMesh.setColorAt(i, _color.setHex(b.fromPlayer ? 0xfef08a : 0xf87171));
      }
    }
    this.bulletMesh.instanceMatrix.needsUpdate = true;
    if (this.bulletMesh.instanceColor) this.bulletMesh.instanceColor.needsUpdate = true;
  }

  /** Step guided missiles: homing, smoke trails, swept collision. */
  private stepMissilePool(dt: number, diffCfg: (typeof DIFFICULTY_CONFIG)[DifficultyMode]): void {
    for (const m of this.missiles) {
      if (!m.active) continue;
      m.life -= dt;
      if (m.life <= 0) {
        m.active = false;
        m.mesh.visible = false;
        continue;
      }

      if (m.fromPlayer) {
        this.steerPlayerMissile(m, dt);
      } else {
        this.steerEnemyMissile(m, dt, diffCfg);
      }

      _vPrev.copy(m.pos);
      m.pos.addScaledVector(m.vel, dt);
      m.mesh.position.copy(m.pos);
      _vC.copy(m.pos).add(m.vel);
      m.mesh.lookAt(_vC);

      const mGroundY = Math.max(OCEAN_LEVEL, sampleTerrainHeight(m.pos.x, m.pos.z));
      if (m.pos.y <= mGroundY) {
        m.active = false;
        m.mesh.visible = false;
        this.spawnExplosion({ x: m.pos.x, y: mGroundY + 1, z: m.pos.z }, 0.85);
        continue;
      }

      // Realistic tapering missile smoke ribbon
      this.spawnParticle(
        m.pos.x,
        m.pos.y,
        m.pos.z,
        (Math.random() - 0.5) * 4,
        1.2,
        (Math.random() - 0.5) * 4,
        0.55,
        0.55,
        1.9,
        m.fromPlayer ? 0xe2e8f0 : 0xfca5a5
      );

      if (m.fromPlayer) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          if (checkSegmentSphereCollision(_vPrev, m.pos, enemy.pos, diffCfg.missileHitRadius)) {
            m.active = false;
            m.mesh.visible = false;
            this.damageEnemy(enemy, diffCfg.playerMissileDmg, true);
            this.spawnExplosion(m.pos, 1.15);
            break;
          }
        }
      } else {
        if (checkSegmentSphereCollision(_vPrev, m.pos, this.player.pos, 10)) {
          m.active = false;
          m.mesh.visible = false;
          this.damagePlayer(diffCfg.enemyMissileDmg, 'Direct hit from hostile air-to-air missile.');
          this.spawnExplosion(m.pos, 0.95);
        }
      }
    }
  }

  /** Home a player missile toward its target with a small predictive lead. */
  private steerPlayerMissile(m: ActiveMissile, dt: number): void {
    let target = this.enemies.find((e) => e.id === m.targetEnemyId && e.alive);
    if (!target && this.autoTargetEnabled) {
      // Re-acquire nearest active enemy if original target was destroyed mid-flight
      let bestDist = 1400;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.pos.x - m.pos.x, e.pos.y - m.pos.y, e.pos.z - m.pos.z);
        if (d < bestDist) {
          bestDist = d;
          target = e;
          m.targetEnemyId = e.id;
        }
      }
    }
    if (!target) return;
    const dist = Math.hypot(target.pos.x - m.pos.x, target.pos.y - m.pos.y, target.pos.z - m.pos.z);
    const leadSec = clamp(dist / 480, 0, 0.25);
    const tFwd = getForwardVector(target.heading, target.pitch, _vA);
    _vB
      .set(
        target.pos.x + tFwd.x * target.speed * leadSec - m.pos.x,
        target.pos.y + tFwd.y * target.speed * leadSec - m.pos.y,
        target.pos.z + tFwd.z * target.speed * leadSec - m.pos.z
      )
      .normalize();
    const speed = m.vel.length();
    m.vel
      .normalize()
      .lerp(_vB, clamp(dt * 11.5, 0, 1))
      .normalize()
      .multiplyScalar(Math.min(470, speed + dt * 150));
  }

  /** Home an enemy missile at the player; a maneuver makes it dive away. */
  private steerEnemyMissile(
    m: ActiveMissile,
    dt: number,
    diffCfg: (typeof DIFFICULTY_CONFIG)[DifficultyMode]
  ): void {
    if (this.player.maneuverTimer > 0) {
      m.vel.y -= dt * 135;
    } else {
      _vB.set(
        this.player.pos.x - m.pos.x,
        this.player.pos.y - m.pos.y,
        this.player.pos.z - m.pos.z
      ).normalize();
      const speed = m.vel.length();
      m.vel.normalize().lerp(_vB, clamp(dt * diffCfg.enemyMissileTurn, 0, 1)).normalize().multiplyScalar(speed);
    }
  }

  /** Animate checkpoint rings and pay out ring-clear rewards. */
  private stepCheckpointRings(dt: number): void {
    const nextCp = this.checkpoints.find((c) => !c.collected);
    for (const cp of this.checkpoints) {
      const mesh = this.checkpointMeshes.get(cp.id);
      if (mesh) {
        mesh.visible = !cp.collected;
        if (!cp.collected) {
          mesh.rotation.z += dt * (cp.id === nextCp?.id ? 1.8 : 0.45);
          const scale = cp.id === nextCp?.id ? 1 + Math.sin(this.clockTime * 4) * 0.06 : 0.88;
          mesh.scale.setScalar(scale);
        }
      }
      if (!cp.collected && checkSphereCollision(this.player.pos, cp.pos, cp.radius)) {
        cp.collected = true;
        const pts = 500 * this.combo;
        this.score += pts;
        this.combo = Math.min(5, this.combo + 1);
        this.comboTimer = 8.0;
        this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 25);
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        this.player.missiles = Math.min(this.player.maxMissiles, this.player.missiles + 2);
        this.sound.playCheckpoint();
        this.showBanner(`RING ${cp.order} CLEARED (+${pts} · +20 HP)`, 1.8);
      }
    }
  }

  /** Bob collectible pods and apply their pickup effects. */
  private stepCollectiblePods(dt: number): void {
    for (const col of this.collectibles) {
      const mesh = this.collectibleMeshes.get(col.id);
      if (mesh) {
        mesh.visible = !col.collected;
        if (!col.collected) {
          mesh.rotation.y += dt * 1.9;
          mesh.position.y = col.pos.y + Math.sin(this.clockTime * 2.4 + col.bobPhase) * 3.5;
        }
      }
      if (!col.collected && checkSphereCollision(this.player.pos, col.pos, col.radius)) {
        col.collected = true;
        this.sound.playCollectible();
        if (col.kind === 'repair') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
          this.showBanner('HULL REPAIRED (+35 HP)', 1.8);
        } else if (col.kind === 'fuel') {
          this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 40);
          this.showBanner('FUEL POD COLLECTED (+40%)', 1.8);
        } else if (col.kind === 'missile') {
          this.player.missiles = this.player.maxMissiles;
          this.showBanner('ORDNANCE RESUPPLIED', 1.8);
        } else {
          this.score += 500 * this.combo;
          this.showBanner(`STAR POD SECURED (+${500 * this.combo})`, 1.8);
        }
      }
    }
  }

  /** Wave / mission completion checks (clearing all waves triggers Victory). */
  private checkWaveProgress(aliveEnemies: number, dt: number): void {
    if (this.mode === 'missions') {
      const m = MISSIONS[this.missionIndex];
      if (aliveEnemies === 0 && this.wave < this.totalWaves) {
        this.wave++;
        const clearBonus = 500 * (this.wave - 1);
        this.score += clearBonus;
        this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 25);
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        this.player.missiles = Math.min(this.player.maxMissiles, this.player.missiles + 2);
        const waveCount = Math.ceil(m.enemyCount / m.waves) + (this.difficulty === 'beginner' ? 0 : 1);
        this.spawnWaveEnemies(waveCount, this.wave);
        this.showBanner(`WAVE ${this.wave}/${this.totalWaves} INBOUND · +${clearBonus} BONUS`, 2.6);
      } else if (aliveEnemies === 0 && this.wave >= this.totalWaves) {
        this.finishRun('victory');
      }
    } else if (this.mode === 'survival') {
      if (aliveEnemies === 0) {
        this.survivalSpawnTimer += dt;
        if (this.survivalSpawnTimer >= 1.6) {
          this.survivalSpawnTimer = 0;
          this.wave++;
          this.score += 400 * this.wave;
          this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 25);
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 15);
          this.spawnWaveEnemies(Math.min(9, 3 + this.wave), this.wave);
          this.showBanner(`SURVIVAL WAVE ${this.wave} — HOSTILES DETECTED`, 2.8);
        }
      }
    } else if (this.mode === 'freeflight') {
      if (this.checkpoints.every((c) => c.collected)) {
        for (const c of this.checkpoints) c.collected = false;
        this.showBanner('AIRSPACE CIRCUIT COMPLETE — CHECKPOINTS RESET', 2.4);
      }
    }
  }

  /* ================================================================== */
  /* Particles stepping & player rig sync                                 */
  /* ================================================================== */

  private stepParticles(dt: number): void {
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) {
        _dummy.scale.set(0, 0, 0);
        _dummy.updateMatrix();
        this.particleMesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        continue;
      }
      p.pos.addScaledVector(p.vel, dt);
      const t = p.age / p.maxAge;
      const scale = lerp(p.startScale, p.endScale, t);
      _dummy.position.copy(p.pos);
      _dummy.scale.setScalar(scale);
      _dummy.rotation.set(0, 0, 0);
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummy.matrix);
      this.particleMesh.setColorAt(i, p.color);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;

    for (const s of this.shockwaves) {
      if (!s.active) continue;
      s.age += dt;
      if (s.age >= s.maxAge) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      const t = s.age / s.maxAge;
      s.mesh.scale.setScalar(lerp(2, s.maxScale, t));
      s.mesh.lookAt(this.camera.position);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85;
    }
  }

  private syncPlayerRigTransform(dt: number): void {
    this.playerRig.root.position.set(this.player.pos.x, this.player.pos.y, this.player.pos.z);
    _euler.set(this.player.pitch, this.player.heading, this.player.bank, 'YXZ');
    this.playerRig.root.quaternion.setFromEuler(_euler);

    const flameLen = this.player.afterburnerActive
      ? 1.55 + Math.sin(this.clockTime * 48) * 0.2
      : 0.45 + this.player.throttle * 0.5 + Math.sin(this.clockTime * 32) * 0.08;
    const flameRadius = this.player.afterburnerActive ? 1.15 : 0.68;
    this.playerRig.leftFlameOuter.scale.set(flameRadius, flameRadius, flameLen);
    this.playerRig.rightFlameOuter.scale.set(flameRadius, flameRadius, flameLen);
    this.playerRig.leftFlameInner.scale.set(flameRadius * 0.85, flameRadius * 0.85, flameLen * 0.9);
    this.playerRig.rightFlameInner.scale.set(flameRadius * 0.85, flameRadius * 0.85, flameLen * 0.9);

    for (let i = 0; i < this.playerRig.machDiamonds.length; i++) {
      const md = this.playerRig.machDiamonds[i];
      md.visible = this.player.afterburnerActive || this.player.throttle > 0.75;
      const pulse = 0.85 + Math.sin(this.clockTime * 55 + i) * 0.25;
      md.scale.setScalar(pulse);
    }

    this.playerRig.afterburnerLight.intensity = this.player.afterburnerActive ? 4.5 : 1.5;
    void dt;
  }

  /* ================================================================== */
  /* Camera                                                               */
  /* ================================================================== */

  private updateCamera(dt: number): void {
    if (this.phase === 'title') {
      this.updateTitleCamera(dt);
      return;
    }

    if (this.cameraMode === 'cockpit') {
      this.playerRig.cockpitCameraAnchor.getWorldPosition(_vA);
      this.camera.position.copy(_vA);
      const fwd = getForwardVector(this.player.heading, this.player.pitch, _vB);
      this.camLook.copy(_vA).addScaledVector(fwd, 120);
      this.camera.lookAt(this.camLook);
      this.camera.rotateZ(this.player.bank * 0.75);
    } else {
      this.updateChaseCamera(dt);
    }

    if (this.trauma > 0.01) {
      const shake = this.trauma * this.trauma * 0.045;
      this.camera.rotateX((Math.random() - 0.5) * shake);
      this.camera.rotateY((Math.random() - 0.5) * shake);
      this.camera.rotateZ((Math.random() - 0.5) * shake * 1.4);
    }

    const speedNorm = clamp((this.player.speed - 75) / 170, 0, 1);
    const targetFov = 62 + speedNorm * 14 + (this.player.afterburnerActive ? 4 : 0);
    this.camera.fov = damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();
  }

  /** Slow orbit around the parked showcase jet on the title screen. */
  private updateTitleCamera(dt: number): void {
    this.titleClock += dt;
    const orbitAngle = this.titleClock * 0.22 - 0.55;
    const dist = 23;
    const targetPos = _vA.set(
      this.player.pos.x + Math.sin(orbitAngle) * dist,
      this.player.pos.y + 4.8 + Math.sin(this.titleClock * 0.5) * 1.4,
      this.player.pos.z + Math.cos(orbitAngle) * dist
    );
    this.camPos.lerp(targetPos, 1 - Math.exp(-4 * dt));
    this.camLook.set(this.player.pos.x - 2, this.player.pos.y + 0.6, this.player.pos.z - 4);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.fov = damp(this.camera.fov, 52, 4, dt);
    this.camera.updateProjectionMatrix();
  }

  /** Chase / action follow camera with terrain & building anti-clipping. */
  private updateChaseCamera(dt: number): void {
    const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
    const isTakeoff = this.player.takeoffTimer > 0;
    const dist = isTakeoff ? 20 : this.cameraMode === 'action' ? 16 : 22;
    const height = isTakeoff ? 4.5 : this.cameraMode === 'action' ? 3.8 : 5.8;
    const sideOffset = this.cameraMode === 'action' && !isTakeoff ? 4.0 : 0;

    const rx = Math.cos(this.player.heading);
    const rz = -Math.sin(this.player.heading);

    _vB.set(
      this.player.pos.x - fwd.x * dist + rx * sideOffset,
      this.player.pos.y - fwd.y * dist + height,
      this.player.pos.z - fwd.z * dist + rz * sideOffset
    );

    // Ray-sampled terrain & skyscraper anti-clipping safety
    const safe = resolveSafeCameraPosition(this.player.pos, _vB, this.world.buildingObstacles);
    _vB.set(safe.x, safe.y, safe.z);

    const stiffness = isTakeoff ? 9.5 : 11.0;
    this.camPos.lerp(_vB, 1 - Math.exp(-stiffness * dt));

    _vC.set(
      this.player.pos.x + fwd.x * 55,
      this.player.pos.y + fwd.y * 55 + 1.4,
      this.player.pos.z + fwd.z * 55
    );
    this.camLook.lerp(_vC, 1 - Math.exp(-14 * dt));

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.rotateZ(this.player.bank * (this.cameraMode === 'action' ? 0.32 : 0.16));
  }

  /* ================================================================== */
  /* HUD snapshot                                                         */
  /* ================================================================== */

  /**
   * Project a world point to screen space, checking camera-space
   * coordinates FIRST so anything behind the camera never inverts
   * through .project() — the marker is clamped to the screen edge
   * with a direction arrow instead.
   */
  private projectTargets(): ProjectedTarget[] {
    const targets: ProjectedTarget[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      _vProj.set(enemy.pos.x, enemy.pos.y, enemy.pos.z).applyMatrix4(this.camera.matrixWorldInverse);
      const inFront = _vProj.z < -1.0;
      const dist = Math.hypot(
        enemy.pos.x - this.player.pos.x,
        enemy.pos.y - this.player.pos.y,
        enemy.pos.z - this.player.pos.z
      );

      let screenX = 0.5;
      let screenY = 0.5;
      let dirX = 0;
      let dirY = 0;

      if (inFront) {
        _vProj.set(enemy.pos.x, enemy.pos.y, enemy.pos.z).project(this.camera);
        const rawX = _vProj.x * 0.5 + 0.5;
        const rawY = -_vProj.y * 0.5 + 0.5;
        screenX = clamp(rawX, 0.08, 0.92);
        screenY = clamp(rawY, 0.14, 0.78);
        if (rawX < 0.08 || rawX > 0.92 || rawY < 0.14 || rawY > 0.78) {
          const dx = rawX - 0.5;
          const dy = rawY - 0.5;
          const mag = Math.max(1e-4, Math.hypot(dx, dy));
          dirX = dx / mag;
          dirY = dy / mag;
        }
      } else {
        // Offscreen behind/beside camera: compute screen-plane vector from camera-local x & -y
        const dx = _vProj.x;
        const dy = -_vProj.y;
        const mag = Math.max(1e-4, Math.hypot(dx, dy));
        dirX = dx / mag;
        dirY = dy / mag;
        screenX = clamp(0.5 + dirX * 0.44, 0.08, 0.92);
        screenY = clamp(0.48 + dirY * 0.34, 0.18, 0.76);
      }

      const isLockedTarget = enemy.id === this.lockedTargetId;
      targets.push({
        id: enemy.id,
        callsign: enemy.callsign,
        archetype: enemy.archetype,
        screenX,
        screenY,
        inFront,
        dirX,
        dirY,
        distance: Math.round(dist),
        healthRatio: enemy.health / enemy.maxHealth,
        isLockedTarget,
        lockProgress: isLockedTarget ? this.lockProgress : 0,
      });
    }
    return targets;
  }

  private projectNextCheckpoint(nextCp: CheckpointState | null): ProjectedCheckpoint | null {
    if (!nextCp) return null;
    _vProj.set(nextCp.pos.x, nextCp.pos.y, nextCp.pos.z).applyMatrix4(this.camera.matrixWorldInverse);
    const inFront = _vProj.z < -1.0;
    let screenX = 0.5;
    let screenY = 0.5;
    if (inFront) {
      _vProj.set(nextCp.pos.x, nextCp.pos.y, nextCp.pos.z).project(this.camera);
      screenX = clamp(_vProj.x * 0.5 + 0.5, 0.1, 0.9);
      screenY = clamp(-_vProj.y * 0.5 + 0.5, 0.16, 0.74);
    } else {
      const dx = _vProj.x;
      const dy = -_vProj.y;
      const mag = Math.max(1e-4, Math.hypot(dx, dy));
      screenX = clamp(0.5 + (dx / mag) * 0.4, 0.14, 0.86);
      screenY = clamp(0.48 + (dy / mag) * 0.3, 0.18, 0.72);
    }
    const dist = Math.hypot(
      nextCp.pos.x - this.player.pos.x,
      nextCp.pos.y - this.player.pos.y,
      nextCp.pos.z - this.player.pos.z
    );
    return {
      id: nextCp.id,
      screenX,
      screenY,
      inFront,
      distance: Math.round(dist),
      order: nextCp.order,
    };
  }

  /** Project the aim-assist lead point; null when it sits behind the camera. */
  private projectLeadTarget(): { screenX: number; screenY: number; distance: number } | null {
    const leadSol = computeAimAssistLead(
      this.player,
      this.enemies,
      this.lockedTargetId,
      680,
      this.difficulty
    );
    if (!leadSol) return null;
    _vProj
      .set(leadSol.interceptPos.x, leadSol.interceptPos.y, leadSol.interceptPos.z)
      .applyMatrix4(this.camera.matrixWorldInverse);
    if (_vProj.z >= -1.0) return null;
    _vProj
      .set(leadSol.interceptPos.x, leadSol.interceptPos.y, leadSol.interceptPos.z)
      .project(this.camera);
    return {
      screenX: clamp(_vProj.x * 0.5 + 0.5, 0.08, 0.92),
      screenY: clamp(-_vProj.y * 0.5 + 0.5, 0.14, 0.78),
      distance: leadSol.distance,
    };
  }

  /** Heading-relative radar blips for enemies, the next ring and pickups. */
  private buildRadarBlips(nextCp: CheckpointState | null): RadarBlip[] {
    const radarRange = 1350;
    const cosH = Math.cos(this.player.heading);
    const sinH = Math.sin(this.player.heading);
    const radarBlips: RadarBlip[] = [];

    const toRadar = (wx: number, wz: number) => {
      const dx = wx - this.player.pos.x;
      const dz = wz - this.player.pos.z;
      const rx = (dx * cosH - dz * sinH) / radarRange;
      const rz = (dx * sinH + dz * cosH) / radarRange;
      const mag = Math.hypot(rx, rz);
      if (mag > 0.94) {
        return { rx: (rx / mag) * 0.94, rz: (rz / mag) * 0.94 };
      }
      return { rx, rz };
    };

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const { rx, rz } = toRadar(e.pos.x, e.pos.z);
      radarBlips.push({
        id: e.id,
        dx: rx,
        dz: rz,
        kind: 'enemy',
        isLocked: e.id === this.lockedTargetId,
      });
    }
    if (nextCp) {
      const { rx, rz } = toRadar(nextCp.pos.x, nextCp.pos.z);
      radarBlips.push({ id: 1000 + nextCp.id, dx: rx, dz: rz, kind: 'checkpoint' });
    }
    for (const col of this.collectibles) {
      if (col.collected) continue;
      const { rx, rz } = toRadar(col.pos.x, col.pos.z);
      radarBlips.push({ id: 2000 + col.id, dx: rx, dz: rz, kind: 'collectible' });
    }
    return radarBlips;
  }

  private emitHud(): void {
    const targets = this.projectTargets();
    const nextCp = this.checkpoints.find((c) => !c.collected) ?? null;
    const projectedCp = this.projectNextCheckpoint(nextCp);
    const radarBlips = this.buildRadarBlips(nextCp);
    const leadTarget = this.projectLeadTarget();

    const lockedEnemy = this.enemies.find((e) => e.id === this.lockedTargetId && e.alive);
    const lockedDist = lockedEnemy
      ? Math.round(
          Math.hypot(
            lockedEnemy.pos.x - this.player.pos.x,
            lockedEnemy.pos.y - this.player.pos.y,
            lockedEnemy.pos.z - this.player.pos.z
          )
        )
      : null;

    const checkpointsCleared = this.checkpoints.filter((c) => c.collected).length;
    const aliveCount = this.enemies.filter((e) => e.alive).length;
    let incomingDistance: number | null = null;
    for (const m of this.missiles) {
      if (m.active && !m.fromPlayer) {
        const md = Math.round(
          Math.hypot(m.pos.x - this.player.pos.x, m.pos.y - this.player.pos.y, m.pos.z - this.player.pos.z)
        );
        if (incomingDistance === null || md < incomingDistance) incomingDistance = md;
      }
    }
    const incomingMissile = incomingDistance !== null;

    let objectiveText = 'Free Patrol — Clear Aerial Rings & Explore';
    if (this.mode === 'missions') {
      objectiveText = `Wave ${this.wave}/${this.totalWaves}: Destroy ${aliveCount} Hostile${
        aliveCount === 1 ? '' : 's'
      } (Bonus Rings ${checkpointsCleared}/${this.checkpoints.length})`;
    } else if (this.mode === 'survival') {
      objectiveText = `Survival Wave ${this.wave} · ${aliveCount} Hostile${aliveCount === 1 ? '' : 's'}`;
    }

    const headingDeg = ((Math.round((-this.player.heading * 180) / Math.PI) % 360) + 360) % 360;

    this.callbacks.onHudUpdate({
      phase: this.phase,
      mode: this.mode,
      difficulty: this.difficulty,
      autoTargetEnabled: this.autoTargetEnabled,
      missionIndex: this.missionIndex,
      missionTitle:
        this.mode === 'missions'
          ? MISSIONS[this.missionIndex].title
          : this.mode === 'survival'
          ? 'Survival Mode'
          : 'Free Flight',
      objectiveText,
      cameraMode: this.cameraMode,
      speedKnots: Math.round(this.player.speed * 4.2),
      altitudeMeters: Math.max(0, Math.round(this.player.pos.y * 3.5)),
      headingDeg,
      pitchDeg: Math.round((this.player.pitch * 180) / Math.PI),
      bankDeg: Math.round((this.player.bank * 180) / Math.PI),
      throttlePct: Math.round(this.player.throttle * 100),
      health: Math.round(this.player.health),
      maxHealth: this.player.maxHealth,
      fuel: Math.round(this.player.fuel),
      maxFuel: this.player.maxFuel,
      missiles: this.player.missiles,
      maxMissiles: this.player.maxMissiles,
      gunHeat: this.player.gunHeat,
      gunOverheated: this.gunOverheated,
      afterburner: this.player.afterburnerActive,
      maneuverReady: this.player.maneuverCooldown <= 0,
      takeoffActive: this.player.takeoffTimer > 0,
      score: this.score,
      bestScore: this.bestScore,
      combo: this.combo,
      comboTimer: this.comboTimer,
      kills: this.kills,
      wave: this.wave,
      totalWaves: this.totalWaves,
      elapsedSec: Math.round(this.elapsedSec),
      timeRemainingSec: this.timeRemainingSec !== null ? Math.ceil(this.timeRemainingSec) : null,
      checkpointsCleared,
      checkpointsTotal: this.checkpoints.length,
      incomingWarning: incomingMissile,
      incomingDistance,
      lowHealthWarning: this.player.health <= 30,
      lowFuelWarning: this.mode !== 'freeflight' && this.player.fuel <= 20,
      lockState: this.lockProgress >= 0.99 ? 'locked' : this.lockedTargetId !== null ? 'acquiring' : 'none',
      lockProgress: this.lockProgress,
      lockedTargetCallsign: lockedEnemy?.callsign ?? null,
      lockedTargetDist: lockedDist,
      leadTarget,
      damageFlash: this.damageFlash,
      hitMarker: this.hitMarkerTimer > 0,
      combatFeedback: this.combatFeedback
        ? { text: this.combatFeedback.text, kind: this.combatFeedback.kind }
        : null,
      bannerMessage: this.bannerMessage,
      targets,
      nextCheckpoint: projectedCp,
      radarBlips,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      defeatReason: this.defeatReason,
    });
  }

  /* ================================================================== */
  /* Main loop                                                            */
  /* ================================================================== */

  private tick = (now?: number): void => {
    if (this.disposed) return;

    const current = typeof now === 'number' ? now : performance.now();
    const rawDt = (current - this.lastTimestamp) / 1000;
    this.lastTimestamp = current;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (this.phase === 'title') {
      this.clockTime += dt;
      this.player.pos.y = 158 + Math.sin(this.clockTime * 1.3) * 1.1;
      this.player.bank = 0.2 + Math.sin(this.clockTime * 0.9) * 0.04;
      this.syncPlayerRigTransform(dt);
      this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
      this.updateCamera(dt);
    } else if (this.phase === 'playing') {
      this.stepSimulation(dt);
      this.stepParticles(dt);
      this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
      this.updateCamera(dt);

      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.075) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }
    } else {
      this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
    }

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  };

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  /** Pace software-GL frames behind a GPU fence so the tab stays responsive. */
  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  /* ================================================================== */
  /* DOM event handlers                                                   */
  /* ================================================================== */

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.sound.unlock();
    this.keys.add(e.code);

    if (e.code === 'KeyF' || e.code === 'KeyK') {
      if (!e.repeat) this.missileJustPressed = true;
    }
    if (e.code === 'KeyX' || e.code === 'KeyV') {
      if (!e.repeat) this.maneuverJustPressed = true;
    }
    if (e.code === 'KeyC' && !e.repeat && this.phase === 'playing') {
      this.cycleCamera();
    }
    if (e.code === 'KeyT' && !e.repeat && this.phase === 'playing') {
      this.toggleAutoTarget();
    }
    if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) {
      if (this.phase === 'playing') this.pauseGame();
      else if (this.phase === 'paused') this.resumeGame();
    }
    if (e.code === 'KeyM' && !e.repeat) {
      const nextMuted = this.sound.toggleMute();
      this.callbacks.onMuteChange?.(nextMuted);
      this.emitHud();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (this.phase !== 'playing') return;
    this.sound.unlock();
    if (e.button === 0) {
      this.mouseGunDown = true;
    } else if (e.button === 2) {
      this.missileJustPressed = true;
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseGunDown = false;
    }
  };

  private handleContextMenu = (e: MouseEvent): void => {
    if (this.phase === 'playing') {
      e.preventDefault();
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.phase !== 'playing') return;
    this.mouseThrottleImpulse += e.deltaY < 0 ? 1.5 : -1.5;
  };

  private handleBlur = (): void => {
    this.keys.clear();
    this.mouseGunDown = false;
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.keys.clear();
      this.mouseGunDown = false;
    }
  };

  private handleResize(): void {
    if (this.disposed) return;
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, this.isMobileDevice ? 1.5 : 2)
    );
    this.renderer.render(this.scene, this.camera);
  }

  /* ================================================================== */
  /* Teardown                                                             */
  /* ================================================================== */

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.renderer.domElement.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.renderer.domElement.removeEventListener('contextmenu', this.handleContextMenu);
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel);
    this.resizeObserver.disconnect();

    this.clearDynamicActors();
    this.scene.remove(this.playerRig.root);
    this.disposeGroupResources(this.playerRig.root);
    for (const m of this.missiles) {
      this.scene.remove(m.mesh);
      this.disposeGroupResources(m.mesh);
    }

    this.sound.dispose();
    this.world.dispose();
    this.textures.dispose();
    this.scene.remove(this.bulletMesh);
    this.bulletMesh.geometry.dispose();
    (this.bulletMesh.material as THREE.Material).dispose();
    this.scene.remove(this.particleMesh);
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
    for (const s of this.shockwaves) {
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      (s.mesh.material as THREE.Material).dispose();
    }
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
