import React, { useEffect, useState } from 'react';
import type { HudSnapshot } from '../game/types';

interface MilitaryHudProps {
  hud: HudSnapshot;
  muted: boolean;
  touchEnabled: boolean;
  onCycleCamera: () => void;
  onToggleAutoTarget: () => void;
  onToggleTouch: () => void;
  onToggleMute: () => void;
  onPause: () => void;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const MilitaryHud: React.FC<MilitaryHudProps> = ({
  hud,
  muted,
  touchEnabled,
  onCycleCamera,
  onToggleAutoTarget,
  onToggleTouch,
  onToggleMute,
  onPause,
}) => {
  const [shortViewport, setShortViewport] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerHeight < 520
  );

  useEffect(() => {
    const onResize = () => setShortViewport(window.innerHeight < 520);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.max(0, sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const lockColor =
    hud.lockState === 'locked'
      ? '#22c55e'
      : hud.lockState === 'acquiring'
      ? '#f59e0b'
      : '#38bdf8';

  const shortCamLabel =
    hud.cameraMode === 'chase' ? 'CHS' : hud.cameraMode === 'action' ? 'ACT' : 'CKP';

  // Safe viewport bounds for 3D projected markers so they never clip edges or overlap HUD/TouchControls
  const markerMinX = touchEnabled ? (shortViewport ? 0.24 : 0.22) : 0.08;
  const markerMaxX = touchEnabled ? (shortViewport ? 0.76 : 0.78) : 0.92;
  const markerMinY = touchEnabled ? (shortViewport ? 0.35 : 0.29) : 0.14;
  const markerMaxY = touchEnabled ? (shortViewport ? 0.56 : 0.58) : 0.85;

  const telemetryLeftBlock = (
    <div
      className={`bg-[#090f1d]/82 border border-slate-700/60 rounded-lg ${
        shortViewport ? 'p-1.5 space-y-0.5 w-[116px]' : 'p-2 sm:p-3 space-y-1 sm:space-y-2 w-[114px] sm:w-[162px]'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-hud text-slate-400">SPD</span>
        <span className="text-sm sm:text-base font-hud font-bold text-sky-300">
          {hud.speedKnots} <span className="text-[9px] text-slate-400">KTS</span>
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-hud text-slate-400">ALT</span>
        <span className="text-sm sm:text-base font-hud font-bold text-slate-100">
          {hud.altitudeMeters} <span className="text-[9px] text-slate-400">M</span>
        </span>
      </div>
      <div>
        <div className="flex items-center justify-between text-[10px] font-hud mb-0.5">
          <span className={hud.lowFuelWarning ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            FUEL
          </span>
          <span className="text-amber-300">{hud.fuel}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${hud.lowFuelWarning ? 'bg-rose-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.round((hud.fuel / hud.maxFuel) * 100)}%` }}
          />
        </div>
      </div>
      {hud.afterburner && (
        <div className="text-[9px] font-hud font-bold text-orange-400 tracking-wider">
          AFTERBURNER
        </div>
      )}
    </div>
  );

  const telemetryRightBlock = (
    <div
      className={`bg-[#090f1d]/82 border border-slate-700/60 rounded-lg ${
        shortViewport ? 'p-1.5 space-y-0.5 w-[122px]' : 'p-2 sm:p-3 space-y-1 sm:space-y-2 w-[118px] sm:w-[172px]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between text-[10px] font-hud mb-0.5">
          <span className={hud.lowHealthWarning ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            HULL
          </span>
          <span className="text-emerald-300">{hud.health}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              hud.health > 50 ? 'bg-emerald-400' : hud.health > 25 ? 'bg-amber-400' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.round((hud.health / hud.maxHealth) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-hud">
        <span className="text-slate-400">MSL</span>
        <span className="text-amber-300 font-bold">
          {hud.missiles}/{hud.maxMissiles}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-[10px] font-hud mb-0.5">
          <span className="text-slate-400">HEAT</span>
          <span className={hud.gunHeat > 0.8 ? 'text-rose-400' : 'text-sky-300'}>
            {Math.round(hud.gunHeat * 100)}%
          </span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${hud.gunHeat > 0.8 ? 'bg-rose-500' : 'bg-sky-400'}`}
            style={{ width: `${Math.round(hud.gunHeat * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Peripheral Damage / Low-Health Vignette */}
      {(hud.damageFlash > 0.05 || hud.lowHealthWarning) && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 110px rgba(239, 68, 68, ${
              Math.max(hud.damageFlash * 0.65, hud.lowHealthWarning ? 0.35 : 0)
            })`,
          }}
        />
      )}

      {/* Afterburner Peripheral Speed Streaks */}
      {hud.afterburner && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="fixed inset-0 w-full h-full pointer-events-none opacity-45"
          aria-hidden="true"
        >
          <g stroke="#bae6fd" strokeWidth="0.18" strokeLinecap="round">
            <line x1="2" y1="14" x2="10" y2="20" />
            <line x1="98" y1="14" x2="90" y2="20" />
            <line x1="1" y1="44" x2="9" y2="46" />
            <line x1="99" y1="44" x2="91" y2="46" />
            <line x1="3" y1="78" x2="11" y2="73" />
            <line x1="97" y1="78" x2="89" y2="73" />
            <line x1="18" y1="3" x2="22" y2="10" />
            <line x1="82" y1="3" x2="78" y2="10" />
          </g>
        </svg>
      )}

      {/* 3D Projected Enemy Target Boxes (clamped to safe HUD corridor) */}
      {hud.targets.map((t) => {
        const sx = clamp(t.screenX, markerMinX, markerMaxX);
        const sy = clamp(t.screenY, markerMinY, markerMaxY);
        const hpPct = Math.max(0, Math.min(100, Math.round(t.healthRatio * 100)));
        const hpFill =
          hpPct > 55 ? 'bg-emerald-400' : hpPct > 25 ? 'bg-amber-400' : 'bg-rose-500';

        if (!t.inFront) {
          const dx = t.dirX ?? 0;
          const dy = t.dirY ?? 1;
          const arrow =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? '▶'
                : '◀'
              : dy < 0
              ? '▲'
              : '▼';
          return (
            <div
              key={t.id}
              className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-0.5"
              style={{ left: `${sx * 100}%`, top: `${sy * 100}%` }}
            >
              <div className="w-14 h-1.5 bg-slate-950/90 border border-slate-500/70 rounded-sm overflow-hidden">
                <div className={`h-full ${hpFill}`} style={{ width: `${hpPct}%` }} />
              </div>
              <div
                className={`px-1.5 py-0.5 text-[10px] font-hud rounded whitespace-nowrap border ${
                  t.isLockedTarget
                    ? 'text-emerald-200 bg-emerald-950/90 border-emerald-400/80'
                    : 'text-rose-200 bg-rose-950/85 border-rose-500/70'
                }`}
              >
                {arrow} {t.callsign} {t.distance}m
              </div>
            </div>
          );
        }

        const boxBorder = t.isLockedTarget
          ? hud.lockState === 'locked'
            ? 'border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
            : 'border-amber-400'
          : 'border-rose-400/85';

        return (
          <div
            key={t.id}
            className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
            style={{ left: `${sx * 100}%`, top: `${sy * 100}%` }}
          >
            {/* Callsign, Distance & Visible Health Bar ABOVE every enemy aircraft */}
            <div className="mb-1 flex flex-col items-center gap-0.5">
              <div className="px-1.5 py-0.5 rounded bg-[#070b14]/85 border border-slate-700/70 whitespace-nowrap text-[10px] font-hud text-white leading-none">
                {t.callsign} · {t.distance}m
              </div>
              <div className="w-14 sm:w-16 h-2 bg-slate-950/95 border border-slate-400/75 rounded-sm overflow-hidden">
                <div className={`h-full transition-all duration-100 ${hpFill}`} style={{ width: `${hpPct}%` }} />
              </div>
            </div>

            <div className={`w-9 h-9 sm:w-11 sm:h-11 border-2 ${boxBorder} relative`}>
              {t.isLockedTarget && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-hud font-bold tracking-wider hud-stroke" style={{ color: lockColor }}>
                  {hud.lockState === 'locked' ? 'TARGET LOCKED' : 'TRACKING'}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Aim-Assist Predicted Lead Pip */}
      {hud.leadTarget && (
        <div
          className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
          style={{
            left: `${clamp(hud.leadTarget.screenX, markerMinX, markerMaxX) * 100}%`,
            top: `${clamp(hud.leadTarget.screenY, markerMinY, markerMaxY) * 100}%`,
          }}
        >
          <div className="w-6 h-6 rounded-full border-2 border-cyan-300/90 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
          </div>
        </div>
      )}

      {/* 3D Projected Next Checkpoint Marker */}
      {hud.nextCheckpoint && (
        <div
          className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
          style={{
            left: `${clamp(hud.nextCheckpoint.screenX, markerMinX, markerMaxX) * 100}%`,
            top: `${clamp(hud.nextCheckpoint.screenY, markerMinY, markerMaxY) * 100}%`,
          }}
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rotate-45 border-2 border-sky-400 flex items-center justify-center">
            <div className="w-2 h-2 bg-amber-300" />
          </div>
          <span className="mt-1 text-[10px] font-hud text-sky-200 hud-stroke whitespace-nowrap">
            RING {hud.nextCheckpoint.order} · {hud.nextCheckpoint.distance}m
          </span>
        </div>
      )}

      {/* Center Boresight Crosshair + Pitch/Roll Artificial Horizon */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        {hud.combatFeedback && (
          <div
            data-testid="combat-feedback"
            className={`absolute -top-13 px-2.5 py-0.5 rounded border text-[11px] sm:text-xs font-hud font-bold tracking-wider whitespace-nowrap shadow-md ${
              hud.combatFeedback.kind === 'kill'
                ? 'bg-emerald-600/95 border-emerald-300 text-white'
                : hud.combatFeedback.kind === 'crit'
                ? 'bg-amber-500/95 border-amber-200 text-slate-950'
                : 'bg-sky-600/90 border-sky-300 text-white'
            }`}
          >
            {hud.combatFeedback.text}
          </div>
        )}

        {hud.lockState !== 'none' && hud.lockedTargetCallsign && (
          <div
            className="absolute -top-6 text-[10px] sm:text-xs font-hud font-bold tracking-wider whitespace-nowrap hud-stroke"
            style={{ color: lockColor }}
          >
            {hud.lockState === 'locked'
              ? `TARGET LOCKED · ${hud.lockedTargetCallsign} (${hud.lockedTargetDist ?? 0}m)`
              : `LOCKING · ${hud.lockedTargetCallsign} ${Math.round(hud.lockProgress * 100)}%`}
          </div>
        )}

        <svg
          viewBox="0 0 180 180"
          className={`${shortViewport ? 'w-28 h-28' : 'w-32 h-32 sm:w-44 sm:h-44'} overflow-visible`}
        >
          {/* Artificial Horizon Line */}
          <g
            transform={`rotate(${-hud.bankDeg} 90 90) translate(0 ${Math.max(
              -34,
              Math.min(34, hud.pitchDeg * 0.9)
            )})`}
          >
            <line x1="26" y1="90" x2="64" y2="90" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="116" y1="90" x2="154" y2="90" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="64" y1="90" x2="64" y2="96" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="116" y1="90" x2="116" y2="96" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.65" />
          </g>

          {/* Outer Lock Progress Ring */}
          <circle
            cx="90"
            cy="90"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
          {hud.lockProgress > 0 && (
            <circle
              cx="90"
              cy="90"
              r="46"
              fill="none"
              stroke={lockColor}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - hud.lockProgress)}
              transform="rotate(-90 90 90)"
            />
          )}

          {/* Fixed Aircraft Boresight Reticle */}
          <circle cx="90" cy="90" r="3" fill={lockColor} />
          <path
            d="M78,90 L85,90 M95,90 L102,90 M90,78 L90,85 M90,95 L90,102"
            stroke="#f8fafc"
            strokeWidth="1.75"
          />
          {hud.hitMarker && (
            <path
              d="M75,75 L83,83 M105,75 L97,83 M75,105 L83,97 M105,105 L97,97"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* Top HUD Header: Sequential flex rows prevent any overlap across portrait & landscape */}
      <div className="relative flex flex-col p-2 sm:p-3.5 gap-1.5 pointer-events-none">
        {/* Row 1: Score, Desktop/Landscape Center Objective, Utility Controls */}
        <div className="flex items-start justify-between gap-2">
          {/* Top-Left: Score & Combo */}
          <div
            className={`bg-[#090f1d]/85 border border-slate-700/60 rounded-lg ${
              shortViewport
                ? 'px-2 py-1 min-w-[116px]'
                : 'px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[114px] sm:min-w-[138px]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-hud uppercase tracking-wider text-slate-400">
              <span>Kills {hud.kills}</span>
              {hud.combo > 1 && <span className="text-amber-300 font-bold">x{hud.combo}</span>}
            </div>
            <div
              className={`${
                shortViewport ? 'text-base' : 'text-lg sm:text-2xl'
              } font-display font-bold text-amber-400 leading-tight font-hud`}
              data-testid="hud-score"
            >
              {hud.score.toLocaleString()}
            </div>
          </div>

          {/* Top-Center: Heading Compass & Objective (Tablet/Desktop & Landscape) */}
          <div className="hidden sm:flex flex-col items-center max-w-md text-center min-w-0">
            <div className="bg-[#090f1d]/85 border border-slate-700/60 rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 text-xs font-hud whitespace-nowrap">
              <span className="text-sky-300 font-bold">HDG {String(hud.headingDeg).padStart(3, '0')}°</span>
              <span className="text-slate-600" aria-hidden="true">|</span>
              <span className="text-slate-100 truncate max-w-[180px]">{hud.missionTitle}</span>
              {hud.timeRemainingSec !== null && (
                <>
                  <span className="text-slate-600" aria-hidden="true">|</span>
                  <span
                    className={
                      hud.timeRemainingSec <= 30 ? 'text-rose-400 font-bold' : 'text-amber-300'
                    }
                  >
                    {formatTime(hud.timeRemainingSec)}
                  </span>
                </>
              )}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-200 hud-stroke truncate max-w-[360px]">
              {hud.objectiveText}
            </div>
            {(hud.incomingWarning || hud.bannerMessage) && (
              <div className="mt-1.5 flex flex-col items-center gap-1">
                {hud.incomingWarning && (
                  <div className="px-3 py-0.5 bg-rose-600/90 text-white text-[11px] font-hud font-bold tracking-wider rounded border border-rose-300/60 whitespace-nowrap">
                    INCOMING MISSILE ({hud.incomingDistance}m) — EVADE!
                  </div>
                )}
                {hud.bannerMessage && (
                  <div className="px-3 py-0.5 bg-[#090f1d]/90 text-amber-300 text-[11px] font-hud font-semibold tracking-wider rounded border border-amber-500/40 whitespace-nowrap truncate max-w-[360px]">
                    {hud.bannerMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top-Right: Utility Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-pressed={hud.autoTargetEnabled}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleAutoTarget();
              }}
              aria-label="Toggle Auto Target"
              title="Toggle Auto Target (T)"
              className={`h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium border rounded-lg cursor-pointer whitespace-nowrap flex items-center ${
                hud.autoTargetEnabled
                  ? 'bg-[#062820]/90 border-emerald-400 text-emerald-200'
                  : 'bg-[#090f1d]/85 hover:bg-slate-800 text-slate-300 border-slate-700/70'
              }`}
            >
              <span className="sm:hidden">A:{hud.autoTargetEnabled ? 'ON' : 'OFF'}</span>
              <span className="hidden sm:inline">Auto: {hud.autoTargetEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleCamera();
              }}
              aria-label="Switch Camera View"
              title="Switch Camera (C)"
              className="h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer whitespace-nowrap flex items-center"
            >
              <span className="sm:hidden">C:{shortCamLabel}</span>
              <span className="hidden sm:inline">Cam: {hud.cameraMode.toUpperCase()}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouch();
              }}
              aria-label="Toggle Touch Controls"
              title="Toggle On-Screen Touch Controls"
              className={`h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium border rounded-lg cursor-pointer whitespace-nowrap flex items-center ${
                touchEnabled
                  ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                  : 'bg-[#090f1d]/85 hover:bg-slate-800 text-slate-300 border-slate-700/70'
              }`}
            >
              Pad
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              title="Mute (M)"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                {muted ? (
                  <path d="M22 9l-6 6M16 9l6 6" stroke="#f87171" />
                ) : (
                  <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause Game"
              title="Pause (P)"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2 (Portrait Mobile Only): Objective & Heading Strip cleanly above telemetry */}
        <div className="sm:hidden flex justify-center">
          <div className="bg-[#090f1d]/85 border border-slate-700/60 rounded-md px-2.5 py-1 flex items-center gap-2 text-[10px] font-hud max-w-full">
            <span className="text-sky-300 font-bold shrink-0">
              {String(hud.headingDeg).padStart(3, '0')}°
            </span>
            <span className="text-slate-600 shrink-0" aria-hidden="true">|</span>
            <span className="text-slate-100 truncate">{hud.objectiveText}</span>
            {hud.timeRemainingSec !== null && (
              <>
                <span className="text-slate-600 shrink-0" aria-hidden="true">|</span>
                <span
                  className={`shrink-0 ${
                    hud.timeRemainingSec <= 30 ? 'text-rose-400 font-bold' : 'text-amber-300'
                  }`}
                >
                  {formatTime(hud.timeRemainingSec)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Portrait Mobile Warnings & Banners inside header flow so they never collide with 3D target boxes */}
        {(hud.incomingWarning || hud.bannerMessage) && (
          <div className="sm:hidden flex flex-col items-center gap-1 pointer-events-none">
            {hud.incomingWarning && (
              <div className="px-2.5 py-0.5 bg-rose-600/90 text-white text-[10px] font-hud font-bold tracking-wider rounded border border-rose-300/60 whitespace-nowrap">
                INCOMING MISSILE ({hud.incomingDistance}m) — EVADE!
              </div>
            )}
            {hud.bannerMessage && (
              <div className="px-2.5 py-0.5 bg-[#090f1d]/90 text-amber-300 text-[10px] font-hud font-semibold tracking-wider rounded border border-amber-500/40 whitespace-nowrap truncate max-w-[90vw]">
                {hud.bannerMessage}
              </div>
            )}
          </div>
        )}

        {/* Row 3 (Touch Mode): Left & Right Telemetry cleanly in normal flow below header */}
        {touchEnabled && (
          <div className="flex items-start justify-between gap-2">
            {telemetryLeftBlock}
            {telemetryRightBlock}
          </div>
        )}
      </div>

      {/* Diegetic Cockpit Canopy Bow Frame in Cockpit Camera Mode */}
      {hud.cameraMode === 'cockpit' && (
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="fixed inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <path
            d="M0,210 Q180,60 720,42 Q1260,60 1440,210 L1440,0 L0,0 Z"
            fill="rgba(9,13,22,0.55)"
          />
          <path
            d="M0,210 Q180,60 720,42 Q1260,60 1440,210"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
          />
          <path
            d="M0,900 L0,760 L430,835 L1010,835 L1440,760 L1440,900 Z"
            fill="rgba(9,13,22,0.82)"
            stroke="#334155"
            strokeWidth="4"
          />
          {/* Lit Cockpit Glareshield MFDs & Attitude Instruments */}
          <g opacity="0.9">
            <rect x="468" y="846" width="120" height="44" rx="4" fill="#07111e" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="528" cy="868" r="15" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="513" y1="868" x2="543" y2="868" stroke="#22c55e" strokeWidth="2" />
            <rect x="615" y="844" width="210" height="48" rx="4" fill="#07111e" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="630" y="858" width="84" height="7" rx="2" fill="#22c55e" />
            <rect x="630" y="872" width="128" height="7" rx="2" fill="#38bdf8" />
            <circle cx="792" cy="868" r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="792" y1="868" x2="801" y2="859" stroke="#fbbf24" strokeWidth="2" />
            <rect x="852" y="846" width="120" height="44" rx="4" fill="#07111e" stroke="#22c55e" strokeWidth="1.5" />
            <polyline points="866,878 886,864 906,872 930,856 958,864" fill="none" stroke="#22c55e" strokeWidth="2" />
          </g>
        </svg>
      )}

      {/* Desktop Bottom-Left & Bottom-Right Telemetry + Radar when Touch Controls are OFF */}
      {!touchEnabled && (
        <>
          <div className="fixed left-4 bottom-5">{telemetryLeftBlock}</div>

          <div className="fixed right-4 bottom-5 flex flex-col items-end gap-2">
            {telemetryRightBlock}
            {!shortViewport && (
              <div className="hidden sm:flex items-center justify-center bg-[#090f1d]/85 border border-slate-700/70 rounded-full w-28 h-28 p-1">
                <svg viewBox="-1 -1 2 2" className="w-full h-full">
                  <circle cx="0" cy="0" r="0.96" fill="rgba(15,23,42,0.75)" stroke="rgba(56,189,248,0.35)" strokeWidth="0.03" />
                  <circle cx="0" cy="0" r="0.5" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="0.02" />
                  <line x1="-0.95" y1="0" x2="0.95" y2="0" stroke="rgba(56,189,248,0.18)" strokeWidth="0.02" />
                  <line x1="0" y1="-0.95" x2="0" y2="0.95" stroke="rgba(56,189,248,0.18)" strokeWidth="0.02" />
                  <polygon points="0,-0.12 0.08,0.09 -0.08,0.09" fill="#f8fafc" />
                  {hud.radarBlips.map((b) => (
                    <circle
                      key={b.id}
                      cx={b.dx}
                      cy={b.dz}
                      r={b.isLocked ? 0.085 : 0.06}
                      fill={
                        b.kind === 'enemy'
                          ? b.isLocked
                            ? '#facc15'
                            : '#ef4444'
                          : b.kind === 'checkpoint'
                          ? '#38bdf8'
                          : '#22c55e'
                      }
                    />
                  ))}
                </svg>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
