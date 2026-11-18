import { EnemyVariant } from '../types/game';

export const BASE_PLAYER_MAX_HP = 100;
export const HP_BONUS_PER_LEVEL = 10;
export const BASE_PLAYER_MAX_MAGIC = 100;
export const STARTING_HEALING_POTIONS = 3;
export const POTION_HEAL_RATIO = 0.4;
export const HEALTH_REGEN_RATE_PER_SEC = 0.02;
export const HEALTH_REGEN_DELAY_SEC = 5.0;
export const MAGIC_REGEN_RATE_OUT_OF_COMBAT = 0.04;
export const MAGIC_REGEN_RATE_IN_COMBAT = 0.02;
export const DASH_MAGIC_COST = 15;

export const XP_REWARDS = {
  regularSkeleton: 25,
  stalker: 30,
  brute: 45,
  wraith: 45,
  guardian: 75,
  dreadlord: 125,
  dungeonKey: 25,
  dungeonComplete: 100,
} as const;

export function getEnemyXpReward(variant: EnemyVariant): number {
  switch (variant) {
    case 'guardian':
      return XP_REWARDS.guardian;
    case 'dreadlord':
      return XP_REWARDS.dreadlord;
    case 'stalker':
      return XP_REWARDS.stalker;
    case 'brute':
      return XP_REWARDS.brute;
    case 'wraith':
      return XP_REWARDS.wraith;
    default:
      return XP_REWARDS.regularSkeleton;
  }
}

/**
 * Cumulative XP required to reach a given level:
 * - Level 1: 0 XP
 * - Level 2: 100 XP (+100)
 * - Level 3: 250 XP (+150)
 * - Level 4: 450 XP (+200)
 * - Level 5: 700 XP (+250)
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * level * (level + 1) - 50;
}

export function getLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (safeXp >= getCumulativeXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function getMaxHealthForLevel(level: number): number {
  return BASE_PLAYER_MAX_HP + Math.max(0, level - 1) * HP_BONUS_PER_LEVEL;
}

export function getLevelProgress(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = getLevelFromXp(safeXp);
  const currentLevelMinXp = getCumulativeXpForLevel(level);
  const nextLevelXp = getCumulativeXpForLevel(level + 1);
  const xpIntoLevel = safeXp - currentLevelMinXp;
  const xpRequiredForNext = nextLevelXp - currentLevelMinXp;
  const progressPct =
    xpRequiredForNext > 0
      ? Math.max(0, Math.min(100, (xpIntoLevel / xpRequiredForNext) * 100))
      : 100;

  return {
    level,
    xp: safeXp,
    currentLevelMinXp,
    nextLevelXp,
    xpIntoLevel,
    xpRequiredForNext,
    progressPct,
    maxHp: getMaxHealthForLevel(level),
  };
}
