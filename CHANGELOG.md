# Changelog

All notable changes verified and applied in this continuation session for **SKY WARRIOR: DOMINION** are documented below.
Baseline existing project files (existing 3D flight combat engine, world terrain, procedural textures, Web Audio synthesizer, Make.fun dossier packaging, screenshots, and MIT license) were preserved without rewriting from scratch.

## [2026-11-27] Production build, cockpit HUD fixes & fresh screenshots (Tasya session)

### Fixed
- **Cockpit canopy bow frame covering the top HUD (`src/components/MilitaryHud.tsx`)**:
  The diegetic canopy SVG was painted after the HUD header in DOM order, so its
  dark band (55% opaque, dipping to y=210 at the edges) dimmed and crossed the
  `HDG / Operation / timer` pill in cockpit camera mode. The header now stacks
  above the canopy (`z-20` vs `z-0`), the bow is flattened (edges y=120, centre
  y=40) and lightened to 42% opacity, so the whole top bar stays readable.
- **Lock-status text colliding with target markers (`src/components/MilitaryHud.tsx`)**:
  The `TARGET LOCKED / LOCKING` label above the crosshair now sits in a dark
  pill (`bg-[#090f1d]/85` with a border) and is lifted to `-top-9`, so it stays
  legible when a target box or checkpoint ring passes behind it.
- **Projected markers colliding with the mission banner (`src/components/MilitaryHud.tsx`)**:
  Desktop `markerMinY` raised from 0.14 to 0.19 so enemy / ring markers stay
  below the header and `OPERATION … — WAVE 1` banner.
- **Title-screen launch hint cut off (`src/components/TitleScreen.tsx`)**:
  The bottom hint was a `justify-between` row whose long controls string pushed
  `Press Enter or Space to Launch` off the right edge. It is now two centred
  lines, with the launch hint in bold amber, always visible.

### Verified locally in this session — ready to push, blocked on GitHub App access
- Unit tests: `npx tsx --test src/game/rules.test.ts` → **14/14 pass**.
- Lint: `npm run lint` (`tsc --noEmit`) → **0 errors**.
- Builds: `npm run build` and `npm run build:game` → **both pass**.
- The committed `game/` was a development build (React `jsxDEV`,
  `scheduler.development.js`, `/app/applet` source paths in the bundle). This
  working tree carries the production rebuild with the locked toolchain
  (`bun install --frozen-lockfile`, Vite 8.3.8, Three.js 0.187.0): `jsx`
  runtime, `scheduler.production.js`, no leaked sandbox paths,
  `game/src/index.js` 2647 → 1591 lines, `game/vendor/libs.min.js`
  5556 → 4638 lines.
- Playwright (Chromium 159, SwiftShader) play-test of the production `game/`:
  all four `?shot=` modes render a 1280x720 canvas with **0 console errors**,
  and a real click-through (LAUNCH SORTIE + throttle) plays with **0 console errors**.
- Fresh screenshots retaken with Playwright and installed as `screenshots/`:
  cover combat (chase), cockpit HUD (fixed top bar), runway takeoff (live
  playthrough via `?autostart=1`, jet on the runway with afterburner), title
  hangar (launch hint now fully visible). All 1280x720 JPEG, 171–184 KB.
- Kit check (`node cli/makefun.mjs check --kit . --repo . --worktree`):
  **4 passed, 1 failed (transcripts_present — bundled by the top-level agent
  at submit time), 15 skipped**; `vendor/makefun-game.ts` verified unchanged
  against the kit starter; `.makefun/owner.json` wallet `692rgf…` verified as
  an agent wallet on the @bsp05 make.fun account, so it is kept as-is.
- **Not pushed yet:** both GitHub write paths return
  `403 Resource not accessible by integration` — the Muse GitHub App has not
  been granted access to `Bsp-05/SKY-WARRIOR-DOMINION`. Grant it at the App
  installation page, then push this working tree (10 files) and submit.

## [2026-11-27] Continuation Audit, Bug Fixes & Responsive Polish

### Fixed
- **WebGL / Three.js Resource Disposal (`src/game/engine.ts`)**:
  - Updated `setLivery()` to call `disposeGroupResources(this.playerRig.root)` before swapping to a new F-22X livery rig, preventing geometry/material leaks when toggling liveries on the title screen.
  - Updated `clearDynamicActors()` to dispose checkpoint ring and collectible pod meshes (`checkpointMeshes`, `collectibleMeshes`) when restarting or returning to the hangar.
  - Updated `dispose()` to clean up `clearDynamicActors()`, `playerRig.root`, pooled missile meshes (`this.missiles`), shockwave meshes (`this.shockwaves`), and remove pooled `bulletMesh`/`particleMesh` from the scene.
  - Extended `disposeGroupResources()` to cover `THREE.Line` and `THREE.Points` in addition to `THREE.Mesh`.
- **Title Screen Keyboard Navigation Trap (`src/components/TitleScreen.tsx`)**:
  - Updated the global `keydown` handler so pressing `Enter` or `Space` while focused on non-start buttons (`Flight Mode`, `Combat Difficulty`, `Operation`, `F-22X Livery`, `Audio: On/Off`) activates the focused control instead of unconditionally launching the sortie. Pressing `Enter`/`Space` outside option buttons or on `Launch Sortie` (`data-start="true"`) continues to launch as expected.
- **Behind-Camera HUD Marker Projection (`src/game/engine.ts`)**:
  - Updated `emitHud()` so `nextCheckpoint` and `leadTarget` first transform into camera space (`matrixWorldInverse`, `_vProj.z < -1.0`) before calling `.project(this.camera)`, matching the enemy target projection logic and preventing near-plane inversion/wrap when objectives are behind the aircraft.
- **Mobile Landscape TouchControls Clearance (`src/components/TouchControls.tsx`)**:
  - Added `shortViewport` (`window.innerHeight < 520`) compaction in `TouchControls.tsx`: compact virtual stick (`w-24 h-24`), compact 2x2 action grid (`w-[58px] h-[40px]`), and hiding the redundant stacked `AUTO TARGET` button in landscape (where `Auto: ON/OFF` is already accessible in the top-right utility bar), eliminating right-side crowding/overlap risk with the Hull/Missile/Heat telemetry block on `844x390` viewports.

### Added / Improved
- **Cannon Overheat Latch & HUD Feedback (`src/game/types.ts`, `src/game/engine.ts`, `src/components/MilitaryHud.tsx`, `src/components/TouchControls.tsx`, `src/App.tsx`)**:
  - Added `gunOverheated: boolean` to `HudSnapshot` and a `gunOverheated` cooling latch in `FlightGameEngine` (`>= 0.98` triggers `CANNON OVERHEAT — COOLING` banner and allows heat to cool down to `<= 0.45` even if the trigger remains held).
  - Updated `MilitaryHud.tsx` to show `OVERHEAT` on the cannon heat gauge and `TouchControls.tsx` to display `COOL` on the fire button during overheat cooldown.
- **Unit Tests (`src/game/rules.test.ts`)**:
  - Added 2 new unit tests covering cannon heat buildup/cooling, missile reload replenishment, and Free Flight fuel regeneration (bringing suite total from 12 to 14 passing tests).
- **Synchronized Offline Build (`game/`)**:
  - Rebuilt both `dist/` (`npm run build`) and the Make.fun offline static build `game/` (`npm run build:game`) so `game/src/*` and `game/index.html` reflect all code fixes.
- **Project Documentation**:
  - Added `CHANGELOG.md`, `TESTING.md`, and `AGENT_TRANSCRIPT.md` in the repository root.
