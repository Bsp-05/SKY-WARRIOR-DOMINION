import { N as SRGBColorSpace, j as RepeatWrapping, o as CanvasTexture } from "../vendor/libs.min.js";
// src/game/textures.ts
/** Create a blank canvas of the given size and hand back its 2D context. */
function makeCanvas(width, height) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return {
		canvas,
		ctx: canvas.getContext("2d")
	};
}
/** Fill the whole canvas with one colour. */
function fillAll(ctx, width, height, colour) {
	ctx.fillStyle = colour;
	ctx.fillRect(0, 0, width, height);
}
/** Draw a regular grid of panel seams, `step` px apart, in both axes. */
function drawPanelGrid(ctx, width, height, step, stroke, lineWidth) {
	ctx.strokeStyle = stroke;
	ctx.lineWidth = lineWidth;
	for (let x = step; x < width; x += step) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	}
	for (let y = step; y < height; y += step) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}
}
/** Wrap a texture for tiling and set its anisotropy. */
function finishTiled(texture, repeatX, repeatY, maxAnisotropy) {
	texture.wrapS = RepeatWrapping;
	texture.wrapT = RepeatWrapping;
	texture.repeat.set(repeatX, repeatY);
	texture.anisotropy = maxAnisotropy;
}
var PANEL_SIZE = 512;
var PANEL_GRID = 64;
function buildJetPanelBump(maxAnisotropy) {
	const { canvas, ctx } = makeCanvas(PANEL_SIZE, PANEL_SIZE);
	fillAll(ctx, PANEL_SIZE, PANEL_SIZE, "#888888");
	for (let i = 0; i < 650; i++) {
		const y = Math.random() * PANEL_SIZE;
		ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
		ctx.fillRect(0, y, PANEL_SIZE, 1);
	}
	drawPanelGrid(ctx, PANEL_SIZE, PANEL_SIZE, PANEL_GRID, "#303030", 2);
	ctx.fillStyle = "#aaaaaa";
	for (let x = 12; x < PANEL_SIZE; x += PANEL_GRID) for (let y = 12; y < PANEL_SIZE; y += 32) ctx.fillRect(x, y, 2, 2);
	const texture = new CanvasTexture(canvas);
	finishTiled(texture, 2, 2, maxAnisotropy);
	return texture;
}
function buildJetPanelAlbedo(maxAnisotropy) {
	const { canvas, ctx } = makeCanvas(PANEL_SIZE, PANEL_SIZE);
	fillAll(ctx, PANEL_SIZE, PANEL_SIZE, "#e5e7eb");
	drawPanelGrid(ctx, PANEL_SIZE, PANEL_SIZE, PANEL_GRID, "rgba(25, 30, 42, 0.24)", 2);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	finishTiled(texture, 2, 2, maxAnisotropy);
	return texture;
}
var CITY_WIDTH = 256;
var CITY_HEIGHT = 512;
function buildCityWindows(maxAnisotropy) {
	const { canvas: mapCanvas, ctx } = makeCanvas(CITY_WIDTH, CITY_HEIGHT);
	fillAll(ctx, CITY_WIDTH, CITY_HEIGHT, "#1b2434");
	const { canvas: emissiveCanvas, ctx: emissiveCtx } = makeCanvas(CITY_WIDTH, CITY_HEIGHT);
	fillAll(emissiveCtx, CITY_WIDTH, CITY_HEIGHT, "#000000");
	for (let row = 8; row < 504; row += 14) {
		const litBand = Math.random() > .25;
		for (let col = 8; col < 248; col += 16) {
			ctx.fillStyle = "#26344a";
			ctx.fillRect(col, row, 10, 8);
			if (litBand && Math.random() > .35) {
				const winCol = Math.random() > .65 ? "#67e8f9" : "#fbbf24";
				ctx.fillStyle = winCol;
				ctx.fillRect(col + 1, row + 1, 8, 6);
				emissiveCtx.fillStyle = winCol;
				emissiveCtx.fillRect(col + 1, row + 1, 8, 6);
			}
		}
	}
	emissiveCtx.fillStyle = "#38bdf8";
	emissiveCtx.fillRect(4, 0, 3, CITY_HEIGHT);
	emissiveCtx.fillRect(249, 0, 3, CITY_HEIGHT);
	const map = new CanvasTexture(mapCanvas);
	map.colorSpace = SRGBColorSpace;
	finishTiled(map, 1, 1, maxAnisotropy);
	const emissive = new CanvasTexture(emissiveCanvas);
	emissive.colorSpace = SRGBColorSpace;
	finishTiled(emissive, 1, 1, maxAnisotropy);
	return {
		map,
		emissive
	};
}
function buildRunwayMap(maxAnisotropy) {
	const width = 256;
	const height = 1024;
	const { canvas, ctx } = makeCanvas(width, height);
	fillAll(ctx, width, height, "#1f242d");
	for (let i = 0; i < 1800; i++) {
		ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)";
		ctx.fillRect(Math.random() * width, Math.random() * height, 3, 3);
	}
	ctx.fillStyle = "#eab308";
	ctx.fillRect(14, 0, 6, height);
	ctx.fillRect(236, 0, 6, height);
	ctx.fillStyle = "#f8fafc";
	for (let y = 30; y < 990; y += 64) ctx.fillRect(123, y, 10, 36);
	for (let x = 36; x <= 204; x += 24) {
		ctx.fillRect(x, 930, 12, 60);
		ctx.fillRect(x, 30, 12, 60);
	}
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = maxAnisotropy;
	return texture;
}
function buildOceanBump(maxAnisotropy) {
	const size = 256;
	const { canvas, ctx } = makeCanvas(size, size);
	fillAll(ctx, size, size, "#808080");
	for (let i = 0; i < 360; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		const w = 18 + Math.random() * 44;
		const h = 3 + Math.random() * 5;
		ctx.fillStyle = i % 2 === 0 ? "rgba(230,230,230,0.22)" : "rgba(35,35,35,0.22)";
		ctx.fillRect(x, y, w, h);
	}
	const texture = new CanvasTexture(canvas);
	finishTiled(texture, 36, 36, maxAnisotropy);
	return texture;
}
function buildParticleGlow() {
	const size = 128;
	const { canvas, ctx } = makeCanvas(size, size);
	const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
	grad.addColorStop(0, "rgba(255,255,255,1)");
	grad.addColorStop(.35, "rgba(255,255,255,0.75)");
	grad.addColorStop(.7, "rgba(255,255,255,0.22)");
	grad.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, size, size);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
}
function createProceduralTextures(maxAnisotropy) {
	const jetPanelBump = buildJetPanelBump(maxAnisotropy);
	const jetPanelAlbedo = buildJetPanelAlbedo(maxAnisotropy);
	const { map: cityWindowMap, emissive: cityWindowEmissive } = buildCityWindows(maxAnisotropy);
	const runwayMap = buildRunwayMap(maxAnisotropy);
	const oceanBump = buildOceanBump(maxAnisotropy);
	const particleGlow = buildParticleGlow();
	return {
		jetPanelBump,
		jetPanelAlbedo,
		cityWindowMap,
		cityWindowEmissive,
		runwayMap,
		oceanBump,
		particleGlow,
		dispose: () => {
			jetPanelBump.dispose();
			jetPanelAlbedo.dispose();
			cityWindowMap.dispose();
			cityWindowEmissive.dispose();
			runwayMap.dispose();
			oceanBump.dispose();
			particleGlow.dispose();
		}
	};
}
export { createProceduralTextures as t };
