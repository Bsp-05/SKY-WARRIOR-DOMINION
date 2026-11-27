import { C as MeshPhysicalMaterial, E as OctahedronGeometry, I as Shape, L as SphereGeometry, O as PlaneGeometry, R as TorusGeometry, S as MeshBasicMaterial, T as Object3D, d as CylinderGeometry, g as Group, i as BoxGeometry, k as PointLight, m as ExtrudeGeometry, s as CapsuleGeometry, u as ConeGeometry, w as MeshStandardMaterial, x as Mesh } from "../vendor/libs.min.js";
// src/game/models.ts
function getLiveryColors(livery) {
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
function createFighterJetModel(livery, textures, isSoftwareGl) {
	const root = new Group();
	const palette = getLiveryColors(livery);
	const hullMat = new MeshPhysicalMaterial({
		color: palette.primary,
		map: textures.jetPanelAlbedo,
		bumpMap: textures.jetPanelBump,
		bumpScale: .035,
		metalness: palette.metalness,
		roughness: palette.roughness,
		clearcoat: .45,
		clearcoatRoughness: .18,
		anisotropy: .55
	});
	const trimMat = new MeshStandardMaterial({
		color: palette.secondary,
		bumpMap: textures.jetPanelBump,
		bumpScale: .02,
		metalness: .48,
		roughness: .58
	});
	const accentMat = new MeshStandardMaterial({
		color: palette.accent,
		metalness: .35,
		roughness: .35,
		emissive: palette.accent,
		emissiveIntensity: .16
	});
	const canopyMat = new MeshPhysicalMaterial({
		color: 14919730,
		metalness: .2,
		roughness: .06,
		clearcoat: 1,
		clearcoatRoughness: .04,
		transparent: true,
		opacity: isSoftwareGl ? .52 : .74,
		ior: 1.54
	});
	const nozzleMat = new MeshStandardMaterial({
		color: 1841431,
		metalness: .94,
		roughness: .2
	});
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
	const fuselage = new Mesh(fuseGeo, hullMat);
	fuselage.castShadow = true;
	fuselage.receiveShadow = true;
	root.add(fuselage);
	const lerxGeo = new BoxGeometry(.65, .14, 2.9);
	const rightLerx = new Mesh(lerxGeo, trimMat);
	rightLerx.position.set(1.15, .12, -1.6);
	rightLerx.rotation.y = -.24;
	root.add(rightLerx);
	const leftLerx = rightLerx.clone();
	leftLerx.position.x = -1.15;
	leftLerx.rotation.y = .24;
	root.add(leftLerx);
	const noseGeo = new ConeGeometry(.68, 3.3, 18);
	noseGeo.rotateX(-Math.PI / 2);
	const nose = new Mesh(noseGeo, trimMat);
	nose.position.set(0, .08, -6.9);
	nose.scale.set(1, .66, 1);
	nose.castShadow = true;
	root.add(nose);
	const spine = new Mesh(new BoxGeometry(.92, .56, 6.2), hullMat);
	spine.position.set(0, .52, 1.2);
	spine.castShadow = true;
	root.add(spine);
	const cockpitTub = new Mesh(new BoxGeometry(.86, .38, 2.35), new MeshStandardMaterial({
		color: 988970,
		roughness: .85,
		metalness: .1
	}));
	cockpitTub.position.set(0, .48, -2.5);
	root.add(cockpitTub);
	const headrest = new Mesh(new BoxGeometry(.42, .45, .22), trimMat);
	headrest.position.set(0, .78, -1.9);
	root.add(headrest);
	const pilotHelmet = new Mesh(new SphereGeometry(.24, 12, 12), new MeshStandardMaterial({
		color: 14870768,
		roughness: .28,
		metalness: .45
	}));
	pilotHelmet.position.set(0, .82, -2.35);
	root.add(pilotHelmet);
	const hudGlass = new Mesh(new PlaneGeometry(.45, .28), new MeshBasicMaterial({
		color: 3718648,
		transparent: true,
		opacity: .48,
		side: 2
	}));
	hudGlass.position.set(0, .82, -3.35);
	hudGlass.rotation.x = -.35;
	root.add(hudGlass);
	const canopyGeo = new CapsuleGeometry(.54, 1.9, 8, 16);
	canopyGeo.rotateX(Math.PI / 2);
	const canopy = new Mesh(canopyGeo, canopyMat);
	canopy.position.set(0, .74, -2.55);
	canopy.scale.set(.92, .72, 1.15);
	canopy.renderOrder = 2;
	root.add(canopy);
	const cockpitCameraAnchor = new Object3D();
	cockpitCameraAnchor.position.set(0, 1.02, -2.65);
	root.add(cockpitCameraAnchor);
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
	const rightWing = new Mesh(wingGeo, hullMat);
	rightWing.position.set(0, .08, 0);
	rightWing.castShadow = true;
	rightWing.receiveShadow = true;
	root.add(rightWing);
	const leftWing = rightWing.clone();
	leftWing.scale.x = -1;
	root.add(leftWing);
	const stripeGeo = new BoxGeometry(3.3, .05, .42);
	const rightStripe = new Mesh(stripeGeo, accentMat);
	rightStripe.position.set(3.25, .14, 1.65);
	rightStripe.rotation.y = -.62;
	root.add(rightStripe);
	const leftStripe = rightStripe.clone();
	leftStripe.position.x = -3.25;
	leftStripe.rotation.y = .62;
	root.add(leftStripe);
	const aileronGeo = new BoxGeometry(1.85, .08, .44);
	const rightAileron = new Mesh(aileronGeo, trimMat);
	rightAileron.position.set(3.95, .04, 3.12);
	rightAileron.rotation.y = .1;
	root.add(rightAileron);
	const leftAileron = new Mesh(aileronGeo, trimMat);
	leftAileron.position.set(-3.95, .04, 3.12);
	leftAileron.rotation.y = -.1;
	root.add(leftAileron);
	const elevGeo = new BoxGeometry(2.15, .09, 1.05);
	const rightElevator = new Mesh(elevGeo, trimMat);
	rightElevator.position.set(1.98, .08, 4.88);
	rightElevator.rotation.y = -.22;
	rightElevator.castShadow = true;
	root.add(rightElevator);
	const leftElevator = new Mesh(elevGeo, trimMat);
	leftElevator.position.set(-1.98, .08, 4.88);
	leftElevator.rotation.y = .22;
	leftElevator.castShadow = true;
	root.add(leftElevator);
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
	const rightFin = new Mesh(finGeo, hullMat);
	rightFin.position.set(.88, .48, 4.98);
	rightFin.rotation.z = -.26;
	rightFin.castShadow = true;
	root.add(rightFin);
	const leftFin = new Mesh(finGeo, hullMat);
	leftFin.position.set(-.96, .48, 4.98);
	leftFin.rotation.z = .26;
	leftFin.castShadow = true;
	root.add(leftFin);
	const rudderGeo = new BoxGeometry(.08, 1.5, .42);
	const rightRudder = new Mesh(rudderGeo, accentMat);
	rightRudder.position.set(1.18, 1.3, 4.98);
	rightRudder.rotation.z = -.26;
	root.add(rightRudder);
	const leftRudder = new Mesh(rudderGeo, accentMat);
	leftRudder.position.set(-1.18, 1.3, 4.98);
	leftRudder.rotation.z = .26;
	root.add(leftRudder);
	const intakeGeo = new BoxGeometry(.68, .56, 2.85);
	const rightIntake = new Mesh(intakeGeo, trimMat);
	rightIntake.position.set(.96, .04, -1.6);
	root.add(rightIntake);
	const leftIntake = rightIntake.clone();
	leftIntake.position.x = -.96;
	root.add(leftIntake);
	const nozzleGeo = new CylinderGeometry(.43, .35, .98, 16);
	nozzleGeo.rotateX(Math.PI / 2);
	const rightNozzle = new Mesh(nozzleGeo, nozzleMat);
	rightNozzle.position.set(.56, .12, 5.28);
	root.add(rightNozzle);
	const leftNozzle = rightNozzle.clone();
	leftNozzle.position.x = -.56;
	root.add(leftNozzle);
	const ringGlowMat = new MeshBasicMaterial({ color: 16486972 });
	const ringGlowGeo = new TorusGeometry(.32, .045, 8, 16);
	const rightRingGlow = new Mesh(ringGlowGeo, ringGlowMat);
	rightRingGlow.position.set(.56, .12, 5.75);
	root.add(rightRingGlow);
	const leftRingGlow = rightRingGlow.clone();
	leftRingGlow.position.x = -.56;
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
	const flameInnerMat = new MeshBasicMaterial({
		color: 12248829,
		transparent: true,
		opacity: .92,
		blending: 2,
		depthWrite: false
	});
	const rightFlameOuter = new Mesh(flameOuterGeo, flameOuterMat);
	rightFlameOuter.position.set(.56, .12, 5.65);
	root.add(rightFlameOuter);
	const leftFlameOuter = rightFlameOuter.clone();
	leftFlameOuter.position.x = -.56;
	root.add(leftFlameOuter);
	const flameInnerGeo = new ConeGeometry(.19, 1.75, 12);
	flameInnerGeo.rotateX(Math.PI / 2);
	flameInnerGeo.translate(0, 0, .88);
	const rightFlameInner = new Mesh(flameInnerGeo, flameInnerMat);
	rightFlameInner.position.set(.56, .12, 5.65);
	root.add(rightFlameInner);
	const leftFlameInner = rightFlameInner.clone();
	leftFlameInner.position.x = -.56;
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
		const d = new Mesh(diamondGeo, diamondMat);
		d.position.set(xPos, .12, 6.25 + dIdx * .85);
		root.add(d);
		machDiamonds.push(d);
	}
	const afterburnerLight = new PointLight(16743209, 3.2, 24, 2);
	afterburnerLight.position.set(0, .2, 6.5);
	root.add(afterburnerLight);
	const pylonGeo = new BoxGeometry(.12, .28, 1.4);
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
		const pylon = new Mesh(pylonGeo, trimMat);
		pylon.position.set(xOffset, -.14, 1.2);
		root.add(pylon);
		const m = new Mesh(podMissileGeo, missileMat);
		m.position.set(xOffset, -.32, 1.15);
		root.add(m);
	}
	const portLight = new Mesh(new SphereGeometry(.11, 8, 8), new MeshBasicMaterial({ color: 15680580 }));
	portLight.position.set(-5.75, .1, 2.78);
	root.add(portLight);
	const stbdLight = new Mesh(new SphereGeometry(.11, 8, 8), new MeshBasicMaterial({ color: 2278750 }));
	stbdLight.position.set(5.75, .1, 2.78);
	root.add(stbdLight);
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
	const leftFlash = new Mesh(flashGeo, flashMat);
	leftFlash.position.set(-.98, .04, -3.85);
	leftFlash.visible = false;
	root.add(leftFlash);
	const rightFlash = new Mesh(flashGeo, flashMat);
	rightFlash.position.set(.98, .04, -3.85);
	rightFlash.visible = false;
	root.add(rightFlash);
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
		landingGear
	};
}
function createEnemyJetModel(archetype) {
	const root = new Group();
	const bodyMaterials = [];
	const telegraphMat = new MeshBasicMaterial({
		color: 16707722,
		transparent: true,
		opacity: 0,
		blending: 2
	});
	const telegraphGlow = new Mesh(new SphereGeometry(.65, 8, 8), telegraphMat);
	telegraphGlow.position.set(0, .1, -5.6);
	root.add(telegraphGlow);
	if (archetype === "interceptor") {
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
		const wingR = new Mesh(wingGeo, hullMat);
		wingR.position.set(2.8, .02, .45);
		wingR.rotation.y = .28;
		root.add(wingR);
		const wingL = new Mesh(wingGeo, hullMat);
		wingL.position.set(-2.8, .02, .45);
		wingL.rotation.y = -.28;
		root.add(wingL);
		const wingStrake = new Mesh(new BoxGeometry(10.2, .16, .42), trimMat);
		wingStrake.position.set(0, .06, -.15);
		root.add(wingStrake);
		const canopy = new Mesh(new CapsuleGeometry(.45, 1.6, 6, 12), new MeshStandardMaterial({
			color: 16347926,
			metalness: .35,
			roughness: .1,
			emissive: 10105874,
			emissiveIntensity: .4
		}));
		canopy.rotation.x = Math.PI / 2;
		canopy.position.set(0, .46, -1.9);
		root.add(canopy);
		for (const tx of [-.65, .65]) {
			const fin = new Mesh(new BoxGeometry(.12, 1.75, 1.45), trimMat);
			fin.position.set(tx, .85, 3.6);
			fin.rotation.z = tx > 0 ? -.22 : .22;
			root.add(fin);
		}
		const flameMesh = new Mesh(new ConeGeometry(.44, 2.8, 10), new MeshBasicMaterial({
			color: 16733986,
			transparent: true,
			opacity: .88,
			blending: 2
		}));
		flameMesh.rotation.x = Math.PI / 2;
		flameMesh.position.set(0, 0, 6);
		root.add(flameMesh);
		root.scale.setScalar(1.28);
		return {
			root,
			flameMesh,
			telegraphGlow,
			bodyMaterials
		};
	}
	if (archetype === "flanker") {
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
		const body = new Mesh(new BoxGeometry(2.2, .72, 8.2), hullMat);
		root.add(body);
		const nose = new Mesh(new ConeGeometry(1.12, 3.5, 4), hullMat);
		nose.rotation.x = -Math.PI / 2;
		nose.rotation.z = Math.PI / 4;
		nose.position.set(0, 0, -5.65);
		root.add(nose);
		const sensorDome = new Mesh(new SphereGeometry(.52, 10, 10), accentMat);
		sensorDome.position.set(0, .45, -1.6);
		sensorDome.scale.set(1, .55, 1.8);
		root.add(sensorDome);
		const wings = new Mesh(new BoxGeometry(11.4, .14, 2.5), hullMat);
		wings.position.set(0, 0, .8);
		root.add(wings);
		const boomL = new Mesh(new BoxGeometry(.45, 1.45, 3.6), accentMat);
		boomL.position.set(-2.5, .45, 2.5);
		root.add(boomL);
		const boomR = boomL.clone();
		boomR.position.x = 2.5;
		root.add(boomR);
		const flameMesh = new Mesh(new ConeGeometry(.52, 3, 10), new MeshBasicMaterial({
			color: 3718648,
			transparent: true,
			opacity: .88,
			blending: 2
		}));
		flameMesh.rotation.x = Math.PI / 2;
		flameMesh.position.set(0, 0, 5.4);
		root.add(flameMesh);
		root.scale.setScalar(1.32);
		return {
			root,
			flameMesh,
			telegraphGlow,
			bodyMaterials
		};
	}
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
	const hull = new Mesh(new BoxGeometry(3.5, 1.7, 11.6), hullMat);
	root.add(hull);
	const nose = new Mesh(new BoxGeometry(2.6, 1.2, 3.3), armorMat);
	nose.position.set(0, -.1, -6.6);
	root.add(nose);
	const wings = new Mesh(new BoxGeometry(14.8, .36, 3.5), hullMat);
	wings.position.set(0, .25, .5);
	root.add(wings);
	const podL = new Mesh(new CylinderGeometry(.75, .88, 5.4, 12), armorMat);
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
	const flameMesh = new Mesh(new ConeGeometry(.75, 3.4, 12), new MeshBasicMaterial({
		color: 16498468,
		transparent: true,
		opacity: .9,
		blending: 2
	}));
	flameMesh.rotation.x = Math.PI / 2;
	flameMesh.position.set(0, 0, 7.2);
	root.add(flameMesh);
	root.scale.setScalar(1.36);
	return {
		root,
		flameMesh,
		turretGroup,
		telegraphGlow,
		bodyMaterials
	};
}
function createMissileModel(isEnemy = false) {
	const g = new Group();
	const body = new Mesh(new CylinderGeometry(.18, .18, 3, 10), new MeshStandardMaterial({
		color: isEnemy ? 16557477 : 16317180,
		metalness: .65,
		roughness: .22
	}));
	body.rotation.x = Math.PI / 2;
	g.add(body);
	const nose = new Mesh(new ConeGeometry(.18, .65, 10), new MeshStandardMaterial({
		color: isEnemy ? 15680580 : 16096779,
		emissive: isEnemy ? 15680580 : 16096779,
		emissiveIntensity: .6
	}));
	nose.rotation.x = -Math.PI / 2;
	nose.position.z = -1.8;
	g.add(nose);
	const plume = new Mesh(new ConeGeometry(.28, 2.2, 8), new MeshBasicMaterial({
		color: isEnemy ? 15680580 : 16772565,
		transparent: true,
		opacity: .92,
		blending: 2
	}));
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
function createCollectibleModel(kind) {
	const g = new Group();
	const col = {
		repair: 2278750,
		fuel: 16096779,
		missile: 15680580,
		star: 3718648
	}[kind];
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
