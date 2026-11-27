import React, { useRef, useState } from 'react';

interface TouchControlsProps {
  missiles: number;
  maneuverReady: boolean;
  lockState: 'none' | 'acquiring' | 'locked';
  autoTargetEnabled: boolean;
  onToggleAutoTarget: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onButtonChange: (btn: 'fireGun' | 'fireMissile' | 'boost' | 'maneuver', pressed: boolean) => void;
}

type ActionButton = 'fireGun' | 'fireMissile' | 'boost' | 'maneuver';

function shapeAxis(raw: number, deadzone = 0.08): number {
  const abs = Math.abs(raw);
  if (abs <= deadzone) return 0;
  const norm = (abs - deadzone) / (1 - deadzone);
  return Math.sign(raw) * Math.pow(norm, 1.2);
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  missiles,
  maneuverReady,
  lockState,
  autoTargetEnabled,
  onToggleAutoTarget,
  onJoystickMove,
  onButtonChange,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [pressedBtns, setPressedBtns] = useState<Record<ActionButton, boolean>>({
    boost: false,
    maneuver: false,
    fireMissile: false,
    fireGun: false,
  });

  const maxRadius = 38;

  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobOffset({ x: dx, y: dy });
    // X = roll (-1..1), Y = pitch (+1 when pushing stick up, -1 down)
    onJoystickMove(shapeAxis(dx / maxRadius), shapeAxis(-dy / maxRadius));
  };

  const resetStick = () => {
    pointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const handleBtn = (btn: ActionButton, pressed: boolean) => {
    setPressedBtns((prev) => (prev[btn] === pressed ? prev : { ...prev, [btn]: pressed }));
    onButtonChange(btn, pressed);
  };

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

  const missileBorder =
    lockState === 'locked'
      ? 'border-emerald-300 ring-2 ring-emerald-400/60 bg-emerald-600/85'
      : lockState === 'acquiring'
      ? 'border-amber-300 bg-amber-600/85'
      : 'border-orange-300/70 bg-orange-600/85';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 sm:p-5 pointer-events-none"
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
        className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#090f1d]/78 border-2 border-sky-400/55 flex items-center justify-center touch-none select-none shadow-xl"
      >
        <div className="absolute inset-2.5 rounded-full border border-sky-400/20 pointer-events-none" />
        <div className="absolute w-3 h-3 rounded-full bg-sky-400/20 pointer-events-none" />
        <div
          className="w-11 h-11 rounded-full bg-sky-400/90 border-2 border-white shadow-lg pointer-events-none"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      {/* Right Ergonomic Combat Action Cluster */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
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

        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <button
            type="button"
            {...bindTouchBtn('boost')}
            className={`w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl bg-amber-600/85 border border-amber-300/70 text-white font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${
              pressedBtns.boost ? 'scale-95 bg-amber-500' : ''
            }`}
          >
            <span>BOOST</span>
          </button>

          <button
            type="button"
            disabled={!maneuverReady}
            {...bindTouchBtn('maneuver', !maneuverReady)}
            className={`w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl border font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${
              maneuverReady
                ? `bg-sky-600/85 border-sky-300/70 text-white ${pressedBtns.maneuver ? 'scale-95 bg-sky-500' : ''}`
                : 'bg-slate-800/75 border-slate-700 text-slate-400'
            }`}
          >
            <span>EVADE</span>
          </button>

          <button
            type="button"
            disabled={missiles <= 0}
            {...bindTouchBtn('fireMissile', missiles <= 0)}
            className={`w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl border text-white font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${
              missiles > 0 ? missileBorder : 'bg-slate-800/75 border-slate-700 text-slate-400'
            } ${pressedBtns.fireMissile ? 'scale-95' : ''}`}
          >
            <span>{lockState === 'locked' ? 'LOCK!' : 'MSL'}</span>
            <span className="text-[10px] opacity-90">{missiles}</span>
          </button>

          <button
            type="button"
            {...bindTouchBtn('fireGun')}
            className={`w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl bg-rose-600/90 border border-rose-300/75 text-white font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${
              pressedBtns.fireGun ? 'scale-95 bg-rose-500' : ''
            }`}
          >
            <span>FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
