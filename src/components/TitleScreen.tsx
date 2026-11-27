import React, { useEffect } from 'react';
import { DIFFICULTY_CONFIG, MISSIONS } from '../game/rules';
import type { DifficultyMode, GameMode, JetLivery } from '../game/types';

/**
 * TitleScreen — the hangar / command briefing screen shown before a run:
 * emblem + best score, audio toggle, mode / difficulty / mission / livery
 * selectors, and the Launch Sortie button.
 *
 * Keyboard rule (fixed against an accidental-launch bug): Enter / Space
 * only launches when focus is on the Launch Sortie button itself
 * (`data-start="true"`) or on nothing interactive. Pressing Enter/Space
 * while another button is focused must do nothing here — that button's
 * own click handles it.
 *
 * The bottom control hint is always visible, in two centred lines, with
 * the launch line in bold amber.
 */

interface TitleScreenProps {
  mode: GameMode;
  difficulty: DifficultyMode;
  missionIndex: number;
  livery: JetLivery;
  bestScore: number;
  muted: boolean;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (difficulty: DifficultyMode) => void;
  onSelectMission: (idx: number) => void;
  onSelectLivery: (livery: JetLivery) => void;
  onToggleMute: () => void;
  onStart: () => void;
}

// ---------------------------------------------------------------------------
// Static option data
// ---------------------------------------------------------------------------

const MODE_ITEMS: Array<{ id: GameMode; label: string; desc: string }> = [
  { id: 'missions', label: 'Combat Missions', desc: 'Tactical waves, recon checkpoints & time targets' },
  { id: 'survival', label: 'Survival Mode', desc: 'Endless escalating enemy squadrons' },
  { id: 'freeflight', label: 'Free Flight', desc: 'Unrestricted sunset patrol over islands & city' },
];

const DIFFICULTY_ITEMS: DifficultyMode[] = ['beginner', 'standard', 'ace'];

const LIVERY_ITEMS: Array<{ id: JetLivery; label: string; swatch: string }> = [
  { id: 'obsidian', label: 'Stealth Obsidian', swatch: '#2a313d' },
  { id: 'viper', label: 'Sunset Viper', swatch: '#d97706' },
  { id: 'arctic', label: 'Arctic Ghost', swatch: '#cbd5e1' },
];

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

/** Section heading inside the briefing panel. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-slate-400 mb-1.5">{children}</div>;
}

/** A segmented 3-way selector row (mode / difficulty). */
function SegmentedRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 bg-[#070b14] p-1 rounded-lg border border-slate-800">
      {children}
    </div>
  );
}

/** Wrapper for a panel section separated by a top border. */
function PanelSection({ children }: { children: React.ReactNode }) {
  return <div className="pt-2 border-t border-slate-800/90">{children}</div>;
}

/** The shield emblem next to the SKY WARRIOR wordmark. */
function Emblem() {
  return (
    <svg viewBox="0 0 64 64" className="w-11 h-11 sm:w-13 sm:h-13 shrink-0" aria-hidden="true">
      <polygon points="32,4 58,20 52,50 32,60 12,50 6,20" fill="#111827" stroke="#f59e0b" strokeWidth="2.5" />
      <polygon points="32,12 46,38 32,31 18,38" fill="#f59e0b" />
      <polygon points="32,26 52,44 32,39 12,44" fill="#e2e8f0" />
    </svg>
  );
}

/** Mission time limit, scaled by the selected difficulty. */
function missionTimeText(timeLimitSec: number, timeMult: number): string {
  const totalSec = timeLimitSec * timeMult;
  return `${Math.floor(totalSec / 60)}m ${Math.round(totalSec % 60)}s`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const TitleScreen: React.FC<TitleScreenProps> = ({
  mode,
  difficulty,
  missionIndex,
  livery,
  bestScore,
  muted,
  onSelectMode,
  onSelectDifficulty,
  onSelectMission,
  onSelectLivery,
  onToggleMute,
  onStart,
}) => {
  // Enter / Space launches only from the Launch Sortie button (data-start)
  // or from a non-interactive target — never from another focused button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        const interactive = target?.closest('button, a, input, select, textarea, [role="button"]');
        if (interactive && interactive.getAttribute('data-start') !== 'true') {
          return;
        }
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  const activeMission = MISSIONS[missionIndex] ?? MISSIONS[0];
  const activeMode = MODE_ITEMS.find((m) => m.id === mode);
  const showDifficulty = mode !== 'freeflight';
  const showMissions = mode === 'missions';

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 pointer-events-none overflow-y-auto">
      {/* Subtle left-side scrim for crisp typography contrast while keeping 3D jet clear on right */}
      <div
        className="fixed inset-y-0 left-0 w-full md:w-[54%] pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(8,12,21,0.88) 0%, rgba(8,12,21,0.68) 68%, rgba(8,12,21,0) 100%)',
        }}
      />

      {/* Top row: Emblem + Audio button */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Emblem />
          <div>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white leading-none hud-stroke">
              SKY WARRIOR
            </h1>
            <div className="flex items-center gap-2.5 mt-1 text-xs sm:text-sm font-hud tracking-[0.22em] text-amber-400">
              <span>DOMINION</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300 tracking-normal font-sans">
                Best Score {bestScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="pointer-events-auto px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0d1422]/90 border border-slate-700/80 rounded-lg hover:border-amber-500/70 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {muted ? 'Audio: Off' : 'Audio: On'}
        </button>
      </div>

      {/* Main Command Briefing Panel (Left Third) */}
      <div className="relative z-10 w-full max-w-md my-auto py-3 pointer-events-auto">
        <div className="bg-[#0b111e]/92 border border-slate-700/70 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
          {/* Mode Selector */}
          <div>
            <SectionLabel>Flight Mode</SectionLabel>
            <SegmentedRow>
              {MODE_ITEMS.map((item) => {
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMode(item.id)}
                    className={`px-1 sm:px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.label.replace(' Mode', '')}
                  </button>
                );
              })}
            </SegmentedRow>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{activeMode?.desc}</p>
          </div>

          {/* Difficulty Selector */}
          {showDifficulty && (
            <PanelSection>
              <SectionLabel>Combat Difficulty</SectionLabel>
              <SegmentedRow>
                {DIFFICULTY_ITEMS.map((d) => {
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDifficulty(d)}
                      className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {DIFFICULTY_CONFIG[d].label}
                    </button>
                  );
                })}
              </SegmentedRow>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                {DIFFICULTY_CONFIG[difficulty].desc}
              </p>
            </PanelSection>
          )}

          {/* Mission Briefing when Combat Missions active */}
          {showMissions && (
            <PanelSection>
              <SectionLabel>Operation</SectionLabel>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {MISSIONS.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMission(idx)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      missionIndex === idx
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-[#080d18] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sortie 0{idx + 1}
                  </button>
                ))}
              </div>
              <div className="text-sm font-semibold text-white">{activeMission.title}</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeMission.briefing}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs font-hud text-slate-400">
                <span>{activeMission.waves} Waves</span>
                <span aria-hidden="true">·</span>
                <span>{activeMission.checkpointCount} Bonus Rings</span>
                <span aria-hidden="true">·</span>
                <span>
                  {missionTimeText(activeMission.timeLimitSec, DIFFICULTY_CONFIG[difficulty].timeMult)}
                </span>
              </div>
            </PanelSection>
          )}

          {/* Aircraft Livery Selector */}
          <PanelSection>
            <SectionLabel>F-22X Livery</SectionLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {LIVERY_ITEMS.map((item) => {
                const active = livery === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectLivery(item.id)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-slate-800 border-amber-400 text-white'
                        : 'bg-[#080d18] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/25"
                      style={{ backgroundColor: item.swatch }}
                    />
                    <span className="truncate">{item.label.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>
          </PanelSection>

          {/* Primary Launch Action */}
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-display font-bold text-base tracking-wider uppercase rounded-lg transition-colors cursor-pointer shadow-lg"
          >
            Launch Sortie
          </button>
        </div>
      </div>

      {/* Bottom Safe-Margin Control Hint: two centered lines so the launch
          hint is never pushed off-screen by the long controls string. */}
      <div className="relative z-10 flex flex-col items-center gap-1 text-center text-xs text-slate-300/90 hud-stroke">
        <span className="font-hud">
          W/S Pitch · A/D Roll · Q/E Yaw · Space/LMB Cannon · F/RMB Missile · Wheel Throttle · T Auto-Target · Shift Boost · X Evade · C View
        </span>
        <span className="font-hud font-bold text-amber-300">Press Enter or Space to Launch</span>
      </div>
    </div>
  );
};
