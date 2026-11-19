import React, { useEffect, useState } from 'react';
import {
  Sword,
  Shield,
  RotateCcw,
  Volume2,
  VolumeX,
  Skull,
  Trophy,
  Zap,
  KeyRound,
  Heart,
  Map as MapIcon,
  User,
  Sparkles,
  Flag,
  Pause,
  Play,
  Coins,
  ArrowLeftRight,
} from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { DungeonMiniMap } from './DungeonMiniMap';
import { HeroPanel } from './HeroPanel';
import { MapEnemyPin, RoomId, Vector2D } from '../types/game';

interface GameHUDProps {
  playerHp: number;
  playerMaxHp: number;
  playerMagic: number;
  playerMaxMagic: number;
  healingPotions: number;
  gold: number;
  inCombat: boolean;
  isHealthRegenerating: boolean;
  isMagicRegenerating: boolean;
  playerXp: number;
  playerLevel: number;
  playerPos: { x: number; z: number };
  playerRot: number;
  currentRoom: RoomId;
  discoveredRooms: RoomId[];
  enemies: MapEnemyPin[];
  enemiesDefeated: number;
  totalEnemies: number;
  objectiveText: string;
  hasKey: boolean;
  collectedPotionIds: string[];
  doorUnlocked: boolean;
  sanctumUnlocked: boolean;
  wardenUnlocked: boolean;
  portalActive: boolean;
  showHealthRestored: boolean;
  showPotionPickedUp: boolean;
  showGoldPickedUp: boolean;
  lastGoldPickedUp: number;
  showLevelUp: boolean;
  levelUpLevel: number;
  checkpointRoom: RoomId | null;
  showCheckpointActivated: boolean;
  activeEnemyName: string | null;
  activeEnemyHp: number;
  activeEnemyMaxHp: number;
  dungeonCompleted: boolean;
  playerDefeated: boolean;
  attackCooldownRatio: number; // 0 = ready, 1 = full cooldown
  dashCooldownRatio: number; // 0 = ready, 1 = full cooldown
  isMuted: boolean;
  isPaused: boolean;
  mirroredControls: boolean;
  onMove: (vec: Vector2D) => void;
  onAttack: () => void;
  onDash: () => void;
  onHeal: () => void;
  onPause: () => void;
  onResume: () => void;
  onReturnToTitle?: () => void;
  onContinueFromCheckpoint: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleMirroredControls: () => void;
  onInteract: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerHp,
  playerMaxHp,
  playerMagic,
  playerMaxMagic,
  healingPotions,
  gold,
  inCombat,
  isHealthRegenerating,
  isMagicRegenerating,
  playerXp,
  playerLevel,
  playerPos,
  playerRot,
  currentRoom,
  discoveredRooms,
  enemies,
  enemiesDefeated,
  totalEnemies,
  objectiveText,
  hasKey,
  collectedPotionIds,
  doorUnlocked,
  sanctumUnlocked,
  wardenUnlocked,
  portalActive,
  showHealthRestored,
  showPotionPickedUp,
  showGoldPickedUp,
  lastGoldPickedUp,
  showLevelUp,
  levelUpLevel,
  checkpointRoom,
  showCheckpointActivated,
  activeEnemyName,
  activeEnemyHp,
  activeEnemyMaxHp,
  dungeonCompleted,
  playerDefeated,
  attackCooldownRatio,
  dashCooldownRatio,
  isMuted,
  isPaused,
  mirroredControls,
  onMove,
  onAttack,
  onDash,
  onHeal,
  onPause,
  onResume,
  onReturnToTitle,
  onContinueFromCheckpoint,
  onRestart,
  onToggleMute,
  onToggleMirroredControls,
  onInteract,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isHeroOpen, setIsHeroOpen] = useState(false);

  useEffect(() => {
    if (!isHeroOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHeroOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHeroOpen]);
  const playerHpPct = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const playerMagicPct = Math.max(0, Math.min(100, (playerMagic / playerMaxMagic) * 100));
  const enemyHpPct =
    activeEnemyMaxHp > 0
      ? Math.max(0, Math.min(100, (activeEnemyHp / activeEnemyMaxHp) * 100))
      : 0;
  const attackReady = attackCooldownRatio <= 0.01;
  const dashReady = dashCooldownRatio <= 0.01;
  const canHealNow = healingPotions > 0 && playerHp > 0 && playerHp < playerMaxHp;
  const isCriticalHealth = playerHp > 0 && playerHpPct < 35;
  const isWarningHealth = playerHp > 0 && playerHpPct >= 35 && playerHpPct <= 50;
  const shouldPulseHeal = isCriticalHealth && healingPotions > 0;

  const playerHpFillClass = isCriticalHealth
    ? 'bg-gradient-to-r from-red-700 via-red-500 to-rose-400 animate-pulse'
    : isWarningHealth
      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-yellow-300'
      : 'bg-gradient-to-r from-green-600 via-emerald-400 to-lime-400';

  const playerHpTrackClass = isCriticalHealth
    ? 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.75)] animate-pulse'
    : isHealthRegenerating
      ? 'border-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.35)]'
      : isWarningHealth
        ? 'border-yellow-500/70'
        : 'border-emerald-700/60';

  const playerHpTextClass = isCriticalHealth
    ? 'text-red-300 animate-pulse'
    : isWarningHealth
      ? 'text-yellow-300'
      : 'text-emerald-300';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 select-none"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      {/* TOP BAR: Health Bars, Key Status, Objective & Upper-Right Utility + Mini-Map */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          {/* Top-Left: Knight Status, Key Badge, Mobile Enemy Bar & Mobile Objective */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-amber-700/50 bg-stone-950/88 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/60 bg-stone-800 text-amber-400">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-[126px] sm:min-w-[172px]">
                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-100">
                    <span className="truncate">Knight · Lv{playerLevel}</span>
                    <span className="flex shrink-0 items-center gap-1 tabular-nums">
                      {isHealthRegenerating ? (
                        <span className="text-[9px] font-black text-emerald-400">
                          +2%/s
                        </span>
                      ) : playerHp > 0 && playerHp < playerMaxHp && inCombat ? (
                        <span className="text-[9px] font-bold text-stone-400">
                          Paused
                        </span>
                      ) : null}
                      <span className={`font-extrabold ${playerHpTextClass}`}>
                        {Math.max(0, Math.ceil(playerHp))}/{playerMaxHp}
                      </span>
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 h-2.5 w-full overflow-hidden rounded-full border bg-stone-800 ${playerHpTrackClass}`}
                  >
                    <div
                      className={`h-full transition-all duration-150 ${playerHpFillClass}`}
                      style={{ width: `${playerHpPct}%` }}
                    />
                  </div>

                  {/* Magic & Regeneration Bar */}
                  <div className="mt-1 flex items-center justify-between gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-300">
                    <span className="flex items-center gap-1 text-sky-300">
                      <span>Magic</span>
                      <span
                        className={`font-black ${
                          inCombat ? 'text-amber-400/90' : 'text-cyan-300'
                        }`}
                      >
                        {isMagicRegenerating
                          ? inCombat
                            ? '+2%/s'
                            : '+4%/s'
                          : inCombat
                            ? '½Rate'
                            : '+4%/s'}
                      </span>
                    </span>
                    <span className="tabular-nums text-sky-300">
                      {Math.max(0, Math.floor(playerMagic))}/{playerMaxMagic}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 h-1.5 w-full overflow-hidden rounded-full border bg-stone-800 ${
                      isMagicRegenerating
                        ? inCombat
                          ? 'border-amber-500/55'
                          : 'border-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                        : 'border-stone-700'
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-300 transition-all duration-150"
                      style={{ width: `${playerMagicPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key Indicator */}
              <div
                className={`pointer-events-auto flex h-10 sm:h-11 items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 text-xs font-bold uppercase tracking-wider shadow-lg ${
                  hasKey
                    ? 'border-amber-400/80 bg-amber-950/90 text-amber-300'
                    : 'border-stone-700/80 bg-stone-950/85 text-stone-500'
                }`}
              >
                <KeyRound className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{hasKey ? 'Key' : '0/1'}</span>
              </div>

              {/* Desktop Gold Counter */}
              <div
                aria-label={`Gold: ${gold}`}
                className="pointer-events-auto hidden sm:flex h-11 items-center gap-1.5 rounded-xl border border-amber-500/60 bg-stone-950/88 px-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-lg"
              >
                <Coins className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="tabular-nums">{gold}</span>
              </div>
            </div>

            {/* Mobile Portrait Gold Counter (cleanly stacked below Knight card without crowding Mute/Restart) */}
            <div
              aria-label={`Gold: ${gold}`}
              className="pointer-events-auto inline-flex sm:hidden items-center gap-1.5 rounded-lg border border-amber-500/55 bg-stone-950/88 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 shadow-md"
            >
              <Coins className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="tabular-nums">{gold}</span>
              <span className="text-[10px] text-amber-400/85">Gold</span>
            </div>

            {/* Active Enemy HP Bar (stacked cleanly on mobile portrait so upper-right mini-map never collides) */}
            {activeEnemyName && activeEnemyHp > 0 && (
              <div className="pointer-events-auto flex sm:hidden items-center gap-2 rounded-xl border border-red-900/60 bg-stone-950/88 px-2.5 py-1.5 shadow-lg max-w-full">
                <div className="min-w-[118px]">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-200">
                    <span className="truncate">{activeEnemyName}</span>
                    <span className="tabular-nums text-red-400">
                      {Math.max(0, Math.ceil(activeEnemyHp))}/{activeEnemyMaxHp}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-red-900/80 bg-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 transition-all duration-150"
                      style={{ width: `${enemyHpPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-700/50 bg-stone-900 text-red-400">
                  <Skull className="h-3.5 w-3.5" />
                </div>
              </div>
            )}

            {/* Mobile Portrait Objective Banner (stays clear of upper-right mini-map) */}
            <div className="flex sm:hidden flex-col items-start gap-1 max-w-full">
              <div className="rounded-lg border border-amber-800/45 bg-stone-950/82 px-2.5 py-1 text-left text-[11px] font-semibold leading-snug tracking-wide text-stone-200 shadow-md">
                <span className="mr-1.5 font-black uppercase text-amber-400">
                  Room {currentRoom}/8
                </span>
                <span>{objectiveText}</span>
              </div>

              {showHealthRestored && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/70 bg-stone-950/92 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-300 shadow-lg">
                  <Heart className="h-3.5 w-3.5 fill-red-500 text-red-400" />
                  <span>Health Restored</span>
                </div>
              )}

              {showPotionPickedUp && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/75 bg-stone-950/92 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-200 shadow-lg">
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-300" />
                  <span>Healing Potion +1 ({healingPotions})</span>
                </div>
              )}

              {showGoldPickedUp && lastGoldPickedUp > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/80 bg-stone-950/92 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200 shadow-lg">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span>+{lastGoldPickedUp} Gold</span>
                </div>
              )}

              {showLevelUp && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/85 bg-gradient-to-r from-amber-950/95 via-stone-950/95 to-amber-950/95 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.35)]">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Level Up! Lv. {levelUpLevel} (+10 Max HP)</span>
                </div>
              )}

              {showCheckpointActivated && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/75 bg-stone-950/92 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 shadow-lg">
                  <Flag className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Checkpoint Activated — Room {checkpointRoom ?? 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Top-Right: Desktop/Landscape Enemy HP + Utility Buttons + Always-On Compact Mini-Map */}
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {activeEnemyName && activeEnemyHp > 0 && (
                <div className="pointer-events-auto hidden sm:flex items-center gap-2 rounded-xl border border-red-900/60 bg-stone-950/88 px-3 py-2 shadow-lg">
                  <div className="min-w-[146px]">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-200">
                      <span className="truncate">{activeEnemyName}</span>
                      <span className="tabular-nums text-red-400">
                        {Math.max(0, Math.ceil(activeEnemyHp))}/{activeEnemyMaxHp}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full border border-red-900/80 bg-stone-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 transition-all duration-150"
                        style={{ width: `${enemyHpPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-700/50 bg-stone-900 text-red-400">
                    <Skull className="h-4 w-4" />
                  </div>
                </div>
              )}

              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onInteract();
                  onToggleMute();
                }}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-stone-700 bg-stone-950/88 text-stone-300 active:scale-95 hover:border-amber-600/60 hover:text-amber-300 transition"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onInteract();
                  onRestart();
                }}
                aria-label="Restart dungeon"
                className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-stone-700 bg-stone-950/88 text-stone-300 active:scale-95 hover:border-amber-600/60 hover:text-amber-300 transition"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            {/* Upper-Right PAUSE Button (aligned cleanly above mini-map, clear of Map/Hero & controls) */}
            {!(dungeonCompleted || playerDefeated) && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onInteract();
                  if (isPaused) {
                    onResume();
                  } else {
                    onPause();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onInteract();
                    if (isPaused) {
                      onResume();
                    } else {
                      onPause();
                    }
                  }
                }}
                aria-label={isPaused ? 'Resume game' : 'Pause game'}
                aria-pressed={isPaused}
                style={{ touchAction: 'none' }}
                className={`pointer-events-auto flex h-8 sm:h-9 w-[84px] sm:w-[96px] items-center justify-center gap-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider shadow-lg transition active:scale-95 ${
                  isPaused
                    ? 'border-amber-400 bg-amber-950/92 text-amber-200'
                    : 'border-stone-700/90 bg-stone-950/88 text-stone-200 hover:border-amber-600/60 hover:text-amber-300'
                }`}
              >
                <Pause className="h-3.5 w-3.5 shrink-0" />
                <span>Pause</span>
              </button>
            )}

            {/* Continuously Visible Compact Mini-Map in Upper-Right Corner */}
            {!isMapOpen && !(dungeonCompleted || playerDefeated) && (
              <DungeonMiniMap
                mode="compact"
                playerPos={playerPos}
                playerRot={playerRot}
                currentRoom={currentRoom}
                discoveredRooms={discoveredRooms}
                enemies={enemies}
                hasKey={hasKey}
                collectedPotionIds={collectedPotionIds}
                doorUnlocked={doorUnlocked}
                sanctumUnlocked={sanctumUnlocked}
                wardenUnlocked={wardenUnlocked}
                portalActive={portalActive}
              />
            )}
          </div>
        </div>

        {/* Desktop / Landscape Objective Banner */}
        <div className="hidden sm:flex flex-col items-center gap-1.5 sm:px-48">
          <div className="rounded-lg border border-amber-800/45 bg-stone-950/82 px-3 py-1 text-center text-sm font-semibold tracking-wide text-stone-200 shadow-md">
            <span className="mr-2 font-black uppercase text-amber-400">
              Room {currentRoom}/8
            </span>
            <span>{objectiveText}</span>
          </div>

          {showHealthRestored && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/70 bg-stone-950/92 px-3 py-1 text-sm font-bold uppercase tracking-wider text-red-300 shadow-lg">
              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-400" />
              <span>Health Restored</span>
            </div>
          )}

          {showPotionPickedUp && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/75 bg-stone-950/92 px-3 py-1 text-sm font-bold uppercase tracking-wider text-rose-200 shadow-lg">
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-300" />
              <span>Healing Potion +1 ({healingPotions})</span>
            </div>
          )}

          {showGoldPickedUp && lastGoldPickedUp > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/80 bg-stone-950/92 px-3 py-1 text-sm font-bold uppercase tracking-wider text-amber-200 shadow-lg">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>+{lastGoldPickedUp} Gold</span>
            </div>
          )}

          {showLevelUp && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/85 bg-gradient-to-r from-amber-950/95 via-stone-950/95 to-amber-950/95 px-3.5 py-1 text-sm font-black uppercase tracking-wider text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Level Up! Level {levelUpLevel} (+10 Max HP)</span>
            </div>
          )}

          {showCheckpointActivated && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/75 bg-stone-950/92 px-3 py-1 text-sm font-bold uppercase tracking-wider text-emerald-300 shadow-lg">
              <Flag className="h-3.5 w-3.5 text-emerald-400" />
              <span>Checkpoint Activated — Room {checkpointRoom ?? 3}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT-SIDE MAP & HERO BUTTON STACK (Clear of top bar, compact mini-map & lower-right Attack/Dash) */}
      <div
        className="pointer-events-auto fixed right-[max(0.75rem,env(safe-area-inset-right))] top-1/2 -translate-y-1/2 sm:right-[max(7.25rem,calc(env(safe-area-inset-right)+6.75rem))] sm:top-[4.75rem] sm:translate-y-0 z-30 flex flex-col gap-2"
        style={{ touchAction: 'none' }}
      >
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInteract();
            setIsMapOpen((open) => !open);
          }}
          aria-label={isMapOpen ? 'Close Expanded Map' : 'Open Expanded Map'}
          aria-pressed={isMapOpen}
          style={{ touchAction: 'none' }}
          className={`flex h-12 w-14 sm:h-13 sm:w-16 flex-col items-center justify-center rounded-xl border shadow-lg transition active:scale-95 ${
            isMapOpen
              ? 'border-amber-400 bg-amber-950/92 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.3)]'
              : 'border-stone-700/90 bg-stone-950/88 text-stone-200 hover:border-amber-600/60 hover:text-amber-300'
          }`}
        >
          <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="mt-0.5 text-[10px] font-black uppercase tracking-wider">
            Map
          </span>
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInteract();
            setIsHeroOpen((open) => !open);
          }}
          aria-label={isHeroOpen ? 'Close Hero Panel' : 'Open Hero Panel'}
          aria-pressed={isHeroOpen}
          style={{ touchAction: 'none' }}
          className={`flex h-12 w-14 sm:h-13 sm:w-16 flex-col items-center justify-center rounded-xl border shadow-lg transition active:scale-95 ${
            isHeroOpen
              ? 'border-amber-400 bg-amber-950/92 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.3)]'
              : 'border-stone-700/90 bg-stone-950/88 text-stone-200 hover:border-amber-600/60 hover:text-amber-300'
          }`}
        >
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="mt-0.5 text-[10px] font-black uppercase tracking-wider">
            Hero
          </span>
        </button>
      </div>

      {/* EXPANDED DUNGEON MAP OVERLAY (Toggled by MAP button without interrupting gameplay) */}
      {isMapOpen && !(dungeonCompleted || playerDefeated) && (
        <div
          className="pointer-events-none fixed top-28 right-[max(4.75rem,calc(env(safe-area-inset-right)+4.25rem))] sm:top-20 sm:right-[max(12.25rem,calc(env(safe-area-inset-right)+11.75rem))] z-25"
        >
          <DungeonMiniMap
            mode="expanded"
            playerPos={playerPos}
            playerRot={playerRot}
            currentRoom={currentRoom}
            discoveredRooms={discoveredRooms}
            enemies={enemies}
            hasKey={hasKey}
            collectedPotionIds={collectedPotionIds}
            doorUnlocked={doorUnlocked}
            sanctumUnlocked={sanctumUnlocked}
            wardenUnlocked={wardenUnlocked}
            portalActive={portalActive}
            onClose={() => setIsMapOpen(false)}
            onInteract={onInteract}
          />
        </div>
      )}

      {/* HERO CHARACTER PANEL MODAL */}
      {isHeroOpen && !(dungeonCompleted || playerDefeated) && (
        <HeroPanel
          playerHp={playerHp}
          playerMaxHp={playerMaxHp}
          playerMagic={playerMagic}
          playerMaxMagic={playerMaxMagic}
          healingPotions={healingPotions}
          gold={gold}
          playerXp={playerXp}
          playerLevel={playerLevel}
          currentRoom={currentRoom}
          discoveredRooms={discoveredRooms}
          enemiesDefeated={enemiesDefeated}
          totalEnemies={totalEnemies}
          objectiveText={objectiveText}
          hasKey={hasKey}
          doorUnlocked={doorUnlocked}
          sanctumUnlocked={sanctumUnlocked}
          wardenUnlocked={wardenUnlocked}
          portalActive={portalActive}
          dungeonCompleted={dungeonCompleted}
          onClose={() => setIsHeroOpen(false)}
          onInteract={onInteract}
        />
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && !(dungeonCompleted || playerDefeated) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Game Paused"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{ touchAction: 'none' }}
          className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border-2 border-amber-600/70 bg-stone-950/95 p-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.92)]">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400/80 bg-amber-950/75 text-amber-300">
              <Pause className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black uppercase tracking-wider text-amber-300">
              Game Paused
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-stone-400">
              Room {currentRoom}/8 · Knight Lv. {playerLevel}
            </p>
            {activeEnemyName && activeEnemyHp > 0 && (
              <p className="mt-1 text-xs font-semibold text-red-300">
                In Combat: {activeEnemyName} ({Math.ceil(activeEnemyHp)}/{activeEnemyMaxHp} HP)
              </p>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-stone-800 bg-stone-900/80 px-2.5 py-2 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400">HP</div>
                <div className="font-black tabular-nums text-emerald-300">
                  {Math.max(0, Math.ceil(playerHp))}/{playerMaxHp}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400">Magic</div>
                <div className="font-black tabular-nums text-sky-300">
                  {Math.max(0, Math.floor(playerMagic))}/{playerMaxMagic}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400">Potions</div>
                <div className="font-black tabular-nums text-rose-300">
                  {healingPotions}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400">Gold</div>
                <div className="font-black tabular-nums text-amber-300">
                  {gold}
                </div>
              </div>
            </div>

            {/* Control Layout Toggle: LEFT JOYSTICK / RIGHT JOYSTICK */}
            <div className="mt-3.5 rounded-xl border border-stone-800 bg-stone-900/80 p-2.5">
              <div className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400" />
                <span>Mobile Controls</span>
              </div>
              <div
                role="group"
                aria-label="Mobile Controls Layout"
                className="grid grid-cols-2 gap-1.5"
              >
                <button
                  type="button"
                  aria-pressed={!mirroredControls}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onInteract();
                    if (mirroredControls) onToggleMirroredControls();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onInteract();
                      if (mirroredControls) onToggleMirroredControls();
                    }
                  }}
                  style={{ touchAction: 'none' }}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-black uppercase tracking-wider transition active:scale-95 ${
                    !mirroredControls
                      ? 'border-amber-400/85 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.22)]'
                      : 'border-stone-700/80 bg-stone-950/75 text-stone-400 hover:border-stone-600 hover:text-stone-200'
                  }`}
                >
                  Left Joystick
                </button>

                <button
                  type="button"
                  aria-pressed={mirroredControls}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onInteract();
                    if (!mirroredControls) onToggleMirroredControls();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onInteract();
                      if (!mirroredControls) onToggleMirroredControls();
                    }
                  }}
                  style={{ touchAction: 'none' }}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-black uppercase tracking-wider transition active:scale-95 ${
                    mirroredControls
                      ? 'border-amber-400/85 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.22)]'
                      : 'border-stone-700/80 bg-stone-950/75 text-stone-400 hover:border-stone-600 hover:text-stone-200'
                  }`}
                >
                  Right Joystick
                </button>
              </div>
            </div>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInteract();
                onResume();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onInteract();
                  onResume();
                }
              }}
              style={{ touchAction: 'none' }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-amber-300/85 bg-gradient-to-b from-amber-500 to-amber-700 px-6 py-4 text-lg font-black uppercase tracking-wider text-stone-950 shadow-[0_0_24px_rgba(245,158,11,0.45)] active:scale-95 transition"
            >
              <Play className="h-5 w-5 fill-current" />
              Resume
            </button>

            {onReturnToTitle && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onInteract();
                  onReturnToTitle();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onInteract();
                    onReturnToTitle();
                  }
                }}
                style={{ touchAction: 'none' }}
                className="mt-2.5 inline-flex w-full items-center justify-center rounded-xl border border-stone-700/90 bg-stone-900/90 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-300 hover:border-amber-600/60 hover:text-amber-200 active:scale-95 transition"
              >
                Title Screen
              </button>
            )}
          </div>
        </div>
      )}

      {/* VICTORY / DEFEAT BANNER OVERLAY */}
      {(dungeonCompleted || playerDefeated) && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-amber-600/70 bg-stone-950/95 p-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.9)]">
            {showLevelUp && (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/85 bg-amber-950/85 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.35)]">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Level Up! Level {levelUpLevel} (+10 Max HP)</span>
              </div>
            )}
            <div
              className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                dungeonCompleted
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300'
                  : 'border-red-500 bg-red-950/70 text-red-400'
              }`}
            >
              {dungeonCompleted ? (
                <Trophy className="h-7 w-7" />
              ) : (
                <Skull className="h-7 w-7" />
              )}
            </div>

            <h2
              className={`text-2xl font-black uppercase tracking-wider ${
                dungeonCompleted ? 'text-amber-300' : 'text-red-400'
              }`}
            >
              {dungeonCompleted ? 'Dungeon Cleared!' : 'Fallen in the Abyss'}
            </h2>
            <p className="mt-1.5 text-sm text-stone-300">
              {dungeonCompleted
                ? 'You conquered all eight chambers and escaped through the Abyssal Portal.'
                : 'The undead guardians overwhelmed you.'}
            </p>

            {playerDefeated && !dungeonCompleted && checkpointRoom !== null && (
              <button
                type="button"
                onClick={() => {
                  onInteract();
                  onContinueFromCheckpoint();
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/80 bg-gradient-to-b from-emerald-600 to-emerald-800 px-5 py-3.5 text-base font-bold uppercase tracking-wider text-white shadow-lg active:scale-95 transition"
              >
                <Flag className="h-5 w-5" />
                Continue from Checkpoint
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onInteract();
                onRestart();
              }}
              className={`${
                playerDefeated && !dungeonCompleted && checkpointRoom !== null
                  ? 'mt-3 border-stone-600 bg-gradient-to-b from-stone-800 to-stone-900 text-amber-200 hover:border-amber-500/70'
                  : 'mt-5 border-amber-400/70 bg-gradient-to-b from-amber-600 to-amber-800 text-white'
              } inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-base font-bold uppercase tracking-wider shadow-lg active:scale-95 transition`}
            >
              <RotateCcw className="h-5 w-5" />
              Restart Dungeon
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS: Default (Joystick Left / Actions Right) or Mirrored (Actions Left / Joystick Right) */}
      <div
        data-controls-layout={mirroredControls ? 'mirrored' : 'default'}
        className={`flex items-end justify-between ${
          mirroredControls ? 'flex-row-reverse' : ''
        }`}
      >
        {/* Virtual Movement Joystick */}
        <div className="pointer-events-auto">
          <VirtualJoystick onMove={onMove} onInteract={onInteract} disabled={isPaused} />
        </div>

        {/* Action Cluster (Attack on outer edge, Heal & Dash stacked cleanly inward) */}
        <div
          className={`pointer-events-auto relative flex items-end gap-2.5 sm:gap-3 ${
            mirroredControls ? 'flex-row-reverse' : ''
          }`}
          style={{ touchAction: 'none' }}
        >
          <div
            className={`mb-1 flex flex-col gap-2 ${
              mirroredControls ? 'items-start' : 'items-end'
            }`}
          >
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPaused) return;
                onInteract();
                onHeal();
              }}
              aria-label={`Heal (${healingPotions} potions)`}
              style={{ touchAction: 'none' }}
              className={`relative flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center rounded-full border-2 shadow-xl transition active:scale-90 ${
                shouldPulseHeal
                  ? 'animate-pulse border-red-300 bg-gradient-to-b from-red-600 to-red-950 text-white ring-2 ring-red-400/75 shadow-[0_0_20px_rgba(248,113,113,0.65)]'
                  : canHealNow
                    ? 'border-red-400/90 bg-gradient-to-b from-red-700/95 to-red-950/95 text-red-100 shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                    : healingPotions > 0
                      ? 'border-red-800/75 bg-stone-900/90 text-red-300/85'
                      : 'border-stone-700 bg-stone-950/80 text-stone-500'
              }`}
            >
              <span
                className={`absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1 text-[10px] font-black tabular-nums shadow ${
                  healingPotions > 0
                    ? 'border-red-300/80 bg-red-600 text-white'
                    : 'border-stone-600 bg-stone-800 text-stone-400'
                }`}
              >
                {healingPotions}
              </span>
              <Heart
                className={`relative z-10 h-5 w-5 sm:h-6 sm:w-6 ${
                  healingPotions > 0 ? 'fill-red-500/85 text-red-200' : ''
                }`}
              />
              <span className="relative z-10 mt-0.5 text-[9px] font-bold uppercase tracking-wider">
                Heal
              </span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPaused) return;
                onInteract();
                onDash();
              }}
              aria-label="Dash"
              style={{ touchAction: 'none' }}
              className={`relative flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center overflow-hidden rounded-full border-2 shadow-xl transition active:scale-90 ${
                dashReady
                  ? 'border-sky-400/80 bg-stone-900/90 text-sky-300'
                  : 'border-stone-700 bg-stone-950/80 text-stone-500'
              }`}
            >
              {!dashReady && (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-sky-500/20"
                  style={{ height: `${dashCooldownRatio * 100}%` }}
                />
              )}
              <Zap className="relative z-10 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="relative z-10 mt-0.5 text-[9px] font-bold uppercase tracking-wider">
                Dash
              </span>
            </button>
          </div>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isPaused) return;
              onInteract();
              onAttack();
            }}
            aria-label="Attack"
            style={{ touchAction: 'none' }}
            className={`relative flex h-20 w-20 sm:h-24 sm:w-24 flex-col items-center justify-center overflow-hidden rounded-full border-2 shadow-[0_0_24px_rgba(0,0,0,0.75)] transition active:scale-90 ${
              attackReady
                ? 'border-amber-400 bg-gradient-to-b from-amber-700 to-red-900 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : 'border-stone-700 bg-stone-900/90 text-stone-400'
            }`}
          >
            {!attackReady && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-500/25"
                style={{ height: `${attackCooldownRatio * 100}%` }}
              />
            )}
            <Sword className="relative z-10 h-8 w-8 sm:h-9 sm:w-9" />
            <span className="relative z-10 mt-1 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Attack
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
