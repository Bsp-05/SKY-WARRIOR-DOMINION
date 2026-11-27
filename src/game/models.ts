/**
 * models.ts — procedural aircraft and pickup meshes for Sky Warrior Dominion.
 *
 * Everything here is built from Three.js primitives at runtime: no external
 * model files are loaded. The player jet (F-22X), the three enemy
 * archetypes, missiles, checkpoint rings and collectible pods all live in
 * this module. Public builders keep exactly the shapes the engine expects;
 * the private helpers below are only organisational — they group one
 * airframe section per function so a single section can be tweaked without
 * scrolling through the whole jet.
 */
import * as THREE from 'three';
import type { CollectibleKind, EnemyArchetype, JetLivery } from './types';
import type { ProceduralTextureSet } from './textures';

export interface FighterJetRig {
  root: THREE.Group;
  leftAileron: THREE.Mesh;
  rightAileron: THREE.Mesh;
  leftElevator: THREE.Mesh;
  rightElevator: THREE.Mesh;
  leftRudder: THREE.Mesh;
  rightRudder: THREE.Mesh;
  leftFlameOuter: THREE.Mesh;
  rightFlameOuter: THREE.Mesh;
  leftFlameInner: THREE.Mesh;
  rightFlameInner: THREE.Mesh;
  machDiamonds: THREE.Mesh[];
  afterburnerLight: THREE.PointLight;
  cockpitCameraAnchor: THREE.Object3D;
  gunMuzzles: THREE.Object3D[];
  muzzleFlashes: THREE.Mesh[];
  landingGear: THREE.Group;
}

export interface EnemyModelRig {
  root: THREE.Group;
  flameMesh: THREE.Mesh;
  turretGroup?: THREE.Group;
  telegraphGlow: THREE.Mesh;
  bodyMaterials: THREE.MeshStandardMaterial[];
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** A small placement tuple, used so builders stay readable. */
type Vec3 = [number, number, number];

/** Attach a mesh to a parent, applying position / rotation / scale in one place. */
function placeMesh<T extends THREE.Mesh>(
  parent: THREE.Object3D,
  mesh: T,
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
  scale: Vec3 = [1, 1, 1],
): T {
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  parent.add(mesh);
  return mesh;
}

/** Shorthand for a box mesh placed in one call. */
function boxMesh(
  parent: THREE.Object3D,
  size: Vec3,
  material: THREE.Material,
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
): THREE.Mesh {
  return placeMesh(parent, new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material), position, rotation);
}

/** Mirror a mesh across the aircraft centreline (x = 0). */
function mirrorX(source: THREE.Mesh): THREE.Mesh {
  const copy = source.clone();
  copy.position.x = -source.position.x;
  return copy;
}

/* ------------------------------------------------------------------ */
/* Player jet — livery and materials                                   */
/* ------------------------------------------------------------------ */

interface LiveryPalette {
  primary: number;
  secondary: number;
  accent: number;
  metalness: number;
  roughness: number;
}

function paletteForLivery(livery: JetLivery): LiveryPalette {
  switch (livery) {
    case 'viper':
      return { primary: 0x3b485b, secondary: 0x1e293b, accent: 0xf59e0b, metalness: 0.76, roughness: 0.24 };
    case 'arctic':
      return { primary: 0xd8e1eb, secondary: 0x475569, accent: 0x0ea5e9, metalness: 0.62, roughness: 0.3 };
    case 'obsidian':
    default:
      return { primary: 0x2c3442, secondary: 0x141923, accent: 0xf97316, metalness: 0.86, roughness: 0.2 };
  }
}

interface JetMaterials {
  hull: THREE.MeshPhysicalMaterial;
  trim: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  canopy: THREE.MeshPhysicalMaterial;
  nozzle: THREE.MeshStandardMaterial;
}

function buildJetMaterials(
  livery: JetLivery,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): JetMaterials {
  const palette = paletteForLivery(livery);
  return {
    hull: new THREE.MeshPhysicalMaterial({
      color: palette.primary,
      map: textures.jetPanelAlbedo,
      bumpMap: textures.jetPanelBump,
      bumpScale: 0.035,
      metalness: palette.metalness,
      roughness: palette.roughness,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18,
      anisotropy: 0.55,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: palette.secondary,
      bumpMap: textures.jetPanelBump,
      bumpScale: 0.02,
      metalness: 0.48,
      roughness: 0.58,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: palette.accent,
      metalness: 0.35,
      roughness: 0.35,
      emissive: palette.accent,
      emissiveIntensity: 0.16,
    }),
    canopy: new THREE.MeshPhysicalMaterial({
      color: 0xe3a832,
      metalness: 0.2,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      // Software GL renders transparency more cheaply at lower opacity.
      opacity: isSoftwareGl ? 0.52 : 0.74,
      ior: 1.54,
    }),
    nozzle: new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.94, roughness: 0.2 }),
  };
}

/** Everything the fuselage / cockpit builders share. */
interface JetBuildContext {
  root: THREE.Group;
  mats: JetMaterials;
}

/* ------------------------------------------------------------------ */
/* Player jet — airframe sections                                      */
/* ------------------------------------------------------------------ */

/** Stealth fuselage, LERX strakes, nose radome and dorsal spine. */
function buildFuselage(ctx: JetBuildContext): void {
  const { root, mats } = ctx;

  // Primary sculpted stealth fuselage: flat plan-form extruded vertically.
  const fuseShape = new THREE.Shape();
  fuseShape.moveTo(0, -6.3);
  fuseShape.lineTo(0.7, -2.6);
  fuseShape.lineTo(1.26, 0.35);
  fuseShape.lineTo(1.2, 4.25);
  fuseShape.lineTo(0.86, 5.15);
  fuseShape.lineTo(-0.86, 5.15);
  fuseShape.lineTo(-1.2, 4.25);
  fuseShape.lineTo(-1.26, 0.35);
  fuseShape.lineTo(-0.7, -2.6);
  fuseShape.closePath();

  const fuseGeo = new THREE.ExtrudeGeometry(fuseShape, {
    depth: 0.68,
    bevelEnabled: true,
    bevelThickness: 0.28,
    bevelSize: 0.24,
    bevelSegments: 2,
  });
  fuseGeo.rotateX(Math.PI / 2);
  fuseGeo.translate(0, 0.34, 0);
  const fuselage = new THREE.Mesh(fuseGeo, mats.hull);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  root.add(fuselage);

  // Leading-edge root extensions (LERX), mirrored left / right.
  const lerxGeo = new THREE.BoxGeometry(0.65, 0.14, 2.9);
  const rightLerx = placeMesh(root, new THREE.Mesh(lerxGeo, mats.trim), [1.15, 0.12, -1.6], [0, -0.24, 0]);
  const leftLerx = mirrorX(rightLerx);
  leftLerx.rotation.y = 0.24;
  root.add(leftLerx);

  // Nose radome (flattened cone) — the pitot probe is implied by its tip.
  const noseGeo = new THREE.ConeGeometry(0.68, 3.3, 18);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = placeMesh(root, new THREE.Mesh(noseGeo, mats.trim), [0, 0.08, -6.9], [0, 0, 0], [1.0, 0.66, 1.0]);
  nose.castShadow = true;

  // Dorsal spine / avionics fairing running down the centreline.
  const spine = boxMesh(root, [0.92, 0.56, 6.2], mats.hull, [0, 0.52, 1.2]);
  spine.castShadow = true;
}

/** Cockpit tub, seat, pilot helmet, HUD glass, canopy and camera anchor. */
function buildCockpit(ctx: JetBuildContext): THREE.Object3D {
  const { root, mats } = ctx;

  const tubMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 });
  boxMesh(root, [0.86, 0.38, 2.35], tubMat, [0, 0.48, -2.5]);
  boxMesh(root, [0.42, 0.45, 0.22], mats.trim, [0, 0.78, -1.9]); // ejection-seat headrest

  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.28, metalness: 0.45 });
  placeMesh(root, new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), helmetMat), [0, 0.82, -2.35]);

  const hudMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
  });
  placeMesh(root, new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.28), hudMat), [0, 0.82, -3.35], [-0.35, 0, 0]);

  const canopyGeo = new THREE.CapsuleGeometry(0.54, 1.9, 8, 16);
  canopyGeo.rotateX(Math.PI / 2);
  const canopy = placeMesh(root, new THREE.Mesh(canopyGeo, mats.canopy), [0, 0.74, -2.55], [0, 0, 0], [0.92, 0.72, 1.15]);
  canopy.renderOrder = 2;

  const anchor = new THREE.Object3D();
  anchor.position.set(0, 1.02, -2.65);
  root.add(anchor);
  return anchor;
}

/** Swept delta wings, accent stripes and the moving ailerons. */
function buildWings(ctx: JetBuildContext): { leftAileron: THREE.Mesh; rightAileron: THREE.Mesh } {
  const { root, mats } = ctx;

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.95, -1.6);
  wingShape.lineTo(5.75, 2.35);
  wingShape.lineTo(5.75, 3.2);
  wingShape.lineTo(1.15, 2.75);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  wingGeo.rotateX(Math.PI / 2);

  const rightWing = placeMesh(root, new THREE.Mesh(wingGeo, mats.hull), [0, 0.08, 0]);
  rightWing.castShadow = true;
  rightWing.receiveShadow = true;
  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  root.add(leftWing);

  // Tactical accent stripes swept along each wing.
  const stripeGeo = new THREE.BoxGeometry(3.3, 0.05, 0.42);
  const rightStripe = placeMesh(root, new THREE.Mesh(stripeGeo, mats.accent), [3.25, 0.14, 1.65], [0, -0.62, 0]);
  const leftStripe = mirrorX(rightStripe);
  leftStripe.rotation.y = 0.62;
  root.add(leftStripe);

  const aileronGeo = new THREE.BoxGeometry(1.85, 0.08, 0.44);
  const rightAileron = placeMesh(root, new THREE.Mesh(aileronGeo, mats.trim), [3.95, 0.04, 3.12], [0, 0.1, 0]);
  const leftAileron = placeMesh(root, new THREE.Mesh(aileronGeo, mats.trim), [-3.95, 0.04, 3.12], [0, -0.1, 0]);
  return { leftAileron, rightAileron };
}

/** Rear horizontal stabilisers (elevators) and canted tail fins + rudders. */
function buildTail(ctx: JetBuildContext): {
  leftElevator: THREE.Mesh;
  rightElevator: THREE.Mesh;
  leftRudder: THREE.Mesh;
  rightRudder: THREE.Mesh;
} {
  const { root, mats } = ctx;

  const elevGeo = new THREE.BoxGeometry(2.15, 0.09, 1.05);
  const rightElevator = placeMesh(root, new THREE.Mesh(elevGeo, mats.trim), [1.98, 0.08, 4.88], [0, -0.22, 0]);
  rightElevator.castShadow = true;
  const leftElevator = placeMesh(root, new THREE.Mesh(elevGeo, mats.trim), [-1.98, 0.08, 4.88], [0, 0.22, 0]);
  leftElevator.castShadow = true;

  // Canted vertical fins, extruded from a swept plan-form shape.
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(1.8, 0);
  finShape.lineTo(2.4, 2.0);
  finShape.lineTo(1.32, 2.0);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
  });
  finGeo.rotateY(Math.PI / 2);

  const rightFin = placeMesh(root, new THREE.Mesh(finGeo, mats.hull), [0.88, 0.48, 4.98], [0, 0, -0.26]);
  rightFin.castShadow = true;
  const leftFin = placeMesh(root, new THREE.Mesh(finGeo, mats.hull), [-0.96, 0.48, 4.98], [0, 0, 0.26]);
  leftFin.castShadow = true;

  const rudderGeo = new THREE.BoxGeometry(0.08, 1.5, 0.42);
  const rightRudder = placeMesh(root, new THREE.Mesh(rudderGeo, mats.accent), [1.18, 1.3, 4.98], [0, 0, -0.26]);
  const leftRudder = placeMesh(root, new THREE.Mesh(rudderGeo, mats.accent), [-1.18, 1.3, 4.98], [0, 0, 0.26]);
  return { leftElevator, rightElevator, leftRudder, rightRudder };
}

/** Side air intakes (one builder for both sides). */
function buildIntakes(ctx: JetBuildContext): void {
  const { root, mats } = ctx;
  const intakeGeo = new THREE.BoxGeometry(0.68, 0.56, 2.85);
  const rightIntake = placeMesh(root, new THREE.Mesh(intakeGeo, mats.trim), [0.96, 0.04, -1.6]);
  const leftIntake = mirrorX(rightIntake);
  root.add(leftIntake);
}

/** Twin nozzles, glow rings, two-stage exhaust flames, Mach diamonds, light. */
function buildPropulsion(ctx: JetBuildContext): {
  leftFlameOuter: THREE.Mesh;
  rightFlameOuter: THREE.Mesh;
  leftFlameInner: THREE.Mesh;
  rightFlameInner: THREE.Mesh;
  machDiamonds: THREE.Mesh[];
  afterburnerLight: THREE.PointLight;
} {
  const { root, mats } = ctx;

  const nozzleGeo = new THREE.CylinderGeometry(0.43, 0.35, 0.98, 16);
  nozzleGeo.rotateX(Math.PI / 2);
  const rightNozzle = placeMesh(root, new THREE.Mesh(nozzleGeo, mats.nozzle), [0.56, 0.12, 5.28]);
  const leftNozzle = mirrorX(rightNozzle);
  root.add(leftNozzle);

  // Hot interior glow rings at the nozzle exit plane.
  const ringGlowMat = new THREE.MeshBasicMaterial({ color: 0xfb923c });
  const ringGlowGeo = new THREE.TorusGeometry(0.32, 0.045, 8, 16);
  const rightRingGlow = placeMesh(root, new THREE.Mesh(ringGlowGeo, ringGlowMat), [0.56, 0.12, 5.75]);
  const leftRingGlow = mirrorX(rightRingGlow);
  root.add(leftRingGlow);

  // Outer (orange) and inner (pale blue) exhaust cones, pointing backwards.
  const flameOuterGeo = new THREE.ConeGeometry(0.34, 2.8, 14);
  flameOuterGeo.rotateX(Math.PI / 2);
  flameOuterGeo.translate(0, 0, 1.4);
  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xff6b1a,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rightFlameOuter = placeMesh(root, new THREE.Mesh(flameOuterGeo, flameOuterMat), [0.56, 0.12, 5.65]);
  const leftFlameOuter = mirrorX(rightFlameOuter);
  root.add(leftFlameOuter);

  const flameInnerGeo = new THREE.ConeGeometry(0.19, 1.75, 12);
  flameInnerGeo.rotateX(Math.PI / 2);
  flameInnerGeo.translate(0, 0, 0.88);
  const flameInnerMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rightFlameInner = placeMesh(root, new THREE.Mesh(flameInnerGeo, flameInnerMat), [0.56, 0.12, 5.65]);
  const leftFlameInner = mirrorX(rightFlameInner);
  root.add(leftFlameInner);

  // Mach shock-diamond discs inside each afterburner plume.
  const machDiamonds: THREE.Mesh[] = [];
  const diamondGeo = new THREE.OctahedronGeometry(0.14, 0);
  diamondGeo.scale(1, 1, 2.1);
  const diamondMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const xPos of [-0.56, 0.56]) {
    for (let dIdx = 0; dIdx < 2; dIdx++) {
      const diamond = placeMesh(root, new THREE.Mesh(diamondGeo, diamondMat), [xPos, 0.12, 6.25 + dIdx * 0.85]);
      machDiamonds.push(diamond);
    }
  }

  const afterburnerLight = new THREE.PointLight(0xff7b29, 3.2, 24, 2);
  afterburnerLight.position.set(0, 0.2, 6.5);
  root.add(afterburnerLight);

  return { leftFlameOuter, rightFlameOuter, leftFlameInner, rightFlameInner, machDiamonds, afterburnerLight };
}

/** Underwing pylons + missiles, nav lights, gun muzzles and muzzle flashes. */
function buildArmament(ctx: JetBuildContext): { gunMuzzles: THREE.Object3D[]; muzzleFlashes: THREE.Mesh[] } {
  const { root, mats } = ctx;

  const podMissileGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.85, 8);
  podMissileGeo.rotateX(Math.PI / 2);
  const missileMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.55, roughness: 0.28 });
  for (const xOffset of [-3.35, -2.15, 2.15, 3.35]) {
    boxMesh(root, [0.12, 0.28, 1.4], mats.trim, [xOffset, -0.14, 1.2]);
    const missile = new THREE.Mesh(podMissileGeo, missileMat);
    missile.position.set(xOffset, -0.32, 1.15);
    root.add(missile);
  }

  // Wingtip navigation lights: red port, green starboard.
  placeMesh(
    root,
    new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 })),
    [-5.75, 0.1, 2.78],
  );
  placeMesh(
    root,
    new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e })),
    [5.75, 0.1, 2.78],
  );

  const leftMuzzle = new THREE.Object3D();
  leftMuzzle.position.set(-0.98, 0.04, -3.2);
  root.add(leftMuzzle);
  const rightMuzzle = new THREE.Object3D();
  rightMuzzle.position.set(0.98, 0.04, -3.2);
  root.add(rightMuzzle);

  const flashGeo = new THREE.ConeGeometry(0.32, 1.35, 8);
  flashGeo.rotateX(-Math.PI / 2);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const leftFlash = placeMesh(root, new THREE.Mesh(flashGeo, flashMat), [-0.98, 0.04, -3.85]);
  leftFlash.visible = false;
  const rightFlash = placeMesh(root, new THREE.Mesh(flashGeo, flashMat), [0.98, 0.04, -3.85]);
  rightFlash.visible = false;

  return { gunMuzzles: [leftMuzzle, rightMuzzle], muzzleFlashes: [leftFlash, rightFlash] };
}

/** Retractable tricycle landing gear: nose wheel + two main wheels. */
function buildLandingGear(root: THREE.Group): THREE.Group {
  const landingGear = new THREE.Group();
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.05 });
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12);
  wheelGeo.rotateZ(Math.PI / 2);

  for (const gx of [0, -0.85, 0.85]) {
    const gz = gx === 0 ? -3.8 : 1.4;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), strutMat);
    strut.position.set(gx, -0.45, gz);
    landingGear.add(strut);
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(gx, -0.82, gz);
    landingGear.add(wheel);
  }
  root.add(landingGear);
  return landingGear;
}

export function createFighterJetModel(
  livery: JetLivery,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): FighterJetRig {
  const root = new THREE.Group();
  const ctx: JetBuildContext = { root, mats: buildJetMaterials(livery, textures, isSoftwareGl) };

  buildFuselage(ctx);
  const cockpitCameraAnchor = buildCockpit(ctx);
  const { leftAileron, rightAileron } = buildWings(ctx);
  const { leftElevator, rightElevator, leftRudder, rightRudder } = buildTail(ctx);
  buildIntakes(ctx);
  const propulsion = buildPropulsion(ctx);
  const { gunMuzzles, muzzleFlashes } = buildArmament(ctx);
  const landingGear = buildLandingGear(root);

  return {
    root,
    leftAileron,
    rightAileron,
    leftElevator,
    rightElevator,
    leftRudder,
    rightRudder,
    leftFlameOuter: propulsion.leftFlameOuter,
    rightFlameOuter: propulsion.rightFlameOuter,
    leftFlameInner: propulsion.leftFlameInner,
    rightFlameInner: propulsion.rightFlameInner,
    machDiamonds: propulsion.machDiamonds,
    afterburnerLight: propulsion.afterburnerLight,
    cockpitCameraAnchor,
    gunMuzzles,
    muzzleFlashes,
    landingGear,
  };
}

/* ------------------------------------------------------------------ */
/* Enemy aircraft                                                      */
/* ------------------------------------------------------------------ */

/** Shared telegraph glow: the warning flash shown just before an attack. */
function buildTelegraphGlow(root: THREE.Group): THREE.Mesh {
  const telegraphMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  return placeMesh(root, new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), telegraphMat), [0, 0.1, -5.6]);
}

/** Shared additive exhaust cone, pointing backwards from the tail. */
function buildEnemyFlame(
  root: THREE.Group,
  radius: number,
  length: number,
  color: number,
  z: number,
  radialSegments = 10,
  opacity = 0.88,
): THREE.Mesh {
  const flameGeo = new THREE.ConeGeometry(radius, length, radialSegments);
  const flameMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.set(0, 0, z);
  root.add(flame);
  return flame;
}

/** Fast, dart-like interceptor with forward-swept wings and red trim. */
function buildInterceptor(root: THREE.Group, telegraphGlow: THREE.Mesh): EnemyModelRig {
  const bodyMaterials: THREE.MeshStandardMaterial[] = [];
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x3b1d26, metalness: 0.8, roughness: 0.25 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.45,
    roughness: 0.38,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.25,
  });
  bodyMaterials.push(hullMat, trimMat);

  const fuse = new THREE.Mesh(new THREE.ConeGeometry(1.18, 10.2, 8), hullMat);
  fuse.rotation.x = -Math.PI / 2;
  fuse.scale.set(1.22, 1.0, 0.5);
  root.add(fuse);

  // Swept forward wings (angled pair) plus a full-span trim strake.
  const wingGeo = new THREE.BoxGeometry(5.1, 0.14, 1.85);
  placeMesh(root, new THREE.Mesh(wingGeo, hullMat), [2.8, 0.02, 0.45], [0, 0.28, 0]);
  placeMesh(root, new THREE.Mesh(wingGeo, hullMat), [-2.8, 0.02, 0.45], [0, -0.28, 0]);
  boxMesh(root, [10.2, 0.16, 0.42], trimMat, [0, 0.06, -0.15]);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.35,
    roughness: 0.1,
    emissive: 0x9a3412,
    emissiveIntensity: 0.4,
  });
  const canopyGeo = new THREE.CapsuleGeometry(0.45, 1.6, 6, 12);
  placeMesh(root, new THREE.Mesh(canopyGeo, canopyMat), [0, 0.46, -1.9], [Math.PI / 2, 0, 0]);

  for (const tx of [-0.65, 0.65]) {
    boxMesh(root, [0.12, 1.75, 1.45], trimMat, [tx, 0.85, 3.6], [0, 0, tx > 0 ? -0.22 : 0.22]);
  }

  const flameMesh = buildEnemyFlame(root, 0.44, 2.8, 0xff5722, 6.0);
  root.scale.setScalar(1.28);
  return { root, flameMesh, telegraphGlow, bodyMaterials };
}

/** Wide twin-boom flanker with a sensor dome and blue accent lighting. */
function buildFlanker(root: THREE.Group, telegraphGlow: THREE.Mesh): EnemyModelRig {
  const bodyMaterials: THREE.MeshStandardMaterial[] = [];
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.86, roughness: 0.22 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.45,
    roughness: 0.32,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
  });
  bodyMaterials.push(hullMat, accentMat);

  boxMesh(root, [2.2, 0.72, 8.2], hullMat, [0, 0, 0]);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.12, 3.5, 4), hullMat);
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.z = Math.PI / 4;
  nose.position.set(0, 0, -5.65);
  root.add(nose);

  placeMesh(
    root,
    new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 10), accentMat),
    [0, 0.45, -1.6],
    [0, 0, 0],
    [1, 0.55, 1.8],
  );

  boxMesh(root, [11.4, 0.14, 2.5], hullMat, [0, 0, 0.8]);

  const boomL = boxMesh(root, [0.45, 1.45, 3.6], accentMat, [-2.5, 0.45, 2.5]);
  const boomR = boomL.clone();
  boomR.position.x = 2.5;
  root.add(boomR);

  const flameMesh = buildEnemyFlame(root, 0.52, 3.0, 0x38bdf8, 5.4);
  root.scale.setScalar(1.32);
  return { root, flameMesh, telegraphGlow, bodyMaterials };
}

/** Heavy gunship with armoured nose, engine pods and a rotating dorsal turret. */
function buildGunship(root: THREE.Group, telegraphGlow: THREE.Mesh): EnemyModelRig {
  const bodyMaterials: THREE.MeshStandardMaterial[] = [];
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.68, roughness: 0.42 });
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.52,
    roughness: 0.34,
    emissive: 0xb45309,
    emissiveIntensity: 0.32,
  });
  bodyMaterials.push(hullMat, armorMat);

  boxMesh(root, [3.5, 1.7, 11.6], hullMat, [0, 0, 0]);
  boxMesh(root, [2.6, 1.2, 3.3], armorMat, [0, -0.1, -6.6]);
  boxMesh(root, [14.8, 0.36, 3.5], hullMat, [0, 0.25, 0.5]);

  const podGeo = new THREE.CylinderGeometry(0.75, 0.88, 5.4, 12);
  const podL = new THREE.Mesh(podGeo, armorMat);
  podL.rotation.x = Math.PI / 2;
  podL.position.set(-4.5, -0.35, 1.2);
  root.add(podL);
  const podR = podL.clone();
  podR.position.x = 4.5;
  root.add(podR);

  const turretGroup = new THREE.Group();
  turretGroup.position.set(0, 1.05, -0.6);
  const turretDome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), armorMat);
  turretGroup.add(turretDome);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 8), hullMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.2, -1.4);
  turretGroup.add(barrel);
  root.add(turretGroup);

  const flameMesh = buildEnemyFlame(root, 0.75, 3.4, 0xfbbf24, 7.2, 12, 0.9);
  root.scale.setScalar(1.36);
  return { root, flameMesh, turretGroup, telegraphGlow, bodyMaterials };
}

export function createEnemyJetModel(archetype: EnemyArchetype): EnemyModelRig {
  const root = new THREE.Group();
  const telegraphGlow = buildTelegraphGlow(root);

  if (archetype === 'interceptor') return buildInterceptor(root, telegraphGlow);
  if (archetype === 'flanker') return buildFlanker(root, telegraphGlow);
  return buildGunship(root, telegraphGlow);
}

/* ------------------------------------------------------------------ */
/* Missiles, checkpoint rings and collectibles                         */
/* ------------------------------------------------------------------ */

export function createMissileModel(isEnemy = false): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isEnemy ? 0xfca5a5 : 0xf8fafc,
    metalness: 0.65,
    roughness: 0.22,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.0, 10), bodyMat);
  body.rotation.x = Math.PI / 2;
  g.add(body);

  const noseMat = new THREE.MeshStandardMaterial({
    color: isEnemy ? 0xef4444 : 0xf59e0b,
    emissive: isEnemy ? 0xef4444 : 0xf59e0b,
    emissiveIntensity: 0.6,
  });
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 10), noseMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.8;
  g.add(nose);

  const plumeMat = new THREE.MeshBasicMaterial({
    color: isEnemy ? 0xef4444 : 0xffedd5,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.2, 8), plumeMat);
  plume.rotation.x = Math.PI / 2;
  plume.position.z = 2.4;
  g.add(plume);

  return g;
}

export function createCheckpointRingModel(order: number): THREE.Group {
  const g = new THREE.Group();

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(32, 1.4, 12, 36),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.2,
    }),
  );
  g.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(27, 0.55, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.72 }),
  );
  g.add(innerRing);

  // Four beacon pylons around the rim; the order rotates them slightly so
  // consecutive rings do not look identical.
  const pylonGeo = new THREE.ConeGeometry(2.2, 5.5, 4);
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.6,
  });
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + order * 0.2;
    const pylon = new THREE.Mesh(pylonGeo, pylonMat);
    pylon.position.set(Math.cos(angle) * 35.5, Math.sin(angle) * 35.5, 0);
    pylon.rotation.z = angle + Math.PI / 2;
    g.add(pylon);
  }

  return g;
}

const COLLECTIBLE_COLORS: Record<CollectibleKind, number> = {
  repair: 0x22c55e,
  fuel: 0xf59e0b,
  missile: 0xef4444,
  star: 0x38bdf8,
};

export function createCollectibleModel(kind: CollectibleKind): THREE.Group {
  const g = new THREE.Group();
  const col = COLLECTIBLE_COLORS[kind];

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(6.5, 0),
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.75,
      metalness: 0.55,
      roughness: 0.2,
    }),
  );
  g.add(core);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(10.5, 0.7, 8, 24),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.65 }),
  );
  g.add(halo);

  return g;
}
