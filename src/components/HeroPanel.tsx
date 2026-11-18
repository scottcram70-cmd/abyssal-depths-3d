import React from 'react';
import {
  Coins,
  Compass,
  Heart,
  KeyRound,
  Shield,
  Skull,
  Sword,
  X,
} from 'lucide-react';
import { getLevelProgress } from '../utils/progression';
import { ROOM_NAMES } from '../utils/obstacles';
import { RoomId } from '../types/game';

interface HeroPanelProps {
  playerHp: number;
  playerMaxHp: number;
  playerMagic: number;
  playerMaxMagic: number;
  healingPotions: number;
  gold: number;
  playerXp: number;
  playerLevel: number;
  currentRoom: RoomId;
  discoveredRooms: RoomId[];
  enemiesDefeated: number;
  totalEnemies: number;
  objectiveText: string;
  hasKey: boolean;
  doorUnlocked: boolean;
  sanctumUnlocked: boolean;
  wardenUnlocked: boolean;
  portalActive: boolean;
  dungeonCompleted: boolean;
  onClose: () => void;
  onInteract: () => void;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({
  playerHp,
  playerMaxHp,
  playerMagic,
  playerMaxMagic,
  healingPotions,
  gold,
  playerXp,
  playerLevel,
  currentRoom,
  discoveredRooms,
  enemiesDefeated,
  totalEnemies,
  objectiveText,
  hasKey,
  doorUnlocked,
  sanctumUnlocked,
  wardenUnlocked,
  portalActive,
  dungeonCompleted,
  onClose,
  onInteract,
}) => {
  const hpDisplay = Math.max(0, Math.ceil(playerHp));
  const hpPct = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const magicDisplay = Math.max(0, Math.floor(playerMagic));
  const magicPct = Math.max(0, Math.min(100, (playerMagic / playerMaxMagic) * 100));
  const roomsExplored = discoveredRooms.length;
  const {
    xp,
    nextLevelXp,
    xpIntoLevel,
    xpRequiredForNext,
    progressPct: xpProgressPct,
  } = getLevelProgress(playerXp);

  const exitStatus = dungeonCompleted
    ? 'Escaped via Throne Portal'
    : portalActive
      ? 'Exit Portal Active (Room 8)'
      : wardenUnlocked
        ? 'Throne Open — Portal Sealed'
        : sanctumUnlocked
          ? "Warden's Gate Sealed (Room 7)"
          : doorUnlocked
            ? 'Sanctum Gate Sealed (Room 3)'
            : 'Iron Gate Locked (Room 2)';

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-[2px]"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onInteract();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Hero Information"
    >
      <div
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-amber-700/70 bg-stone-950/96 text-stone-100 shadow-[0_0_45px_rgba(0,0,0,0.92)]"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-800/45 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/60 bg-stone-800 text-amber-400 shadow-inner">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90">
                Character
              </div>
              <h2 className="truncate text-base sm:text-lg font-black tracking-wide text-stone-100">
                Nick — Knight
              </h2>
            </div>
          </div>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInteract();
              onClose();
            }}
            aria-label="Close hero panel"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-700 bg-stone-900 text-stone-300 active:scale-95 hover:border-amber-500/70 hover:text-amber-300 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scroll-safe Body (fits portrait cleanly; safely scrolls only on ultra-short screens) */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y p-4">
          {/* STATISTICS */}
          <section className="rounded-xl border border-stone-800 bg-stone-900/75 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-400">
              <Heart className="h-3.5 w-3.5" />
              <span>Statistics</span>
            </div>

            <div className="mb-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
                <span>Health</span>
                <span className="tabular-nums font-bold text-amber-300">
                  {hpDisplay} / {playerMaxHp}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-stone-700 bg-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            <div className="mb-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
                <span>Magic</span>
                <span className="tabular-nums font-bold text-sky-300">
                  {magicDisplay} / {playerMaxMagic}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-stone-700 bg-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-300 transition-all duration-150"
                  style={{ width: `${magicPct}%` }}
                />
              </div>
            </div>

            <div className="mb-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
                <span>Experience (Level {playerLevel})</span>
                <span className="tabular-nums font-bold text-amber-300">
                  {xp} XP
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-stone-700 bg-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-150"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400 tabular-nums">
                <span>
                  {xpIntoLevel} / {xpRequiredForNext} XP to Lv. {playerLevel + 1}
                </span>
                <span>Next: {nextLevelXp} XP</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-stone-800 bg-stone-950/75 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  Level
                </div>
                <div className="mt-0.5 font-bold text-amber-200">
                  Level {playerLevel}
                </div>
              </div>

              <div className="rounded-lg border border-stone-800 bg-stone-950/75 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  Gold
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-bold tabular-nums text-amber-300">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span>{gold}</span>
                </div>
              </div>

              <div className="rounded-lg border border-stone-800 bg-stone-950/75 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  Healing Potions
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-bold tabular-nums text-red-300">
                  <Heart className="h-3.5 w-3.5 fill-red-500/80 text-red-400" />
                  <span>{healingPotions}</span>
                </div>
              </div>

              <div className="rounded-lg border border-stone-800 bg-stone-950/75 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  Enemies Defeated
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-bold tabular-nums text-stone-100">
                  <Skull className="h-3.5 w-3.5 text-red-400" />
                  <span>
                    {enemiesDefeated} / {totalEnemies}
                  </span>
                </div>
              </div>

              <div className="col-span-2 rounded-lg border border-stone-800 bg-stone-950/75 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  Current Room
                </div>
                <div className="mt-0.5 truncate font-bold text-amber-200">
                  R{currentRoom}/8 · {ROOM_NAMES[currentRoom]}
                </div>
              </div>
            </div>
          </section>

          {/* EQUIPMENT */}
          <section className="rounded-xl border border-stone-800 bg-stone-900/75 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-400">
              <Sword className="h-3.5 w-3.5" />
              <span>Equipment</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-950/75 px-3 py-2">
                <span className="text-stone-400">Primary Weapon</span>
                <span className="font-bold text-amber-200">Knight Sword</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-950/75 px-3 py-2">
                <span className="text-stone-400">Off-Hand</span>
                <span className="font-semibold text-stone-200">Heater Shield</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-950/75 px-3 py-2">
                <span className="text-stone-400">Armor</span>
                <span className="font-semibold text-stone-200">
                  Steel Cuirass &amp; Greathelm
                </span>
              </div>
            </div>
          </section>

          {/* EXPEDITION */}
          <section className="rounded-xl border border-stone-800 bg-stone-900/75 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-400">
              <Compass className="h-3.5 w-3.5" />
              <span>Expedition</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg border border-amber-800/40 bg-stone-950/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  Current Objective
                </div>
                <div className="mt-0.5 font-semibold text-stone-100">
                  {objectiveText}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-950/75 px-3 py-2">
                <span className="text-stone-400">Dungeon Progress</span>
                <span className="font-semibold tabular-nums text-stone-200">
                  {roomsExplored}/8 Rooms • {enemiesDefeated}/{totalEnemies} Slain
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-950/75 px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-stone-400">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  <span>Key Possession</span>
                </span>
                <span
                  className={`font-bold ${
                    hasKey ? 'text-amber-300' : 'text-stone-400'
                  }`}
                >
                  {hasKey ? 'Golden Key (1/1)' : 'Not Found (0/1)'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-stone-800 bg-stone-950/75 px-3 py-2">
                <span className="text-stone-400 shrink-0">Exit Status</span>
                <span
                  className={`text-right font-bold ${
                    dungeonCompleted || portalActive
                      ? 'text-sky-300'
                      : doorUnlocked
                        ? 'text-emerald-300'
                        : 'text-red-300'
                  }`}
                >
                  {exitStatus}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Close Button */}
        <div className="shrink-0 border-t border-stone-800 bg-stone-900/75 px-4 py-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInteract();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/60 bg-gradient-to-b from-stone-800 to-stone-900 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-amber-200 shadow active:scale-95 transition"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
