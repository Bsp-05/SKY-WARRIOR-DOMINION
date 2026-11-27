/**
 * world.ts — the sunset archipelago the game flies over.
 *
 * Builds the whole static environment in one place: the gradient sky dome,
 * three-point sunset lighting, the animated ocean, the vertex-coloured
 * island terrain with pine trees, the Solaris airbase, the coastal citadel
 * skyline, the volcanic glow, and the high cloud banks. The per-frame
 * `update` hook only moves the ocean time, scrolls the ocean bump map,
 * follows the player with the sun shadow, and drifts the clouds.
 *
 * Nothing here is loaded from disk — terrain heights come from
 * `sampleTerrainHeight` in rules.ts, textures from the procedural set.
 */
import * as THREE from 'three';
import { OCEAN_LEVEL, WORLD_RADIUS, sampleTerrainHeight } from './rules';
import type { ProceduralTextureSet } from './textures';
import type { BuildingObstacle } from './types';

export interface WorldHandles {
  root: THREE.Group;
  sunLight: THREE.DirectionalLight;
  oceanMaterial: THREE.MeshStandardMaterial;
  oceanUniforms: { uTime: { value: number }; uSunDir: { value: THREE.Vector3 } };
  cloudsMesh: THREE.InstancedMesh;
  buildingObstacles: BuildingObstacle[];
  update: (timeElapsed: number, playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => void;
  dispose: () => void;
}

const SUN_DIRECTION = new THREE.Vector3(-0.52, 0.21, -0.83).normalize();

/* ------------------------------------------------------------------ */
/* Sky dome                                                            */
/* ------------------------------------------------------------------ */

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT_SHADER = `
  varying vec3 vWorldDir;
  uniform vec3 uSunDir;
  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y, -0.2, 1.0);

    vec3 zenith = vec3(0.06, 0.10, 0.25);
    vec3 midSky = vec3(0.30, 0.22, 0.42);
    vec3 horizon = vec3(0.91, 0.48, 0.30);
    vec3 belowHorizon = vec3(0.24, 0.14, 0.21);

    vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.25, h));
    col = mix(col, zenith, smoothstep(0.20, 0.80, h));
    if (h < 0.0) {
      col = mix(horizon, belowHorizon, smoothstep(0.0, -0.18, h));
    }

    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    col += vec3(1.0, 0.56, 0.24) * pow(sunDot, 10.0) * 0.6;
    col += vec3(1.0, 0.88, 0.64) * pow(sunDot, 160.0) * 1.45;
    float sunDisk = smoothstep(0.9985, 0.9994, sunDot);
    col = mix(col, vec3(1.0, 0.97, 0.88), sunDisk);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Sunset sky dome with atmospheric horizon scattering and a sun disc. */
function buildSkyDome(root: THREE.Group): { skyGeo: THREE.SphereGeometry; skyMat: THREE.ShaderMaterial } {
  const skyGeo = new THREE.SphereGeometry(WORLD_RADIUS * 2.2, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uSunDir: { value: SUN_DIRECTION } },
    vertexShader: SKY_VERTEX_SHADER,
    fragmentShader: SKY_FRAGMENT_SHADER,
  });
  root.add(new THREE.Mesh(skyGeo, skyMat));
  return { skyGeo, skyMat };
}

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

/** Hemisphere fill + warm directional sun (shadow caster) + cool rim light. */
function buildLighting(root: THREE.Group, isSoftwareGl: boolean): THREE.DirectionalLight {
  const hemiLight = new THREE.HemisphereLight(0x829ad4, 0x3b2621, 0.98);
  root.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffb470, 2.8);
  sunLight.position.copy(SUN_DIRECTION).multiplyScalar(900);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  const d = 240;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.camera.near = 100;
  sunLight.shadow.camera.far = 1600;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.03;
  root.add(sunLight);
  root.add(sunLight.target);

  const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.78);
  rimLight.position.set(420, 260, 520);
  root.add(rimLight);

  return sunLight;
}

/* ------------------------------------------------------------------ */
/* Ocean                                                               */
/* ------------------------------------------------------------------ */

interface OceanParts {
  oceanGeo: THREE.PlaneGeometry;
  oceanMat: THREE.MeshStandardMaterial;
  oceanUniforms: { uTime: { value: number }; uSunDir: { value: THREE.Vector3 } };
}

/** Reflective PBR ocean; vertex waves + sun-path glint are injected via onBeforeCompile. */
function buildOcean(root: THREE.Group, textures: ProceduralTextureSet): OceanParts {
  const oceanUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: SUN_DIRECTION },
  };
  const oceanGeo = new THREE.PlaneGeometry(WORLD_RADIUS * 4.0, WORLD_RADIUS * 4.0, 72, 72);
  oceanGeo.rotateX(-Math.PI / 2);

  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x0a2e45,
    roughness: 0.14,
    metalness: 0.82,
    bumpMap: textures.oceanBump,
    bumpScale: 0.48,
  });

  oceanMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = oceanUniforms.uTime;
    shader.uniforms.uSunDir = oceanUniforms.uSunDir;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         varying vec3 vOceanWorldPos;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float wave1 = sin(position.x * 0.018 + uTime * 1.45) * cos(position.z * 0.015 + uTime * 1.15) * 1.45;
         float wave2 = sin((position.x + position.z) * 0.036 - uTime * 2.0) * 0.65;
         transformed.y += wave1 + wave2;
         vOceanWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uSunDir;
         varying vec3 vOceanWorldPos;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `vec3 viewDirW = normalize(cameraPosition - vOceanWorldPos);
         vec3 halfSun = normalize(normalize(uSunDir) + viewDirW);
         float sunGlint = pow(max(dot(vec3(0.0, 1.0, 0.0), halfSun), 0.0), 64.0);
         float fresnel = pow(1.0 - max(dot(viewDirW, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
         gl_FragColor.rgb += vec3(1.0, 0.68, 0.36) * (sunGlint * 0.55 + fresnel * 0.16);
         #include <dithering_fragment>`,
      );
  };

  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.position.y = OCEAN_LEVEL;
  ocean.receiveShadow = true;
  root.add(ocean);

  return { oceanGeo, oceanMat, oceanUniforms };
}

/* ------------------------------------------------------------------ */
/* Terrain and trees                                                   */
/* ------------------------------------------------------------------ */

/** Height-band palette used for the terrain vertex colours. */
const TERRAIN_BANDS = {
  foam: new THREE.Color(0x4b7779),
  sand: new THREE.Color(0xcfa878),
  grass: new THREE.Color(0x214430),
  highland: new THREE.Color(0x3a4d3b),
  rock: new THREE.Color(0x4f464c),
  peak: new THREE.Color(0xa6948a),
};

/** Pick the strata colour for a terrain height, blending across band edges. */
function terrainColorForHeight(y: number, out: THREE.Color): THREE.Color {
  if (y < 0.5) return out.copy(TERRAIN_BANDS.foam);
  if (y < 4.5) return out.copy(TERRAIN_BANDS.foam).lerp(TERRAIN_BANDS.sand, (y - 0.5) / 4.0);
  if (y < 16) return out.copy(TERRAIN_BANDS.sand).lerp(TERRAIN_BANDS.grass, (y - 4.5) / 11.5);
  if (y < 52) return out.copy(TERRAIN_BANDS.grass).lerp(TERRAIN_BANDS.highland, (y - 16) / 36);
  if (y < 125) return out.copy(TERRAIN_BANDS.highland).lerp(TERRAIN_BANDS.rock, (y - 52) / 73);
  return out.copy(TERRAIN_BANDS.rock).lerp(TERRAIN_BANDS.peak, Math.min(1, (y - 125) / 130));
}

interface TerrainParts {
  terrainGeo: THREE.PlaneGeometry;
  terrainMat: THREE.MeshStandardMaterial;
}

/** Multi-island archipelago mesh, displaced and coloured from the heightfield. */
function buildTerrain(root: THREE.Group, isSoftwareGl: boolean): TerrainParts {
  const terrainSize = 2800;
  const segments = isSoftwareGl ? 115 : 148;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const cTemp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = sampleTerrainHeight(x, z);
    posAttr.setY(i, y);

    terrainColorForHeight(y, cTemp);
    colors[i * 3] = cTemp.r;
    colors[i * 3 + 1] = cTemp.g;
    colors[i * 3 + 2] = cTemp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.05,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  root.add(terrainMesh);

  return { terrainGeo, terrainMat };
}

interface TreeParts {
  treeGeo: THREE.ConeGeometry;
  treeMat: THREE.MeshStandardMaterial;
}

/** Island pine trees, instanced on a golden-angle spiral, skipping the airbase. */
function plantTrees(root: THREE.Group, dummy: THREE.Object3D): TreeParts {
  const treeGeo = new THREE.ConeGeometry(4.2, 16, 6);
  treeGeo.translate(0, 8, 0);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x1e3f2d, roughness: 0.85, metalness: 0.02 });

  const treeSpots: Array<{ x: number; y: number; z: number; s: number }> = [];
  for (let i = 0; i < 240; i++) {
    const angle = ((i * 137.5) % 360) * (Math.PI / 180);
    const rad = 180 + ((i * 67) % 1250);
    const tx = Math.cos(angle) * rad;
    const tz = Math.sin(angle) * rad;
    // Skip central airbase & city apron.
    if (Math.abs(tx) < 270 && Math.abs(tz) < 280) continue;
    const ty = sampleTerrainHeight(tx, tz);
    if (ty > 8 && ty < 85) {
      treeSpots.push({ x: tx, y: ty - 0.5, z: tz, s: 0.75 + (i % 4) * 0.22 });
    }
  }

  const treesMesh = new THREE.InstancedMesh(treeGeo, treeMat, Math.max(1, treeSpots.length));
  treeSpots.forEach((t, idx) => {
    dummy.position.set(t.x, t.y, t.z);
    dummy.scale.setScalar(t.s);
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.updateMatrix();
    treesMesh.setMatrixAt(idx, dummy.matrix);
  });
  treesMesh.instanceMatrix.needsUpdate = true;
  treesMesh.computeBoundingSphere();
  root.add(treesMesh);

  return { treeGeo, treeMat };
}

/* ------------------------------------------------------------------ */
/* Airbase                                                             */
/* ------------------------------------------------------------------ */

interface AirbaseParts {
  beaconGeo: THREE.SphereGeometry;
  beaconMat: THREE.MeshBasicMaterial;
}

/** Solaris airbase: tarmac apron, textured runway, edge beacons, tower, hangars. */
function buildAirbase(root: THREE.Group, textures: ProceduralTextureSet, dummy: THREE.Object3D): AirbaseParts {
  const runwayGroup = new THREE.Group();

  const apronMesh = new THREE.Mesh(
    new THREE.BoxGeometry(126, 0.4, 385),
    new THREE.MeshStandardMaterial({ color: 0x242d3b, roughness: 0.85, metalness: 0.12 }),
  );
  apronMesh.position.set(0, 14.08, 60);
  apronMesh.receiveShadow = true;
  runwayGroup.add(apronMesh);

  const runwayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.6, 360),
    new THREE.MeshStandardMaterial({ map: textures.runwayMap, roughness: 0.72, metalness: 0.12 }),
  );
  runwayMesh.position.set(0, 14.32, 60);
  runwayMesh.receiveShadow = true;
  runwayGroup.add(runwayMesh);

  const beaconGeo = new THREE.SphereGeometry(0.85, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beacons = new THREE.InstancedMesh(beaconGeo, beaconMat, 24);
  for (let i = 0; i < 12; i++) {
    const z = -105 + i * 30;
    dummy.position.set(-18.5, 14.9, z);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    beacons.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(18.5, 14.9, z);
    dummy.updateMatrix();
    beacons.setMatrixAt(i * 2 + 1, dummy.matrix);
  }
  beacons.instanceMatrix.needsUpdate = true;
  beacons.computeBoundingSphere();
  runwayGroup.add(beacons);

  const towerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 5.8, 28, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.55 }),
  );
  towerBase.position.set(36, 28, 130);
  towerBase.castShadow = true;
  runwayGroup.add(towerBase);

  const towerDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(8.2, 6.2, 5.5, 8),
    new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.4,
    }),
  );
  towerDeck.position.set(36, 44, 130);
  runwayGroup.add(towerDeck);

  const hangarGeo = new THREE.CylinderGeometry(12, 12, 34, 12, 1, false, 0, Math.PI);
  hangarGeo.rotateZ(Math.PI / 2);
  hangarGeo.rotateY(Math.PI / 2);
  const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55, metalness: 0.45 });
  for (const zPos of [65, 115]) {
    const hangar = new THREE.Mesh(hangarGeo, hangarMat);
    hangar.position.set(-42, 14.2, zPos);
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    runwayGroup.add(hangar);
  }
  root.add(runwayGroup);

  return { beaconGeo, beaconMat };
}

/* ------------------------------------------------------------------ */
/* City, spire and volcano                                             */
/* ------------------------------------------------------------------ */

interface CityPlot {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

interface CityParts {
  buildingObstacles: BuildingObstacle[];
  buildingGeo: THREE.BoxGeometry;
  buildingMat: THREE.MeshStandardMaterial;
}

/**
 * Futuristic coastal citadel: three districts of instanced towers, the
 * central spire landmark, and the volcanic caldera glow. Every tower also
 * registers a collision obstacle.
 */
function buildCity(root: THREE.Group, textures: ProceduralTextureSet, dummy: THREE.Object3D): CityParts {
  const buildingObstacles: BuildingObstacle[] = [
    { x: 36, z: 130, halfW: 9, halfD: 9, topY: 48 },
    { x: -42, z: 90, halfW: 15, halfD: 45, topY: 28 },
  ];

  const cityPositions: CityPlot[] = [];

  // Main Citadel East District — ring around (185, -20).
  for (let i = 0; i < 38; i++) {
    const angle = (i / 38) * Math.PI * 2;
    const rad = 110 + (i % 5) * 28;
    const cx = 185 + Math.cos(angle) * rad * 0.65;
    const cz = -20 + Math.sin(angle) * rad * 0.92;
    if (Math.abs(cx) < 74 && Math.abs(cz - 60) < 225) continue;
    if (sampleTerrainHeight(cx, cz) < 5) continue;
    const h = 44 + ((i * 37) % 112);
    cityPositions.push({ x: cx, z: cz, w: 14 + (i % 4) * 5, h, d: 14 + ((i + 2) % 4) * 5 });
  }
  // West Harbor District — ring around (-195, -40).
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const rad = 95 + (i % 4) * 26;
    const cx = -195 + Math.cos(angle) * rad * 0.7;
    const cz = -40 + Math.sin(angle) * rad * 0.9;
    if (Math.abs(cx) < 74) continue;
    if (sampleTerrainHeight(cx, cz) < 5) continue;
    const h = 36 + ((i * 29) % 92);
    cityPositions.push({ x: cx, z: cz, w: 15 + (i % 3) * 5, h, d: 15 + ((i + 1) % 3) * 5 });
  }
  // Distant East Island Futuristic Colony (near 860, -360).
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const rad = 75 + (i % 3) * 28;
    const cx = 840 + Math.cos(angle) * rad;
    const cz = -340 + Math.sin(angle) * rad;
    if (sampleTerrainHeight(cx, cz) < 8) continue;
    const h = 48 + ((i * 41) % 105);
    cityPositions.push({ x: cx, z: cz, w: 16 + (i % 3) * 4, h, d: 16 + ((i + 1) % 3) * 4 });
  }

  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.cityWindowMap,
    emissive: 0xffffff,
    emissiveMap: textures.cityWindowEmissive,
    emissiveIntensity: 0.78,
    roughness: 0.3,
    metalness: 0.65,
  });
  const buildingsMesh = new THREE.InstancedMesh(buildingGeo, buildingMat, cityPositions.length);
  buildingsMesh.castShadow = true;
  buildingsMesh.receiveShadow = true;

  cityPositions.forEach((b, idx) => {
    const groundY = Math.max(OCEAN_LEVEL - 2, sampleTerrainHeight(b.x, b.z));
    dummy.position.set(b.x, groundY + b.h * 0.5 - 2, b.z);
    dummy.scale.set(b.w, b.h, b.d);
    dummy.rotation.set(0, (idx % 4) * 0.15, 0);
    dummy.updateMatrix();
    buildingsMesh.setMatrixAt(idx, dummy.matrix);

    buildingObstacles.push({
      x: b.x,
      z: b.z,
      halfW: b.w * 0.5,
      halfD: b.d * 0.5,
      topY: groundY + b.h - 2,
    });
  });
  buildingsMesh.instanceMatrix.needsUpdate = true;
  buildingsMesh.computeBoundingSphere();
  root.add(buildingsMesh);

  // Citadel Central Spire Landmark.
  const spireBaseY = sampleTerrainHeight(220, -140);
  const spireTower = new THREE.Mesh(
    new THREE.ConeGeometry(16, 225, 6),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.22 }),
  );
  spireTower.position.set(220, spireBaseY + 110, -140);
  spireTower.castShadow = true;
  root.add(spireTower);
  buildingObstacles.push({ x: 220, z: -140, halfW: 16, halfD: 16, topY: spireBaseY + 225 });

  const spireBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 65, 8),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.82 }),
  );
  spireBeacon.position.set(220, spireBaseY + 235, -140);
  root.add(spireBeacon);

  // Volcanic Caldera Glow on NW Volcano (-820, -680).
  const volcanoGlow = new THREE.Mesh(
    new THREE.CircleGeometry(42, 20),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.72 }),
  );
  volcanoGlow.rotation.x = -Math.PI / 2;
  volcanoGlow.position.set(-820, sampleTerrainHeight(-820, -680) + 2, -680);
  root.add(volcanoGlow);

  return { buildingObstacles, buildingGeo, buildingMat };
}

/* ------------------------------------------------------------------ */
/* Clouds                                                              */
/* ------------------------------------------------------------------ */

interface CloudPuff {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  speed: number;
  rotY: number;
}

interface CloudParts {
  cloudsMesh: THREE.InstancedMesh;
  cloudGeo: THREE.SphereGeometry;
  cloudMat: THREE.MeshStandardMaterial;
  cloudBaseTransforms: CloudPuff[];
}

/**
 * High-altitude soft sunset cloud banks (y 350..610, so they never
 * obstruct low/mid flight). Puffs are grouped in threes per bank.
 */
function buildClouds(root: THREE.Group, dummy: THREE.Object3D): CloudParts {
  const cloudCount = 135;
  const cloudGeo = new THREE.SphereGeometry(1, 10, 8);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffdfc7,
    emissive: 0x8b4534,
    emissiveIntensity: 0.32,
    roughness: 0.98,
    metalness: 0.0,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  });
  const cloudsMesh = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount);
  const cloudBaseTransforms: CloudPuff[] = [];
  const cloudColor = new THREE.Color();

  for (let i = 0; i < cloudCount; i++) {
    const bankIdx = Math.floor(i / 3);
    const puffIdx = i % 3;
    const clusterAngle = ((bankIdx * 137.5) % 360) * (Math.PI / 180);
    const clusterDist = 360 + ((bankIdx * 127) % 1750);
    const baseX = Math.cos(clusterAngle) * clusterDist;
    const baseZ = Math.sin(clusterAngle) * clusterDist;
    const baseY = 365 + (bankIdx % 6) * 44;

    const x = baseX + (puffIdx - 1) * 44;
    const z = baseZ + ((puffIdx % 2) * 2 - 1) * 20;
    const y = baseY + (puffIdx === 1 ? 12 : -4);
    const sx = (puffIdx === 1 ? 74 : 52) + (bankIdx % 4) * 16;
    const sy = (puffIdx === 1 ? 18 : 12) + (bankIdx % 3) * 4;
    const sz = (puffIdx === 1 ? 58 : 42) + ((bankIdx + 2) % 4) * 14;

    cloudBaseTransforms.push({
      x,
      y,
      z,
      sx,
      sy,
      sz,
      speed: 4 + (bankIdx % 4) * 1.4,
      rotY: (bankIdx % 6) * 0.5,
    });

    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(0, (bankIdx % 6) * 0.5, 0);
    dummy.updateMatrix();
    cloudsMesh.setMatrixAt(i, dummy.matrix);

    const warmth = 0.86 + (bankIdx % 4) * 0.04;
    cloudColor.setRGB(1.0 * warmth, 0.77 * warmth, 0.68 * warmth);
    cloudsMesh.setColorAt(i, cloudColor);
  }
  cloudsMesh.instanceMatrix.needsUpdate = true;
  if (cloudsMesh.instanceColor) cloudsMesh.instanceColor.needsUpdate = true;
  cloudsMesh.frustumCulled = false;
  root.add(cloudsMesh);

  return { cloudsMesh, cloudGeo, cloudMat, cloudBaseTransforms };
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export function createOpenWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): WorldHandles {
  const root = new THREE.Group();
  scene.add(root);

  scene.fog = new THREE.FogExp2(0xc97358, 0.00024);
  scene.background = new THREE.Color(0x1b1936);

  // One scratch transform reused by every instanced-mesh builder and by update().
  const dummy = new THREE.Object3D();

  const { skyGeo, skyMat } = buildSkyDome(root);
  const sunLight = buildLighting(root, isSoftwareGl);
  const { oceanGeo, oceanMat, oceanUniforms } = buildOcean(root, textures);
  const { terrainGeo, terrainMat } = buildTerrain(root, isSoftwareGl);
  const { treeGeo, treeMat } = plantTrees(root, dummy);
  const { beaconGeo, beaconMat } = buildAirbase(root, textures, dummy);
  const { buildingObstacles, buildingGeo, buildingMat } = buildCity(root, textures, dummy);
  const { cloudsMesh, cloudGeo, cloudMat, cloudBaseTransforms } = buildClouds(root, dummy);
  const cloudCount = cloudBaseTransforms.length;

  const update = (timeElapsed: number, playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => {
    oceanUniforms.uTime.value = timeElapsed;
    textures.oceanBump.offset.x = (timeElapsed * 0.015) % 1;
    textures.oceanBump.offset.y = (timeElapsed * 0.01) % 1;

    if (!isSoftwareGl) {
      sunLight.target.position.set(playerPos.x, 14, playerPos.z);
      sunLight.position.copy(sunLight.target.position).addScaledVector(SUN_DIRECTION, 900);
    }

    // Drift clouds and collapse any puff that comes close to camera so view is never obstructed.
    for (let i = 0; i < cloudCount; i++) {
      const c = cloudBaseTransforms[i];
      let cx = c.x + timeElapsed * c.speed;
      if (cx > WORLD_RADIUS) cx -= WORLD_RADIUS * 2;
      const dx = cx - cameraPos.x;
      const dy = c.y - cameraPos.y;
      const dz = c.z - cameraPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const fadeScale = distSq < 110 * 110 ? 0 : 1;

      dummy.position.set(cx, c.y, c.z);
      dummy.scale.set(c.sx * fadeScale, c.sy * fadeScale, c.sz * fadeScale);
      dummy.rotation.set(0, c.rotY, 0);
      dummy.updateMatrix();
      cloudsMesh.setMatrixAt(i, dummy.matrix);
    }
    cloudsMesh.instanceMatrix.needsUpdate = true;
  };

  const dispose = () => {
    skyGeo.dispose();
    skyMat.dispose();
    oceanGeo.dispose();
    oceanMat.dispose();
    terrainGeo.dispose();
    terrainMat.dispose();
    treeGeo.dispose();
    treeMat.dispose();
    buildingGeo.dispose();
    buildingMat.dispose();
    cloudGeo.dispose();
    cloudMat.dispose();
    beaconGeo.dispose();
    beaconMat.dispose();
  };

  return {
    root,
    sunLight,
    oceanMaterial: oceanMat,
    oceanUniforms,
    cloudsMesh,
    buildingObstacles,
    update,
    dispose,
  };
}
