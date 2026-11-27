// src/game/audio.ts
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
/** Master bus level when unmuted (0..1). */
var MASTER_VOLUME = .42;
/** How fast the master bus fades when muting / unmuting, in seconds. */
var MUTE_FADE_SECONDS = .05;
/** Length of the shared white-noise buffer, in seconds. */
var NOISE_BUFFER_SECONDS = 2;
/** Engine loop smoothing time constant, in seconds. */
var ENGINE_SMOOTHING = .08;
var ENGINE_BASE_VOLUME = .14;
var ENGINE_SPEED_VOLUME = .14;
var ENGINE_AFTERBURNER_VOLUME = .16;
var ENGINE_OSC1_BASE_HZ = 64;
var ENGINE_OSC1_SPEED_HZ = 52;
var ENGINE_OSC1_AFTERBURNER_HZ = 26;
var ENGINE_OSC2_BASE_HZ = 128;
var ENGINE_OSC2_SPEED_HZ = 110;
var ENGINE_OSC2_AFTERBURNER_HZ = 55;
var ENGINE_FILTER_BASE_HZ = 260;
var ENGINE_FILTER_SPEED_HZ = 650;
var ENGINE_FILTER_AFTERBURNER_HZ = 720;
var ENGINE_NOISE_NORMAL = .42;
var ENGINE_NOISE_AFTERBURNER = .85;
var LOCK_PING_MIN_PROGRESS = .05;
var LOCK_PING_OPEN_HZ = 880;
var LOCK_PING_SWEEP_HZ = 240;
var LOCK_PING_LOCKED_HZ = 1320;
var LOCK_PING_OPEN_INTERVAL = .28;
var LOCK_PING_LOCKED_INTERVAL = .14;
/** A short envelope helper: start at `peak`, decay exponentially to silence. */
function decayEnvelope(gain, now, peak, duration) {
	gain.gain.setValueAtTime(peak, now);
	gain.gain.exponentialRampToValueAtTime(.001, now + duration);
}
/** Melody helper: play `notes` in sequence, one every `stepSec`. */
function scheduleMelody(play, notes, stepSec, duration, type, volume) {
	notes.forEach((freq, i) => {
		setTimeout(() => play(freq, duration, type, volume), i * stepSec * 1e3);
	});
}
var SoundEngine = class {
	constructor() {
		this.ctx = null;
		this.masterGain = null;
		this.noiseBuffer = null;
		this.engineOsc1 = null;
		this.engineOsc2 = null;
		this.engineNoiseGain = null;
		this.engineFilter = null;
		this.engineGain = null;
		this.muted = false;
		this.initialized = false;
		this.lockPingTimer = 0;
	}
	isMuted() {
		return this.muted;
	}
	setMuted(mute) {
		this.muted = mute;
		if (this.masterGain && this.ctx) this.masterGain.gain.setTargetAtTime(mute ? 0 : MASTER_VOLUME, this.ctx.currentTime, MUTE_FADE_SECONDS);
	}
	toggleMute() {
		this.setMuted(!this.muted);
		return this.muted;
	}
	/**
	* Create (or resume) the AudioContext. Must be called from a user
	* gesture the first time; afterwards it is a cheap resume-if-suspended.
	* Silently no-ops on browsers without Web Audio.
	*/
	unlock() {
		if (this.initialized) {
			if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
			return;
		}
		const AudioCtx = window.AudioContext || window.webkitAudioContext;
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
		} catch {}
	}
	/** Two seconds of white noise, shared by every noise-based effect. */
	buildNoiseBuffer(ctx) {
		const bufSize = ctx.sampleRate * NOISE_BUFFER_SECONDS;
		const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
		return buf;
	}
	/**
	* The always-on turbine: a sawtooth + triangle pair through a low-pass
	* filter, mixed with looped noise. Starts silent; `updateEngine()`
	* drives its volume / pitch / brightness every frame.
	*/
	buildEngineLoop(ctx, master) {
		const engineGain = ctx.createGain();
		engineGain.gain.value = 0;
		engineGain.connect(master);
		this.engineGain = engineGain;
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 320;
		filter.Q.value = 1.8;
		filter.connect(engineGain);
		this.engineFilter = filter;
		const osc1 = ctx.createOscillator();
		osc1.type = "sawtooth";
		osc1.frequency.value = 72;
		const osc1Gain = ctx.createGain();
		osc1Gain.gain.value = .28;
		osc1.connect(osc1Gain);
		osc1Gain.connect(filter);
		osc1.start();
		this.engineOsc1 = osc1;
		const osc2 = ctx.createOscillator();
		osc2.type = "triangle";
		osc2.frequency.value = 145;
		const osc2Gain = ctx.createGain();
		osc2Gain.gain.value = .2;
		osc2.connect(osc2Gain);
		osc2Gain.connect(filter);
		osc2.start();
		this.engineOsc2 = osc2;
		const noiseSrc = ctx.createBufferSource();
		noiseSrc.buffer = this.noiseBuffer;
		noiseSrc.loop = true;
		const noiseGain = ctx.createGain();
		noiseGain.gain.value = .45;
		noiseSrc.connect(noiseGain);
		noiseGain.connect(filter);
		noiseSrc.start();
		this.engineNoiseGain = noiseGain;
	}
	/**
	* Drive the continuous engine sound. Call every frame while playing.
	* `speedNorm` is 0..1, `lockProgress` is 0..1 (0 = no lock attempt).
	*/
	updateEngine(active, speedNorm, afterburner, dt, lockProgress) {
		if (!this.ctx || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineNoiseGain) return;
		const now = this.ctx.currentTime;
		if (!active || this.muted) {
			this.engineGain.gain.setTargetAtTime(0, now, ENGINE_SMOOTHING);
			return;
		}
		const boost = afterburner ? 1 : 0;
		const baseVol = ENGINE_BASE_VOLUME + speedNorm * ENGINE_SPEED_VOLUME + boost * ENGINE_AFTERBURNER_VOLUME;
		this.engineGain.gain.setTargetAtTime(baseVol, now, ENGINE_SMOOTHING);
		this.engineOsc1.frequency.setTargetAtTime(ENGINE_OSC1_BASE_HZ + speedNorm * ENGINE_OSC1_SPEED_HZ + boost * ENGINE_OSC1_AFTERBURNER_HZ, now, ENGINE_SMOOTHING);
		this.engineOsc2.frequency.setTargetAtTime(ENGINE_OSC2_BASE_HZ + speedNorm * ENGINE_OSC2_SPEED_HZ + boost * ENGINE_OSC2_AFTERBURNER_HZ, now, ENGINE_SMOOTHING);
		this.engineFilter.frequency.setTargetAtTime(ENGINE_FILTER_BASE_HZ + speedNorm * ENGINE_FILTER_SPEED_HZ + boost * ENGINE_FILTER_AFTERBURNER_HZ, now, ENGINE_SMOOTHING);
		this.engineNoiseGain.gain.setTargetAtTime(afterburner ? ENGINE_NOISE_AFTERBURNER : ENGINE_NOISE_NORMAL, now, ENGINE_SMOOTHING);
		this.tickLockPing(lockProgress, dt);
	}
	/** Radar lock ping cadence — quicker / sharper once fully locked. */
	tickLockPing(lockProgress, dt) {
		if (lockProgress > LOCK_PING_MIN_PROGRESS) {
			this.lockPingTimer -= dt;
			if (this.lockPingTimer <= 0) {
				const locked = lockProgress >= .99;
				this.playTone(locked ? LOCK_PING_LOCKED_HZ : LOCK_PING_OPEN_HZ + lockProgress * LOCK_PING_SWEEP_HZ, locked ? .09 : .05, locked ? "square" : "sine", .08);
				this.lockPingTimer = locked ? LOCK_PING_LOCKED_INTERVAL : LOCK_PING_OPEN_INTERVAL;
			}
		} else this.lockPingTimer = 0;
	}
	/** Shared plumbing for a burst of filtered noise. Returns its gain node. */
	startNoiseBurst(filterType, filterStartHz, filterEndHz, filterQ, duration) {
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
		return {
			src,
			filter,
			gain,
			now
		};
	}
	/** Short band-passed noise crack with a random pitch wobble. */
	playCannonShot() {
		const burst = this.startNoiseBurst("bandpass", 1200 * (.92 + Math.random() * .16), 260, 1.6, .07);
		if (!burst) return;
		decayEnvelope(burst.gain, burst.now, .28, .08);
		burst.src.start(burst.now);
		burst.src.stop(burst.now + .085);
	}
	/** Rising whoosh plus a low ignition thump. */
	playMissileLaunch() {
		const burst = this.startNoiseBurst("bandpass", 420, 2200, 2.2, .28);
		if (!burst) return;
		burst.gain.gain.setValueAtTime(.02, burst.now);
		burst.gain.gain.linearRampToValueAtTime(.38, burst.now + .06);
		burst.gain.gain.exponentialRampToValueAtTime(.001, burst.now + .45);
		burst.src.start(burst.now);
		burst.src.stop(burst.now + .48);
		this.playTone(135, .18, "sawtooth", .22, 55);
	}
	/** Big low-passed noise boom with a sub-bass drop. */
	playExplosion(heavy = true) {
		const dur = heavy ? .95 : .45;
		const burst = this.startNoiseBurst("lowpass", heavy ? 1100 : 800, 90, 1, dur);
		if (!burst) return;
		decayEnvelope(burst.gain, burst.now, heavy ? .65 : .35, dur);
		burst.src.start(burst.now);
		burst.src.stop(burst.now + dur + .02);
		this.playTone(heavy ? 95 : 130, heavy ? .42 : .22, "sine", heavy ? .42 : .22, 28);
	}
	/** Sharp metallic tick when a shot connects. */
	playHitImpact() {
		this.playTone(320 + Math.random() * 70, .07, "triangle", .18, 120);
	}
	/** Low sawtooth thud when the player takes a hit. */
	playPlayerDamage() {
		this.playTone(110, .2, "sawtooth", .35, 45);
	}
	/** Two-note rising alarm for an incoming missile. */
	playIncomingAlert() {
		if (!this.ctx || this.muted) return;
		this.playTone(960, .09, "square", .14);
		setTimeout(() => this.playTone(1240, .11, "square", .14), 95);
	}
	/** Bright two-note pickup chime. */
	playCollectible() {
		if (!this.ctx || this.muted) return;
		this.playTone(660, .11, "sine", .18);
		setTimeout(() => this.playTone(990, .16, "sine", .18), 70);
	}
	/** Three-note ascending checkpoint fanfare (C–E–C). */
	playCheckpoint() {
		if (!this.ctx || this.muted) return;
		this.playTone(523.25, .12, "triangle", .2);
		setTimeout(() => this.playTone(659.25, .12, "triangle", .2), 75);
		setTimeout(() => this.playTone(1046.5, .22, "triangle", .22), 150);
	}
	/** High-passed air rush for a barrel-roll / evade maneuver. */
	playManeuver() {
		if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
		const now = this.ctx.currentTime;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noiseBuffer;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.setValueAtTime(1400, now);
		const gain = this.ctx.createGain();
		decayEnvelope(gain, now, .24, .26);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(this.masterGain);
		src.start(now);
		src.stop(now + .28);
	}
	/** Rising major arpeggio for victory. */
	playVictory() {
		scheduleMelody((freq, duration, type, volume) => this.playTone(freq, duration, type, volume), [
			523.25,
			659.25,
			783.99,
			1046.5
		], .11, .28, "triangle", .22);
	}
	/** Falling minor phrase for defeat. */
	playDefeat() {
		scheduleMelody((freq, duration, type, volume) => this.playTone(freq, duration, type, volume), [
			330,
			277.18,
			220,
			146.83
		], .13, .3, "sawtooth", .18);
	}
	/**
	* One oscillator with a decaying envelope, optionally gliding down to
	* `endFreq`. The workhorse every tonal effect above is built on.
	*/
	playTone(freq, duration, type, volume, endFreq) {
		if (!this.ctx || !this.masterGain || this.muted) return;
		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, now);
		if (endFreq !== void 0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
		const gain = this.ctx.createGain();
		decayEnvelope(gain, now, volume, duration);
		osc.connect(gain);
		gain.connect(this.masterGain);
		osc.start(now);
		osc.stop(now + duration + .02);
	}
	dispose() {
		if (this.ctx) {
			this.ctx.close().catch(() => {});
			this.ctx = null;
		}
		this.initialized = false;
	}
};
export { SoundEngine as t };
