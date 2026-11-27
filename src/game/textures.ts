import * as THREE from 'three';

/**
 * Procedural textures — every surface detail in Sky Warrior Dominion is
 * painted at runtime on 2D canvases and wrapped in THREE.CanvasTexture,
 * so the game ships no image assets at all.
 *
 * Six textures are produced:
 *   1. jetPanelBump    — fighter metal: brushed grain, panel seams, rivets
 *   2. jetPanelAlbedo  — pale panel colour with matching seams
 *   3. cityWindowMap / cityWindowEmissive — lit skyscraper facades
 *   4. runwayMap       — airbase tarmac, edge lines, centreline, thresholds
 *   5. oceanBump       — micro-wave streaks for the sea
 *   6. particleGlow    — soft radial sprite for particles / engine glow
 *
 * Colour-space note: albedo / emissive maps are sRGB (they carry colour),
 * bump maps stay linear (they carry height data, not colour).
 */

export interface ProceduralTextureSet {
  jetPanelBump: THREE.CanvasTexture;
  jetPanelAlbedo: THREE.CanvasTexture;
  cityWindowMap: THREE.CanvasTexture;
  cityWindowEmissive: THREE.CanvasTexture;
  runwayMap: THREE.CanvasTexture;
  oceanBump: THREE.CanvasTexture;
  particleGlow: THREE.CanvasTexture;
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// Canvas plumbing
// ---------------------------------------------------------------------------

/** Create a blank canvas of the given size and hand back its 2D context. */
function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d')! };
}

/** Fill the whole canvas with one colour. */
function fillAll(ctx: CanvasRenderingContext2D, width: number, height: number, colour: string): void {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, width, height);
}

/** Draw a regular grid of panel seams, `step` px apart, in both axes. */
function drawPanelGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step: number,
  stroke: string,
  lineWidth: number,
): void {
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
function finishTiled(texture: THREE.CanvasTexture, repeatX: number, repeatY: number, maxAnisotropy: number): void {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = maxAnisotropy;
}

// ---------------------------------------------------------------------------
// 1–2. Fighter jet panels (bump + albedo share the same 64 px grid)
// ---------------------------------------------------------------------------

const PANEL_SIZE = 512;
const PANEL_GRID = 64;

function buildJetPanelBump(maxAnisotropy: number): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(PANEL_SIZE, PANEL_SIZE);
  fillAll(ctx, PANEL_SIZE, PANEL_SIZE, '#888888');

  // Brushed grain: faint horizontal streaks across the whole sheet.
  for (let i = 0; i < 650; i++) {
    const y = Math.random() * PANEL_SIZE;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, y, PANEL_SIZE, 1);
  }

  // Panel seams.
  drawPanelGrid(ctx, PANEL_SIZE, PANEL_SIZE, PANEL_GRID, '#303030', 2);

  // Subtle rivets dotted along the seams.
  ctx.fillStyle = '#aaaaaa';
  for (let x = 12; x < PANEL_SIZE; x += PANEL_GRID) {
    for (let y = 12; y < PANEL_SIZE; y += 32) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  finishTiled(texture, 2, 2, maxAnisotropy);
  return texture;
}

function buildJetPanelAlbedo(maxAnisotropy: number): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(PANEL_SIZE, PANEL_SIZE);
  fillAll(ctx, PANEL_SIZE, PANEL_SIZE, '#e5e7eb');
  drawPanelGrid(ctx, PANEL_SIZE, PANEL_SIZE, PANEL_GRID, 'rgba(25, 30, 42, 0.24)', 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  finishTiled(texture, 2, 2, maxAnisotropy);
  return texture;
}

// ---------------------------------------------------------------------------
// 3. Futuristic city facade (albedo + emissive, painted in one pass)
// ---------------------------------------------------------------------------

const CITY_WIDTH = 256;
const CITY_HEIGHT = 512;

function buildCityWindows(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
} {
  const { canvas: mapCanvas, ctx } = makeCanvas(CITY_WIDTH, CITY_HEIGHT);
  fillAll(ctx, CITY_WIDTH, CITY_HEIGHT, '#1b2434');

  const { canvas: emissiveCanvas, ctx: emissiveCtx } = makeCanvas(CITY_WIDTH, CITY_HEIGHT);
  fillAll(emissiveCtx, CITY_WIDTH, CITY_HEIGHT, '#000000');

  // Window grid: rows of 10×8 panes, some rows mostly dark, lit panes
  // randomly cyan or warm amber. Lit panes are painted on both maps so
  // the facade glows at dusk.
  for (let row = 8; row < 504; row += 14) {
    const litBand = Math.random() > 0.25;
    for (let col = 8; col < 248; col += 16) {
      ctx.fillStyle = '#26344a';
      ctx.fillRect(col, row, 10, 8);
      if (litBand && Math.random() > 0.35) {
        const winCol = Math.random() > 0.65 ? '#67e8f9' : '#fbbf24';
        ctx.fillStyle = winCol;
        ctx.fillRect(col + 1, row + 1, 8, 6);
        emissiveCtx.fillStyle = winCol;
        emissiveCtx.fillRect(col + 1, row + 1, 8, 6);
      }
    }
  }

  // Vertical architectural accent strips down both edges (emissive only).
  emissiveCtx.fillStyle = '#38bdf8';
  emissiveCtx.fillRect(4, 0, 3, CITY_HEIGHT);
  emissiveCtx.fillRect(249, 0, 3, CITY_HEIGHT);

  const map = new THREE.CanvasTexture(mapCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  finishTiled(map, 1, 1, maxAnisotropy);

  const emissive = new THREE.CanvasTexture(emissiveCanvas);
  emissive.colorSpace = THREE.SRGBColorSpace;
  finishTiled(emissive, 1, 1, maxAnisotropy);
  return { map, emissive };
}

// ---------------------------------------------------------------------------
// 4. Airbase / carrier runway
// ---------------------------------------------------------------------------

function buildRunwayMap(maxAnisotropy: number): THREE.CanvasTexture {
  const width = 256;
  const height = 1024;
  const { canvas, ctx } = makeCanvas(width, height);
  fillAll(ctx, width, height, '#1f242d');

  // Subtle tarmac noise.
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.random() * width, Math.random() * height, 3, 3);
  }

  // Amber edge lines.
  ctx.fillStyle = '#eab308';
  ctx.fillRect(14, 0, 6, height);
  ctx.fillRect(236, 0, 6, height);

  // Dashed white centreline.
  ctx.fillStyle = '#f8fafc';
  for (let y = 30; y < 990; y += 64) {
    ctx.fillRect(123, y, 10, 36);
  }

  // Threshold bars at both ends.
  for (let x = 36; x <= 204; x += 24) {
    ctx.fillRect(x, 930, 12, 60);
    ctx.fillRect(x, 30, 12, 60);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

// ---------------------------------------------------------------------------
// 5. Ocean micro-wave bump
// ---------------------------------------------------------------------------

function buildOceanBump(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  fillAll(ctx, size, size, '#808080');

  // Short horizontal wave streaks, alternating light and dark.
  for (let i = 0; i < 360; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 18 + Math.random() * 44;
    const h = 3 + Math.random() * 5;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(230,230,230,0.22)' : 'rgba(35,35,35,0.22)';
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  finishTiled(texture, 36, 36, maxAnisotropy);
  return texture;
}

// ---------------------------------------------------------------------------
// 6. Radial soft particle glow
// ---------------------------------------------------------------------------

function buildParticleGlow(): THREE.CanvasTexture {
  const size = 128;
  const { canvas, ctx } = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
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
    },
  };
}
