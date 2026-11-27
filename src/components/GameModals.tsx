/**
 * GameModals — the full-screen overlays shown outside active play.
 *
 * Two states, both rendered as centred modal dialogs over a dimmed
 * backdrop:
 *  - `paused`   — Resume / Restart / Return to Hangar.
 *  - victory / defeat (with a RunSummary) — rank badge, three stat
 *    cards (score, kills/wave, flight time), then Next Mission
 *    (victory only, when a later mission exists), Replay / Try Again,
 *    and Main Menu.
 *
 * Any other phase renders nothing; the title screen and the in-flight
 * HUD are owned by App, not by this file.
 */
import React from 'react';
import type { GamePhase, RunSummary } from '../game/types';

interface GameModalsProps {
  phase: GamePhase;
  summary: RunSummary | null;
  canAdvanceMission: boolean;
  onResume: () => void;
  onRestart: () => void;
  onNextMission: () => void;
  onMainMenu: () => void;
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

/** The dimmed full-screen backdrop + centred dialog shell. */
function ModalShell({
  label,
  wide,
  dim = 'bg-[#060911]/80',
  children,
}: {
  label: string;
  wide?: boolean;
  dim?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`fixed inset-0 z-30 flex items-center justify-center p-4 ${dim} overflow-y-auto`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} bg-[#0b111e] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto`}
      >
        {children}
      </div>
    </div>
  );
}

/** One of the three stat cards on the result screen. */
function StatCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  valueClass: string;
}) {
  return (
    <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3">
      <div className="text-[10px] font-hud text-slate-400 uppercase">{label}</div>
      <div className={`text-lg font-hud font-bold mt-0.5 ${valueClass}`}>{value}</div>
      <div className="text-[10px] font-hud text-slate-500">{sub}</div>
    </div>
  );
}

/** Border / text colour for the rank badge, by rank letter. */
function rankBadgeStyle(rank: RunSummary['rank']): string {
  switch (rank) {
    case 'S':
      return 'border-amber-400 text-amber-300';
    case 'A':
      return 'border-emerald-400 text-emerald-300';
    case 'B':
      return 'border-sky-400 text-sky-300';
    default:
      return 'border-slate-600 text-slate-300';
  }
}

/* ------------------------------------------------------------------ */
/* Pause modal                                                         */
/* ------------------------------------------------------------------ */

function PauseModal({
  onResume,
  onRestart,
  onMainMenu,
}: Pick<GameModalsProps, 'onResume' | 'onRestart' | 'onMainMenu'>) {
  return (
    <ModalShell label="Flight Paused" dim="bg-[#060911]/75">
      <div>
        <h2 className="font-display text-2xl font-bold text-white tracking-wide">
          Sortie Paused
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Simulation held. Resume flight or reconfigure sortie.
        </p>
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onResume}
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
        >
          Resume Flight
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600 transition-colors cursor-pointer"
        >
          Restart Sortie
        </button>
        <button
          type="button"
          onClick={onMainMenu}
          className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-800/70 text-slate-300 font-medium text-sm rounded-lg border border-slate-800 transition-colors cursor-pointer"
        >
          Return to Hangar
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Victory / defeat modal                                              */
/* ------------------------------------------------------------------ */

function ResultModal({
  phase,
  summary,
  canAdvanceMission,
  onRestart,
  onNextMission,
  onMainMenu,
}: {
  phase: 'victory' | 'defeat';
  summary: RunSummary;
  canAdvanceMission: boolean;
  onRestart: () => void;
  onNextMission: () => void;
  onMainMenu: () => void;
}) {
  const isWin = phase === 'victory';
  const showNextMission = isWin && canAdvanceMission;
  // The primary action gets data-start so automated flows / tests can
  // find the "continue" button: Next Mission when it exists, else the
  // replay button.
  const replayIsPrimary = !showNextMission;

  return (
    <ModalShell label={isWin ? 'Mission Accomplished' : 'Aircraft Lost'} wide>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`text-xs font-hud font-bold tracking-[0.2em] uppercase ${
                isWin ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isWin ? 'Air Superiority Confirmed' : 'Sortie Failed'}
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-hud uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
              {summary.difficulty}
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white tracking-wide mt-1">
            {isWin ? 'Victory' : 'Defeat'}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {isWin
              ? `${summary.missionTitle} completed with full airspace control.`
              : summary.defeatReason || 'Hostile forces overwhelmed the sector.'}
          </p>
        </div>

        <div
          className={`shrink-0 w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center bg-[#070b14] ${rankBadgeStyle(summary.rank)}`}
        >
          <span className="text-[9px] font-hud uppercase tracking-wider text-slate-400">Rank</span>
          <span className="text-2xl font-display font-bold leading-none">{summary.rank}</span>
        </div>
      </div>

      {/* Mastery / Progress Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          label="Score"
          value={summary.score.toLocaleString()}
          sub={`Best ${summary.bestScore.toLocaleString()}`}
          valueClass="text-amber-400"
        />
        <StatCard
          label="Kills / Wave"
          value={
            <>
              {summary.kills} <span className="text-xs text-slate-400">W{summary.wave}</span>
            </>
          }
          sub={`Acc ${summary.accuracyPct}%`}
          valueClass="text-white"
        />
        <StatCard
          label="Flight Time"
          value={`${summary.elapsedSec}s`}
          sub={`Rings ${summary.checkpointsCleared}/${summary.checkpointsTotal}`}
          valueClass="text-sky-300"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        {showNextMission && (
          <button
            type="button"
            data-start="true"
            onClick={onNextMission}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
          >
            Next Mission
          </button>
        )}
        <button
          type="button"
          data-start={replayIsPrimary ? 'true' : undefined}
          onClick={onRestart}
          className={`flex-1 py-3 px-4 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${
            showNextMission
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
        >
          {isWin ? 'Replay' : 'Try Again'}
        </button>
        <button
          type="button"
          onClick={onMainMenu}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600 transition-colors cursor-pointer"
        >
          Main Menu
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Entry point: pick the modal for the current phase                   */
/* ------------------------------------------------------------------ */

export const GameModals: React.FC<GameModalsProps> = ({
  phase,
  summary,
  canAdvanceMission,
  onResume,
  onRestart,
  onNextMission,
  onMainMenu,
}) => {
  if (phase === 'paused') {
    return <PauseModal onResume={onResume} onRestart={onRestart} onMainMenu={onMainMenu} />;
  }

  if ((phase === 'victory' || phase === 'defeat') && summary) {
    return (
      <ResultModal
        phase={phase}
        summary={summary}
        canAdvanceMission={canAdvanceMission}
        onRestart={onRestart}
        onNextMission={onNextMission}
        onMainMenu={onMainMenu}
      />
    );
  }

  return null;
};
