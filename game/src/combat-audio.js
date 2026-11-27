// src/game/audio.ts
var SoundEngine = class {
	constructor() {
		this.ctx = null;
		this.masterGain = null;
		this.engineOsc1 = null;
		this.engineOsc2 = null;
		this.engineNoiseGain = null;
		this.engineFilter = null;
		this.engineGain = null;
		this.noiseBuffer = null;
		this.muted = false;
		this.initialized = false;
		this.lockPingTimer = 0;
	}
	isMuted() {
		return this.muted;
	}
	setMuted(mute) {
		this.muted = mute;
		if (this.masterGain && this.ctx) this.masterGain.gain.setTargetAtTime(mute ? 0 : .42, this.ctx.currentTime, .05);
	}
	toggleMute() {
		this.setMuted(!this.muted);
		return this.muted;
	}
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
			master.gain.value = this.muted ? 0 : .42;
			master.connect(ctx.destination);
			this.masterGain = master;
			const bufSize = ctx.sampleRate * 2;
			const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
			const data = buf.getChannelData(0);
			for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
			this.noiseBuffer = buf;
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
			noiseSrc.buffer = buf;
			noiseSrc.loop = true;
			const noiseGain = ctx.createGain();
			noiseGain.gain.value = .45;
			noiseSrc.connect(noiseGain);
			noiseGain.connect(filter);
			noiseSrc.start();
			this.engineNoiseGain = noiseGain;
			this.initialized = true;
		} catch {}
	}
	updateEngine(active, speedNorm, afterburner, dt, lockProgress) {
		if (!this.ctx || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineNoiseGain) return;
		const now = this.ctx.currentTime;
		if (!active || this.muted) {
			this.engineGain.gain.setTargetAtTime(0, now, .08);
			return;
		}
		const baseVol = .14 + speedNorm * .14 + (afterburner ? .16 : 0);
		this.engineGain.gain.setTargetAtTime(baseVol, now, .08);
		this.engineOsc1.frequency.setTargetAtTime(64 + speedNorm * 52 + (afterburner ? 26 : 0), now, .08);
		this.engineOsc2.frequency.setTargetAtTime(128 + speedNorm * 110 + (afterburner ? 55 : 0), now, .08);
		this.engineFilter.frequency.setTargetAtTime(260 + speedNorm * 650 + (afterburner ? 720 : 0), now, .08);
		this.engineNoiseGain.gain.setTargetAtTime(afterburner ? .85 : .42, now, .08);
		if (lockProgress > .05) {
			this.lockPingTimer -= dt;
			if (this.lockPingTimer <= 0) {
				const locked = lockProgress >= .99;
				this.playTone(locked ? 1320 : 880 + lockProgress * 240, locked ? .09 : .05, locked ? "square" : "sine", .08);
				this.lockPingTimer = locked ? .14 : .28;
			}
		} else this.lockPingTimer = 0;
	}
	playCannonShot() {
		if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
		const now = this.ctx.currentTime;
		const pitchMod = .92 + Math.random() * .16;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noiseBuffer;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.setValueAtTime(1200 * pitchMod, now);
		filter.frequency.exponentialRampToValueAtTime(260, now + .07);
		filter.Q.value = 1.6;
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(.28, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .08);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(this.masterGain);
		src.start(now);
		src.stop(now + .085);
	}
	playMissileLaunch() {
		if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
		const now = this.ctx.currentTime;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noiseBuffer;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.setValueAtTime(420, now);
		filter.frequency.exponentialRampToValueAtTime(2200, now + .28);
		filter.Q.value = 2.2;
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(.02, now);
		gain.gain.linearRampToValueAtTime(.38, now + .06);
		gain.gain.exponentialRampToValueAtTime(.001, now + .45);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(this.masterGain);
		src.start(now);
		src.stop(now + .48);
		this.playTone(135, .18, "sawtooth", .22, 55);
	}
	playExplosion(heavy = true) {
		if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
		const now = this.ctx.currentTime;
		const dur = heavy ? .95 : .45;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noiseBuffer;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(heavy ? 1100 : 800, now);
		filter.frequency.exponentialRampToValueAtTime(90, now + dur);
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(heavy ? .65 : .35, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + dur);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(this.masterGain);
		src.start(now);
		src.stop(now + dur + .02);
		this.playTone(heavy ? 95 : 130, heavy ? .42 : .22, "sine", heavy ? .42 : .22, 28);
	}
	playHitImpact() {
		this.playTone(320 + Math.random() * 70, .07, "triangle", .18, 120);
	}
	playPlayerDamage() {
		this.playTone(110, .2, "sawtooth", .35, 45);
	}
	playIncomingAlert() {
		if (!this.ctx || this.muted) return;
		this.playTone(960, .09, "square", .14);
		setTimeout(() => this.playTone(1240, .11, "square", .14), 95);
	}
	playCollectible() {
		if (!this.ctx || this.muted) return;
		this.playTone(660, .11, "sine", .18);
		setTimeout(() => this.playTone(990, .16, "sine", .18), 70);
	}
	playCheckpoint() {
		if (!this.ctx || this.muted) return;
		this.playTone(523.25, .12, "triangle", .2);
		setTimeout(() => this.playTone(659.25, .12, "triangle", .2), 75);
		setTimeout(() => this.playTone(1046.5, .22, "triangle", .22), 150);
	}
	playManeuver() {
		if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
		const now = this.ctx.currentTime;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noiseBuffer;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.setValueAtTime(1400, now);
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(.24, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .26);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(this.masterGain);
		src.start(now);
		src.stop(now + .28);
	}
	playVictory() {
		[
			523.25,
			659.25,
			783.99,
			1046.5
		].forEach((n, i) => {
			setTimeout(() => this.playTone(n, .28, "triangle", .22), i * 110);
		});
	}
	playDefeat() {
		[
			330,
			277.18,
			220,
			146.83
		].forEach((n, i) => {
			setTimeout(() => this.playTone(n, .3, "sawtooth", .18), i * 130);
		});
	}
	playTone(freq, duration, type, volume, endFreq) {
		if (!this.ctx || !this.masterGain || this.muted) return;
		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, now);
		if (endFreq !== void 0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(volume, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + duration);
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
