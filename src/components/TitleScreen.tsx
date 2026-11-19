import React, { useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Heart,
  HelpCircle,
  Map as MapIcon,
  Pause,
  Play,
  Shield,
  Skull,
  Sword,
  User,
  Zap,
} from 'lucide-react';
import catacombsKeyArt from '../assets/images/abyssal_catacombs_keyart_1795034845303.jpg';
import { RoomId } from '../types/game';
import { ROOM_NAMES } from '../utils/obstacles';

interface TitleScreenProps {
  hasActiveRun: boolean;
  currentRoom: RoomId;
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  mirroredControls: boolean;
  onSelectMirroredControls: (mirrored: boolean) => void;
  onEnterDungeon: () => void;
  onContinueRun: () => void;
  onInteract: () => void;
}

const CONTROL_ITEMS = [
  {
    label: 'Move',
    detail: 'Drag the lower-left joystick or use WASD / Arrow keys.',
    icon: Compass,
    accent: 'text-amber-300',
  },
  {
    label: 'Attack',
    detail: 'Tap Attack (or Space / J / Enter) to swing your Knight Sword.',
    icon: Sword,
    accent: 'text-amber-300',
  },
  {
    label: 'Dash',
    detail: 'Tap Dash (or Shift / K) to evade strikes using magic.',
    icon: Zap,
    accent: 'text-sky-300',
  },
  {
    label: 'Heal',
    detail: 'Tap Heal (or H) to drink a potion and restore 40% max HP.',
    icon: Heart,
    accent: 'text-rose-300',
  },
  {
    label: 'Pause',
    detail: 'Tap Pause (upper-right) or press P to freeze the action.',
    icon: Pause,
    accent: 'text-stone-200',
  },
  {
    label: 'Map',
    detail: 'Tap Map to toggle the expanded 8-room dungeon layout.',
    icon: MapIcon,
    accent: 'text-emerald-300',
  },
  {
    label: 'Hero',
    detail: 'Tap Hero to view Knight stats, XP level, gear, and objective.',
    icon: User,
    accent: 'text-amber-200',
  },
];

const SURVIVAL_NOTES = [
  'Break barrels for supplies',
  'Clear each room to continue',
  'Use potions wisely',
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasActiveRun,
  currentRoom,
  playerLevel,
  playerHp,
  playerMaxHp,
  mirroredControls,
  onSelectMirroredControls,
  onEnterDungeon,
  onContinueRun,
  onInteract,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(true);
  const lastTouchActivationRef = useRef(0);

  const runAction = (action: () => void, isTouch = false) => {
    const now = Date.now();
    if (!isTouch && now - lastTouchActivationRef.current < 350) {
      return;
    }
    if (isTouch) {
      lastTouchActivationRef.current = now;
    }
    onInteract();
    action();
  };

  return (
    <div
      role="region"
      aria-label="Abyssal Depths Title Screen"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-stone-950 px-4 py-5"
      style={{
        paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      {/* Cinematic Dark-Fantasy Catacombs Key Art Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-gradient-to-b from-stone-950 via-emerald-950/35 to-black">
        {bgLoaded && (
          <img
            src={catacombsKeyArt}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setBgLoaded(false)}
            className="h-full w-full scale-[1.03] object-cover object-[42%_center] sm:object-center opacity-85"
          />
        )}

        {/* Torchlight & Necrotic Mist Ambient Depth Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_26%_34%,rgba(245,158,11,0.16),transparent_48%),radial-gradient(circle_at_68%_60%,rgba(16,185,129,0.14),transparent_52%)]"
        />

        {/* Vertical Contrast Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-stone-950/35 to-black/90"
        />

        {/* Dramatic Outer Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,10,9,0.18)_0%,rgba(12,10,9,0.68)_58%,rgba(3,3,3,0.96)_100%)]"
        />
      </div>

      {/* Centered Dark-Fantasy Title Card */}
      <div className="relative z-10 my-auto w-full max-w-lg rounded-2xl border border-amber-600/45 bg-stone-950/82 p-5 sm:p-8 text-center backdrop-blur-md shadow-[0_28px_90px_rgba(0,0,0,0.94),0_0_50px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(251,191,36,0.18)]">
        {/* Subtle Corner Filigree Ticks */}
        <span aria-hidden="true" className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 border-t border-l border-amber-400/50 rounded-tl-sm" />
        <span aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 border-t border-r border-amber-400/50 rounded-tr-sm" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b border-l border-amber-400/50 rounded-bl-sm" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b border-r border-amber-400/50 rounded-br-sm" />

        {/* Knight Crest */}
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/65 bg-gradient-to-b from-stone-800/95 via-stone-900 to-stone-950 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.22),inset_0_1px_0_rgba(253,224,71,0.2)]">
          <Shield className="h-7 w-7" />
        </div>

        {/* Sculpted Title Typography */}
        <h1 className="font-serif text-3xl sm:text-[2.65rem] font-black uppercase leading-none tracking-[0.14em] text-amber-200 text-balance drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
          <span className="bg-gradient-to-b from-amber-50 via-amber-300 to-amber-600 bg-clip-text text-transparent">
            ABYSSAL DEPTHS
          </span>
        </h1>

        {/* Ornamental Hairline Divider */}
        <div aria-hidden="true" className="mx-auto my-2.5 flex max-w-[220px] items-center gap-2.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/55 to-amber-400/75" />
          <div className="h-1.5 w-1.5 rotate-45 border border-amber-300/80 bg-amber-500/70" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/55 to-amber-400/75" />
        </div>

        <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.26em] text-red-400 drop-shadow-[0_2px_10px_rgba(127,29,29,0.7)]">
          THE PLAGUE CATACOMBS
        </p>

        {/* Short Mission Description */}
        <p className="mx-auto mt-4 max-w-md text-sm sm:text-[15px] leading-relaxed text-stone-100/95 text-balance drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          The dead stir beneath the ruins. Descend into the Plague Catacombs,
          survive the horrors within, and uncover the source of the corruption.
        </p>

        {/* Controller Selection (shared with Pause menu preference) */}
        <div className="mt-5 rounded-xl border border-stone-800/90 bg-stone-950/80 p-3">
          <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
            <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Controls</span>
          </div>
          <div
            role="group"
            aria-label="Controls"
            className="grid grid-cols-2 gap-2"
          >
            <button
              type="button"
              aria-pressed={!mirroredControls}
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') {
                  e.preventDefault();
                  e.stopPropagation();
                  runAction(() => onSelectMirroredControls(false), true);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                runAction(() => onSelectMirroredControls(false), false);
              }}
              style={{ touchAction: 'manipulation' }}
              className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-black uppercase tracking-wider transition active:scale-[0.98] ${
                !mirroredControls
                  ? 'border-amber-400/90 bg-amber-950/80 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.28)]'
                  : 'border-stone-700/85 bg-stone-900/75 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              Left Joystick
            </button>

            <button
              type="button"
              aria-pressed={mirroredControls}
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') {
                  e.preventDefault();
                  e.stopPropagation();
                  runAction(() => onSelectMirroredControls(true), true);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                runAction(() => onSelectMirroredControls(true), false);
              }}
              style={{ touchAction: 'manipulation' }}
              className={`flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-black uppercase tracking-wider transition active:scale-[0.98] ${
                mirroredControls
                  ? 'border-amber-400/90 bg-amber-950/80 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.28)]'
                  : 'border-stone-700/85 bg-stone-900/75 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              Right Joystick
            </button>
          </div>
        </div>

        {/* Primary Action(s) */}
        <div className="mt-3.5 flex flex-col gap-2.5">
          {hasActiveRun && (
            <button
              type="button"
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') {
                  e.preventDefault();
                  e.stopPropagation();
                  runAction(onContinueRun, true);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                runAction(onContinueRun, false);
              }}
              style={{ touchAction: 'manipulation' }}
              className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-xl border-2 border-emerald-400/80 bg-gradient-to-b from-emerald-600 to-emerald-800 px-6 py-3.5 text-base sm:text-lg font-black uppercase tracking-wider text-white shadow-[0_0_24px_rgba(16,185,129,0.34)] active:scale-[0.98] transition"
            >
              <Play className="h-5 w-5 fill-current shrink-0" />
              <span className="whitespace-nowrap">Continue</span>
              <span className="text-xs font-semibold normal-case tracking-normal text-emerald-100/90 tabular-nums">
                (Room {currentRoom}/8 · Lv.{playerLevel} · {Math.max(0, Math.ceil(playerHp))}/{playerMaxHp} HP)
              </span>
            </button>
          )}

          <button
            type="button"
            onPointerDown={(e) => {
              if (e.pointerType === 'touch') {
                e.preventDefault();
                e.stopPropagation();
                runAction(onEnterDungeon, true);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              runAction(onEnterDungeon, false);
            }}
            style={{ touchAction: 'manipulation' }}
            className={`flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-xl border-2 px-6 py-4 text-lg font-black uppercase tracking-wider active:scale-[0.98] transition ${
              hasActiveRun
                ? 'border-amber-500/75 bg-gradient-to-b from-stone-800/95 to-stone-950/95 text-amber-200 hover:border-amber-400'
                : 'border-amber-300/90 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 text-stone-950 shadow-[0_0_32px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.45)] hover:from-amber-300 hover:via-amber-400 hover:to-amber-600'
            }`}
          >
            <Sword className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">Enter Dungeon</span>
          </button>

          <button
            type="button"
            aria-expanded={showHowToPlay}
            onPointerDown={(e) => {
              if (e.pointerType === 'touch') {
                e.preventDefault();
                e.stopPropagation();
                runAction(() => setShowHowToPlay((v) => !v), true);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              runAction(() => setShowHowToPlay((v) => !v), false);
            }}
            style={{ touchAction: 'manipulation' }}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-700/90 bg-stone-900/80 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-200 hover:border-amber-600/60 hover:text-amber-200 active:scale-[0.98] transition"
          >
            <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">How to Play</span>
            {showHowToPlay ? (
              <ChevronUp className="h-4 w-4 text-stone-400 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
            )}
          </button>
        </div>

        {/* Collapsible Controls Guide */}
        {showHowToPlay && (
          <div
            aria-label="How to Play Controls"
            className="mt-3.5 rounded-xl border border-stone-800/90 bg-stone-950/85 p-3.5 text-left"
          >
            <div className="mb-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-300">
              <span>Controls</span>
              <span className="text-[11px] font-medium normal-case tracking-normal text-stone-400">
                Touch &amp; Keyboard
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CONTROL_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-2.5 rounded-lg border border-stone-800/60 bg-stone-900/75 px-2.5 py-2"
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.accent}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-100">
                        {item.label}
                      </div>
                      <div className="text-[11px] leading-snug text-stone-300">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Brief Dungeon Survival Notes */}
        <div className="mt-4 border-t border-stone-800/90 pt-3.5 text-left">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
            <span className="inline-flex items-center gap-1.5 text-amber-300/95">
              <Skull className="h-3.5 w-3.5" />
              <span>Dungeon Notes</span>
            </span>
            {hasActiveRun && (
              <span className="truncate text-[11px] font-medium normal-case tracking-normal text-stone-400">
                Current: {ROOM_NAMES[currentRoom]}
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 text-xs text-stone-200/90">
            {SURVIVAL_NOTES.map((note) => (
              <li key={note} className="leading-relaxed">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
