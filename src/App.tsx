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

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FlightGameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('title');
  const [mode, setMode] = useState<GameMode>('missions');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('beginner');
  const [missionIndex, setMissionIndex] = useState(0);
  const [livery, setLivery] = useState<JetLivery>('obsidian');
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [touchOverride, setTouchOverride] = useState<boolean | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      window.innerWidth <= 900
    );
  });
  const touchEnabled = touchOverride ?? isMobileViewport;

  useEffect(() => {
    const onResize = () => {
      const mobile =
        window.matchMedia?.('(pointer: coarse)').matches ||
        (navigator.maxTouchPoints ?? 0) > 0 ||
        window.innerWidth <= 900;
      setIsMobileViewport(mobile);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const handleSelectLivery = useCallback((nextLivery: JetLivery) => {
    setLivery(nextLivery);
    engineRef.current?.setLivery(nextLivery);
  }, []);

  const handleToggleMute = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.sound.unlock();
    const nextMuted = engine.sound.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleStartSortie = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRunSummary(null);
    engineRef.current?.startGame(mode, missionIndex, false, difficulty);
  }, [mode, missionIndex, difficulty]);

  const handleRestartSortie = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRunSummary(null);
    engineRef.current?.startGame(mode, missionIndex, false, difficulty);
  }, [mode, missionIndex, difficulty]);

  const handleNextMission = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
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

  const handleCycleCamera = useCallback(() => {
    engineRef.current?.cycleCamera();
  }, []);

  const handleToggleAutoTarget = useCallback(() => {
    engineRef.current?.toggleAutoTarget();
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    engineRef.current?.setTouchJoystick(x, y);
  }, []);

  const handleTouchButton = useCallback(
    (btn: 'fireGun' | 'fireMissile' | 'boost' | 'maneuver', pressed: boolean) => {
      engineRef.current?.setTouchButton(btn, pressed);
    },
    []
  );

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

      {phase === 'playing' && hud && (
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
        canAdvanceMission={mode === 'missions' && missionIndex < MISSIONS.length - 1}
        onResume={handleResume}
        onRestart={handleRestartSortie}
        onNextMission={handleNextMission}
        onMainMenu={handleMainMenu}
      />
    </main>
  );
}
