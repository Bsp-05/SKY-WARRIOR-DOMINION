/**
 * App — the React shell for Sky Warrior Dominion.
 *
 * This file owns only the wiring between the UI and the game engine:
 *  - creating / disposing the FlightGameEngine against the WebGL mount
 *  - holding the small pieces of React state the HUD and screens need
 *    (phase, mode, difficulty, mission, livery, mute, HUD snapshot)
 *  - forwarding player intent (start, pause, resume, camera, touch
 *    input) to the engine through thin callbacks
 *
 * All simulation, rendering and audio live in ./game/engine. Nothing
 * in here draws a frame; it just mounts the canvas container and the
 * overlay screens (TitleScreen / MilitaryHud / TouchControls /
 * GameModals) on top of it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameModals } from './components/GameModals';
import { MilitaryHud } from './components/MilitaryHud';
import { TitleScreen } from './components/TitleScreen';
import { TouchControls } from './components/TouchControls';
import { FlightGameEngine } from './game/engine';
import { MISSIONS } from './game/rules';
import type {
  DifficultyMode,
  GameMode,
  GamePhase,
  HudSnapshot,
  JetLivery,
  RunSummary,
} from './game/types';

/** Touch buttons the engine understands, in the shape App forwards. */
type TouchButtonId = 'fireGun' | 'fireMissile' | 'boost' | 'maneuver';

/** Width at or below which a viewport counts as a touch-first device. */
const MOBILE_VIEWPORT_WIDTH = 900;

/** A focused button keeps its focus ring after a click; blur it so the
 *  keyboard / gamepad focus does not linger on a stale control. */
function blurFocusedElement(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/** Decide whether the current device should get touch controls by
 *  default: coarse pointer, any touch points, or a narrow viewport. */
function detectTouchViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
  const narrowWindow = window.innerWidth <= MOBILE_VIEWPORT_WIDTH;
  return coarsePointer || hasTouchPoints || narrowWindow;
}

export default function App() {
  // -- Refs: the canvas mount node and the engine instance itself. -----
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FlightGameEngine | null>(null);

  // -- React state mirrored from / driven by the engine. ----------------
  const [phase, setPhase] = useState<GamePhase>('title');
  const [mode, setMode] = useState<GameMode>('missions');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('beginner');
  const [missionIndex, setMissionIndex] = useState(0);
  const [livery, setLivery] = useState<JetLivery>('obsidian');
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  // The player can override the automatic touch detection from the HUD.
  // `null` means "no override yet — follow the viewport detection".
  const [touchOverride, setTouchOverride] = useState<boolean | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(detectTouchViewport);
  const touchEnabled = touchOverride ?? isMobileViewport;

  // -- Keep the mobile-viewport detection live on resize. ---------------
  useEffect(() => {
    const onResize = () => setIsMobileViewport(detectTouchViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // -- Engine lifecycle: create once on mount, dispose on unmount. -----
  // Also honours the deep-link launch modes used by screenshots / QA:
  //   ?shot=<name>    — prepare a canned screenshot scene
  //   ?autostart=1    — jump straight into the first mission
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new FlightGameEngine(container, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onPhaseChange: (nextPhase) => setPhase(nextPhase),
      onRunEnd: (summary) => setRunSummary(summary),
      onMuteChange: (nextMuted) => setMuted(nextMuted),
    });
    engineRef.current = engine;

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      engine.prepareShot(shot);
    } else if (params.get('autostart') === '1') {
      engine.startGame('missions', 0, true, 'beginner');
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // -- Settings callbacks (livery, mute). -------------------------------
  const handleSelectLivery = useCallback((nextLivery: JetLivery) => {
    setLivery(nextLivery);
    engineRef.current?.setLivery(nextLivery);
  }, []);

  const handleToggleMute = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    // Unlock the AudioContext from the user gesture, then flip mute.
    engine.sound.unlock();
    setMuted(engine.sound.toggleMute());
  }, []);

  // -- Flow callbacks (start / restart / next mission / pause / menu). --
  // Starting and restarting a sortie are the same engine call with the
  // current mode / mission / difficulty; they share the blur + reset.
  const launchCurrentSortie = useCallback(() => {
    blurFocusedElement();
    setRunSummary(null);
    engineRef.current?.startGame(mode, missionIndex, false, difficulty);
  }, [mode, missionIndex, difficulty]);

  const handleStartSortie = launchCurrentSortie;
  const handleRestartSortie = launchCurrentSortie;

  const handleNextMission = useCallback(() => {
    blurFocusedElement();
    const nextIdx = Math.min(MISSIONS.length - 1, missionIndex + 1);
    setMissionIndex(nextIdx);
    setRunSummary(null);
    engineRef.current?.startGame('missions', nextIdx, false, difficulty);
  }, [missionIndex, difficulty]);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleMainMenu = useCallback(() => {
    setRunSummary(null);
    engineRef.current?.returnToTitle();
  }, []);

  // -- In-flight callbacks (camera, auto-target, touch input). ----------
  const handleCycleCamera = useCallback(() => {
    engineRef.current?.cycleCamera();
  }, []);

  const handleToggleAutoTarget = useCallback(() => {
    engineRef.current?.toggleAutoTarget();
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    engineRef.current?.setTouchJoystick(x, y);
  }, []);

  const handleTouchButton = useCallback((btn: TouchButtonId, pressed: boolean) => {
    engineRef.current?.setTouchButton(btn, pressed);
  }, []);

  // -- Render: canvas layer + whichever overlay matches the phase. ------
  const inFlight = phase === 'playing' && hud !== null;
  const canAdvanceMission = mode === 'missions' && missionIndex < MISSIONS.length - 1;

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#090d16]">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={canvasMountRef}
        data-testid="webgl-viewport"
        className="fixed inset-0 w-full h-full"
      />

      {phase === 'title' && (
        <TitleScreen
          mode={mode}
          difficulty={difficulty}
          missionIndex={missionIndex}
          livery={livery}
          bestScore={hud?.bestScore ?? 0}
          muted={muted}
          onSelectMode={setMode}
          onSelectDifficulty={setDifficulty}
          onSelectMission={setMissionIndex}
          onSelectLivery={handleSelectLivery}
          onToggleMute={handleToggleMute}
          onStart={handleStartSortie}
        />
      )}

      {inFlight && hud && (
        <>
          <MilitaryHud
            hud={hud}
            muted={muted}
            touchEnabled={touchEnabled}
            onCycleCamera={handleCycleCamera}
            onToggleAutoTarget={handleToggleAutoTarget}
            onToggleTouch={() => setTouchOverride(!touchEnabled)}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
          />
          {touchEnabled && (
            <TouchControls
              missiles={hud.missiles}
              maneuverReady={hud.maneuverReady}
              gunOverheated={hud.gunOverheated}
              lockState={hud.lockState}
              autoTargetEnabled={hud.autoTargetEnabled}
              onToggleAutoTarget={handleToggleAutoTarget}
              onJoystickMove={handleJoystickMove}
              onButtonChange={handleTouchButton}
            />
          )}
        </>
      )}

      <GameModals
        phase={phase}
        summary={runSummary}
        canAdvanceMission={canAdvanceMission}
        onResume={handleResume}
        onRestart={handleRestartSortie}
        onNextMission={handleNextMission}
        onMainMenu={handleMainMenu}
      />
    </main>
  );
}
