import { N as SRGBColorSpace, j as RepeatWrapping, o as CanvasTexture } from "../vendor/libs.min.js";
// src/game/textures.ts
function createProceduralTextures(maxAnisotropy) {
	const panelBumpCanvas = document.createElement("canvas");
	panelBumpCanvas.width = 512;
	panelBumpCanvas.height = 512;
	const pbCtx = panelBumpCanvas.getContext("2d");
	pbCtx.fillStyle = "#888888";
	pbCtx.fillRect(0, 0, 512, 512);
	for (let i = 0; i < 650; i++) {
		const y = Math.random() * 512;
		pbCtx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
		pbCtx.fillRect(0, y, 512, 1);
	}
	pbCtx.strokeStyle = "#303030";
	pbCtx.lineWidth = 2;
	for (let x = 64; x < 512; x += 64) {
		pbCtx.beginPath();
		pbCtx.moveTo(x, 0);
		pbCtx.lineTo(x, 512);
		pbCtx.stroke();
	}
	for (let y = 64; y < 512; y += 64) {
		pbCtx.beginPath();
		pbCtx.moveTo(0, y);
		pbCtx.lineTo(512, y);
		pbCtx.stroke();
	}
	pbCtx.fillStyle = "#aaaaaa";
	for (let x = 12; x < 512; x += 64) for (let y = 12; y < 512; y += 32) pbCtx.fillRect(x, y, 2, 2);
	const jetPanelBump = new CanvasTexture(panelBumpCanvas);
	jetPanelBump.wrapS = RepeatWrapping;
	jetPanelBump.wrapT = RepeatWrapping;
	jetPanelBump.repeat.set(2, 2);
	jetPanelBump.anisotropy = maxAnisotropy;
	const panelColorCanvas = document.createElement("canvas");
	panelColorCanvas.width = 512;
	panelColorCanvas.height = 512;
	const pcCtx = panelColorCanvas.getContext("2d");
	pcCtx.fillStyle = "#e5e7eb";
	pcCtx.fillRect(0, 0, 512, 512);
	pcCtx.strokeStyle = "rgba(25, 30, 42, 0.24)";
	pcCtx.lineWidth = 2;
	for (let x = 64; x < 512; x += 64) {
		pcCtx.beginPath();
		pcCtx.moveTo(x, 0);
		pcCtx.lineTo(x, 512);
		pcCtx.stroke();
	}
	for (let y = 64; y < 512; y += 64) {
		pcCtx.beginPath();
		pcCtx.moveTo(0, y);
		pcCtx.lineTo(512, y);
		pcCtx.stroke();
	}
	const jetPanelAlbedo = new CanvasTexture(panelColorCanvas);
	jetPanelAlbedo.colorSpace = SRGBColorSpace;
	jetPanelAlbedo.wrapS = RepeatWrapping;
	jetPanelAlbedo.wrapT = RepeatWrapping;
	jetPanelAlbedo.repeat.set(2, 2);
	jetPanelAlbedo.anisotropy = maxAnisotropy;
	const cityCanvas = document.createElement("canvas");
	cityCanvas.width = 256;
	cityCanvas.height = 512;
	const cCtx = cityCanvas.getContext("2d");
	cCtx.fillStyle = "#1b2434";
	cCtx.fillRect(0, 0, 256, 512);
	const cityEmissiveCanvas = document.createElement("canvas");
	cityEmissiveCanvas.width = 256;
	cityEmissiveCanvas.height = 512;
	const ceCtx = cityEmissiveCanvas.getContext("2d");
	ceCtx.fillStyle = "#000000";
	ceCtx.fillRect(0, 0, 256, 512);
	for (let row = 8; row < 504; row += 14) {
		const litBand = Math.random() > .25;
		for (let col = 8; col < 248; col += 16) {
			cCtx.fillStyle = "#26344a";
			cCtx.fillRect(col, row, 10, 8);
			if (litBand && Math.random() > .35) {
				const winCol = Math.random() > .65 ? "#67e8f9" : "#fbbf24";
				cCtx.fillStyle = winCol;
				cCtx.fillRect(col + 1, row + 1, 8, 6);
				ceCtx.fillStyle = winCol;
				ceCtx.fillRect(col + 1, row + 1, 8, 6);
			}
		}
	}
	ceCtx.fillStyle = "#38bdf8";
	ceCtx.fillRect(4, 0, 3, 512);
	ceCtx.fillRect(249, 0, 3, 512);
	const cityWindowMap = new CanvasTexture(cityCanvas);
	cityWindowMap.colorSpace = SRGBColorSpace;
	cityWindowMap.wrapS = RepeatWrapping;
	cityWindowMap.wrapT = RepeatWrapping;
	cityWindowMap.anisotropy = maxAnisotropy;
	const cityWindowEmissive = new CanvasTexture(cityEmissiveCanvas);
	cityWindowEmissive.colorSpace = SRGBColorSpace;
	cityWindowEmissive.wrapS = RepeatWrapping;
	cityWindowEmissive.wrapT = RepeatWrapping;
	cityWindowEmissive.anisotropy = maxAnisotropy;
	const runwayCanvas = document.createElement("canvas");
	runwayCanvas.width = 256;
	runwayCanvas.height = 1024;
	const rCtx = runwayCanvas.getContext("2d");
	rCtx.fillStyle = "#1f242d";
	rCtx.fillRect(0, 0, 256, 1024);
	for (let i = 0; i < 1800; i++) {
		rCtx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)";
		rCtx.fillRect(Math.random() * 256, Math.random() * 1024, 3, 3);
	}
	rCtx.fillStyle = "#eab308";
	rCtx.fillRect(14, 0, 6, 1024);
	rCtx.fillRect(236, 0, 6, 1024);
	rCtx.fillStyle = "#f8fafc";
	for (let y = 30; y < 990; y += 64) rCtx.fillRect(123, y, 10, 36);
	for (let x = 36; x <= 204; x += 24) {
		rCtx.fillRect(x, 930, 12, 60);
		rCtx.fillRect(x, 30, 12, 60);
	}
	const runwayMap = new CanvasTexture(runwayCanvas);
	runwayMap.colorSpace = SRGBColorSpace;
	runwayMap.anisotropy = maxAnisotropy;
	const oceanCanvas = document.createElement("canvas");
	oceanCanvas.width = 256;
	oceanCanvas.height = 256;
	const oCtx = oceanCanvas.getContext("2d");
	oCtx.fillStyle = "#808080";
	oCtx.fillRect(0, 0, 256, 256);
	for (let i = 0; i < 360; i++) {
		const x = Math.random() * 256;
		const y = Math.random() * 256;
		const w = 18 + Math.random() * 44;
		const h = 3 + Math.random() * 5;
		oCtx.fillStyle = i % 2 === 0 ? "rgba(230,230,230,0.22)" : "rgba(35,35,35,0.22)";
		oCtx.fillRect(x, y, w, h);
	}
	const oceanBump = new CanvasTexture(oceanCanvas);
	oceanBump.wrapS = RepeatWrapping;
	oceanBump.wrapT = RepeatWrapping;
	oceanBump.repeat.set(36, 36);
	oceanBump.anisotropy = maxAnisotropy;
	const glowCanvas = document.createElement("canvas");
	glowCanvas.width = 128;
	glowCanvas.height = 128;
	const gCtx = glowCanvas.getContext("2d");
	const grad = gCtx.createRadialGradient(64, 64, 2, 64, 64, 62);
	grad.addColorStop(0, "rgba(255,255,255,1)");
	grad.addColorStop(.35, "rgba(255,255,255,0.75)");
	grad.addColorStop(.7, "rgba(255,255,255,0.22)");
	grad.addColorStop(1, "rgba(255,255,255,0)");
	gCtx.fillStyle = grad;
	gCtx.fillRect(0, 0, 128, 128);
	const particleGlow = new CanvasTexture(glowCanvas);
	particleGlow.colorSpace = SRGBColorSpace;
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
