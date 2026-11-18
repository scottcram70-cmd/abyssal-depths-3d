import { EnemyVariant, LootDropItem } from '../types/game';

function randomIntInclusive(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Barrel loot table:
 * - 45%: Gold (5-20 coins)
 * - 20%: 1 Healing Potion
 * - 35%: Empty
 */
export function rollBarrelLoot(
  barrelId: string,
  x: number,
  z: number,
  rng: () => number = Math.random
): LootDropItem | null {
  const roll = rng();

  if (roll < 0.45) {
    return {
      id: `loot-barrel-${barrelId}`,
      sourceId: barrelId,
      type: 'gold',
      x,
      z,
      amount: randomIntInclusive(5, 20, rng),
      age: 0,
    };
  }

  if (roll < 0.65) {
    return {
      id: `loot-barrel-${barrelId}`,
      sourceId: barrelId,
      type: 'potion',
      x,
      z,
      amount: 1,
      age: 0,
    };
  }

  return null;
}

/**
 * Enemy loot table:
 * - Bosses ('guardian', 'dreadlord') award a guaranteed quantity of gold.
 * - Regular enemies ('warrior') have modest gold/potion drop chances.
 * - Stronger enemies ('stalker', 'brute', 'wraith') have somewhat higher drop chances.
 */
export function rollEnemyLoot(
  enemyId: string,
  variant: EnemyVariant,
  x: number,
  z: number,
  rng: () => number = Math.random
): LootDropItem | null {
  if (variant === 'guardian') {
    return {
      id: `loot-enemy-${enemyId}`,
      sourceId: enemyId,
      type: 'gold',
      x,
      z,
      amount: 50,
      age: 0,
    };
  }

  if (variant === 'dreadlord') {
    return {
      id: `loot-enemy-${enemyId}`,
      sourceId: enemyId,
      type: 'gold',
      x,
      z,
      amount: 90,
      age: 0,
    };
  }

  const roll = rng();

  if (variant === 'warrior') {
    // 25% gold (8-16), 8% potion (1), 67% empty
    if (roll < 0.25) {
      return {
        id: `loot-enemy-${enemyId}`,
        sourceId: enemyId,
        type: 'gold',
        x,
        z,
        amount: randomIntInclusive(8, 16, rng),
        age: 0,
      };
    }
    if (roll < 0.33) {
      return {
        id: `loot-enemy-${enemyId}`,
        sourceId: enemyId,
        type: 'potion',
        x,
        z,
        amount: 1,
        age: 0,
      };
    }
    return null;
  }

  if (variant === 'stalker') {
    // 32% gold (10-20), 10% potion (1), 58% empty
    if (roll < 0.32) {
      return {
        id: `loot-enemy-${enemyId}`,
        sourceId: enemyId,
        type: 'gold',
        x,
        z,
        amount: randomIntInclusive(10, 20, rng),
        age: 0,
      };
    }
    if (roll < 0.42) {
      return {
        id: `loot-enemy-${enemyId}`,
        sourceId: enemyId,
        type: 'potion',
        x,
        z,
        amount: 1,
        age: 0,
      };
    }
    return null;
  }

  // Stronger variants ('brute', 'wraith'): 42% gold (15-28), 14% potion (1), 44% empty
  if (roll < 0.42) {
    return {
      id: `loot-enemy-${enemyId}`,
      sourceId: enemyId,
      type: 'gold',
      x,
      z,
      amount: randomIntInclusive(15, 28, rng),
      age: 0,
    };
  }
  if (roll < 0.56) {
    return {
      id: `loot-enemy-${enemyId}`,
      sourceId: enemyId,
      type: 'potion',
      x,
      z,
      amount: 1,
      age: 0,
    };
  }

  return null;
}
