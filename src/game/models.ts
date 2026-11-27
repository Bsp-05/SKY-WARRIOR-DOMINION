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

function getLiveryColors(livery: JetLivery): {
  primary: number;
  secondary: number;
  accent: number;
  metalness: number;
  roughness: number;
} {
  switch (livery) {
    case 'viper':
      return {
        primary: 0x3b485b,
        secondary: 0x1e293b,
        accent: 0xf59e0b,
        metalness: 0.76,
        roughness: 0.24,
      };
    case 'arctic':
      return {
        primary: 0xd8e1eb,
        secondary: 0x475569,
        accent: 0x0ea5e9,
        metalness: 0.62,
        roughness: 0.3,
      };
    case 'obsidian':
    default:
      return {
        primary: 0x2c3442,
        secondary: 0x141923,
        accent: 0xf97316,
        metalness: 0.86,
        roughness: 0.2,
      };
  }
}

export function createFighterJetModel(
  livery: JetLivery,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): FighterJetRig {
  const root = new THREE.Group();
  const palette = getLiveryColors(livery);

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: palette.primary,
    map: textures.jetPanelAlbedo,
    bumpMap: textures.jetPanelBump,
    bumpScale: 0.035,
    metalness: palette.metalness,
    roughness: palette.roughness,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
    anisotropy: 0.55,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: palette.secondary,
    bumpMap: textures.jetPanelBump,
    bumpScale: 0.02,
    metalness: 0.48,
    roughness: 0.58,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: palette.accent,
    metalness: 0.35,
    roughness: 0.35,
    emissive: palette.accent,
    emissiveIntensity: 0.16,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0xe3a832,
    metalness: 0.2,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    transparent: true,
    opacity: isSoftwareGl ? 0.52 : 0.74,
    ior: 1.54,
  });

  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    metalness: 0.94,
    roughness: 0.2,
  });

  // 1. Primary sculpted stealth fuselage
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
  const fuselage = new THREE.Mesh(fuseGeo, hullMat);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  root.add(fuselage);

  // Leading-edge root extensions (LERX)
  const lerxGeo = new THREE.BoxGeometry(0.65, 0.14, 2.9);
  const rightLerx = new THREE.Mesh(lerxGeo, trimMat);
  rightLerx.position.set(1.15, 0.12, -1.6);
  rightLerx.rotation.y = -0.24;
  root.add(rightLerx);

  const leftLerx = rightLerx.clone();
  leftLerx.position.x = -1.15;
  leftLerx.rotation.y = 0.24;
  root.add(leftLerx);

  // Nose radome + pitot probe
  const noseGeo = new THREE.ConeGeometry(0.68, 3.3, 18);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, trimMat);
  nose.position.set(0, 0.08, -6.9);
  nose.scale.set(1.0, 0.66, 1.0);
  nose.castShadow = true;
  root.add(nose);

  // Dorsal spine & avionics fairing
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 6.2), hullMat);
  spine.position.set(0, 0.52, 1.2);
  spine.castShadow = true;
  root.add(spine);

  // 2. Detailed Cockpit Tub, Ejection Seat, Pilot Helmet, HUD Combiner & Glossy Canopy
  const cockpitTub = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.38, 2.35),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 })
  );
  cockpitTub.position.set(0, 0.48, -2.5);
  root.add(cockpitTub);

  const headrest = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.45, 0.22),
    trimMat
  );
  headrest.position.set(0, 0.78, -1.9);
  root.add(headrest);

  const pilotHelmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.28, metalness: 0.45 })
  );
  pilotHelmet.position.set(0, 0.82, -2.35);
  root.add(pilotHelmet);

  const hudGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.45, 0.28),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
  );
  hudGlass.position.set(0, 0.82, -3.35);
  hudGlass.rotation.x = -0.35;
  root.add(hudGlass);

  const canopyGeo = new THREE.CapsuleGeometry(0.54, 1.9, 8, 16);
  canopyGeo.rotateX(Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.74, -2.55);
  canopy.scale.set(0.92, 0.72, 1.15);
  canopy.renderOrder = 2;
  root.add(canopy);

  const cockpitCameraAnchor = new THREE.Object3D();
  cockpitCameraAnchor.position.set(0, 1.02, -2.65);
  root.add(cockpitCameraAnchor);

  // 3. Swept Delta Main Wings + Moving Ailerons
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

  const rightWing = new THREE.Mesh(wingGeo, hullMat);
  rightWing.position.set(0, 0.08, 0);
  rightWing.castShadow = true;
  rightWing.receiveShadow = true;
  root.add(rightWing);

  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  root.add(leftWing);

  // Wing tactical markings
  const stripeGeo = new THREE.BoxGeometry(3.3, 0.05, 0.42);
  const rightStripe = new THREE.Mesh(stripeGeo, accentMat);
  rightStripe.position.set(3.25, 0.14, 1.65);
  rightStripe.rotation.y = -0.62;
  root.add(rightStripe);

  const leftStripe = rightStripe.clone();
  leftStripe.position.x = -3.25;
  leftStripe.rotation.y = 0.62;
  root.add(leftStripe);

  const aileronGeo = new THREE.BoxGeometry(1.85, 0.08, 0.44);
  const rightAileron = new THREE.Mesh(aileronGeo, trimMat);
  rightAileron.position.set(3.95, 0.04, 3.12);
  rightAileron.rotation.y = 0.1;
  root.add(rightAileron);

  const leftAileron = new THREE.Mesh(aileronGeo, trimMat);
  leftAileron.position.set(-3.95, 0.04, 3.12);
  leftAileron.rotation.y = -0.1;
  root.add(leftAileron);

  // 4. Twin Rear Horizontal Stabilizers (Elevators) + Ventral Strakes
  const elevGeo = new THREE.BoxGeometry(2.15, 0.09, 1.05);
  const rightElevator = new THREE.Mesh(elevGeo, trimMat);
  rightElevator.position.set(1.98, 0.08, 4.88);
  rightElevator.rotation.y = -0.22;
  rightElevator.castShadow = true;
  root.add(rightElevator);

  const leftElevator = new THREE.Mesh(elevGeo, trimMat);
  leftElevator.position.set(-1.98, 0.08, 4.88);
  leftElevator.rotation.y = 0.22;
  leftElevator.castShadow = true;
  root.add(leftElevator);

  // 5. Twin Canted Vertical Tail Fins & Moving Rudders
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

  const rightFin = new THREE.Mesh(finGeo, hullMat);
  rightFin.position.set(0.88, 0.48, 4.98);
  rightFin.rotation.z = -0.26;
  rightFin.castShadow = true;
  root.add(rightFin);

  const leftFin = new THREE.Mesh(finGeo, hullMat);
  leftFin.position.set(-0.96, 0.48, 4.98);
  leftFin.rotation.z = 0.26;
  leftFin.castShadow = true;
  root.add(leftFin);

  const rudderGeo = new THREE.BoxGeometry(0.08, 1.5, 0.42);
  const rightRudder = new THREE.Mesh(rudderGeo, accentMat);
  rightRudder.position.set(1.18, 1.3, 4.98);
  rightRudder.rotation.z = -0.26;
  root.add(rightRudder);

  const leftRudder = new THREE.Mesh(rudderGeo, accentMat);
  leftRudder.position.set(-1.18, 1.3, 4.98);
  leftRudder.rotation.z = 0.26;
  root.add(leftRudder);

  // 6. Twin Side Air Intakes
  const intakeGeo = new THREE.BoxGeometry(0.68, 0.56, 2.85);
  const rightIntake = new THREE.Mesh(intakeGeo, trimMat);
  rightIntake.position.set(0.96, 0.04, -1.6);
  root.add(rightIntake);

  const leftIntake = rightIntake.clone();
  leftIntake.position.x = -0.96;
  root.add(leftIntake);

  // 7. Twin Afterburner Nozzles, Mach Diamonds & Multi-Stage Exhaust Plumes
  const nozzleGeo = new THREE.CylinderGeometry(0.43, 0.35, 0.98, 16);
  nozzleGeo.rotateX(Math.PI / 2);

  const rightNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  rightNozzle.position.set(0.56, 0.12, 5.28);
  root.add(rightNozzle);

  const leftNozzle = rightNozzle.clone();
  leftNozzle.position.x = -0.56;
  root.add(leftNozzle);

  // Nozzle interior glow rings
  const ringGlowMat = new THREE.MeshBasicMaterial({ color: 0xfb923c });
  const ringGlowGeo = new THREE.TorusGeometry(0.32, 0.045, 8, 16);
  const rightRingGlow = new THREE.Mesh(ringGlowGeo, ringGlowMat);
  rightRingGlow.position.set(0.56, 0.12, 5.75);
  root.add(rightRingGlow);
  const leftRingGlow = rightRingGlow.clone();
  leftRingGlow.position.x = -0.56;
  root.add(leftRingGlow);

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
  const flameInnerMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const rightFlameOuter = new THREE.Mesh(flameOuterGeo, flameOuterMat);
  rightFlameOuter.position.set(0.56, 0.12, 5.65);
  root.add(rightFlameOuter);

  const leftFlameOuter = rightFlameOuter.clone();
  leftFlameOuter.position.x = -0.56;
  root.add(leftFlameOuter);

  const flameInnerGeo = new THREE.ConeGeometry(0.19, 1.75, 12);
  flameInnerGeo.rotateX(Math.PI / 2);
  flameInnerGeo.translate(0, 0, 0.88);

  const rightFlameInner = new THREE.Mesh(flameInnerGeo, flameInnerMat);
  rightFlameInner.position.set(0.56, 0.12, 5.65);
  root.add(rightFlameInner);

  const leftFlameInner = rightFlameInner.clone();
  leftFlameInner.position.x = -0.56;
  root.add(leftFlameInner);

  // Mach shock diamond discs inside afterburner plume
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
      const d = new THREE.Mesh(diamondGeo, diamondMat);
      d.position.set(xPos, 0.12, 6.25 + dIdx * 0.85);
      root.add(d);
      machDiamonds.push(d);
    }
  }

  const afterburnerLight = new THREE.PointLight(0xff7b29, 3.2, 24, 2);
  afterburnerLight.position.set(0, 0.2, 6.5);
  root.add(afterburnerLight);

  // 8. Underwing Missile Pylons & Mounted Missiles
  const pylonGeo = new THREE.BoxGeometry(0.12, 0.28, 1.4);
  const podMissileGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.85, 8);
  podMissileGeo.rotateX(Math.PI / 2);
  const missileMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.55, roughness: 0.28 });

  for (const xOffset of [-3.35, -2.15, 2.15, 3.35]) {
    const pylon = new THREE.Mesh(pylonGeo, trimMat);
    pylon.position.set(xOffset, -0.14, 1.2);
    root.add(pylon);

    const m = new THREE.Mesh(podMissileGeo, missileMat);
    m.position.set(xOffset, -0.32, 1.15);
    root.add(m);
  }

  // 9. Wingtip Navigation Lights, Gun Muzzles & Muzzle Flashes
  const portLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  portLight.position.set(-5.75, 0.1, 2.78);
  root.add(portLight);

  const stbdLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  stbdLight.position.set(5.75, 0.1, 2.78);
  root.add(stbdLight);

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
  const leftFlash = new THREE.Mesh(flashGeo, flashMat);
  leftFlash.position.set(-0.98, 0.04, -3.85);
  leftFlash.visible = false;
  root.add(leftFlash);

  const rightFlash = new THREE.Mesh(flashGeo, flashMat);
  rightFlash.position.set(0.98, 0.04, -3.85);
  rightFlash.visible = false;
  root.add(rightFlash);

  // 10. Retractable Tricycle Landing Gear
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

  return {
    root,
    leftAileron,
    rightAileron,
    leftElevator,
    rightElevator,
    leftRudder,
    rightRudder,
    leftFlameOuter,
    rightFlameOuter,
    leftFlameInner,
    rightFlameInner,
    machDiamonds,
    afterburnerLight,
    cockpitCameraAnchor,
    gunMuzzles: [leftMuzzle, rightMuzzle],
    muzzleFlashes: [leftFlash, rightFlash],
    landingGear,
  };
}

export function createEnemyJetModel(archetype: EnemyArchetype): EnemyModelRig {
  const root = new THREE.Group();
  const bodyMaterials: THREE.MeshStandardMaterial[] = [];

  const telegraphMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const telegraphGlow = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), telegraphMat);
  telegraphGlow.position.set(0, 0.1, -5.6);
  root.add(telegraphGlow);

  if (archetype === 'interceptor') {
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

    // Swept forward wings (angled pair)
    const wingGeo = new THREE.BoxGeometry(5.1, 0.14, 1.85);
    const wingR = new THREE.Mesh(wingGeo, hullMat);
    wingR.position.set(2.8, 0.02, 0.45);
    wingR.rotation.y = 0.28;
    root.add(wingR);

    const wingL = new THREE.Mesh(wingGeo, hullMat);
    wingL.position.set(-2.8, 0.02, 0.45);
    wingL.rotation.y = -0.28;
    root.add(wingL);

    const wingStrake = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.16, 0.42), trimMat);
    wingStrake.position.set(0, 0.06, -0.15);
    root.add(wingStrake);

    const canopy = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.6, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        metalness: 0.35,
        roughness: 0.1,
        emissive: 0x9a3412,
        emissiveIntensity: 0.4,
      })
    );
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(0, 0.46, -1.9);
    root.add(canopy);

    for (const tx of [-0.65, 0.65]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.75, 1.45), trimMat);
      fin.position.set(tx, 0.85, 3.6);
      fin.rotation.z = tx > 0 ? -0.22 : 0.22;
      root.add(fin);
    }

    const flameMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.44, 2.8, 10),
      new THREE.MeshBasicMaterial({
        color: 0xff5722,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      })
    );
    flameMesh.rotation.x = Math.PI / 2;
    flameMesh.position.set(0, 0, 6.0);
    root.add(flameMesh);

    root.scale.setScalar(1.28);
    return { root, flameMesh, telegraphGlow, bodyMaterials };
  }

  if (archetype === 'flanker') {
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.86, roughness: 0.22 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.45,
      roughness: 0.32,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    bodyMaterials.push(hullMat, accentMat);

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 8.2), hullMat);
    root.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.12, 3.5, 4), hullMat);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    nose.position.set(0, 0, -5.65);
    root.add(nose);

    const sensorDome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 10), accentMat);
    sensorDome.position.set(0, 0.45, -1.6);
    sensorDome.scale.set(1, 0.55, 1.8);
    root.add(sensorDome);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.14, 2.5), hullMat);
    wings.position.set(0, 0, 0.8);
    root.add(wings);

    const boomL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.45, 3.6), accentMat);
    boomL.position.set(-2.5, 0.45, 2.5);
    root.add(boomL);

    const boomR = boomL.clone();
    boomR.position.x = 2.5;
    root.add(boomR);

    const flameMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.52, 3.0, 10),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      })
    );
    flameMesh.rotation.x = Math.PI / 2;
    flameMesh.position.set(0, 0, 5.4);
    root.add(flameMesh);

    root.scale.setScalar(1.32);
    return { root, flameMesh, telegraphGlow, bodyMaterials };
  }

  // Heavy Gunship with rotating dorsal turret
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.68, roughness: 0.42 });
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.52,
    roughness: 0.34,
    emissive: 0xb45309,
    emissiveIntensity: 0.32,
  });
  bodyMaterials.push(hullMat, armorMat);

  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.7, 11.6), hullMat);
  root.add(hull);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 3.3), armorMat);
  nose.position.set(0, -0.1, -6.6);
  root.add(nose);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.36, 3.5), hullMat);
  wings.position.set(0, 0.25, 0.5);
  root.add(wings);

  const podL = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.88, 5.4, 12), armorMat);
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

  const flameMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.75, 3.4, 12),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    })
  );
  flameMesh.rotation.x = Math.PI / 2;
  flameMesh.position.set(0, 0, 7.2);
  root.add(flameMesh);

  root.scale.setScalar(1.36);
  return { root, flameMesh, turretGroup, telegraphGlow, bodyMaterials };
}

export function createMissileModel(isEnemy = false): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 3.0, 10),
    new THREE.MeshStandardMaterial({
      color: isEnemy ? 0xfca5a5 : 0xf8fafc,
      metalness: 0.65,
      roughness: 0.22,
    })
  );
  body.rotation.x = Math.PI / 2;
  g.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.65, 10),
    new THREE.MeshStandardMaterial({
      color: isEnemy ? 0xef4444 : 0xf59e0b,
      emissive: isEnemy ? 0xef4444 : 0xf59e0b,
      emissiveIntensity: 0.6,
    })
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.8;
  g.add(nose);

  const plume = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 2.2, 8),
    new THREE.MeshBasicMaterial({
      color: isEnemy ? 0xef4444 : 0xffedd5,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    })
  );
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
    })
  );
  g.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(27, 0.55, 8, 36),
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.72,
    })
  );
  g.add(innerRing);

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

export function createCollectibleModel(kind: CollectibleKind): THREE.Group {
  const g = new THREE.Group();
  const colorMap: Record<CollectibleKind, number> = {
    repair: 0x22c55e,
    fuel: 0xf59e0b,
    missile: 0xef4444,
    star: 0x38bdf8,
  };
  const col = colorMap[kind];

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(6.5, 0),
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.75,
      metalness: 0.55,
      roughness: 0.2,
    })
  );
  g.add(core);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(10.5, 0.7, 8, 24),
    new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.65,
    })
  );
  g.add(halo);

  return g;
}
