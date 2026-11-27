export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private initialized = false;
  private lockPingTimer = 0;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.42, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public unlock(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.42;
      master.connect(ctx.destination);
      this.masterGain = master;

      // Shared white-noise buffer (2 seconds)
      const bufSize = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;

      // Continuous turbine + afterburner roar chain
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

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 72;
      const osc1Gain = ctx.createGain();
      osc1Gain.gain.value = 0.28;
      osc1.connect(osc1Gain);
      osc1Gain.connect(filter);
      osc1.start();
      this.engineOsc1 = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 145;
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.2;
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      osc2.start();
      this.engineOsc2 = osc2;

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = buf;
      noiseSrc.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.45;
      noiseSrc.connect(noiseGain);
      noiseGain.connect(filter);
      noiseSrc.start();
      this.engineNoiseGain = noiseGain;

      this.initialized = true;
    } catch {
      // Ignore audio initialization failures on restricted browsers
    }
  }

  public updateEngine(active: boolean, speedNorm: number, afterburner: boolean, dt: number, lockProgress: number): void {
    if (!this.ctx || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineNoiseGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (!active || this.muted) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
      return;
    }

    const baseVol = 0.14 + speedNorm * 0.14 + (afterburner ? 0.16 : 0);
    this.engineGain.gain.setTargetAtTime(baseVol, now, 0.08);
    this.engineOsc1.frequency.setTargetAtTime(64 + speedNorm * 52 + (afterburner ? 26 : 0), now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(128 + speedNorm * 110 + (afterburner ? 55 : 0), now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(260 + speedNorm * 650 + (afterburner ? 720 : 0), now, 0.08);
    this.engineNoiseGain.gain.setTargetAtTime(afterburner ? 0.85 : 0.42, now, 0.08);

    // Radar lock ping cadence
    if (lockProgress > 0.05) {
      this.lockPingTimer -= dt;
      if (this.lockPingTimer <= 0) {
        const locked = lockProgress >= 0.99;
        this.playTone(locked ? 1320 : 880 + lockProgress * 240, locked ? 0.09 : 0.05, locked ? 'square' : 'sine', 0.08);
        this.lockPingTimer = locked ? 0.14 : 0.28;
      }
    } else {
      this.lockPingTimer = 0;
    }
  }

  public playCannonShot(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const pitchMod = 0.92 + Math.random() * 0.16;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 * pitchMod, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + 0.07);
    filter.Q.value = 1.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.085);
  }

  public playMissileLaunch(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;

    // Noise whoosh
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.28);
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.48);

    // Ignition thump
    this.playTone(135, 0.18, 'sawtooth', 0.22, 55);
  }

  public playExplosion(heavy = true): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = heavy ? 0.95 : 0.45;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 1100 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.65 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + dur + 0.02);

    this.playTone(heavy ? 95 : 130, heavy ? 0.42 : 0.22, 'sine', heavy ? 0.42 : 0.22, 28);
  }

  public playHitImpact(): void {
    this.playTone(320 + Math.random() * 70, 0.07, 'triangle', 0.18, 120);
  }

  public playPlayerDamage(): void {
    this.playTone(110, 0.2, 'sawtooth', 0.35, 45);
  }

  public playIncomingAlert(): void {
    if (!this.ctx || this.muted) return;
    this.playTone(960, 0.09, 'square', 0.14);
    setTimeout(() => this.playTone(1240, 0.11, 'square', 0.14), 95);
  }

  public playCollectible(): void {
    if (!this.ctx || this.muted) return;
    this.playTone(660, 0.11, 'sine', 0.18);
    setTimeout(() => this.playTone(990, 0.16, 'sine', 0.18), 70);
  }

  public playCheckpoint(): void {
    if (!this.ctx || this.muted) return;
    this.playTone(523.25, 0.12, 'triangle', 0.2);
    setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.2), 75);
    setTimeout(() => this.playTone(1046.5, 0.22, 'triangle', 0.22), 150);
  }

  public playManeuver(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.28);
  }

  public playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.28, 'triangle', 0.22), i * 110);
    });
  }

  public playDefeat(): void {
    const notes = [330, 277.18, 220, 146.83];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.3, 'sawtooth', 0.18), i * 130);
    });
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number
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
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.initialized = false;
  }
}
