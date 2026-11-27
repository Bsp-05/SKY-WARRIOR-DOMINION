# Changelog

All notable changes verified and applied in this continuation session for **SKY WARRIOR: DOMINION** are documented below.
Baseline existing project files (existing 3D flight combat engine, world terrain, procedural textures, Web Audio synthesizer, Make.fun dossier packaging, screenshots, and MIT license) were preserved without rewriting from scratch.

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
