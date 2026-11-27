import { A as Points, D as PerspectiveCamera, M as RingGeometry, N as SRGBColorSpace, P as Scene, S as MeshBasicMaterial, T as Object3D, b as Line, i as BoxGeometry, l as Color, n as PMREMGenerator, p as Euler, r as WebGLRenderer, t as RoomEnvironment, v as IcosahedronGeometry, x as Mesh, y as InstancedMesh, z as Vector3 } from "../vendor/libs.min.js";
import { t as SoundEngine } from "./combat-audio.js";
import { a as createMissileModel, i as createFighterJetModel, n as createCollectibleModel, r as createEnemyJetModel, t as createCheckpointRingModel } from "./jet-models.js";
import { C as stepPlayerFlight, S as stepEnemyAI, _ as getEnemyScoreValue, a as checkPlayerBuildingCollision, b as resolveSafeCameraPosition, c as clamp, d as createInitialPlayerState, f as damp, g as getEnemyMaxHealth, h as generateCollectibles, i as applyAssistedPursuit, l as computeAimAssistLead, m as generateCheckpoints, n as MISSIONS, o as checkSegmentSphereCollision, p as evaluateTargetLock, s as checkSphereCollision, t as DIFFICULTY_CONFIG, u as computeMissionRank, v as getForwardVector, x as sampleTerrainHeight, y as lerp } from "./flight-rules.js";
import { t as createProceduralTextures } from "./procedural-textures.js";
import { t as createOpenWorld } from "./world-terrain.js";
// src/game/engine.ts
var _vA = new Vector3();
var _vB = new Vector3();
var _vC = new Vector3();
var _vPrev = new Vector3();
var _vProj = new Vector3();
var _euler = new Euler(0, 0, 0, "YXZ");
var _dummy = new Object3D();
var _color = new Color();
function detectSoftwareGl() {
	try {
		const gl = document.createElement("canvas").getContext("webgl2");
		if (!gl) return true;
		const ext = gl.getExtension("WEBGL_debug_renderer_info");
		const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
		const gpu = String(gl.getParameter(param));
		gl.getExtension("WEBGL_lose_context")?.loseContext();
		return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
	} catch {
		return true;
	}
}
var FlightGameEngine = class {
	constructor(container, callbacks) {
		this.livery = "obsidian";
		this.phase = "title";
		this.mode = "missions";
		this.difficulty = "beginner";
		this.missionIndex = 0;
		this.cameraMode = "chase";
		this.player = createInitialPlayerState(false, "beginner");
		this.enemies = [];
		this.enemyRigs = /* @__PURE__ */ new Map();
		this.checkpoints = [];
		this.checkpointMeshes = /* @__PURE__ */ new Map();
		this.collectibles = [];
		this.collectibleMeshes = /* @__PURE__ */ new Map();
		this.nextEntityId = 1;
		this.score = 0;
		this.bestScore = 0;
		this.combo = 1;
		this.comboTimer = 0;
		this.kills = 0;
		this.wave = 1;
		this.totalWaves = 2;
		this.elapsedSec = 0;
		this.timeRemainingSec = null;
		this.shotsFired = 0;
		this.shotsHit = 0;
		this.defeatReason = null;
		this.autoTargetEnabled = true;
		this.lockedTargetId = null;
		this.lockProgress = 0;
		this.gunFireTimer = 0;
		this.gunOverheated = false;
		this.muzzleFlashTimers = [0, 0];
		this.enemyMissileCooldown = 14;
		this.survivalSpawnTimer = 0;
		this.trauma = 0;
		this.hitstopTimer = 0;
		this.damageFlash = 0;
		this.hitMarkerTimer = 0;
		this.combatFeedback = null;
		this.bannerMessage = null;
		this.bannerTimer = 0;
		this.muzzleToggle = 0;
		this.hudEmitAccum = 0;
		this.titleClock = 0;
		this.clockTime = 0;
		this.camPos = new Vector3(-45, 162, 345);
		this.camLook = new Vector3(-45, 155, 300);
		this.MAX_BULLETS = 160;
		this.bullets = [];
		this.MAX_PARTICLES = 420;
		this.particles = [];
		this.particleCursor = 0;
		this.shockwaves = [];
		this.missiles = [];
		this.keys = /* @__PURE__ */ new Set();
		this.touchJoyX = 0;
		this.touchJoyY = 0;
		this.touchButtons = {
			fireGun: false,
			fireMissile: false,
			boost: false,
			maneuver: false
		};
		this.missileJustPressed = false;
		this.maneuverJustPressed = false;
		this.mouseGunDown = false;
		this.mouseThrottleImpulse = 0;
		this.frameId = 0;
		this.lastTimestamp = 0;
		this.disposed = false;
		this.tick = (now) => {
			if (this.disposed) return;
			const current = typeof now === "number" ? now : performance.now();
			const rawDt = (current - this.lastTimestamp) / 1e3;
			this.lastTimestamp = current;
			const dt = Math.min(Math.max(rawDt, .001), .05);
			if (this.phase === "title") {
				this.clockTime += dt;
				this.player.pos.y = 158 + Math.sin(this.clockTime * 1.3) * 1.1;
				this.player.bank = .2 + Math.sin(this.clockTime * .9) * .04;
				this.syncPlayerRigTransform(dt);
				this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
				this.updateCamera(dt);
			} else if (this.phase === "playing") {
				this.stepSimulation(dt);
				this.stepParticles(dt);
				this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
				this.updateCamera(dt);
				this.hudEmitAccum += dt;
				if (this.hudEmitAccum >= .075) {
					this.hudEmitAccum = 0;
					this.emitHud();
				}
			} else this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
			this.renderer.render(this.scene, this.camera);
			this.scheduleNextFrame();
		};
		this.handleKeyDown = (e) => {
			this.sound.unlock();
			this.keys.add(e.code);
			if (e.code === "KeyF" || e.code === "KeyK") {
				if (!e.repeat) this.missileJustPressed = true;
			}
			if (e.code === "KeyX" || e.code === "KeyV") {
				if (!e.repeat) this.maneuverJustPressed = true;
			}
			if (e.code === "KeyC" && !e.repeat && this.phase === "playing") this.cycleCamera();
			if (e.code === "KeyT" && !e.repeat && this.phase === "playing") this.toggleAutoTarget();
			if ((e.code === "KeyP" || e.code === "Escape") && !e.repeat) {
				if (this.phase === "playing") this.pauseGame();
				else if (this.phase === "paused") this.resumeGame();
			}
			if (e.code === "KeyM" && !e.repeat) {
				const nextMuted = this.sound.toggleMute();
				this.callbacks.onMuteChange?.(nextMuted);
				this.emitHud();
			}
		};
		this.handleKeyUp = (e) => {
			this.keys.delete(e.code);
		};
		this.handleMouseDown = (e) => {
			if (this.phase !== "playing") return;
			this.sound.unlock();
			if (e.button === 0) this.mouseGunDown = true;
			else if (e.button === 2) this.missileJustPressed = true;
		};
		this.handleMouseUp = (e) => {
			if (e.button === 0) this.mouseGunDown = false;
		};
		this.handleContextMenu = (e) => {
			if (this.phase === "playing") e.preventDefault();
		};
		this.handleWheel = (e) => {
			if (this.phase !== "playing") return;
			this.mouseThrottleImpulse += e.deltaY < 0 ? 1.5 : -1.5;
		};
		this.handleBlur = () => {
			this.keys.clear();
			this.mouseGunDown = false;
		};
		this.handleVisibility = () => {
			if (document.hidden) {
				this.keys.clear();
				this.mouseGunDown = false;
			}
		};
		this.container = container;
		this.callbacks = callbacks;
		this.sound = new SoundEngine();
		try {
			const saved = localStorage.getItem("sky_warrior_best_score");
			if (saved) this.bestScore = Number(saved) || 0;
		} catch {}
		this.isSoftwareGl = detectSoftwareGl();
		this.isMobileDevice = typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0);
		this.renderer = new WebGLRenderer({
			antialias: !this.isSoftwareGl,
			powerPreference: "high-performance"
		});
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = 4;
		this.renderer.toneMappingExposure = 1.12;
		this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, this.isMobileDevice ? 1.5 : 2));
		this.renderer.shadowMap.enabled = !this.isSoftwareGl;
		this.renderer.shadowMap.type = 2;
		const rect = container.getBoundingClientRect();
		const width = Math.max(1, rect.width || window.innerWidth);
		const height = Math.max(1, rect.height || window.innerHeight);
		this.renderer.setSize(width, height);
		this.renderer.domElement.style.display = "block";
		this.renderer.domElement.style.width = "100%";
		this.renderer.domElement.style.height = "100%";
		container.appendChild(this.renderer.domElement);
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(64, width / height, .5, 6500);
		const pmrem = new PMREMGenerator(this.renderer);
		this.scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
		pmrem.dispose();
		const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
		this.textures = createProceduralTextures(maxAniso);
		this.world = createOpenWorld(this.scene, this.textures, this.isSoftwareGl);
		this.playerRig = createFighterJetModel(this.livery, this.textures, this.isSoftwareGl);
		this.scene.add(this.playerRig.root);
		const bulletGeo = new BoxGeometry(.28, .28, 4.8);
		const bulletMat = new MeshBasicMaterial({ color: 16777215 });
		this.bulletMesh = new InstancedMesh(bulletGeo, bulletMat, this.MAX_BULLETS);
		this.bulletMesh.frustumCulled = false;
		this.scene.add(this.bulletMesh);
		for (let i = 0; i < this.MAX_BULLETS; i++) {
			this.bullets.push({
				active: false,
				fromPlayer: true,
				pos: new Vector3(),
				vel: new Vector3(),
				life: 0
			});
			_dummy.scale.set(0, 0, 0);
			_dummy.updateMatrix();
			this.bulletMesh.setMatrixAt(i, _dummy.matrix);
			this.bulletMesh.setColorAt(i, _color.setHex(16707722));
		}
		this.bulletMesh.instanceMatrix.needsUpdate = true;
		const pGeo = new IcosahedronGeometry(1, 1);
		const pMat = new MeshBasicMaterial({
			color: 16777215,
			transparent: true,
			opacity: .58,
			depthWrite: false
		});
		this.particleMesh = new InstancedMesh(pGeo, pMat, this.MAX_PARTICLES);
		this.particleMesh.frustumCulled = false;
		this.scene.add(this.particleMesh);
		for (let i = 0; i < this.MAX_PARTICLES; i++) {
			this.particles.push({
				active: false,
				pos: new Vector3(),
				vel: new Vector3(),
				age: 0,
				maxAge: 1,
				startScale: 1,
				endScale: 0,
				color: new Color(16777215)
			});
			_dummy.scale.set(0, 0, 0);
			_dummy.updateMatrix();
			this.particleMesh.setMatrixAt(i, _dummy.matrix);
			this.particleMesh.setColorAt(i, _color.setHex(16777215));
		}
		this.particleMesh.instanceMatrix.needsUpdate = true;
		const shockGeo = new RingGeometry(.75, 1, 24);
		for (let i = 0; i < 6; i++) {
			const mat = new MeshBasicMaterial({
				color: 16628340,
				side: 2,
				transparent: true,
				opacity: .85,
				blending: 2,
				depthWrite: false
			});
			const mesh = new Mesh(shockGeo, mat);
			mesh.visible = false;
			this.scene.add(mesh);
			this.shockwaves.push({
				active: false,
				age: 0,
				maxAge: .55,
				maxScale: 32,
				mesh
			});
		}
		for (let i = 0; i < 12; i++) {
			const mesh = createMissileModel(i >= 8);
			mesh.visible = false;
			this.scene.add(mesh);
			this.missiles.push({
				active: false,
				fromPlayer: i < 8,
				pos: new Vector3(),
				vel: new Vector3(),
				targetEnemyId: null,
				life: 0,
				mesh
			});
		}
		this.setupTitleShowcase();
		if (!this.isSoftwareGl) this.renderer.compile(this.scene, this.camera);
		window.addEventListener("keydown", this.handleKeyDown);
		window.addEventListener("keyup", this.handleKeyUp);
		window.addEventListener("blur", this.handleBlur);
		document.addEventListener("visibilitychange", this.handleVisibility);
		this.renderer.domElement.addEventListener("mousedown", this.handleMouseDown);
		window.addEventListener("mouseup", this.handleMouseUp);
		this.renderer.domElement.addEventListener("contextmenu", this.handleContextMenu);
		this.renderer.domElement.addEventListener("wheel", this.handleWheel, { passive: true });
		this.resizeObserver = new ResizeObserver(() => this.handleResize());
		this.resizeObserver.observe(container);
		this.lastTimestamp = performance.now();
		this.renderer.render(this.scene, this.camera);
		this.scheduleNextFrame();
	}
	setupTitleShowcase() {
		this.phase = "title";
		document.body.dataset.state = "title";
		this.clearDynamicActors();
		this.player = createInitialPlayerState(true);
		this.player.pos = {
			x: -45,
			y: 158,
			z: 325
		};
		this.player.heading = -.38;
		this.player.bank = .2;
		this.player.pitch = .04;
		this.player.afterburnerActive = true;
		this.syncPlayerRigTransform(.016);
		this.camPos.set(this.player.pos.x - 15, this.player.pos.y + 4.8, this.player.pos.z + 18);
		this.camLook.set(this.player.pos.x - 2, this.player.pos.y + .6, this.player.pos.z - 4);
		this.camera.position.copy(this.camPos);
		this.camera.lookAt(this.camLook);
		this.camera.fov = 52;
		this.camera.updateProjectionMatrix();
		this.world.update(this.clockTime, this.playerRig.root.position, this.camera.position);
		this.emitHud();
	}
	setLivery(livery) {
		if (this.livery === livery) return;
		this.livery = livery;
		this.scene.remove(this.playerRig.root);
		this.disposeGroupResources(this.playerRig.root);
		this.playerRig = createFighterJetModel(livery, this.textures, this.isSoftwareGl);
		this.scene.add(this.playerRig.root);
		this.syncPlayerRigTransform(.016);
	}
	startGame(mode, missionIndex = 0, skipTakeoff = false, difficulty = this.difficulty) {
		if (!skipTakeoff) this.sound.unlock();
		this.mode = mode;
		this.difficulty = difficulty;
		this.missionIndex = clamp(missionIndex, 0, MISSIONS.length - 1);
		this.clearDynamicActors();
		const diffCfg = DIFFICULTY_CONFIG[difficulty];
		this.player = createInitialPlayerState(skipTakeoff, difficulty);
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
		this.enemyMissileCooldown = diffCfg.enemyMissileCooldown * .9;
		this.survivalSpawnTimer = 0;
		this.keys.clear();
		this.mouseGunDown = false;
		this.mouseThrottleImpulse = 0;
		this.missileJustPressed = false;
		this.maneuverJustPressed = false;
		this.touchButtons = {
			fireGun: false,
			fireMissile: false,
			boost: false,
			maneuver: false
		};
		if (mode === "missions") {
			const m = MISSIONS[this.missionIndex];
			this.totalWaves = m.waves;
			this.timeRemainingSec = Math.round(m.timeLimitSec * diffCfg.timeMult);
			this.checkpoints = generateCheckpoints(m.checkpointCount);
			this.spawnCheckpoints();
			this.spawnWaveEnemies(Math.ceil(m.enemyCount / m.waves), 1);
			this.showBanner(`${m.title.toUpperCase()} — WAVE 1`, 2.6);
		} else if (mode === "survival") {
			this.totalWaves = 99;
			this.timeRemainingSec = null;
			this.spawnWaveEnemies(3, 1);
			this.showBanner("SURVIVAL WAVE 1 — ENGAGE HOSTILES", 2.6);
		} else {
			this.totalWaves = 1;
			this.timeRemainingSec = null;
			this.checkpoints = generateCheckpoints(8);
			this.spawnCheckpoints();
			this.showBanner("FREE FLIGHT — SOLARIS ARCHIPELAGO", 2.6);
		}
		this.collectibles = generateCollectibles();
		this.spawnCollectibleMeshes();
		this.syncPlayerRigTransform(.016);
		const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
		this.camPos.set(this.player.pos.x - fwd.x * 23, this.player.pos.y + 6.4, this.player.pos.z - fwd.z * 23);
		this.camLook.set(this.player.pos.x + fwd.x * 45, this.player.pos.y + 1.8, this.player.pos.z + fwd.z * 45);
		this.camera.position.copy(this.camPos);
		this.camera.lookAt(this.camLook);
		this.camera.updateMatrixWorld();
		const initialLock = evaluateTargetLock(this.player, this.enemies, null, 0, .016, this.difficulty, this.autoTargetEnabled);
		this.lockedTargetId = initialLock.lockedId;
		this.lockProgress = initialLock.lockProgress;
		this.phase = "playing";
		document.body.dataset.state = "playing";
		this.callbacks.onPhaseChange("playing");
		this.emitHud();
	}
	pauseGame() {
		if (this.phase !== "playing") return;
		this.phase = "paused";
		document.body.dataset.state = "paused";
		this.keys.clear();
		this.mouseGunDown = false;
		this.mouseThrottleImpulse = 0;
		this.missileJustPressed = false;
		this.maneuverJustPressed = false;
		this.touchButtons = {
			fireGun: false,
			fireMissile: false,
			boost: false,
			maneuver: false
		};
		this.sound.updateEngine(false, 0, false, 0, 0);
		this.callbacks.onPhaseChange("paused");
		this.emitHud();
	}
	resumeGame() {
		if (this.phase !== "paused") return;
		this.sound.unlock();
		this.phase = "playing";
		document.body.dataset.state = "playing";
		this.lastTimestamp = performance.now();
		this.callbacks.onPhaseChange("playing");
		this.emitHud();
	}
	returnToTitle() {
		this.sound.updateEngine(false, 0, false, 0, 0);
		this.setupTitleShowcase();
		this.callbacks.onPhaseChange("title");
	}
	cycleCamera() {
		const order = [
			"chase",
			"action",
			"cockpit"
		];
		const next = order[(order.indexOf(this.cameraMode) + 1) % order.length];
		return this.setCameraMode(next);
	}
	setCameraMode(mode) {
		this.cameraMode = mode;
		this.playerRig.root.visible = mode !== "cockpit";
		this.updateCamera(.016);
		this.emitHud();
		return mode;
	}
	prepareShot(shot) {
		if (shot === "start") {
			this.returnToTitle();
			return;
		}
		if (shot === "takeoff") {
			this.startGame("missions", 0, false, "beginner");
			this.setCameraMode("chase");
			for (let i = 0; i < 45; i++) this.stepSimulation(.03);
			this.updateCamera(.03);
			this.emitHud();
			this.renderer.render(this.scene, this.camera);
			return;
		}
		if (shot === "play" || shot === "cockpit") {
			this.startGame("missions", 0, true, "beginner");
			this.player.pos = {
				x: -18,
				y: 128,
				z: 245
			};
			this.player.heading = .08;
			this.player.pitch = .03;
			this.player.bank = -.14;
			this.player.afterburnerActive = true;
			this.player.speed = 165;
			if (this.enemies.length > 0) {
				const target = this.enemies[0];
				target.pos = {
					x: -58,
					y: 148,
					z: 95
				};
				target.heading = .25;
				target.bank = -.35;
				this.lockedTargetId = target.id;
				this.lockProgress = 1;
			}
			if (this.enemies.length > 1) {
				const second = this.enemies[1];
				second.pos = {
					x: 75,
					y: 168,
					z: 25
				};
				second.heading = -.45;
				second.bank = .4;
			}
			if (this.checkpoints.length > 0) {
				this.checkpoints[0].pos = {
					x: 16,
					y: 122,
					z: 10
				};
				const ringMesh = this.checkpointMeshes.get(this.checkpoints[0].id);
				if (ringMesh) {
					ringMesh.position.set(16, 122, 10);
					ringMesh.lookAt(this.player.pos.x, this.player.pos.y, this.player.pos.z);
				}
			}
			this.syncPlayerRigTransform(.016);
			const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
			this.camPos.set(this.player.pos.x - fwd.x * 20, this.player.pos.y - fwd.y * 20 + 5.2, this.player.pos.z - fwd.z * 20);
			this.camLook.set(this.player.pos.x + fwd.x * 55, this.player.pos.y + fwd.y * 55 + 1.4, this.player.pos.z + fwd.z * 55);
			this.setCameraMode(shot === "cockpit" ? "cockpit" : "chase");
			this.renderer.render(this.scene, this.camera);
		}
	}
	setAutoTargetEnabled(enabled) {
		this.autoTargetEnabled = enabled;
		if (!enabled) this.lockProgress = 0;
		this.showBanner(enabled ? "AUTO TARGET · LOCK & PURSUIT ON" : "AUTO TARGET · MANUAL MODE", 1.6);
		this.emitHud();
	}
	toggleAutoTarget() {
		this.setAutoTargetEnabled(!this.autoTargetEnabled);
		return this.autoTargetEnabled;
	}
	setTouchJoystick(x, y) {
		this.touchJoyX = clamp(x, -1, 1);
		this.touchJoyY = clamp(y, -1, 1);
	}
	setTouchButton(btn, pressed) {
		this.sound.unlock();
		if (btn === "fireMissile" && pressed && !this.touchButtons.fireMissile) this.missileJustPressed = true;
		if (btn === "maneuver" && pressed && !this.touchButtons.maneuver) this.maneuverJustPressed = true;
		this.touchButtons[btn] = pressed;
	}
	disposeGroupResources(group) {
		group.traverse((obj) => {
			if (obj instanceof Mesh || obj instanceof Line || obj instanceof Points) {
				obj.geometry.dispose();
				if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
				else obj.material.dispose();
			}
		});
	}
	clearDynamicActors() {
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
	spawnCheckpoints() {
		for (const cp of this.checkpoints) {
			const mesh = createCheckpointRingModel(cp.order);
			mesh.position.set(cp.pos.x, cp.pos.y, cp.pos.z);
			mesh.lookAt(0, cp.pos.y, 0);
			this.scene.add(mesh);
			this.checkpointMeshes.set(cp.id, mesh);
		}
	}
	spawnCollectibleMeshes() {
		for (const col of this.collectibles) {
			const mesh = createCollectibleModel(col.kind);
			mesh.position.set(col.pos.x, col.pos.y, col.pos.z);
			this.scene.add(mesh);
			this.collectibleMeshes.set(col.id, mesh);
		}
	}
	spawnWaveEnemies(count, waveNum) {
		const archetypes = [
			"interceptor",
			"flanker",
			"gunship"
		];
		const callsignPrefixes = {
			interceptor: "VIPER",
			flanker: "SPECTRE",
			gunship: "GOLIATH"
		};
		const diffCfg = DIFFICULTY_CONFIG[this.difficulty];
		const hpScale = (1 + Math.min(.6, (waveNum - 1) * .12)) * diffCfg.enemyHpMult;
		const speedBonus = Math.min(24, (waveNum - 1) * 4);
		const cooldownBonus = this.difficulty === "beginner" ? 1.1 : this.difficulty === "standard" ? .5 : 0;
		for (let i = 0; i < count; i++) {
			const id = this.nextEntityId++;
			const archetype = archetypes[waveNum === 1 && i === 0 ? 0 : (i + waveNum - 1) % archetypes.length];
			const angle = i / Math.max(1, count) * Math.PI * 1.15 - Math.PI * .57 + this.player.heading;
			const dist = 480 + i % 3 * 140;
			const sx = clamp(this.player.pos.x - Math.sin(angle) * dist, -1700, 1700);
			const sz = clamp(this.player.pos.z - Math.cos(angle) * dist, -1700, 1700);
			const groundY = Math.max(0, sampleTerrainHeight(sx, sz));
			const sy = Math.max(groundY + 110, 135 + i % 3 * 28);
			const maxHp = Math.max(25, Math.round(getEnemyMaxHealth(archetype) * hpScale));
			const unit = {
				id,
				archetype,
				callsign: `${callsignPrefixes[archetype]}-${id}`,
				pos: {
					x: sx,
					y: sy,
					z: sz
				},
				heading: Math.atan2(sx - this.player.pos.x, sz - this.player.pos.z),
				pitch: 0,
				bank: 0,
				speed: (archetype === "gunship" ? 74 : 102) + speedBonus,
				health: maxHp,
				maxHealth: maxHp,
				fireCooldown: Math.max(1.2, 2 - (waveNum - 1) * .12) + cooldownBonus + i % 3 * .65,
				telegraphTimer: 0,
				aiPhaseOffset: i * 1.35,
				evadeTimer: 0,
				alive: true,
				dyingTimer: 0,
				hitFlashTimer: 0
			};
			this.enemies.push(unit);
			const rig = createEnemyJetModel(archetype);
			rig.root.position.set(sx, sy, sz);
			this.scene.add(rig.root);
			this.enemyRigs.set(id, rig);
		}
	}
	showBanner(msg, duration = 2.5) {
		this.bannerMessage = msg;
		this.bannerTimer = duration;
	}
	readInput() {
		let pitch = this.touchJoyY;
		if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) pitch += 1;
		if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) pitch -= 1;
		let roll = this.touchJoyX;
		if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) roll += 1;
		if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) roll -= 1;
		let yaw = 0;
		if (this.keys.has("KeyE")) yaw += 1;
		if (this.keys.has("KeyQ")) yaw -= 1;
		let throttleDelta = this.mouseThrottleImpulse;
		this.mouseThrottleImpulse = 0;
		if (this.keys.has("Equal") || this.keys.has("BracketRight")) throttleDelta += 1;
		if (this.keys.has("Minus") || this.keys.has("BracketLeft")) throttleDelta -= 1;
		const boost = this.touchButtons.boost || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.keys.has("KeyB");
		const fireGun = this.touchButtons.fireGun || this.mouseGunDown || this.keys.has("Space") || this.keys.has("KeyJ");
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
			maneuver
		};
	}
	spawnParticle(x, y, z, vx, vy, vz, maxAge, startScale, endScale, hexColor) {
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
	spawnShockwave(pos, maxScale = 34) {
		const slot = this.shockwaves.find((s) => !s.active);
		if (!slot) return;
		slot.active = true;
		slot.age = 0;
		slot.maxAge = .55;
		slot.maxScale = maxScale;
		slot.mesh.visible = true;
		slot.mesh.position.set(pos.x, pos.y, pos.z);
		slot.mesh.lookAt(this.camera.position);
		slot.mesh.scale.setScalar(2);
	}
	spawnExplosion(pos, scale = 1) {
		this.spawnShockwave(pos, 34 * scale);
		const count = Math.round(26 * scale);
		for (let i = 0; i < count; i++) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const speed = (22 + Math.random() * 68) * scale;
			const vx = Math.sin(phi) * Math.cos(theta) * speed;
			const vy = Math.cos(phi) * speed;
			const vz = Math.sin(phi) * Math.sin(theta) * speed;
			const isCore = i < count * .5;
			this.spawnParticle(pos.x, pos.y, pos.z, vx, vy, vz, isCore ? .5 + Math.random() * .35 : .95 + Math.random() * .65, (isCore ? 2.4 : 4.2) * scale, (isCore ? 8.5 : 13.5) * scale, isCore ? i % 3 === 0 ? 16707722 : 16347926 : 3359061);
		}
	}
	firePlayerCannons() {
		if (this.gunOverheated || this.player.gunHeat >= .98) {
			if (!this.gunOverheated) {
				this.gunOverheated = true;
				this.showBanner("CANNON OVERHEAT — COOLING", 1.4);
			}
			return;
		}
		const bulletSpeed = 680;
		const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
		const assist = computeAimAssistLead(this.player, this.enemies, this.lockedTargetId, bulletSpeed, this.difficulty);
		const dirX = assist ? assist.aimDir.x : fwd.x;
		const dirY = assist ? assist.aimDir.y : fwd.y;
		const dirZ = assist ? assist.aimDir.z : fwd.z;
		const idx = this.muzzleToggle % 2;
		const muzzle = this.playerRig.gunMuzzles[idx];
		this.muzzleToggle++;
		muzzle.getWorldPosition(_vB);
		this.muzzleFlashTimers[idx] = .055;
		for (const slot of this.bullets) if (!slot.active) {
			slot.active = true;
			slot.fromPlayer = true;
			slot.pos.copy(_vB);
			slot.vel.set(dirX * bulletSpeed + (Math.random() - .5) * 3, dirY * bulletSpeed + (Math.random() - .5) * 3, dirZ * bulletSpeed + (Math.random() - .5) * 3);
			slot.life = 1.65;
			this.shotsFired++;
			this.sound.playCannonShot();
			break;
		}
	}
	fireEnemyBullet(enemy, spread) {
		const dx = this.player.pos.x - enemy.pos.x;
		const dy = this.player.pos.y - enemy.pos.y;
		const dz = this.player.pos.z - enemy.pos.z;
		const len = Math.max(1, Math.hypot(dx, dy, dz));
		for (const slot of this.bullets) if (!slot.active) {
			slot.active = true;
			slot.fromPlayer = false;
			slot.pos.set(enemy.pos.x, enemy.pos.y, enemy.pos.z);
			slot.vel.set((dx / len + (Math.random() - .5) * spread) * 290, (dy / len + (Math.random() - .5) * spread) * 290, (dz / len + (Math.random() - .5) * spread) * 290);
			slot.life = 2.4;
			break;
		}
	}
	launchPlayerMissile() {
		if (this.player.missiles <= 0) return;
		const slot = this.missiles.find((m) => m.fromPlayer && !m.active);
		if (!slot) return;
		this.player.missiles--;
		this.shotsFired++;
		const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
		slot.active = true;
		slot.pos.set(this.player.pos.x + (this.player.missiles % 2 === 0 ? -2.4 : 2.4), this.player.pos.y - 1, this.player.pos.z);
		const launchSpeed = Math.max(260, this.player.speed + 145);
		slot.vel.set(fwd.x * launchSpeed, fwd.y * launchSpeed, fwd.z * launchSpeed);
		let targetId = this.autoTargetEnabled && this.lockedTargetId !== null ? this.lockedTargetId : this.lockedTargetId !== null && this.lockProgress >= .35 ? this.lockedTargetId : null;
		if (targetId === null) {
			let bestScore = -Infinity;
			for (const e of this.enemies) {
				if (!e.alive) continue;
				const dx = e.pos.x - this.player.pos.x;
				const dy = e.pos.y - this.player.pos.y;
				const dz = e.pos.z - this.player.pos.z;
				const dist = Math.hypot(dx, dy, dz);
				if (dist < 10 || dist > 2e3) continue;
				const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
				if (dot > .52) {
					const score = dot - dist / 4500;
					if (score > bestScore) {
						bestScore = score;
						targetId = e.id;
					}
				}
			}
		}
		slot.targetEnemyId = targetId;
		slot.life = 6;
		slot.mesh.visible = true;
		slot.mesh.position.copy(slot.pos);
		this.sound.playMissileLaunch();
		this.trauma = Math.min(1, this.trauma + .14);
	}
	launchEnemyMissile(enemy) {
		const slot = this.missiles.find((m) => !m.fromPlayer && !m.active);
		if (!slot) return;
		const diffCfg = DIFFICULTY_CONFIG[this.difficulty];
		slot.active = true;
		slot.pos.set(enemy.pos.x, enemy.pos.y - 1.5, enemy.pos.z);
		_vA.set(this.player.pos.x - enemy.pos.x, this.player.pos.y - enemy.pos.y, this.player.pos.z - enemy.pos.z).normalize();
		slot.vel.copy(_vA).multiplyScalar(diffCfg.enemyMissileSpeed);
		slot.targetEnemyId = null;
		slot.life = 6;
		slot.mesh.visible = true;
		slot.mesh.position.copy(slot.pos);
		this.sound.playIncomingAlert();
		this.showBanner("INCOMING MISSILE — EVADE!", 2.2);
	}
	damageEnemy(enemy, amount, isMissile) {
		if (!enemy.alive) return;
		enemy.health -= amount;
		enemy.hitFlashTimer = .08;
		this.hitMarkerTimer = .16;
		this.shotsHit++;
		if (enemy.health <= 0) {
			enemy.health = 0;
			enemy.alive = false;
			enemy.dyingTimer = .85;
			this.kills++;
			const pts = getEnemyScoreValue(enemy.archetype) * this.combo;
			this.score += pts;
			this.combo = Math.min(5, this.combo + 1);
			this.comboTimer = 8;
			if (this.score > this.bestScore) {
				this.bestScore = this.score;
				try {
					localStorage.setItem("sky_warrior_best_score", String(this.bestScore));
				} catch {}
			}
			this.hitstopTimer = isMissile ? .045 : .025;
			this.trauma = Math.min(1, this.trauma + .36);
			this.spawnExplosion(enemy.pos, 1.45);
			this.sound.playExplosion(true);
			this.combatFeedback = {
				text: `TARGET DESTROYED · ${enemy.callsign} (+${pts})`,
				kind: "kill",
				timer: 1.65
			};
			if (this.lockedTargetId === enemy.id) {
				const nextLock = evaluateTargetLock(this.player, this.enemies, null, 0, .016, this.difficulty, this.autoTargetEnabled);
				this.lockedTargetId = nextLock.lockedId;
				this.lockProgress = nextLock.lockProgress;
			}
		} else {
			if (enemy.evadeTimer <= 0 && enemy.archetype !== "gunship") enemy.evadeTimer = 1.25;
			this.combatFeedback = {
				text: isMissile ? `MISSILE HIT -${amount} DMG` : `HIT -${amount} DMG`,
				kind: isMissile ? "crit" : "hit",
				timer: isMissile ? .85 : .45
			};
			this.sound.playHitImpact();
		}
	}
	damagePlayer(amount, reason) {
		if (this.mode === "freeflight" || this.player.maneuverTimer > 0) return;
		this.player.health = Math.max(0, this.player.health - amount);
		this.damageFlash = 1;
		this.trauma = Math.min(1, this.trauma + .35);
		this.sound.playPlayerDamage();
		if (this.player.health <= 0) this.finishRun("defeat", reason);
	}
	finishRun(outcome, reason = null) {
		if (this.phase === "victory" || this.phase === "defeat") return;
		this.phase = outcome;
		this.defeatReason = reason;
		document.body.dataset.state = "gameover";
		this.sound.updateEngine(false, 0, false, 0, 0);
		const checkpointsCleared = this.checkpoints.filter((c) => c.collected).length;
		if (outcome === "victory") {
			const timeBonus = this.timeRemainingSec ? Math.round(this.timeRemainingSec * 12) : 0;
			const ringBonus = checkpointsCleared * 250;
			this.score += 1e3 + timeBonus + ringBonus;
			if (this.score > this.bestScore) {
				this.bestScore = this.score;
				try {
					localStorage.setItem("sky_warrior_best_score", String(this.bestScore));
				} catch {}
			}
			this.sound.playVictory();
		} else {
			this.spawnExplosion(this.player.pos, 1.8);
			this.sound.playExplosion(true);
			this.sound.playDefeat();
		}
		this.callbacks.onPhaseChange(outcome);
		const accuracyPct = this.shotsFired > 0 ? Math.min(100, Math.round(this.shotsHit / this.shotsFired * 100)) : 0;
		const rank = computeMissionRank(outcome, accuracyPct, this.player.health, this.kills);
		this.callbacks.onRunEnd({
			outcome,
			mode: this.mode,
			difficulty: this.difficulty,
			missionTitle: this.mode === "missions" ? MISSIONS[this.missionIndex].title : this.mode === "survival" ? "Endless Survival" : "Free Flight",
			score: this.score,
			bestScore: this.bestScore,
			rank,
			kills: this.kills,
			wave: this.wave,
			elapsedSec: Math.round(this.elapsedSec),
			accuracyPct,
			checkpointsCleared,
			checkpointsTotal: this.checkpoints.length,
			defeatReason: reason
		});
		this.emitHud();
	}
	stepSimulation(dt) {
		this.clockTime += dt;
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
			if (this.muzzleFlashTimers[i] > 0) this.muzzleFlashTimers[i] = Math.max(0, this.muzzleFlashTimers[i] - dt);
			this.playerRig.muzzleFlashes[i].visible = this.muzzleFlashTimers[i] > 0;
		}
		if (this.hitstopTimer > 0) {
			this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
			return;
		}
		this.elapsedSec += dt;
		if (this.timeRemainingSec !== null && this.player.takeoffTimer <= 0) {
			this.timeRemainingSec = Math.max(0, this.timeRemainingSec - dt);
			if (this.timeRemainingSec <= 0) {
				this.finishRun("defeat", "Mission timer expired before objectives were cleared.");
				return;
			}
		}
		const diffCfg = DIFFICULTY_CONFIG[this.difficulty];
		const input = this.readInput();
		if (this.gunOverheated && this.player.gunHeat <= .45) this.gunOverheated = false;
		const flightInput = this.gunOverheated ? {
			...input,
			fireGun: false
		} : input;
		const prevManeuver = this.player.maneuverTimer;
		const flightOutcome = stepPlayerFlight(this.player, flightInput, dt, this.mode, this.difficulty);
		if (!this.gunOverheated && this.player.gunHeat >= .98) {
			this.gunOverheated = true;
			this.showBanner("CANNON OVERHEAT — COOLING", 1.4);
		}
		if (prevManeuver <= 0 && this.player.maneuverTimer > 0) {
			this.sound.playManeuver();
			for (let i = 0; i < 10; i++) this.spawnParticle(this.player.pos.x, this.player.pos.y - 1, this.player.pos.z, (Math.random() - .5) * 48, -14 - Math.random() * 18, (Math.random() - .5) * 48, .95, .9, 2.2, 16707722);
		}
		if (flightOutcome.terrainCrash) {
			this.finishRun("defeat", "Aircraft lost in terrain impact.");
			return;
		}
		if (flightOutcome.terrainScraped) {
			this.damageFlash = .65;
			this.showBanner("LOW ALTITUDE — PULL UP!", 1.5);
		}
		if (flightOutcome.fuelDepleted) {
			this.finishRun("defeat", "Fuel reserves exhausted.");
			return;
		}
		if (this.player.takeoffTimer <= 0) {
			const hitBuilding = checkPlayerBuildingCollision(this.player.pos, this.world.buildingObstacles);
			if (hitBuilding) {
				const dx = this.player.pos.x - hitBuilding.x;
				const dz = this.player.pos.z - hitBuilding.z;
				const dist = Math.max(1, Math.hypot(dx, dz));
				this.player.pos.x = hitBuilding.x + dx / dist * (hitBuilding.halfW + 10);
				this.player.pos.z = hitBuilding.z + dz / dist * (hitBuilding.halfD + 10);
				this.player.pos.y = Math.max(this.player.pos.y, hitBuilding.topY + 8);
				this.player.pitch = Math.max(.22, this.player.pitch);
				if (this.mode !== "freeflight" && this.player.collisionCooldown <= 0) {
					this.player.collisionCooldown = 1.4;
					this.spawnExplosion(this.player.pos, .65);
					this.showBanner("TOWER CLEARANCE — PULL UP!", 1.5);
					this.damagePlayer(diffCfg.scrapeDmg, "Aircraft lost in urban tower impact.");
					if (this.phase !== "playing") return;
				}
			}
		}
		if (this.player.afterburnerActive && this.player.takeoffTimer <= 0 || Math.abs(this.player.bank) > .55) {
			const rx = Math.cos(this.player.heading) * 5.6;
			const rz = -Math.sin(this.player.heading) * 5.6;
			const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
			this.spawnParticle(this.player.pos.x + rx - fwd.x * 2.5, this.player.pos.y, this.player.pos.z + rz - fwd.z * 2.5, -fwd.x * 8, -fwd.y * 8, -fwd.z * 8, .26, .16, .38, 14870768);
			this.spawnParticle(this.player.pos.x - rx - fwd.x * 2.5, this.player.pos.y, this.player.pos.z - rz - fwd.z * 2.5, -fwd.x * 8, -fwd.y * 8, -fwd.z * 8, .26, .16, .38, 14870768);
		}
		this.playerRig.leftAileron.rotation.x = damp(this.playerRig.leftAileron.rotation.x, input.roll * .48, 12, dt);
		this.playerRig.rightAileron.rotation.x = damp(this.playerRig.rightAileron.rotation.x, -input.roll * .48, 12, dt);
		this.playerRig.leftElevator.rotation.x = damp(this.playerRig.leftElevator.rotation.x, -input.pitch * .42, 12, dt);
		this.playerRig.rightElevator.rotation.x = damp(this.playerRig.rightElevator.rotation.x, -input.pitch * .42, 12, dt);
		this.playerRig.leftRudder.rotation.y = damp(this.playerRig.leftRudder.rotation.y, input.yaw * .42, 12, dt);
		this.playerRig.rightRudder.rotation.y = damp(this.playerRig.rightRudder.rotation.y, input.yaw * .42, 12, dt);
		const gearScale = this.player.takeoffTimer > 1 ? 1 : clamp(this.player.takeoffTimer / 1, 0, 1);
		this.playerRig.landingGear.visible = gearScale > .05;
		this.playerRig.landingGear.scale.set(1, gearScale, 1);
		const pursuitTarget = this.enemies.find((e) => e.id === this.lockedTargetId && e.alive) ?? null;
		applyAssistedPursuit(this.player, pursuitTarget, input, this.world.buildingObstacles, dt, this.autoTargetEnabled && this.mode !== "freeflight");
		this.syncPlayerRigTransform(dt);
		if (this.gunFireTimer > 0) this.gunFireTimer -= dt;
		if (input.fireGun && !this.gunOverheated && this.player.takeoffTimer <= 0 && this.gunFireTimer <= 0) {
			this.firePlayerCannons();
			this.gunFireTimer = .08;
		}
		if (input.fireMissile && this.player.takeoffTimer <= 0) this.launchPlayerMissile();
		const lockRes = evaluateTargetLock(this.player, this.enemies, this.lockedTargetId, this.lockProgress, dt, this.difficulty, this.autoTargetEnabled);
		this.lockedTargetId = lockRes.lockedId;
		this.lockProgress = lockRes.lockProgress;
		this.sound.updateEngine(true, clamp((this.player.speed - 60) / 180, 0, 1), this.player.afterburnerActive, dt, this.lockProgress);
		let activeAttackTokens = 3;
		let aliveEnemies = 0;
		for (let i = this.enemies.length - 1; i >= 0; i--) {
			const enemy = this.enemies[i];
			if (enemy.alive) aliveEnemies++;
			const canAttack = activeAttackTokens > 0 && this.player.takeoffTimer <= 0 && this.mode !== "freeflight";
			const aiRes = stepEnemyAI(enemy, this.player, this.elapsedSec, dt, canAttack);
			if (aiRes.wantsToFire) {
				activeAttackTokens--;
				this.fireEnemyBullet(enemy, aiRes.fireSpread);
			}
			const rig = this.enemyRigs.get(enemy.id);
			if (rig) {
				rig.root.position.set(enemy.pos.x, enemy.pos.y, enemy.pos.z);
				_euler.set(enemy.pitch, enemy.heading, enemy.bank, "YXZ");
				rig.root.quaternion.setFromEuler(_euler);
				const flicker = .85 + Math.sin(this.clockTime * 35 + enemy.id) * .25;
				rig.flameMesh.scale.set(1, 1, flicker);
				const teleMat = rig.telegraphGlow.material;
				teleMat.opacity = enemy.telegraphTimer > 0 ? .85 : 0;
				if (rig.turretGroup && enemy.alive) rig.turretGroup.rotation.y += dt * 1.4;
				if (!enemy.alive) this.spawnParticle(enemy.pos.x, enemy.pos.y, enemy.pos.z, 0, 2, 0, .55, 1.5, 4.5, 3359061);
				for (const mat of rig.bodyMaterials) if (enemy.hitFlashTimer > 0) {
					mat.emissive.setHex(16777215);
					mat.emissiveIntensity = 1.8;
				} else {
					mat.emissiveIntensity = .22;
					mat.emissive.setHex(enemy.archetype === "interceptor" ? 8330525 : enemy.archetype === "flanker" ? 165063 : 11817737);
				}
			}
			if (!enemy.alive && enemy.dyingTimer <= 0) {
				this.spawnExplosion(enemy.pos, 1);
				if (rig) {
					this.scene.remove(rig.root);
					this.disposeGroupResources(rig.root);
					this.enemyRigs.delete(enemy.id);
				}
				this.enemies.splice(i, 1);
			}
		}
		if (this.mode !== "freeflight" && aliveEnemies > 0 && this.player.takeoffTimer <= 0) {
			this.enemyMissileCooldown -= dt;
			if (this.enemyMissileCooldown <= 0) {
				const attacker = this.enemies.find((e) => e.alive);
				if (attacker) this.launchEnemyMissile(attacker);
				this.enemyMissileCooldown = this.mode === "survival" ? Math.max(7.5, diffCfg.enemyMissileCooldown - this.wave * .4) : diffCfg.enemyMissileCooldown;
			}
		}
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
			const groundY = Math.max(0, sampleTerrainHeight(b.pos.x, b.pos.z));
			if (b.pos.y <= groundY) {
				b.active = false;
				this.spawnParticle(b.pos.x, groundY + 1, b.pos.z, 0, 12, 0, .32, 1.5, 4.5, 16628340);
				continue;
			}
			if (b.fromPlayer) for (const enemy of this.enemies) {
				if (!enemy.alive) continue;
				const hitRadius = (enemy.archetype === "gunship" ? 15 : 11) + diffCfg.bulletHitRadiusBonus;
				if (checkSegmentSphereCollision(_vPrev, b.pos, enemy.pos, hitRadius)) {
					b.active = false;
					this.damageEnemy(enemy, diffCfg.playerCannonDmg, false);
					this.spawnParticle(b.pos.x, b.pos.y, b.pos.z, 0, 0, 0, .25, 1.8, 4.4, 16707722);
					break;
				}
			}
			else if (checkSegmentSphereCollision(_vPrev, b.pos, this.player.pos, 7)) {
				b.active = false;
				this.damagePlayer(diffCfg.enemyCannonDmg, "Shot down by hostile cannon fire.");
			}
			if (b.active) {
				_dummy.position.copy(b.pos);
				_vC.copy(b.pos).add(b.vel);
				_dummy.lookAt(_vC);
				_dummy.scale.set(1, 1, 1);
				_dummy.updateMatrix();
				this.bulletMesh.setMatrixAt(i, _dummy.matrix);
				this.bulletMesh.setColorAt(i, _color.setHex(b.fromPlayer ? 16707722 : 16281969));
			}
		}
		this.bulletMesh.instanceMatrix.needsUpdate = true;
		if (this.bulletMesh.instanceColor) this.bulletMesh.instanceColor.needsUpdate = true;
		for (const m of this.missiles) {
			if (!m.active) continue;
			m.life -= dt;
			if (m.life <= 0) {
				m.active = false;
				m.mesh.visible = false;
				continue;
			}
			if (m.fromPlayer) {
				let target = this.enemies.find((e) => e.id === m.targetEnemyId && e.alive);
				if (!target && this.autoTargetEnabled) {
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
				if (target) {
					const dist = Math.hypot(target.pos.x - m.pos.x, target.pos.y - m.pos.y, target.pos.z - m.pos.z);
					const leadSec = clamp(dist / 480, 0, .25);
					const tFwd = getForwardVector(target.heading, target.pitch, _vA);
					_vB.set(target.pos.x + tFwd.x * target.speed * leadSec - m.pos.x, target.pos.y + tFwd.y * target.speed * leadSec - m.pos.y, target.pos.z + tFwd.z * target.speed * leadSec - m.pos.z).normalize();
					const speed = m.vel.length();
					m.vel.normalize().lerp(_vB, clamp(dt * 11.5, 0, 1)).normalize().multiplyScalar(Math.min(470, speed + dt * 150));
				}
			} else if (this.player.maneuverTimer > 0) m.vel.y -= dt * 135;
			else {
				_vB.set(this.player.pos.x - m.pos.x, this.player.pos.y - m.pos.y, this.player.pos.z - m.pos.z).normalize();
				const speed = m.vel.length();
				m.vel.normalize().lerp(_vB, clamp(dt * diffCfg.enemyMissileTurn, 0, 1)).normalize().multiplyScalar(speed);
			}
			_vPrev.copy(m.pos);
			m.pos.addScaledVector(m.vel, dt);
			m.mesh.position.copy(m.pos);
			_vC.copy(m.pos).add(m.vel);
			m.mesh.lookAt(_vC);
			const mGroundY = Math.max(0, sampleTerrainHeight(m.pos.x, m.pos.z));
			if (m.pos.y <= mGroundY) {
				m.active = false;
				m.mesh.visible = false;
				this.spawnExplosion({
					x: m.pos.x,
					y: mGroundY + 1,
					z: m.pos.z
				}, .85);
				continue;
			}
			this.spawnParticle(m.pos.x, m.pos.y, m.pos.z, (Math.random() - .5) * 4, 1.2, (Math.random() - .5) * 4, .55, .55, 1.9, m.fromPlayer ? 14870768 : 16557477);
			if (m.fromPlayer) for (const enemy of this.enemies) {
				if (!enemy.alive) continue;
				if (checkSegmentSphereCollision(_vPrev, m.pos, enemy.pos, diffCfg.missileHitRadius)) {
					m.active = false;
					m.mesh.visible = false;
					this.damageEnemy(enemy, diffCfg.playerMissileDmg, true);
					this.spawnExplosion(m.pos, 1.15);
					break;
				}
			}
			else if (checkSegmentSphereCollision(_vPrev, m.pos, this.player.pos, 10)) {
				m.active = false;
				m.mesh.visible = false;
				this.damagePlayer(diffCfg.enemyMissileDmg, "Direct hit from hostile air-to-air missile.");
				this.spawnExplosion(m.pos, .95);
			}
		}
		const nextCp = this.checkpoints.find((c) => !c.collected);
		for (const cp of this.checkpoints) {
			const mesh = this.checkpointMeshes.get(cp.id);
			if (mesh) {
				mesh.visible = !cp.collected;
				if (!cp.collected) {
					mesh.rotation.z += dt * (cp.id === nextCp?.id ? 1.8 : .45);
					const scale = cp.id === nextCp?.id ? 1 + Math.sin(this.clockTime * 4) * .06 : .88;
					mesh.scale.setScalar(scale);
				}
			}
			if (!cp.collected && checkSphereCollision(this.player.pos, cp.pos, cp.radius)) {
				cp.collected = true;
				const pts = 500 * this.combo;
				this.score += pts;
				this.combo = Math.min(5, this.combo + 1);
				this.comboTimer = 8;
				this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 25);
				this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
				this.player.missiles = Math.min(this.player.maxMissiles, this.player.missiles + 2);
				this.sound.playCheckpoint();
				this.showBanner(`RING ${cp.order} CLEARED (+${pts} · +20 HP)`, 1.8);
			}
		}
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
				if (col.kind === "repair") {
					this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
					this.showBanner("HULL REPAIRED (+35 HP)", 1.8);
				} else if (col.kind === "fuel") {
					this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 40);
					this.showBanner("FUEL POD COLLECTED (+40%)", 1.8);
				} else if (col.kind === "missile") {
					this.player.missiles = this.player.maxMissiles;
					this.showBanner("ORDNANCE RESUPPLIED", 1.8);
				} else {
					this.score += 500 * this.combo;
					this.showBanner(`STAR POD SECURED (+${500 * this.combo})`, 1.8);
				}
			}
		}
		if (this.mode === "missions") {
			const m = MISSIONS[this.missionIndex];
			if (aliveEnemies === 0 && this.wave < this.totalWaves) {
				this.wave++;
				const clearBonus = 500 * (this.wave - 1);
				this.score += clearBonus;
				this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 25);
				this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
				this.player.missiles = Math.min(this.player.maxMissiles, this.player.missiles + 2);
				const waveCount = Math.ceil(m.enemyCount / m.waves) + (this.difficulty === "beginner" ? 0 : 1);
				this.spawnWaveEnemies(waveCount, this.wave);
				this.showBanner(`WAVE ${this.wave}/${this.totalWaves} INBOUND · +${clearBonus} BONUS`, 2.6);
			} else if (aliveEnemies === 0 && this.wave >= this.totalWaves) this.finishRun("victory");
		} else if (this.mode === "survival") {
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
		} else if (this.mode === "freeflight") {
			if (this.checkpoints.every((c) => c.collected)) {
				for (const c of this.checkpoints) c.collected = false;
				this.showBanner("AIRSPACE CIRCUIT COMPLETE — CHECKPOINTS RESET", 2.4);
			}
		}
	}
	stepParticles(dt) {
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
			s.mesh.material.opacity = (1 - t) * .85;
		}
	}
	syncPlayerRigTransform(dt) {
		this.playerRig.root.position.set(this.player.pos.x, this.player.pos.y, this.player.pos.z);
		_euler.set(this.player.pitch, this.player.heading, this.player.bank, "YXZ");
		this.playerRig.root.quaternion.setFromEuler(_euler);
		const flameLen = this.player.afterburnerActive ? 1.55 + Math.sin(this.clockTime * 48) * .2 : .45 + this.player.throttle * .5 + Math.sin(this.clockTime * 32) * .08;
		const flameRadius = this.player.afterburnerActive ? 1.15 : .68;
		this.playerRig.leftFlameOuter.scale.set(flameRadius, flameRadius, flameLen);
		this.playerRig.rightFlameOuter.scale.set(flameRadius, flameRadius, flameLen);
		this.playerRig.leftFlameInner.scale.set(flameRadius * .85, flameRadius * .85, flameLen * .9);
		this.playerRig.rightFlameInner.scale.set(flameRadius * .85, flameRadius * .85, flameLen * .9);
		for (let i = 0; i < this.playerRig.machDiamonds.length; i++) {
			const md = this.playerRig.machDiamonds[i];
			md.visible = this.player.afterburnerActive || this.player.throttle > .75;
			const pulse = .85 + Math.sin(this.clockTime * 55 + i) * .25;
			md.scale.setScalar(pulse);
		}
		this.playerRig.afterburnerLight.intensity = this.player.afterburnerActive ? 4.5 : 1.5;
	}
	updateCamera(dt) {
		if (this.phase === "title") {
			this.titleClock += dt;
			const orbitAngle = this.titleClock * .22 - .55;
			const dist = 23;
			const targetPos = _vA.set(this.player.pos.x + Math.sin(orbitAngle) * dist, this.player.pos.y + 4.8 + Math.sin(this.titleClock * .5) * 1.4, this.player.pos.z + Math.cos(orbitAngle) * dist);
			this.camPos.lerp(targetPos, 1 - Math.exp(-4 * dt));
			this.camLook.set(this.player.pos.x - 2, this.player.pos.y + .6, this.player.pos.z - 4);
			this.camera.position.copy(this.camPos);
			this.camera.lookAt(this.camLook);
			this.camera.fov = damp(this.camera.fov, 52, 4, dt);
			this.camera.updateProjectionMatrix();
			return;
		}
		if (this.cameraMode === "cockpit") {
			this.playerRig.cockpitCameraAnchor.getWorldPosition(_vA);
			this.camera.position.copy(_vA);
			const fwd = getForwardVector(this.player.heading, this.player.pitch, _vB);
			this.camLook.copy(_vA).addScaledVector(fwd, 120);
			this.camera.lookAt(this.camLook);
			this.camera.rotateZ(this.player.bank * .75);
		} else {
			const fwd = getForwardVector(this.player.heading, this.player.pitch, _vA);
			const isTakeoff = this.player.takeoffTimer > 0;
			const dist = isTakeoff ? 20 : this.cameraMode === "action" ? 16 : 22;
			const height = isTakeoff ? 4.5 : this.cameraMode === "action" ? 3.8 : 5.8;
			const sideOffset = this.cameraMode === "action" && !isTakeoff ? 4 : 0;
			const rx = Math.cos(this.player.heading);
			const rz = -Math.sin(this.player.heading);
			_vB.set(this.player.pos.x - fwd.x * dist + rx * sideOffset, this.player.pos.y - fwd.y * dist + height, this.player.pos.z - fwd.z * dist + rz * sideOffset);
			const safe = resolveSafeCameraPosition(this.player.pos, _vB, this.world.buildingObstacles);
			_vB.set(safe.x, safe.y, safe.z);
			const stiffness = isTakeoff ? 9.5 : 11;
			this.camPos.lerp(_vB, 1 - Math.exp(-stiffness * dt));
			_vC.set(this.player.pos.x + fwd.x * 55, this.player.pos.y + fwd.y * 55 + 1.4, this.player.pos.z + fwd.z * 55);
			this.camLook.lerp(_vC, 1 - Math.exp(-14 * dt));
			this.camera.position.copy(this.camPos);
			this.camera.lookAt(this.camLook);
			this.camera.rotateZ(this.player.bank * (this.cameraMode === "action" ? .32 : .16));
		}
		if (this.trauma > .01) {
			const shake = this.trauma * this.trauma * .045;
			this.camera.rotateX((Math.random() - .5) * shake);
			this.camera.rotateY((Math.random() - .5) * shake);
			this.camera.rotateZ((Math.random() - .5) * shake * 1.4);
		}
		const targetFov = 62 + clamp((this.player.speed - 75) / 170, 0, 1) * 14 + (this.player.afterburnerActive ? 4 : 0);
		this.camera.fov = damp(this.camera.fov, targetFov, 6, dt);
		this.camera.updateProjectionMatrix();
	}
	emitHud() {
		const targets = [];
		for (const enemy of this.enemies) {
			if (!enemy.alive) continue;
			_vProj.set(enemy.pos.x, enemy.pos.y, enemy.pos.z).applyMatrix4(this.camera.matrixWorldInverse);
			const inFront = _vProj.z < -1;
			const dist = Math.hypot(enemy.pos.x - this.player.pos.x, enemy.pos.y - this.player.pos.y, enemy.pos.z - this.player.pos.z);
			let screenX = .5;
			let screenY = .5;
			let dirX = 0;
			let dirY = 0;
			if (inFront) {
				_vProj.set(enemy.pos.x, enemy.pos.y, enemy.pos.z).project(this.camera);
				const rawX = _vProj.x * .5 + .5;
				const rawY = -_vProj.y * .5 + .5;
				screenX = clamp(rawX, .08, .92);
				screenY = clamp(rawY, .14, .78);
				if (rawX < .08 || rawX > .92 || rawY < .14 || rawY > .78) {
					const dx = rawX - .5;
					const dy = rawY - .5;
					const mag = Math.max(1e-4, Math.hypot(dx, dy));
					dirX = dx / mag;
					dirY = dy / mag;
				}
			} else {
				const dx = _vProj.x;
				const dy = -_vProj.y;
				const mag = Math.max(1e-4, Math.hypot(dx, dy));
				dirX = dx / mag;
				dirY = dy / mag;
				screenX = clamp(.5 + dirX * .44, .08, .92);
				screenY = clamp(.48 + dirY * .34, .18, .76);
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
				lockProgress: isLockedTarget ? this.lockProgress : 0
			});
		}
		const nextCp = this.checkpoints.find((c) => !c.collected) ?? null;
		let projectedCp = null;
		if (nextCp) {
			_vProj.set(nextCp.pos.x, nextCp.pos.y, nextCp.pos.z).applyMatrix4(this.camera.matrixWorldInverse);
			const inFront = _vProj.z < -1;
			let screenX = .5;
			let screenY = .5;
			if (inFront) {
				_vProj.set(nextCp.pos.x, nextCp.pos.y, nextCp.pos.z).project(this.camera);
				screenX = clamp(_vProj.x * .5 + .5, .1, .9);
				screenY = clamp(-_vProj.y * .5 + .5, .16, .74);
			} else {
				const dx = _vProj.x;
				const dy = -_vProj.y;
				const mag = Math.max(1e-4, Math.hypot(dx, dy));
				screenX = clamp(.5 + dx / mag * .4, .14, .86);
				screenY = clamp(.48 + dy / mag * .3, .18, .72);
			}
			const dist = Math.hypot(nextCp.pos.x - this.player.pos.x, nextCp.pos.y - this.player.pos.y, nextCp.pos.z - this.player.pos.z);
			projectedCp = {
				id: nextCp.id,
				screenX,
				screenY,
				inFront,
				distance: Math.round(dist),
				order: nextCp.order
			};
		}
		const radarRange = 1350;
		const cosH = Math.cos(this.player.heading);
		const sinH = Math.sin(this.player.heading);
		const radarBlips = [];
		const toRadar = (wx, wz) => {
			const dx = wx - this.player.pos.x;
			const dz = wz - this.player.pos.z;
			const rx = (dx * cosH - dz * sinH) / radarRange;
			const rz = (dx * sinH + dz * cosH) / radarRange;
			const mag = Math.hypot(rx, rz);
			if (mag > .94) return {
				rx: rx / mag * .94,
				rz: rz / mag * .94
			};
			return {
				rx,
				rz
			};
		};
		for (const e of this.enemies) {
			if (!e.alive) continue;
			const { rx, rz } = toRadar(e.pos.x, e.pos.z);
			radarBlips.push({
				id: e.id,
				dx: rx,
				dz: rz,
				kind: "enemy",
				isLocked: e.id === this.lockedTargetId
			});
		}
		if (nextCp) {
			const { rx, rz } = toRadar(nextCp.pos.x, nextCp.pos.z);
			radarBlips.push({
				id: 1e3 + nextCp.id,
				dx: rx,
				dz: rz,
				kind: "checkpoint"
			});
		}
		for (const col of this.collectibles) {
			if (col.collected) continue;
			const { rx, rz } = toRadar(col.pos.x, col.pos.z);
			radarBlips.push({
				id: 2e3 + col.id,
				dx: rx,
				dz: rz,
				kind: "collectible"
			});
		}
		const lockedEnemy = this.enemies.find((e) => e.id === this.lockedTargetId && e.alive);
		const lockedDist = lockedEnemy ? Math.round(Math.hypot(lockedEnemy.pos.x - this.player.pos.x, lockedEnemy.pos.y - this.player.pos.y, lockedEnemy.pos.z - this.player.pos.z)) : null;
		const checkpointsCleared = this.checkpoints.filter((c) => c.collected).length;
		const aliveCount = this.enemies.filter((e) => e.alive).length;
		let incomingDistance = null;
		for (const m of this.missiles) if (m.active && !m.fromPlayer) {
			const md = Math.round(Math.hypot(m.pos.x - this.player.pos.x, m.pos.y - this.player.pos.y, m.pos.z - this.player.pos.z));
			if (incomingDistance === null || md < incomingDistance) incomingDistance = md;
		}
		const incomingMissile = incomingDistance !== null;
		const leadSol = computeAimAssistLead(this.player, this.enemies, this.lockedTargetId, 680, this.difficulty);
		let leadTarget = null;
		if (leadSol) {
			_vProj.set(leadSol.interceptPos.x, leadSol.interceptPos.y, leadSol.interceptPos.z).applyMatrix4(this.camera.matrixWorldInverse);
			if (_vProj.z < -1) {
				_vProj.set(leadSol.interceptPos.x, leadSol.interceptPos.y, leadSol.interceptPos.z).project(this.camera);
				leadTarget = {
					screenX: clamp(_vProj.x * .5 + .5, .08, .92),
					screenY: clamp(-_vProj.y * .5 + .5, .14, .78),
					distance: leadSol.distance
				};
			}
		}
		let objectiveText = "Free Patrol — Clear Aerial Rings & Explore";
		if (this.mode === "missions") objectiveText = `Wave ${this.wave}/${this.totalWaves}: Destroy ${aliveCount} Hostile${aliveCount === 1 ? "" : "s"} (Bonus Rings ${checkpointsCleared}/${this.checkpoints.length})`;
		else if (this.mode === "survival") objectiveText = `Survival Wave ${this.wave} · ${aliveCount} Hostile${aliveCount === 1 ? "" : "s"}`;
		const headingDeg = (Math.round(-this.player.heading * 180 / Math.PI) % 360 + 360) % 360;
		this.callbacks.onHudUpdate({
			phase: this.phase,
			mode: this.mode,
			difficulty: this.difficulty,
			autoTargetEnabled: this.autoTargetEnabled,
			missionIndex: this.missionIndex,
			missionTitle: this.mode === "missions" ? MISSIONS[this.missionIndex].title : this.mode === "survival" ? "Survival Mode" : "Free Flight",
			objectiveText,
			cameraMode: this.cameraMode,
			speedKnots: Math.round(this.player.speed * 4.2),
			altitudeMeters: Math.max(0, Math.round(this.player.pos.y * 3.5)),
			headingDeg,
			pitchDeg: Math.round(this.player.pitch * 180 / Math.PI),
			bankDeg: Math.round(this.player.bank * 180 / Math.PI),
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
			lowFuelWarning: this.mode !== "freeflight" && this.player.fuel <= 20,
			lockState: this.lockProgress >= .99 ? "locked" : this.lockedTargetId !== null ? "acquiring" : "none",
			lockProgress: this.lockProgress,
			lockedTargetCallsign: lockedEnemy?.callsign ?? null,
			lockedTargetDist: lockedDist,
			leadTarget,
			damageFlash: this.damageFlash,
			hitMarker: this.hitMarkerTimer > 0,
			combatFeedback: this.combatFeedback ? {
				text: this.combatFeedback.text,
				kind: this.combatFeedback.kind
			} : null,
			bannerMessage: this.bannerMessage,
			targets,
			nextCheckpoint: projectedCp,
			radarBlips,
			shotsFired: this.shotsFired,
			shotsHit: this.shotsHit,
			defeatReason: this.defeatReason
		});
	}
	scheduleNextFrame() {
		if (this.disposed) return;
		if (this.isSoftwareGl) this.afterDraw(this.tick);
		else this.frameId = requestAnimationFrame(this.tick);
	}
	afterDraw(cb) {
		const gl = this.renderer.getContext();
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
			if ((sync && gl.getSyncParameter(sync, gl.SYNC_STATUS)) === gl.UNSIGNALED) this.frameId = window.setTimeout(poll, 5);
			else {
				if (sync) gl.deleteSync(sync);
				this.frameId = window.setTimeout(cb, 80);
			}
		};
		this.frameId = window.setTimeout(poll, 5);
	}
	handleResize() {
		if (this.disposed) return;
		const rect = this.container.getBoundingClientRect();
		const width = Math.max(1, rect.width || window.innerWidth);
		const height = Math.max(1, rect.height || window.innerHeight);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, this.isMobileDevice ? 1.5 : 2));
		this.renderer.render(this.scene, this.camera);
	}
	dispose() {
		this.disposed = true;
		cancelAnimationFrame(this.frameId);
		clearTimeout(this.frameId);
		window.removeEventListener("keydown", this.handleKeyDown);
		window.removeEventListener("keyup", this.handleKeyUp);
		window.removeEventListener("blur", this.handleBlur);
		document.removeEventListener("visibilitychange", this.handleVisibility);
		this.renderer.domElement.removeEventListener("mousedown", this.handleMouseDown);
		window.removeEventListener("mouseup", this.handleMouseUp);
		this.renderer.domElement.removeEventListener("contextmenu", this.handleContextMenu);
		this.renderer.domElement.removeEventListener("wheel", this.handleWheel);
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
		this.bulletMesh.material.dispose();
		this.scene.remove(this.particleMesh);
		this.particleMesh.geometry.dispose();
		this.particleMesh.material.dispose();
		for (const s of this.shockwaves) {
			this.scene.remove(s.mesh);
			s.mesh.geometry.dispose();
			s.mesh.material.dispose();
		}
		this.renderer.dispose();
		if (this.renderer.domElement.parentNode === this.container) this.container.removeChild(this.renderer.domElement);
	}
};
export { FlightGameEngine as t };
