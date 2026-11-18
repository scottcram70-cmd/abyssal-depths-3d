/**
 * Abyssal Depths - Sound & Dynamic Soundtrack Engine
 * Preserves synthesized Web Audio combat SFX while managing the 5 MP3 dungeon tracks
 * with smooth ~2.4s crossfades, seamless looping, pause/resume continuity, and mute sync.
 */

import type { EnemyRuntime, RoomId } from '../types/game';

export type MusicTrackId =
  | 'explore'
  | 'danger'
  | 'combat'
  | 'guardian'
  | 'overlord';

export interface MusicStateInput {
  currentRoom: RoomId;
  playerPos: { x: number; z: number };
  playerHp: number;
  playerMaxHp: number;
  timeSinceCombatAction: number;
  dungeonCompleted: boolean;
  playerDefeated: boolean;
  enemies: Pick<EnemyRuntime, 'roomId' | 'variant' | 'x' | 'z' | 'hp' | 'state'>[];
}

export function getDesiredMusicTrack({
  currentRoom,
  playerPos,
  playerHp,
  playerMaxHp,
  timeSinceCombatAction,
  dungeonCompleted,
  playerDefeated,
  enemies,
}: MusicStateInput): MusicTrackId {
  if (dungeonCompleted || playerDefeated) {
    return 'explore';
  }

  let hasActiveRegularCombat = false;
  let hasNearbyRegularEnemy = false;
  let hasLivingEnemyInRoom = false;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.hp <= 0) continue;

    const dist = Math.hypot(e.x - playerPos.x, e.z - playerPos.z);
    const isAggroed =
      e.state === 'chase' || e.state === 'attack' || e.state === 'hurt';

    // 1. Final encounter in Room 8 (Throne of Escape)
    if (e.roomId === 8 && (currentRoom === 8 || isAggroed || dist <= 11.5)) {
      return 'overlord';
    }

    // 2. Guardian (Room 3) and Mini-Boss Dreadlord (Room 7)
    if (
      (e.variant === 'guardian' || e.variant === 'dreadlord') &&
      (currentRoom === e.roomId || isAggroed || dist <= 11.5)
    ) {
      return 'guardian';
    }

    if (e.roomId === currentRoom) {
      hasLivingEnemyInRoom = true;
    }

    if (isAggroed || (timeSinceCombatAction < 2.2 && dist <= 9.0)) {
      hasActiveRegularCombat = true;
    } else if (dist <= 6.6) {
      hasNearbyRegularEnemy = true;
    }
  }

  if (hasActiveRegularCombat) {
    return 'combat';
  }

  const lowHealthInDanger =
    playerMaxHp > 0 && playerHp / playerMaxHp <= 0.35 && hasLivingEnemyInRoom;
  const inDeepDangerRoom =
    currentRoom >= 4 && currentRoom <= 6 && hasLivingEnemyInRoom;

  if (hasNearbyRegularEnemy || inDeepDangerRoom || lowHealthInDanger) {
    return 'danger';
  }

  return 'explore';
}

const MUSIC_FILENAMES: Record<MusicTrackId, string> = {
  explore: 'explore.mp3',
  danger: 'danger.mp3',
  combat: 'combat.mp3',
  guardian: 'guardian.mp3',
  overlord: 'overlord.mp3',
};

const MUSIC_MAX_GAIN = 0.24;
const CROSSFADE_DURATION_SEC = 2.4;

export function resolveMusicUrl(track: MusicTrackId): string {
  const filename = MUSIC_FILENAMES[track];
  const base =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined' &&
    typeof import.meta.env.BASE_URL === 'string' &&
    import.meta.env.BASE_URL.length > 0
      ? import.meta.env.BASE_URL
      : '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (
    normalizedBase === '/' &&
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/abyssal-depths-3d/')
  ) {
    return `/abyssal-depths-3d/music/${filename}`;
  }

  return `${normalizedBase}music/${filename}`;
}

interface MusicDeck {
  id: MusicTrackId;
  url: string;
  audio: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  currentWeight: number;
  targetWeight: number;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private isStarted: boolean = false;

  private musicMasterGain: GainNode | null = null;
  private decks: Map<MusicTrackId, MusicDeck> = new Map();
  private currentTrack: MusicTrackId | null = null;
  private isMusicStarted: boolean = false;
  private isMusicPaused: boolean = false;
  private fadeRafId: number | null = null;
  private lastFadeTimeMs: number = 0;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore autoplay resume rejection until next user gesture
      });
    }
    this.connectMusicDecksToContext();
  }

  private ensureMusicMasterGain() {
    if (!this.ctx || this.musicMasterGain) return;
    this.musicMasterGain = this.ctx.createGain();
    this.musicMasterGain.gain.setValueAtTime(
      this.isMuted ? 0 : MUSIC_MAX_GAIN,
      this.ctx.currentTime
    );
    this.musicMasterGain.connect(this.ctx.destination);
  }

  private ensureDecks() {
    if (typeof Audio === 'undefined') return;
    if (this.decks.size === 0) {
      (Object.keys(MUSIC_FILENAMES) as MusicTrackId[]).forEach((trackId) => {
        const url = resolveMusicUrl(trackId);
        const audio = new Audio(url);
        audio.loop = true;
        audio.preload = 'auto';
        audio.muted = this.isMuted;

        this.decks.set(trackId, {
          id: trackId,
          url,
          audio,
          sourceNode: null,
          gainNode: null,
          currentWeight: 0,
          targetWeight: 0,
        });
      });
    }
    this.connectMusicDecksToContext();
  }

  private connectMusicDecksToContext() {
    if (!this.ctx || this.decks.size === 0) return;
    this.ensureMusicMasterGain();
    if (!this.musicMasterGain) return;

    for (const deck of this.decks.values()) {
      if (deck.sourceNode) continue;
      try {
        const gainNode = this.ctx.createGain();
        const shaped = Math.sin(deck.currentWeight * Math.PI * 0.5);
        gainNode.gain.setValueAtTime(shaped, this.ctx.currentTime);
        const sourceNode = this.ctx.createMediaElementSource(deck.audio);
        sourceNode.connect(gainNode);
        gainNode.connect(this.musicMasterGain);
        deck.gainNode = gainNode;
        deck.sourceNode = sourceNode;
        // Keep element volume at 1.0 when routed through Web Audio GainNode
        deck.audio.volume = 1;
      } catch {
        // Fallback: direct HTMLAudioElement volume control if MediaElementSource fails
        deck.audio.volume = this.isMuted
          ? 0
          : Math.sin(deck.currentWeight * Math.PI * 0.5) * MUSIC_MAX_GAIN;
      }
    }
  }

  private applyDeckGain(deck: MusicDeck) {
    const clamped = Math.max(0, Math.min(1, deck.currentWeight));
    const shaped = Math.sin(clamped * Math.PI * 0.5);
    deck.audio.muted = this.isMuted;

    if (deck.gainNode && this.ctx) {
      deck.gainNode.gain.setValueAtTime(shaped, this.ctx.currentTime);
    } else {
      deck.audio.volume = this.isMuted ? 0 : shaped * MUSIC_MAX_GAIN;
    }
  }

  private safePlayDeck(deck: MusicDeck) {
    if (this.isMusicPaused) return;
    if (!deck.audio.paused) return;
    const playPromise = deck.audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Browser autoplay policy blocked playback; will retry on next user interaction
      });
    }
  }

  private stopFadeLoop() {
    if (this.fadeRafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.fadeRafId);
    }
    this.fadeRafId = null;
  }

  private startFadeLoop() {
    if (this.fadeRafId !== null || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.lastFadeTimeMs =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    const stepFade = (nowMs: number) => {
      if (this.isMusicPaused) {
        this.fadeRafId = null;
        return;
      }

      const dt = Math.max(0.001, Math.min((nowMs - this.lastFadeTimeMs) / 1000, 0.1));
      this.lastFadeTimeMs = nowMs;
      const step = dt / CROSSFADE_DURATION_SEC;

      let anyPending = false;
      for (const deck of this.decks.values()) {
        const diff = deck.targetWeight - deck.currentWeight;
        if (Math.abs(diff) > 0.001) {
          anyPending = true;
          if (Math.abs(diff) <= step) {
            deck.currentWeight = deck.targetWeight;
          } else {
            deck.currentWeight += Math.sign(diff) * step;
          }
          this.applyDeckGain(deck);
        } else if (deck.currentWeight !== deck.targetWeight) {
          deck.currentWeight = deck.targetWeight;
          this.applyDeckGain(deck);
        }

        if (
          deck.targetWeight === 0 &&
          deck.currentWeight <= 0.001 &&
          !deck.audio.paused
        ) {
          deck.audio.pause();
        }
      }

      if (anyPending) {
        this.fadeRafId = requestAnimationFrame(stepFade);
      } else {
        this.fadeRafId = null;
      }
    };

    this.fadeRafId = requestAnimationFrame(stepFade);
  }

  public enableAudio() {
    this.initContext();
    if (!this.isStarted && this.ctx) {
      this.isStarted = true;
      this.startDungeonAmbience();
    }
    if (this.isMusicStarted && !this.isMusicPaused && this.currentTrack) {
      const activeDeck = this.decks.get(this.currentTrack);
      if (activeDeck) {
        this.applyDeckGain(activeDeck);
        this.safePlayDeck(activeDeck);
      }
    }
  }

  public startMusic(
    track: MusicTrackId = 'explore',
    options?: { restart?: boolean }
  ) {
    this.initContext();
    this.ensureDecks();
    this.isMusicStarted = true;
    this.isMusicPaused = false;
    this.stopFadeLoop();

    if (options?.restart) {
      for (const deck of this.decks.values()) {
        deck.audio.pause();
        try {
          deck.audio.currentTime = 0;
        } catch {
          // Ignore if metadata not yet loaded
        }
        deck.currentWeight = 0;
        deck.targetWeight = 0;
        this.applyDeckGain(deck);
      }
    }

    this.currentTrack = track;
    for (const deck of this.decks.values()) {
      if (deck.id === track) {
        deck.targetWeight = 1;
        if (!options?.restart && deck.currentWeight === 0) {
          deck.currentWeight = 1;
        } else if (options?.restart) {
          deck.currentWeight = 1;
        }
        this.applyDeckGain(deck);
        this.safePlayDeck(deck);
      } else {
        deck.targetWeight = 0;
        if (options?.restart || deck.currentWeight <= 0.001) {
          deck.currentWeight = 0;
          this.applyDeckGain(deck);
          if (!deck.audio.paused) {
            deck.audio.pause();
          }
        } else {
          this.startFadeLoop();
        }
      }
    }
  }

  public setMusicTrack(track: MusicTrackId) {
    if (!this.isMusicStarted) return;
    if (this.currentTrack === track) return;

    this.ensureDecks();
    this.currentTrack = track;

    for (const deck of this.decks.values()) {
      if (deck.id === track) {
        deck.targetWeight = 1;
        this.applyDeckGain(deck);
        if (!this.isMusicPaused) {
          this.safePlayDeck(deck);
        }
      } else {
        deck.targetWeight = 0;
      }
    }

    if (!this.isMusicPaused) {
      this.startFadeLoop();
    }
  }

  public pauseMusic() {
    if (!this.isMusicStarted || this.isMusicPaused) return;
    this.isMusicPaused = true;
    this.stopFadeLoop();
    for (const deck of this.decks.values()) {
      if (!deck.audio.paused) {
        deck.audio.pause();
      }
    }
  }

  public resumeMusic() {
    if (!this.isMusicStarted) return;
    this.isMusicPaused = false;
    this.initContext();
    this.ensureDecks();

    let needsFade = false;
    for (const deck of this.decks.values()) {
      if (deck.targetWeight > 0 || deck.currentWeight > 0.001) {
        this.applyDeckGain(deck);
        this.safePlayDeck(deck);
      }
      if (Math.abs(deck.targetWeight - deck.currentWeight) > 0.001) {
        needsFade = true;
      }
    }
    if (needsFade) {
      this.startFadeLoop();
    }
  }

  public getCurrentMusicTrack(): MusicTrackId | null {
    return this.currentTrack;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.06,
        this.ctx.currentTime
      );
    }
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(
        this.isMuted ? 0 : MUSIC_MAX_GAIN,
        this.ctx.currentTime
      );
    }
    for (const deck of this.decks.values()) {
      this.applyDeckGain(deck);
    }
    if (!this.isMuted && this.isMusicStarted && !this.isMusicPaused && this.currentTrack) {
      const activeDeck = this.decks.get(this.currentTrack);
      if (activeDeck) {
        this.safePlayDeck(activeDeck);
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private startDungeonAmbience() {
    if (!this.ctx || this.ambientGain) return;

    try {
      // Subtle low cavern ambience blended underneath music tracks
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleFilter = this.ctx.createBiquadFilter();
      this.ambientGain = this.ctx.createGain();

      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(rumbleOsc.frequency);
      lfo.start();

      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.ambientGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.06,
        this.ctx.currentTime
      );

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

      const osc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isCrit ? 680 : 440, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      metalGain.gain.setValueAtTime(0.35, now);
      metalGain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

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

  public playLootPickup(kind: 'gold' | 'potion') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = kind === 'gold' ? [1174.66, 1567.98] : [523.25, 659.25];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const start = now + idx * (kind === 'gold' ? 0.055 : 0.065);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = kind === 'gold' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.01, start);
        gain.gain.linearRampToValueAtTime(kind === 'gold' ? 0.16 : 0.18, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.19);
      });
    } catch {
      // Ignore audio error
    }
  }
}

export const soundManager = new SoundManager();
