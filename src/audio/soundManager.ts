/**
 * Abyssal Depths - Procedural Web Audio Sound Engine
 * Zero external audio files; all synthesized via Web Audio API oscillators and noise buffers.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private isStarted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio() {
    this.initContext();
    if (!this.isStarted && this.ctx) {
      this.isStarted = true;
      this.startDungeonAmbience();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private startDungeonAmbience() {
    if (!this.ctx || this.ambientGain) return;

    try {
      // Create ambient low rumble for cavern atmosphere
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleFilter = this.ctx.createBiquadFilter();
      this.ambientGain = this.ctx.createGain();

      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      // LFO for cavern wind/dungeon breath
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
      lfo.connect(rumbleOsc.frequency);
      lfo.start();

      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);

      rumbleOsc.connect(rumbleFilter);
      rumbleFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      rumbleOsc.start();
    } catch {
      // Audio autoplay policy handled gracefully
    }
  }

  public playSwordSwing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore audio error
    }
  }

  public playHitSound(isCrit: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Heavy metal clank / blade impact
      const osc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isCrit ? 680 : 440, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      metalGain.gain.setValueAtTime(0.35, now);
      metalGain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

      // White noise burst for crunch
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(isCrit ? 2200 : 1400, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(metalGain);
      metalGain.connect(this.ctx.destination);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
      noise.start(now);
      noise.stop(now + 0.12);
    } catch {
      // Ignore audio error
    }
  }

  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio error
    }
  }

  public playSkeletonAttack() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore audio error
    }
  }

  public playBoneCrumble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Multi-tap bone rattle
      for (let i = 0; i < 4; i++) {
        const timeOffset = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500 + Math.random() * 300, timeOffset);
        osc.frequency.exponentialRampToValueAtTime(120, timeOffset + 0.05);

        gain.gain.setValueAtTime(0.25, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, timeOffset + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.06);
      }
    } catch {
      // Ignore audio error
    }
  }

  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [293.66, 369.99, 440.0, 587.33]; // D, F#, A, D'
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const startTime = now + idx * 0.16;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch {
      // Ignore audio error
    }
  }

  public playDash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore audio error
    }
  }
}

export const soundManager = new SoundManager();
