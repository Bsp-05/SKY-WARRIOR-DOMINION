import { C as MeshPhysicalMaterial, E as OctahedronGeometry, I as Shape, L as SphereGeometry, O as PlaneGeometry, R as TorusGeometry, S as MeshBasicMaterial, T as Object3D, d as CylinderGeometry, g as Group, i as BoxGeometry, k as PointLight, m as ExtrudeGeometry, s as CapsuleGeometry, u as ConeGeometry, w as MeshStandardMaterial, x as Mesh } from "../vendor/libs.min.js";
// src/game/models.ts
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
/** Attach a mesh to a parent, applying position / rotation / scale in one place. */
function placeMesh(parent, mesh, position, rotation = [
	0,
	0,
	0
], scale = [
	1,
	1,
	1
]) {
	mesh.position.set(position[0], position[1], position[2]);
	mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
	mesh.scale.set(scale[0], scale[1], scale[2]);
	parent.add(mesh);
	return mesh;
}
/** Shorthand for a box mesh placed in one call. */
function boxMesh(parent, size, material, position, rotation = [
	0,
	0,
	0
]) {
	return placeMesh(parent, new Mesh(new BoxGeometry(size[0], size[1], size[2]), material), position, rotation);
}
/** Mirror a mesh across the aircraft centreline (x = 0). */
function mirrorX(source) {
	const copy = source.clone();
	copy.position.x = -source.position.x;
	return copy;
}
function paletteForLivery(livery) {
	switch (livery) {
		case "viper": return {
			primary: 3885147,
			secondary: 1976635,
			accent: 16096779,
			metalness: .76,
			roughness: .24
		};
		case "arctic": return {
			primary: 14213611,
			secondary: 4674921,
			accent: 959977,
			metalness: .62,
			roughness: .3
		};
		default: return {
			primary: 2896962,
			secondary: 1317155,
			accent: 16347926,
			metalness: .86,
			roughness: .2
		};
	}
}
function buildJetMaterials(livery, textures, isSoftwareGl) {
	const palette = paletteForLivery(livery);
	return {
		hull: new MeshPhysicalMaterial({
			color: palette.primary,
			map: textures.jetPanelAlbedo,
			bumpMap: textures.jetPanelBump,
			bumpScale: .035,
			metalness: palette.metalness,
			roughness: palette.roughness,
			clearcoat: .45,
			clearcoatRoughness: .18,
			anisotropy: .55
		}),
		trim: new MeshStandardMaterial({
			color: palette.secondary,
			bumpMap: textures.jetPanelBump,
			bumpScale: .02,
			metalness: .48,
			roughness: .58
		}),
		accent: new MeshStandardMaterial({
			color: palette.accent,
			metalness: .35,
			roughness: .35,
			emissive: palette.accent,
			emissiveIntensity: .16
		}),
		canopy: new MeshPhysicalMaterial({
			color: 14919730,
			metalness: .2,
			roughness: .06,
			clearcoat: 1,
			clearcoatRoughness: .04,
			transparent: true,
			opacity: isSoftwareGl ? .52 : .74,
			ior: 1.54
		}),
		nozzle: new MeshStandardMaterial({
			color: 1841431,
			metalness: .94,
			roughness: .2
		})
	};
}
/** Stealth fuselage, LERX strakes, nose radome and dorsal spine. */
function buildFuselage(ctx) {
	const { root, mats } = ctx;
	const fuseShape = new Shape();
	fuseShape.moveTo(0, -6.3);
	fuseShape.lineTo(.7, -2.6);
	fuseShape.lineTo(1.26, .35);
	fuseShape.lineTo(1.2, 4.25);
	fuseShape.lineTo(.86, 5.15);
	fuseShape.lineTo(-.86, 5.15);
	fuseShape.lineTo(-1.2, 4.25);
	fuseShape.lineTo(-1.26, .35);
	fuseShape.lineTo(-.7, -2.6);
	fuseShape.closePath();
	const fuseGeo = new ExtrudeGeometry(fuseShape, {
		depth: .68,
		bevelEnabled: true,
		bevelThickness: .28,
		bevelSize: .24,
		bevelSegments: 2
	});
	fuseGeo.rotateX(Math.PI / 2);
	fuseGeo.translate(0, .34, 0);
	const fuselage = new Mesh(fuseGeo, mats.hull);
	fuselage.castShadow = true;
	fuselage.receiveShadow = true;
	root.add(fuselage);
	const lerxGeo = new BoxGeometry(.65, .14, 2.9);
	const leftLerx = mirrorX(placeMesh(root, new Mesh(lerxGeo, mats.trim), [
		1.15,
		.12,
		-1.6
	], [
		0,
		-.24,
		0
	]));
	leftLerx.rotation.y = .24;
	root.add(leftLerx);
	const noseGeo = new ConeGeometry(.68, 3.3, 18);
	noseGeo.rotateX(-Math.PI / 2);
	const nose = placeMesh(root, new Mesh(noseGeo, mats.trim), [
		0,
		.08,
		-6.9
	], [
		0,
		0,
		0
	], [
		1,
		.66,
		1
	]);
	nose.castShadow = true;
	const spine = boxMesh(root, [
		.92,
		.56,
		6.2
	], mats.hull, [
		0,
		.52,
		1.2
	]);
	spine.castShadow = true;
}
/** Cockpit tub, seat, pilot helmet, HUD glass, canopy and camera anchor. */
function buildCockpit(ctx) {
	const { root, mats } = ctx;
	boxMesh(root, [
		.86,
		.38,
		2.35
	], new MeshStandardMaterial({
		color: 988970,
		roughness: .85,
		metalness: .1
	}), [
		0,
		.48,
		-2.5
	]);
	boxMesh(root, [
		.42,
		.45,
		.22
	], mats.trim, [
		0,
		.78,
		-1.9
	]);
	const helmetMat = new MeshStandardMaterial({
		color: 14870768,
		roughness: .28,
		metalness: .45
	});
	placeMesh(root, new Mesh(new SphereGeometry(.24, 12, 12), helmetMat), [
		0,
		.82,
		-2.35
	]);
	const hudMat = new MeshBasicMaterial({
		color: 3718648,
		transparent: true,
		opacity: .48,
		side: 2
	});
	placeMesh(root, new Mesh(new PlaneGeometry(.45, .28), hudMat), [
		0,
		.82,
		-3.35
	], [
		-.35,
		0,
		0
	]);
	const canopyGeo = new CapsuleGeometry(.54, 1.9, 8, 16);
	canopyGeo.rotateX(Math.PI / 2);
	const canopy = placeMesh(root, new Mesh(canopyGeo, mats.canopy), [
		0,
		.74,
		-2.55
	], [
		0,
		0,
		0
	], [
		.92,
		.72,
		1.15
	]);
	canopy.renderOrder = 2;
	const anchor = new Object3D();
	anchor.position.set(0, 1.02, -2.65);
	root.add(anchor);
	return anchor;
}
/** Swept delta wings, accent stripes and the moving ailerons. */
function buildWings(ctx) {
	const { root, mats } = ctx;
	const wingShape = new Shape();
	wingShape.moveTo(.95, -1.6);
	wingShape.lineTo(5.75, 2.35);
	wingShape.lineTo(5.75, 3.2);
	wingShape.lineTo(1.15, 2.75);
	wingShape.closePath();
	const wingGeo = new ExtrudeGeometry(wingShape, {
		depth: .14,
		bevelEnabled: true,
		bevelThickness: .05,
		bevelSize: .06,
		bevelSegments: 2
	});
	wingGeo.rotateX(Math.PI / 2);
	const rightWing = placeMesh(root, new Mesh(wingGeo, mats.hull), [
		0,
		.08,
		0
	]);
	rightWing.castShadow = true;
	rightWing.receiveShadow = true;
	const leftWing = rightWing.clone();
	leftWing.scale.x = -1;
	root.add(leftWing);
	const stripeGeo = new BoxGeometry(3.3, .05, .42);
	const leftStripe = mirrorX(placeMesh(root, new Mesh(stripeGeo, mats.accent), [
		3.25,
		.14,
		1.65
	], [
		0,
		-.62,
		0
	]));
	leftStripe.rotation.y = .62;
	root.add(leftStripe);
	const aileronGeo = new BoxGeometry(1.85, .08, .44);
	const rightAileron = placeMesh(root, new Mesh(aileronGeo, mats.trim), [
		3.95,
		.04,
		3.12
	], [
		0,
		.1,
		0
	]);
	return {
		leftAileron: placeMesh(root, new Mesh(aileronGeo, mats.trim), [
			-3.95,
			.04,
			3.12
		], [
			0,
			-.1,
			0
		]),
		rightAileron
	};
}
/** Rear horizontal stabilisers (elevators) and canted tail fins + rudders. */
function buildTail(ctx) {
	const { root, mats } = ctx;
	const elevGeo = new BoxGeometry(2.15, .09, 1.05);
	const rightElevator = placeMesh(root, new Mesh(elevGeo, mats.trim), [
		1.98,
		.08,
		4.88
	], [
		0,
		-.22,
		0
	]);
	rightElevator.castShadow = true;
	const leftElevator = placeMesh(root, new Mesh(elevGeo, mats.trim), [
		-1.98,
		.08,
		4.88
	], [
		0,
		.22,
		0
	]);
	leftElevator.castShadow = true;
	const finShape = new Shape();
	finShape.moveTo(0, 0);
	finShape.lineTo(1.8, 0);
	finShape.lineTo(2.4, 2);
	finShape.lineTo(1.32, 2);
	finShape.closePath();
	const finGeo = new ExtrudeGeometry(finShape, {
		depth: .09,
		bevelEnabled: true,
		bevelThickness: .02,
		bevelSize: .02,
		bevelSegments: 1
	});
	finGeo.rotateY(Math.PI / 2);
	const rightFin = placeMesh(root, new Mesh(finGeo, mats.hull), [
		.88,
		.48,
		4.98
	], [
		0,
		0,
		-.26
	]);
	rightFin.castShadow = true;
	const leftFin = placeMesh(root, new Mesh(finGeo, mats.hull), [
		-.96,
		.48,
		4.98
	], [
		0,
		0,
		.26
	]);
	leftFin.castShadow = true;
	const rudderGeo = new BoxGeometry(.08, 1.5, .42);
	const rightRudder = placeMesh(root, new Mesh(rudderGeo, mats.accent), [
		1.18,
		1.3,
		4.98
	], [
		0,
		0,
		-.26
	]);
	return {
		leftElevator,
		rightElevator,
		leftRudder: placeMesh(root, new Mesh(rudderGeo, mats.accent), [
			-1.18,
			1.3,
			4.98
		], [
			0,
			0,
			.26
		]),
		rightRudder
	};
}
/** Side air intakes (one builder for both sides). */
function buildIntakes(ctx) {
	const { root, mats } = ctx;
	const intakeGeo = new BoxGeometry(.68, .56, 2.85);
	const leftIntake = mirrorX(placeMesh(root, new Mesh(intakeGeo, mats.trim), [
		.96,
		.04,
		-1.6
	]));
	root.add(leftIntake);
}
/** Twin nozzles, glow rings, two-stage exhaust flames, Mach diamonds, light. */
function buildPropulsion(ctx) {
	const { root, mats } = ctx;
	const nozzleGeo = new CylinderGeometry(.43, .35, .98, 16);
	nozzleGeo.rotateX(Math.PI / 2);
	const leftNozzle = mirrorX(placeMesh(root, new Mesh(nozzleGeo, mats.nozzle), [
		.56,
		.12,
		5.28
	]));
	root.add(leftNozzle);
	const ringGlowMat = new MeshBasicMaterial({ color: 16486972 });
	const ringGlowGeo = new TorusGeometry(.32, .045, 8, 16);
	const leftRingGlow = mirrorX(placeMesh(root, new Mesh(ringGlowGeo, ringGlowMat), [
		.56,
		.12,
		5.75
	]));
	root.add(leftRingGlow);
	const flameOuterGeo = new ConeGeometry(.34, 2.8, 14);
	flameOuterGeo.rotateX(Math.PI / 2);
	flameOuterGeo.translate(0, 0, 1.4);
	const flameOuterMat = new MeshBasicMaterial({
		color: 16739098,
		transparent: true,
		opacity: .72,
		blending: 2,
		depthWrite: false
	});
	const rightFlameOuter = placeMesh(root, new Mesh(flameOuterGeo, flameOuterMat), [
		.56,
		.12,
		5.65
	]);
	const leftFlameOuter = mirrorX(rightFlameOuter);
	root.add(leftFlameOuter);
	const flameInnerGeo = new ConeGeometry(.19, 1.75, 12);
	flameInnerGeo.rotateX(Math.PI / 2);
	flameInnerGeo.translate(0, 0, .88);
	const flameInnerMat = new MeshBasicMaterial({
		color: 12248829,
		transparent: true,
		opacity: .92,
		blending: 2,
		depthWrite: false
	});
	const rightFlameInner = placeMesh(root, new Mesh(flameInnerGeo, flameInnerMat), [
		.56,
		.12,
		5.65
	]);
	const leftFlameInner = mirrorX(rightFlameInner);
	root.add(leftFlameInner);
	const machDiamonds = [];
	const diamondGeo = new OctahedronGeometry(.14, 0);
	diamondGeo.scale(1, 1, 2.1);
	const diamondMat = new MeshBasicMaterial({
		color: 14742270,
		transparent: true,
		opacity: .9,
		blending: 2,
		depthWrite: false
	});
	for (const xPos of [-.56, .56]) for (let dIdx = 0; dIdx < 2; dIdx++) {
		const diamond = placeMesh(root, new Mesh(diamondGeo, diamondMat), [
			xPos,
			.12,
			6.25 + dIdx * .85
		]);
		machDiamonds.push(diamond);
	}
	const afterburnerLight = new PointLight(16743209, 3.2, 24, 2);
	afterburnerLight.position.set(0, .2, 6.5);
	root.add(afterburnerLight);
	return {
		leftFlameOuter,
		rightFlameOuter,
		leftFlameInner,
		rightFlameInner,
		machDiamonds,
		afterburnerLight
	};
}
/** Underwing pylons + missiles, nav lights, gun muzzles and muzzle flashes. */
function buildArmament(ctx) {
	const { root, mats } = ctx;
	const podMissileGeo = new CylinderGeometry(.08, .08, 1.85, 8);
	podMissileGeo.rotateX(Math.PI / 2);
	const missileMat = new MeshStandardMaterial({
		color: 14870768,
		metalness: .55,
		roughness: .28
	});
	for (const xOffset of [
		-3.35,
		-2.15,
		2.15,
		3.35
	]) {
		boxMesh(root, [
			.12,
			.28,
			1.4
		], mats.trim, [
			xOffset,
			-.14,
			1.2
		]);
		const missile = new Mesh(podMissileGeo, missileMat);
		missile.position.set(xOffset, -.32, 1.15);
		root.add(missile);
	}
	placeMesh(root, new Mesh(new SphereGeometry(.11, 8, 8), new MeshBasicMaterial({ color: 15680580 })), [
		-5.75,
		.1,
		2.78
	]);
	placeMesh(root, new Mesh(new SphereGeometry(.11, 8, 8), new MeshBasicMaterial({ color: 2278750 })), [
		5.75,
		.1,
		2.78
	]);
	const leftMuzzle = new Object3D();
	leftMuzzle.position.set(-.98, .04, -3.2);
	root.add(leftMuzzle);
	const rightMuzzle = new Object3D();
	rightMuzzle.position.set(.98, .04, -3.2);
	root.add(rightMuzzle);
	const flashGeo = new ConeGeometry(.32, 1.35, 8);
	flashGeo.rotateX(-Math.PI / 2);
	const flashMat = new MeshBasicMaterial({
		color: 16707722,
		transparent: true,
		opacity: .95,
		blending: 2,
		depthWrite: false
	});
	const leftFlash = placeMesh(root, new Mesh(flashGeo, flashMat), [
		-.98,
		.04,
		-3.85
	]);
	leftFlash.visible = false;
	const rightFlash = placeMesh(root, new Mesh(flashGeo, flashMat), [
		.98,
		.04,
		-3.85
	]);
	rightFlash.visible = false;
	return {
		gunMuzzles: [leftMuzzle, rightMuzzle],
		muzzleFlashes: [leftFlash, rightFlash]
	};
}
/** Retractable tricycle landing gear: nose wheel + two main wheels. */
function buildLandingGear(root) {
	const landingGear = new Group();
	const strutMat = new MeshStandardMaterial({
		color: 9741240,
		metalness: .8,
		roughness: .3
	});
	const tireMat = new MeshStandardMaterial({
		color: 1120295,
		roughness: .9,
		metalness: .05
	});
	const wheelGeo = new CylinderGeometry(.24, .24, .16, 12);
	wheelGeo.rotateZ(Math.PI / 2);
	for (const gx of [
		0,
		-.85,
		.85
	]) {
		const gz = gx === 0 ? -3.8 : 1.4;
		const strut = new Mesh(new CylinderGeometry(.06, .06, .8, 8), strutMat);
		strut.position.set(gx, -.45, gz);
		landingGear.add(strut);
		const wheel = new Mesh(wheelGeo, tireMat);
		wheel.position.set(gx, -.82, gz);
		landingGear.add(wheel);
	}
	root.add(landingGear);
	return landingGear;
}
function createFighterJetModel(livery, textures, isSoftwareGl) {
	const root = new Group();
	const ctx = {
		root,
		mats: buildJetMaterials(livery, textures, isSoftwareGl)
	};
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
		landingGear
	};
}
/** Shared telegraph glow: the warning flash shown just before an attack. */
function buildTelegraphGlow(root) {
	const telegraphMat = new MeshBasicMaterial({
		color: 16707722,
		transparent: true,
		opacity: 0,
		blending: 2
	});
	return placeMesh(root, new Mesh(new SphereGeometry(.65, 8, 8), telegraphMat), [
		0,
		.1,
		-5.6
	]);
}
/** Shared additive exhaust cone, pointing backwards from the tail. */
function buildEnemyFlame(root, radius, length, color, z, radialSegments = 10, opacity = .88) {
	const flameGeo = new ConeGeometry(radius, length, radialSegments);
	const flameMat = new MeshBasicMaterial({
		color,
		transparent: true,
		opacity,
		blending: 2
	});
	const flame = new Mesh(flameGeo, flameMat);
	flame.rotation.x = Math.PI / 2;
	flame.position.set(0, 0, z);
	root.add(flame);
	return flame;
}
/** Fast, dart-like interceptor with forward-swept wings and red trim. */
function buildInterceptor(root, telegraphGlow) {
	const bodyMaterials = [];
	const hullMat = new MeshStandardMaterial({
		color: 3874086,
		metalness: .8,
		roughness: .25
	});
	const trimMat = new MeshStandardMaterial({
		color: 14427686,
		metalness: .45,
		roughness: .38,
		emissive: 8330525,
		emissiveIntensity: .25
	});
	bodyMaterials.push(hullMat, trimMat);
	const fuse = new Mesh(new ConeGeometry(1.18, 10.2, 8), hullMat);
	fuse.rotation.x = -Math.PI / 2;
	fuse.scale.set(1.22, 1, .5);
	root.add(fuse);
	const wingGeo = new BoxGeometry(5.1, .14, 1.85);
	placeMesh(root, new Mesh(wingGeo, hullMat), [
		2.8,
		.02,
		.45
	], [
		0,
		.28,
		0
	]);
	placeMesh(root, new Mesh(wingGeo, hullMat), [
		-2.8,
		.02,
		.45
	], [
		0,
		-.28,
		0
	]);
	boxMesh(root, [
		10.2,
		.16,
		.42
	], trimMat, [
		0,
		.06,
		-.15
	]);
	const canopyMat = new MeshStandardMaterial({
		color: 16347926,
		metalness: .35,
		roughness: .1,
		emissive: 10105874,
		emissiveIntensity: .4
	});
	const canopyGeo = new CapsuleGeometry(.45, 1.6, 6, 12);
	placeMesh(root, new Mesh(canopyGeo, canopyMat), [
		0,
		.46,
		-1.9
	], [
		Math.PI / 2,
		0,
		0
	]);
	for (const tx of [-.65, .65]) boxMesh(root, [
		.12,
		1.75,
		1.45
	], trimMat, [
		tx,
		.85,
		3.6
	], [
		0,
		0,
		tx > 0 ? -.22 : .22
	]);
	const flameMesh = buildEnemyFlame(root, .44, 2.8, 16733986, 6);
	root.scale.setScalar(1.28);
	return {
		root,
		flameMesh,
		telegraphGlow,
		bodyMaterials
	};
}
/** Wide twin-boom flanker with a sensor dome and blue accent lighting. */
function buildFlanker(root, telegraphGlow) {
	const bodyMaterials = [];
	const hullMat = new MeshStandardMaterial({
		color: 1976635,
		metalness: .86,
		roughness: .22
	});
	const accentMat = new MeshStandardMaterial({
		color: 3718648,
		metalness: .45,
		roughness: .32,
		emissive: 165063,
		emissiveIntensity: .45
	});
	bodyMaterials.push(hullMat, accentMat);
	boxMesh(root, [
		2.2,
		.72,
		8.2
	], hullMat, [
		0,
		0,
		0
	]);
	const nose = new Mesh(new ConeGeometry(1.12, 3.5, 4), hullMat);
	nose.rotation.x = -Math.PI / 2;
	nose.rotation.z = Math.PI / 4;
	nose.position.set(0, 0, -5.65);
	root.add(nose);
	placeMesh(root, new Mesh(new SphereGeometry(.52, 10, 10), accentMat), [
		0,
		.45,
		-1.6
	], [
		0,
		0,
		0
	], [
		1,
		.55,
		1.8
	]);
	boxMesh(root, [
		11.4,
		.14,
		2.5
	], hullMat, [
		0,
		0,
		.8
	]);
	const boomR = boxMesh(root, [
		.45,
		1.45,
		3.6
	], accentMat, [
		-2.5,
		.45,
		2.5
	]).clone();
	boomR.position.x = 2.5;
	root.add(boomR);
	const flameMesh = buildEnemyFlame(root, .52, 3, 3718648, 5.4);
	root.scale.setScalar(1.32);
	return {
		root,
		flameMesh,
		telegraphGlow,
		bodyMaterials
	};
}
/** Heavy gunship with armoured nose, engine pods and a rotating dorsal turret. */
function buildGunship(root, telegraphGlow) {
	const bodyMaterials = [];
	const hullMat = new MeshStandardMaterial({
		color: 2565930,
		metalness: .68,
		roughness: .42
	});
	const armorMat = new MeshStandardMaterial({
		color: 16096779,
		metalness: .52,
		roughness: .34,
		emissive: 11817737,
		emissiveIntensity: .32
	});
	bodyMaterials.push(hullMat, armorMat);
	boxMesh(root, [
		3.5,
		1.7,
		11.6
	], hullMat, [
		0,
		0,
		0
	]);
	boxMesh(root, [
		2.6,
		1.2,
		3.3
	], armorMat, [
		0,
		-.1,
		-6.6
	]);
	boxMesh(root, [
		14.8,
		.36,
		3.5
	], hullMat, [
		0,
		.25,
		.5
	]);
	const podGeo = new CylinderGeometry(.75, .88, 5.4, 12);
	const podL = new Mesh(podGeo, armorMat);
	podL.rotation.x = Math.PI / 2;
	podL.position.set(-4.5, -.35, 1.2);
	root.add(podL);
	const podR = podL.clone();
	podR.position.x = 4.5;
	root.add(podR);
	const turretGroup = new Group();
	turretGroup.position.set(0, 1.05, -.6);
	const turretDome = new Mesh(new SphereGeometry(.95, 10, 8), armorMat);
	turretGroup.add(turretDome);
	const barrel = new Mesh(new CylinderGeometry(.16, .16, 2.4, 8), hullMat);
	barrel.rotation.x = Math.PI / 2;
	barrel.position.set(0, .2, -1.4);
	turretGroup.add(barrel);
	root.add(turretGroup);
	const flameMesh = buildEnemyFlame(root, .75, 3.4, 16498468, 7.2, 12, .9);
	root.scale.setScalar(1.36);
	return {
		root,
		flameMesh,
		turretGroup,
		telegraphGlow,
		bodyMaterials
	};
}
function createEnemyJetModel(archetype) {
	const root = new Group();
	const telegraphGlow = buildTelegraphGlow(root);
	if (archetype === "interceptor") return buildInterceptor(root, telegraphGlow);
	if (archetype === "flanker") return buildFlanker(root, telegraphGlow);
	return buildGunship(root, telegraphGlow);
}
function createMissileModel(isEnemy = false) {
	const g = new Group();
	const bodyMat = new MeshStandardMaterial({
		color: isEnemy ? 16557477 : 16317180,
		metalness: .65,
		roughness: .22
	});
	const body = new Mesh(new CylinderGeometry(.18, .18, 3, 10), bodyMat);
	body.rotation.x = Math.PI / 2;
	g.add(body);
	const noseMat = new MeshStandardMaterial({
		color: isEnemy ? 15680580 : 16096779,
		emissive: isEnemy ? 15680580 : 16096779,
		emissiveIntensity: .6
	});
	const nose = new Mesh(new ConeGeometry(.18, .65, 10), noseMat);
	nose.rotation.x = -Math.PI / 2;
	nose.position.z = -1.8;
	g.add(nose);
	const plumeMat = new MeshBasicMaterial({
		color: isEnemy ? 15680580 : 16772565,
		transparent: true,
		opacity: .92,
		blending: 2
	});
	const plume = new Mesh(new ConeGeometry(.28, 2.2, 8), plumeMat);
	plume.rotation.x = Math.PI / 2;
	plume.position.z = 2.4;
	g.add(plume);
	return g;
}
function createCheckpointRingModel(order) {
	const g = new Group();
	const outerRing = new Mesh(new TorusGeometry(32, 1.4, 12, 36), new MeshStandardMaterial({
		color: 3718648,
		emissive: 165063,
		emissiveIntensity: .85,
		metalness: .6,
		roughness: .2
	}));
	g.add(outerRing);
	const innerRing = new Mesh(new TorusGeometry(27, .55, 8, 36), new MeshBasicMaterial({
		color: 16638023,
		transparent: true,
		opacity: .72
	}));
	g.add(innerRing);
	const pylonGeo = new ConeGeometry(2.2, 5.5, 4);
	const pylonMat = new MeshStandardMaterial({
		color: 16096779,
		emissive: 14251782,
		emissiveIntensity: .6
	});
	for (let i = 0; i < 4; i++) {
		const angle = i * Math.PI / 2 + order * .2;
		const pylon = new Mesh(pylonGeo, pylonMat);
		pylon.position.set(Math.cos(angle) * 35.5, Math.sin(angle) * 35.5, 0);
		pylon.rotation.z = angle + Math.PI / 2;
		g.add(pylon);
	}
	return g;
}
var COLLECTIBLE_COLORS = {
	repair: 2278750,
	fuel: 16096779,
	missile: 15680580,
	star: 3718648
};
function createCollectibleModel(kind) {
	const g = new Group();
	const col = COLLECTIBLE_COLORS[kind];
	const core = new Mesh(new OctahedronGeometry(6.5, 0), new MeshStandardMaterial({
		color: col,
		emissive: col,
		emissiveIntensity: .75,
		metalness: .55,
		roughness: .2
	}));
	g.add(core);
	const halo = new Mesh(new TorusGeometry(10.5, .7, 8, 24), new MeshBasicMaterial({
		color: col,
		transparent: true,
		opacity: .65
	}));
	g.add(halo);
	return g;
}
export { createMissileModel as a, createFighterJetModel as i, createCollectibleModel as n, createEnemyJetModel as r, createCheckpointRingModel as t };
