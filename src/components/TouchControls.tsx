/**
 * TouchControls — the mobile flight controls.
 *
 * Left side: a virtual flight stick (pointer-captured, clamped to a
 * circle, dead-zoned and eased before it reaches the engine).
 * Right side: a compact 2×2 combat cluster — BOOST, EVADE, missile
 * (MSL, with lock state and remaining count) and gun (FIRE / COOL
 * when overheated) — plus an AUTO TARGET toggle.
 *
 * Short-viewport compaction (phones in landscape, innerHeight < 520):
 * the stick and buttons shrink, gaps tighten, and the redundant
 * AUTO TARGET button is hidden here because the HUD already exposes
 * the same toggle — the cluster must not crowd the stick.
 */
import React, { useEffect, useRef, useState } from 'react';

interface TouchControlsProps {
  missiles: number;
  maneuverReady: boolean;
  gunOverheated: boolean;
  lockState: 'none' | 'acquiring' | 'locked';
  autoTargetEnabled: boolean;
  onToggleAutoTarget: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onButtonChange: (btn: 'fireGun' | 'fireMissile' | 'boost' | 'maneuver', pressed: boolean) => void;
}

type ActionButton = 'fireGun' | 'fireMissile' | 'boost' | 'maneuver';

/** Viewport height below which the compact landscape layout applies. */
const SHORT_VIEWPORT_HEIGHT = 520;

/** Stick travel (px) from centre to rim, normal vs. compact layout. */
const STICK_RADIUS = 38;
const STICK_RADIUS_SHORT = 31;

/** Input below this magnitude is treated as centred (stick drift). */
const STICK_DEADZONE = 0.08;

/** Response curve exponent — values > 1 make fine aim near centre. */
const STICK_CURVE = 1.2;

/** Initial pressed state: every action button released. */
const ALL_RELEASED: Record<ActionButton, boolean> = {
  boost: false,
  maneuver: false,
  fireMissile: false,
  fireGun: false,
};

/**
 * Shape one stick axis: apply the deadzone, renormalise the remainder
 * to 0..1, then ease it so small deflections stay precise.
 */
function shapeAxis(raw: number, deadzone = STICK_DEADZONE): number {
  const abs = Math.abs(raw);
  if (abs <= deadzone) return 0;
  const norm = (abs - deadzone) / (1 - deadzone);
  return Math.sign(raw) * Math.pow(norm, STICK_CURVE);
}

/** Clamp a (dx, dy) offset to a circle of the given radius. */
function clampToRadius(dx: number, dy: number, radius: number): { x: number; y: number } {
  const dist = Math.hypot(dx, dy);
  if (dist <= radius) return { x: dx, y: dy };
  return { x: (dx / dist) * radius, y: (dy / dist) * radius };
}

/** Border / background for the missile button, driven by lock state. */
function missileButtonStyle(lockState: TouchControlsProps['lockState']): string {
  if (lockState === 'locked') {
    return 'border-emerald-300 ring-2 ring-emerald-400/60 bg-emerald-600/85';
  }
  if (lockState === 'acquiring') {
    return 'border-amber-300 bg-amber-600/85';
  }
  return 'border-orange-300/70 bg-orange-600/85';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  missiles,
  maneuverReady,
  gunOverheated,
  lockState,
  autoTargetEnabled,
  onToggleAutoTarget,
  onJoystickMove,
  onButtonChange,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [shortViewport, setShortViewport] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerHeight < SHORT_VIEWPORT_HEIGHT
  );
  const [pressedBtns, setPressedBtns] = useState<Record<ActionButton, boolean>>(ALL_RELEASED);

  // Track the short-viewport breakpoint live as the device rotates.
  useEffect(() => {
    const onResize = () => setShortViewport(window.innerHeight < SHORT_VIEWPORT_HEIGHT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const maxRadius = shortViewport ? STICK_RADIUS_SHORT : STICK_RADIUS;

  /** Convert a pointer position into a clamped knob offset + engine axes. */
  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clamped = clampToRadius(clientX - cx, clientY - cy, maxRadius);
    setKnobOffset(clamped);
    // X = roll (-1..1), Y = pitch (+1 when pushing stick up, -1 down)
    onJoystickMove(shapeAxis(clamped.x / maxRadius), shapeAxis(-clamped.y / maxRadius));
  };

  /** Release the stick: forget the pointer, centre the knob, zero axes. */
  const resetStick = () => {
    pointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  /** Record a button press locally (for the pressed visual) and forward it. */
  const handleBtn = (btn: ActionButton, pressed: boolean) => {
    setPressedBtns((prev) => (prev[btn] === pressed ? prev : { ...prev, [btn]: pressed }));
    onButtonChange(btn, pressed);
  };

  /**
   * Pointer handlers for one action button. A disabled button ignores
   * press-down entirely; release always clears the pressed state so a
   * button can never stick "on" if it becomes disabled mid-press.
   */
  const bindTouchBtn = (btn: ActionButton, disabled = false) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      handleBtn(btn, true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      handleBtn(btn, false);
    },
    onPointerCancel: () => handleBtn(btn, false),
  });

  // -- Derived layout / style classes (all depend on shortViewport). ----
  const missileBorder = missileButtonStyle(lockState);
  const btnSizeClass = shortViewport
    ? 'w-[58px] h-[40px]'
    : 'w-[62px] h-[50px] sm:w-[70px] sm:h-[56px]';
  const baseBtnClass =
    `${btnSizeClass} rounded-xl border font-hud font-bold text-[11px] sm:text-xs ` +
    'flex flex-col items-center justify-center touch-none cursor-pointer transition-transform';
  const pressedClass = 'scale-95';

  const missilesAvailable = missiles > 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 flex items-end justify-between pointer-events-none ${
        shortViewport ? 'px-3 py-2' : 'p-3 sm:p-5'
      }`}
      data-testid="touch-controls"
    >
      {/* Left Virtual Flight Stick */}
      <div
        ref={padRef}
        role="slider"
        aria-label="Flight Stick"
        aria-valuetext="Virtual flight joystick"
        onPointerDown={(e) => {
          e.preventDefault();
          pointerIdRef.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointerIdRef.current !== e.pointerId) return;
          updateStick(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (pointerIdRef.current === e.pointerId) resetStick();
        }}
        onPointerCancel={resetStick}
        className={`pointer-events-auto relative rounded-full bg-[#090f1d]/78 border-2 border-sky-400/55 flex items-center justify-center touch-none select-none shadow-xl ${
          shortViewport ? 'w-24 h-24' : 'w-28 h-28 sm:w-32 sm:h-32'
        }`}
      >
        <div className="absolute inset-2.5 rounded-full border border-sky-400/20 pointer-events-none" />
        <div className="absolute w-3 h-3 rounded-full bg-sky-400/20 pointer-events-none" />
        <div
          className={`rounded-full bg-sky-400/90 border-2 border-white shadow-lg pointer-events-none ${
            shortViewport ? 'w-9 h-9' : 'w-11 h-11'
          }`}
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      {/* Right Ergonomic Combat Action Cluster */}
      <div className={`pointer-events-auto flex flex-col items-end ${shortViewport ? 'gap-1.5' : 'gap-2'}`}>
        {/* Hidden on short viewports: the HUD already has this toggle,
            and the cluster must stay compact in landscape. */}
        {!shortViewport && (
          <button
            type="button"
            aria-pressed={autoTargetEnabled}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleAutoTarget();
            }}
            className={`h-8 px-3 rounded-lg border font-hud font-bold text-[10px] sm:text-[11px] tracking-wider touch-none cursor-pointer transition-colors whitespace-nowrap ${
              autoTargetEnabled
                ? 'bg-emerald-600/85 border-emerald-300/80 text-white'
                : 'bg-[#090f1d]/85 border-slate-600 text-slate-300'
            }`}
          >
            AUTO TARGET: {autoTargetEnabled ? 'ON' : 'OFF'}
          </button>
        )}

        <div className={`grid grid-cols-2 ${shortViewport ? 'gap-1.5' : 'gap-2 sm:gap-2.5'}`}>
          <button
            type="button"
            {...bindTouchBtn('boost')}
            className={`${baseBtnClass} bg-amber-600/85 border-amber-300/70 text-white ${
              pressedBtns.boost ? `${pressedClass} bg-amber-500` : ''
            }`}
          >
            <span>BOOST</span>
          </button>

          <button
            type="button"
            disabled={!maneuverReady}
            {...bindTouchBtn('maneuver', !maneuverReady)}
            className={`${baseBtnClass} ${
              maneuverReady
                ? `bg-sky-600/85 border-sky-300/70 text-white ${pressedBtns.maneuver ? `${pressedClass} bg-sky-500` : ''}`
                : 'bg-slate-800/75 border-slate-700 text-slate-400'
            }`}
          >
            <span>EVADE</span>
          </button>

          <button
            type="button"
            disabled={!missilesAvailable}
            {...bindTouchBtn('fireMissile', !missilesAvailable)}
            className={`${baseBtnClass} text-white ${
              missilesAvailable ? missileBorder : 'bg-slate-800/75 border-slate-700 text-slate-400'
            } ${pressedBtns.fireMissile ? pressedClass : ''}`}
          >
            <span>{lockState === 'locked' ? 'LOCK!' : 'MSL'}</span>
            <span className="text-[10px] opacity-90 leading-none">{missiles}</span>
          </button>

          <button
            type="button"
            {...bindTouchBtn('fireGun')}
            className={`${baseBtnClass} text-white ${
              gunOverheated
                ? 'bg-slate-800/85 border-rose-400/70 text-rose-300'
                : 'bg-rose-600/90 border-rose-300/75'
            } ${pressedBtns.fireGun ? `${pressedClass} bg-rose-500` : ''}`}
          >
            <span>{gunOverheated ? 'COOL' : 'FIRE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
