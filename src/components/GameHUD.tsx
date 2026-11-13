import React from 'react';
import { Sword, Shield, RotateCcw, Volume2, VolumeX, Skull, Trophy, Zap } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { Vector2D } from '../types/game';

interface GameHUDProps {
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyDefeated: boolean;
  playerDefeated: boolean;
  attackCooldownRatio: number; // 0 = ready, 1 = full cooldown
  dashCooldownRatio: number; // 0 = ready, 1 = full cooldown
  isMuted: boolean;
  onMove: (vec: Vector2D) => void;
  onAttack: () => void;
  onDash: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onInteract: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerHp,
  playerMaxHp,
  enemyHp,
  enemyMaxHp,
  enemyDefeated,
  playerDefeated,
  attackCooldownRatio,
  dashCooldownRatio,
  isMuted,
  onMove,
  onAttack,
  onDash,
  onRestart,
  onToggleMute,
  onInteract,
}) => {
  const playerHpPct = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const enemyHpPct = Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100));
  const attackReady = attackCooldownRatio <= 0.01;
  const dashReady = dashCooldownRatio <= 0.01;

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
      {/* TOP BAR: Health Bars & Utility Actions */}
      <div className="flex items-start justify-between gap-3">
        {/* Player Status */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-amber-700/50 bg-stone-950/88 px-3 py-2 shadow-lg">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/60 bg-stone-800 text-amber-400">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-[116px] sm:min-w-[150px]">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-200">
              <span>Knight</span>
              <span className="tabular-nums text-amber-300">
                {Math.max(0, Math.ceil(playerHp))}/{playerMaxHp}
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-stone-800 border border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 transition-all duration-150"
                style={{ width: `${playerHpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center/Right Enemy Bar & Controls */}
        <div className="flex items-center gap-2">
          {/* Skeleton Warrior HP Bar */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-red-900/60 bg-stone-950/88 px-3 py-2 shadow-lg">
            <div className="min-w-[110px] sm:min-w-[146px]">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-200">
                <span className="truncate">Skeleton</span>
                <span className="tabular-nums text-red-400">
                  {Math.max(0, Math.ceil(enemyHp))}/{enemyMaxHp}
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-stone-800 border border-stone-700">
                <div
                  className="h-full bg-gradient-to-r from-red-900 to-red-500 transition-all duration-150"
                  style={{ width: `${enemyHpPct}%` }}
                />
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-700/50 bg-stone-900 text-red-400">
              <Skull className="h-4 w-4" />
            </div>
          </div>

          {/* Mute Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onInteract();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-stone-700 bg-stone-950/88 text-stone-300 active:scale-95 hover:border-amber-600/60 hover:text-amber-300 transition"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          {/* Quick Restart Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onInteract();
              onRestart();
            }}
            aria-label="Restart encounter"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-stone-700 bg-stone-950/88 text-stone-300 active:scale-95 hover:border-amber-600/60 hover:text-amber-300 transition"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* VICTORY / DEFEAT BANNER OVERLAY */}
      {(enemyDefeated || playerDefeated) && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-amber-600/70 bg-stone-950/95 p-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.9)]">
            <div
              className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                enemyDefeated
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300'
                  : 'border-red-500 bg-red-950/70 text-red-400'
              }`}
            >
              {enemyDefeated ? <Trophy className="h-7 w-7" /> : <Skull className="h-7 w-7" />}
            </div>

            <h2
              className={`text-2xl font-black uppercase tracking-wider ${
                enemyDefeated ? 'text-amber-300' : 'text-red-400'
              }`}
            >
              {enemyDefeated ? 'Victory!' : 'Fallen in the Abyss'}
            </h2>
            <p className="mt-1.5 text-sm text-stone-300">
              {enemyDefeated
                ? 'The Skeleton Warrior has been vanquished.'
                : 'The ancient guardian overwhelmed you.'}
            </p>

            <button
              type="button"
              onClick={() => {
                onInteract();
                onRestart();
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/70 bg-gradient-to-b from-amber-600 to-amber-800 px-5 py-3.5 text-base font-bold uppercase tracking-wider text-white shadow-lg active:scale-95 transition"
            >
              <RotateCcw className="h-5 w-5" />
              Restart Dungeon
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS: Lower-Left Joystick & Lower-Right Action Cluster */}
      <div className="flex items-end justify-between">
        {/* Lower-Left Virtual Movement Joystick */}
        <div className="pointer-events-auto">
          <VirtualJoystick onMove={onMove} onInteract={onInteract} />
        </div>

        {/* Lower-Right Action Cluster (Attack at bottom, Dash offset above-left) */}
        <div
          className="pointer-events-auto relative flex items-end gap-3"
          style={{ touchAction: 'none' }}
        >
          {/* Secondary Dash Button */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInteract();
              onDash();
            }}
            aria-label="Dash"
            style={{ touchAction: 'none' }}
            className={`relative mb-3 flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center overflow-hidden rounded-full border-2 shadow-xl transition active:scale-90 ${
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

          {/* Primary Attack Button (Bottom of right-side action cluster) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
            {/* Cooldown Fill Overlay */}
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
