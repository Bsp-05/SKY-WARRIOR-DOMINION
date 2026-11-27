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
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#060911]/75 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Flight Paused"
          className="w-full max-w-sm bg-[#0b111e] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto"
        >
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
        </div>
      </div>
    );
  }

  if ((phase === 'victory' || phase === 'defeat') && summary) {
    const isWin = phase === 'victory';
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#060911]/80 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isWin ? 'Mission Accomplished' : 'Aircraft Lost'}
          className="w-full max-w-md bg-[#0b111e] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto"
        >
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
              className={`shrink-0 w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center bg-[#070b14] ${
                summary.rank === 'S'
                  ? 'border-amber-400 text-amber-300'
                  : summary.rank === 'A'
                  ? 'border-emerald-400 text-emerald-300'
                  : summary.rank === 'B'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-slate-600 text-slate-300'
              }`}
            >
              <span className="text-[9px] font-hud uppercase tracking-wider text-slate-400">Rank</span>
              <span className="text-2xl font-display font-bold leading-none">{summary.rank}</span>
            </div>
          </div>

          {/* Mastery / Progress Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-hud text-slate-400 uppercase">Score</div>
              <div className="text-lg font-hud font-bold text-amber-400 mt-0.5">
                {summary.score.toLocaleString()}
              </div>
              <div className="text-[10px] font-hud text-slate-500">
                Best {summary.bestScore.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-hud text-slate-400 uppercase">Kills / Wave</div>
              <div className="text-lg font-hud font-bold text-white mt-0.5">
                {summary.kills} <span className="text-xs text-slate-400">W{summary.wave}</span>
              </div>
              <div className="text-[10px] font-hud text-slate-500">
                Acc {summary.accuracyPct}%
              </div>
            </div>

            <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-hud text-slate-400 uppercase">Flight Time</div>
              <div className="text-lg font-hud font-bold text-sky-300 mt-0.5">
                {summary.elapsedSec}s
              </div>
              <div className="text-[10px] font-hud text-slate-500">
                Rings {summary.checkpointsCleared}/{summary.checkpointsTotal}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {isWin && canAdvanceMission && (
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
              data-start={isWin && canAdvanceMission ? undefined : 'true'}
              onClick={onRestart}
              className={`flex-1 py-3 px-4 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${
                isWin && canAdvanceMission
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
        </div>
      </div>
    );
  }

  return null;
};
