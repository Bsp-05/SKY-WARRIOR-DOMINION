/**
 * SoundEngine — every sound in Sky Warrior Dominion, synthesized live
 * with the Web Audio API. No audio files are shipped: the jet turbine,
 * cannon, missile whoosh, explosions and UI chimes are all built from
 * oscillators and filtered white noise, so the game stays self-contained
 * and starts instantly.
 *
 * Lifecycle: construct once, call `unlock()` from a user gesture (the
 * browser will not let audio start before one), drive the engine loop
 * every frame with `updateEngine()`, and fire one-shot effects as the
 * game events happen. `dispose()` tears the context down.
 */

// ---------------------------------------------------------------------------
// Tunables — kept in one place so a sound designer can retune the mix
// without hunting through the synthesis code below.
// ---------------------------------------------------------------------------

/** Master bus level when unmuted (0..1). */
const MASTER_VOLUME = 0.42;
/** How fast the master bus fades when muting / unmuting, in seconds. */
const MUTE_FADE_SECONDS = 0.05;
/** Length of the shared white-noise buffer, in seconds. */
const NOISE_BUFFER_SECONDS = 2;
/** Engine loop smoothing time constant, in seconds. */
const ENGINE_SMOOTHING = 0.08;

// Engine drone: two detuned oscillators through a low-pass filter, plus
// a looped noise source for the turbine / afterburner roar.
const ENGINE_BASE_VOLUME = 0.14;
const ENGINE_SPEED_VOLUME = 0.14;
const ENGINE_AFTERBURNER_VOLUME = 0.16;
const ENGINE_OSC1_BASE_HZ = 64;
const ENGINE_OSC1_SPEED_HZ = 52;
const ENGINE_OSC1_AFTERBURNER_HZ = 26;
const ENGINE_OSC2_BASE_HZ = 128;
const ENGINE_OSC2_SPEED_HZ = 110;
const ENGINE_OSC2_AFTERBURNER_HZ = 55;
const ENGINE_FILTER_BASE_HZ = 260;
const ENGINE_FILTER_SPEED_HZ = 650;
const ENGINE_FILTER_AFTERBURNER_HZ = 720;
const ENGINE_NOISE_NORMAL = 0.42;
const ENGINE_NOISE_AFTERBURNER = 0.85;

// Radar lock pings: faster and higher-pitched as the lock firms up.
const LOCK_PING_MIN_PROGRESS = 0.05;
const LOCK_PING_OPEN_HZ = 880;
const LOCK_PING_SWEEP_HZ = 240;
const LOCK_PING_LOCKED_HZ = 1320;
const LOCK_PING_OPEN_INTERVAL = 0.28;
const LOCK_PING_LOCKED_INTERVAL = 0.14;

// ---------------------------------------------------------------------------
// Small synthesis helpers
// ---------------------------------------------------------------------------

interface ToneOptions {
  /** Frequency the oscillator glides down to (if any) by the end. */
  endFreq?: number;
}

/** A short envelope helper: start at `peak`, decay exponentially to silence. */
function decayEnvelope(gain: GainNode, now: number, peak: number, duration: number): void {
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
}

/** Melody helper: play `notes` in sequence, one every `stepSec`. */
function scheduleMelody(
  play: (freq: number, duration: number, type: OscillatorType, volume: number) => void,
  notes: readonly number[],
  stepSec: number,
  duration: number,
  type: OscillatorType,
  volume: number,
): void {
  notes.forEach((freq, i) => {
    setTimeout(() => play(freq, duration, type, volume), i * stepSec * 1000);
  });
}

// ---------------------------------------------------------------------------
// SoundEngine
// ---------------------------------------------------------------------------

export class SoundEngine {
  // Audio graph roots.
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Continuous engine loop nodes (created once in unlock()).
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // State.
  private muted = false;
  private initialized = false;
  private lockPingTimer = 0;

  // -- Mute ---------------------------------------------------------------

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        mute ? 0 : MASTER_VOLUME,
        this.ctx.currentTime,
        MUTE_FADE_SECONDS,
      );
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // -- Setup --------------------------------------------------------------

  /**
   * Create (or resume) the AudioContext. Must be called from a user
   * gesture the first time; afterwards it is a cheap resume-if-suspended.
   * Silently no-ops on browsers without Web Audio.
   */
  public unlock(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      master.connect(ctx.destination);
      this.masterGain = master;

      this.noiseBuffer = this.buildNoiseBuffer(ctx);
      this.buildEngineLoop(ctx, master);

      this.initialized = true;
    } catch {
      // Ignore audio initialization failures on restricted browsers.
    }
  }

  /** Two seconds of white noise, shared by every noise-based effect. */
  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufSize = ctx.sampleRate * NOISE_BUFFER_SECONDS;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /**
   * The always-on turbine: a sawtooth + triangle pair through a low-pass
   * filter, mixed with looped noise. Starts silent; `updateEngine()`
   * drives its volume / pitch / brightness every frame.
   */
  private buildEngineLoop(ctx: AudioContext, master: GainNode): void {
    const engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineGain.connect(master);
    this.engineGain = engineGain;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 1.8;
    filter.connect(engineGain);
    this.engineFilter = filter;

    // Low sawtooth growl.
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 72;
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.value = 0.28;
    osc1.connect(osc1Gain);
    osc1Gain.connect(filter);
    osc1.start();
    this.engineOsc1 = osc1;

    // Higher triangle shimmer, an octave-ish above osc1.
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 145;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.2;
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc2.start();
    this.engineOsc2 = osc2;

    // Looped noise = turbine roar / afterburner hiss.
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    noiseSrc.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.45;
    noiseSrc.connect(noiseGain);
    noiseGain.connect(filter);
    noiseSrc.start();
    this.engineNoiseGain = noiseGain;
  }

  // -- Per-frame engine drone ---------------------------------------------

  /**
   * Drive the continuous engine sound. Call every frame while playing.
   * `speedNorm` is 0..1, `lockProgress` is 0..1 (0 = no lock attempt).
   */
  public updateEngine(
    active: boolean,
    speedNorm: number,
    afterburner: boolean,
    dt: number,
    lockProgress: number,
  ): void {
    if (
      !this.ctx ||
      !this.engineGain ||
      !this.engineOsc1 ||
      !this.engineOsc2 ||
      !this.engineFilter ||
      !this.engineNoiseGain
    ) {
      return;
    }
    const now = this.ctx.currentTime;
    if (!active || this.muted) {
      this.engineGain.gain.setTargetAtTime(0, now, ENGINE_SMOOTHING);
      return;
    }

    const boost = afterburner ? 1 : 0;
    const baseVol =
      ENGINE_BASE_VOLUME + speedNorm * ENGINE_SPEED_VOLUME + boost * ENGINE_AFTERBURNER_VOLUME;
    this.engineGain.gain.setTargetAtTime(baseVol, now, ENGINE_SMOOTHING);
    this.engineOsc1.frequency.setTargetAtTime(
      ENGINE_OSC1_BASE_HZ + speedNorm * ENGINE_OSC1_SPEED_HZ + boost * ENGINE_OSC1_AFTERBURNER_HZ,
      now,
      ENGINE_SMOOTHING,
    );
    this.engineOsc2.frequency.setTargetAtTime(
      ENGINE_OSC2_BASE_HZ + speedNorm * ENGINE_OSC2_SPEED_HZ + boost * ENGINE_OSC2_AFTERBURNER_HZ,
      now,
      ENGINE_SMOOTHING,
    );
    this.engineFilter.frequency.setTargetAtTime(
      ENGINE_FILTER_BASE_HZ + speedNorm * ENGINE_FILTER_SPEED_HZ + boost * ENGINE_FILTER_AFTERBURNER_HZ,
      now,
      ENGINE_SMOOTHING,
    );
    this.engineNoiseGain.gain.setTargetAtTime(
      afterburner ? ENGINE_NOISE_AFTERBURNER : ENGINE_NOISE_NORMAL,
      now,
      ENGINE_SMOOTHING,
    );

    this.tickLockPing(lockProgress, dt);
  }

  /** Radar lock ping cadence — quicker / sharper once fully locked. */
  private tickLockPing(lockProgress: number, dt: number): void {
    if (lockProgress > LOCK_PING_MIN_PROGRESS) {
      this.lockPingTimer -= dt;
      if (this.lockPingTimer <= 0) {
        const locked = lockProgress >= 0.99;
        this.playTone(
          locked ? LOCK_PING_LOCKED_HZ : LOCK_PING_OPEN_HZ + lockProgress * LOCK_PING_SWEEP_HZ,
          locked ? 0.09 : 0.05,
          locked ? 'square' : 'sine',
          0.08,
        );
        this.lockPingTimer = locked ? LOCK_PING_LOCKED_INTERVAL : LOCK_PING_OPEN_INTERVAL;
      }
    } else {
      this.lockPingTimer = 0;
    }
  }

  // -- One-shot effects ----------------------------------------------------

  /** Shared plumbing for a burst of filtered noise. Returns its gain node. */
  private startNoiseBurst(
    filterType: BiquadFilterType,
    filterStartHz: number,
    filterEndHz: number,
    filterQ: number,
    duration: number,
  ): { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode; now: number } | null {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return null;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterStartHz, now);
    filter.frequency.exponentialRampToValueAtTime(filterEndHz, now + duration);
    filter.Q.value = filterQ;

    const gain = this.ctx.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    return { src, filter, gain, now };
  }

  /** Short band-passed noise crack with a random pitch wobble. */
  public playCannonShot(): void {
    const burst = this.startNoiseBurst('bandpass', 1200 * (0.92 + Math.random() * 0.16), 260, 1.6, 0.07);
    if (!burst) return;
    decayEnvelope(burst.gain, burst.now, 0.28, 0.08);
    burst.src.start(burst.now);
    burst.src.stop(burst.now + 0.085);
  }

  /** Rising whoosh plus a low ignition thump. */
  public playMissileLaunch(): void {
    const burst = this.startNoiseBurst('bandpass', 420, 2200, 2.2, 0.28);
    if (!burst) return;
    burst.gain.gain.setValueAtTime(0.02, burst.now);
    burst.gain.gain.linearRampToValueAtTime(0.38, burst.now + 0.06);
    burst.gain.gain.exponentialRampToValueAtTime(0.001, burst.now + 0.45);
    burst.src.start(burst.now);
    burst.src.stop(burst.now + 0.48);

    // Ignition thump underneath the whoosh.
    this.playTone(135, 0.18, 'sawtooth', 0.22, 55);
  }

  /** Big low-passed noise boom with a sub-bass drop. */
  public playExplosion(heavy = true): void {
    const dur = heavy ? 0.95 : 0.45;
    const burst = this.startNoiseBurst('lowpass', heavy ? 1100 : 800, 90, 1, dur);
    if (!burst) return;
    decayEnvelope(burst.gain, burst.now, heavy ? 0.65 : 0.35, dur);
    burst.src.start(burst.now);
    burst.src.stop(burst.now + dur + 0.02);

    this.playTone(heavy ? 95 : 130, heavy ? 0.42 : 0.22, 'sine', heavy ? 0.42 : 0.22, 28);
  }

  /** Sharp metallic tick when a shot connects. */
  public playHitImpact(): void {
    this.playTone(320 + Math.random() * 70, 0.07, 'triangle', 0.18, 120);
  }

  /** Low sawtooth thud when the player takes a hit. */
  public playPlayerDamage(): void {
    this.playTone(110, 0.2, 'sawtooth', 0.35, 45);
  }

  /** Two-note rising alarm for an incoming missile. */
  public playIncomingAlert(): void {
    if (!this.ctx || this.muted) return;
    this.playTone(960, 0.09, 'square', 0.14);
    setTimeout(() => this.playTone(1240, 0.11, 'square', 0.14), 95);
  }

  /** Bright two-note pickup chime. */
  public playCollectible(): void {
    if (!this.ctx || this.muted) return;
    this.playTone(660, 0.11, 'sine', 0.18);
    setTimeout(() => this.playTone(990, 0.16, 'sine', 0.18), 70);
  }

  /** Three-note ascending checkpoint fanfare (C–E–C). */
  public playCheckpoint(): void {
    if (!this.ctx || this.muted) return;
    this.playTone(523.25, 0.12, 'triangle', 0.2);
    setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.2), 75);
    setTimeout(() => this.playTone(1046.5, 0.22, 'triangle', 0.22), 150);
  }

  /** High-passed air rush for a barrel-roll / evade maneuver. */
  public playManeuver(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    const gain = this.ctx.createGain();
    decayEnvelope(gain, now, 0.24, 0.26);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.28);
  }

  /** Rising major arpeggio for victory. */
  public playVictory(): void {
    scheduleMelody(
      (freq, duration, type, volume) => this.playTone(freq, duration, type, volume),
      [523.25, 659.25, 783.99, 1046.5],
      0.11,
      0.28,
      'triangle',
      0.22,
    );
  }

  /** Falling minor phrase for defeat. */
  public playDefeat(): void {
    scheduleMelody(
      (freq, duration, type, volume) => this.playTone(freq, duration, type, volume),
      [330, 277.18, 220, 146.83],
      0.13,
      0.3,
      'sawtooth',
      0.18,
    );
  }

  // -- Primitive ------------------------------------------------------------

  /**
   * One oscillator with a decaying envelope, optionally gliding down to
   * `endFreq`. The workhorse every tonal effect above is built on.
   */
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number,
  ): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    const gain = this.ctx.createGain();
    decayEnvelope(gain, now, volume, duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // -- Teardown -------------------------------------------------------------

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.initialized = false;
  }
}
