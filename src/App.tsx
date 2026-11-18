import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { DungeonEnvironment } from './components/DungeonEnvironment';
import { PlayerCharacter } from './components/PlayerCharacter';
import { SkeletonEnemy } from './components/SkeletonEnemy';
import {
  CombatParticles3D,
  DamageNumbersOverlay,
  ProjectedDamageNumber,
} from './components/CombatEffects';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { getDesiredMusicTrack, soundManager } from './audio/soundManager';
import {
  CHECKPOINT_ROOM_3_SPAWN,
  DUNGEON_OBSTACLES,
  EXIT_PORTAL_POSITION,
  GateUnlockState,
  INITIAL_ENEMY_SPAWNS,
  KEY_POSITION,
  LOCKED_GATE_POSITION,
  PLAYER_SPAWN,
  POTION_SPAWNS,
  SANCTUM_GATE_POSITION,
  WARDEN_GATE_POSITION,
  getRoomIdForPosition,
  hasLineOfSight,
  resolveMovementCollision,
} from './utils/obstacles';
import {
  BASE_PLAYER_MAX_HP,
  BASE_PLAYER_MAX_MAGIC,
  DASH_MAGIC_COST,
  HEALTH_REGEN_DELAY_SEC,
  HEALTH_REGEN_RATE_PER_SEC,
  MAGIC_REGEN_RATE_IN_COMBAT,
  MAGIC_REGEN_RATE_OUT_OF_COMBAT,
  POTION_HEAL_RATIO,
  STARTING_HEALING_POTIONS,
  XP_REWARDS,
  getEnemyXpReward,
  getLevelFromXp,
  getMaxHealthForLevel,
} from './utils/progression';
import { rollBarrelLoot, rollEnemyLoot } from './utils/loot';
import {
  EnemyRuntime,
  LootDropItem,
  MapEnemyPin,
  RoomId,
  SparkParticle,
  Vector2D,
} from './types/game';

// Probe software WebGL once (never throttle game logic, only GPU cost)
const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

const PLAYER_SPEED = 4.7;
const DASH_SPEED = 11.5;
const DASH_DURATION = 0.18;
const DASH_COOLDOWN = 1.05;
const ATTACK_DURATION = 0.36;
const ATTACK_COOLDOWN = 0.52;
const ENEMY_ATTACK_DURATION = 0.78;
const ENEMY_ATTACK_COOLDOWN = 1.35;

const _projVec = new THREE.Vector3();

function createInitialEnemies(): EnemyRuntime[] {
  return INITIAL_ENEMY_SPAWNS.map((cfg) => ({
    ...cfg,
    x: cfg.position[0],
    z: cfg.position[1],
    rot: 0,
    hp: cfg.maxHealth,
    state: 'idle',
    attackTimer: 0,
    cooldownTimer: 0,
    hurtTimer: 0,
    hitFlashTimer: 0,
    hasDealtDamage: false,
    deathSoundPlayed: false,
    xpAwarded: false,
  }));
}

function getObjectiveText(
  roomId: RoomId,
  enemies: EnemyRuntime[],
  hasKey: boolean,
  doorUnlocked: boolean,
  sanctumUnlocked: boolean,
  wardenUnlocked: boolean,
  portalActive: boolean
): string {
  if (roomId === 1) {
    const r1Alive = enemies.some((e) => e.roomId === 1 && e.hp > 0);
    return r1Alive
      ? 'Defeat the Crypt Skeleton & head north'
      : 'Chamber cleared — proceed north into the corridor';
  }
  if (roomId === 2) {
    if (!hasKey) {
      return 'Find the Golden Key to unlock the north gate';
    }
    if (!doorUnlocked) {
      return 'Key acquired! Approach the north gate to unlock it';
    }
    return 'Gate unlocked — enter the Abyssal Sanctum north';
  }
  if (roomId === 3) {
    if (!sanctumUnlocked) {
      return 'Defeat the Skeleton Guardian to unseal the north gate';
    }
    return 'Sanctum unsealed — continue north into the Plague Catacombs';
  }
  if (roomId === 4) {
    const r4Alive = enemies.some((e) => e.roomId === 4 && e.hp > 0);
    return r4Alive
      ? 'Clear the Plague Catacombs & push east'
      : 'Catacombs cleared — take the east bridge to Room 5';
  }
  if (roomId === 5) {
    const r5Alive = enemies.some((e) => e.roomId === 5 && e.hp > 0);
    return r5Alive
      ? 'Battle through the Shattered Ossuary'
      : 'Ossuary cleared — head south to the Arcane Conduit';
  }
  if (roomId === 6) {
    const r6Alive = enemies.some((e) => e.roomId === 6 && e.hp > 0);
    return r6Alive
      ? 'Defeat the Arcane Conduit defenders'
      : "Conduit cleared — march south to Warden's Bastion";
  }
  if (roomId === 7) {
    if (!wardenUnlocked) {
      return 'Defeat the Abyssal Dreadlord mini-boss to unlock the final gate';
    }
    return 'Warden defeated! Proceed south to the Throne of Escape';
  }
  if (!portalActive) {
    return 'Defeat the final guardians to awaken the Exit Portal';
  }
  return 'Portal active! Step into the Exit Portal to escape';
}

interface HudSyncPayload {
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
  attackCooldownRatio: number;
  dashCooldownRatio: number;
  damageNumbers: ProjectedDamageNumber[];
}

interface GameWorldProps {
  joystickRef: React.MutableRefObject<Vector2D>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  attackRequestedRef: React.MutableRefObject<boolean>;
  dashRequestedRef: React.MutableRefObject<boolean>;
  healRequestedRef: React.MutableRefObject<boolean>;
  characterXpRef: React.MutableRefObject<number>;
  hasEnteredDungeon: boolean;
  hasEnteredDungeonRef: React.MutableRefObject<boolean>;
  isPaused: boolean;
  isPausedRef: React.MutableRefObject<boolean>;
  resetCounter: number;
  checkpointCounter: number;
  onHudSync: (data: HudSyncPayload) => void;
}

const GameWorld: React.FC<GameWorldProps> = ({
  joystickRef,
  keysRef,
  attackRequestedRef,
  dashRequestedRef,
  healRequestedRef,
  characterXpRef,
  hasEnteredDungeon,
  hasEnteredDungeonRef,
  isPaused,
  isPausedRef,
  resetCounter,
  checkpointCounter,
  onHudSync,
}) => {
  const { camera } = useThree();

  const simRef = useRef({
    playerPos: { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1] },
    playerRot: Math.PI,
    playerHp: getMaxHealthForLevel(getLevelFromXp(characterXpRef.current)),
    playerMagic: BASE_PLAYER_MAX_MAGIC,
    healingPotions: STARTING_HEALING_POTIONS,
    gold: 0,
    timeSinceCombatAction: HEALTH_REGEN_DELAY_SEC,
    xp: characterXpRef.current,
    level: getLevelFromXp(characterXpRef.current),
    levelUpNoticeTimer: 0,
    levelUpDisplayLevel: getLevelFromXp(characterXpRef.current),
    playerHitTimer: 0,
    isMoving: false,
    isAttacking: false,
    attackTimer: 0,
    attackCooldownTimer: 0,
    hasDealtSwingDamage: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldownTimer: 0,
    dashDir: { x: 0, z: -1 },

    enemies: createInitialEnemies(),
    destroyedObstacles: new Set<string>(),
    lootedBarrelIds: new Set<string>(),
    lootedEnemyIds: new Set<string>(),
    droppedLoot: [] as LootDropItem[],
    discoveredRooms: new Set<RoomId>([1]),
    checkpointRoom: null as RoomId | null,
    checkpointNoticeTimer: 0,
    hasKey: false,
    keyXpAwarded: false,
    collectedPotions: new Set<string>(),
    potionNoticeTimer: 0,
    potionPickupNoticeTimer: 0,
    goldNoticeTimer: 0,
    lastGoldPickedUp: 0,
    doorUnlocked: false,
    sanctumUnlocked: false,
    wardenUnlocked: false,
    dungeonCompleted: false,
    completionXpAwarded: false,

    shakeIntensity: 0,
    camTarget: { x: PLAYER_SPAWN[0] * 0.6, z: PLAYER_SPAWN[1] },
    particles: [] as SparkParticle[],
    damageNumbers: [] as {
      id: string;
      value: number;
      x: number;
      y: number;
      z: number;
      color: string;
      lifetime: number;
      isCrit?: boolean;
    }[],
    impactRing: null as { x: number; z: number; progress: number } | null,
  });

  const [renderState, setRenderState] = useState(() => ({
    playerPos: [PLAYER_SPAWN[0], 0, PLAYER_SPAWN[1]] as [number, number, number],
    playerRot: Math.PI,
    isMoving: false,
    isAttacking: false,
    attackProgress: 0,
    isDashing: false,
    playerHit: false,
    enemies: createInitialEnemies(),
    destroyedObstacles: new Set<string>(),
    hasKey: false,
    collectedPotions: new Set<string>(),
    droppedLoot: [] as LootDropItem[],
    doorUnlocked: false,
    sanctumUnlocked: false,
    wardenUnlocked: false,
    portalActive: false,
    particles: [] as SparkParticle[],
    impactRing: null as { x: number; z: number; progress: number } | null,
  }));

  const lastHudSyncRef = useRef(0);
  const prevCheckpointCounterRef = useRef(checkpointCounter);

  // Reset dungeon-specific state when Restart is triggered while preserving session XP & Level
  useEffect(() => {
    const freshEnemies = createInitialEnemies();
    const preservedXp = characterXpRef.current;
    const preservedLevel = getLevelFromXp(preservedXp);
    const preservedMaxHp = getMaxHealthForLevel(preservedLevel);

    simRef.current = {
      playerPos: { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1] },
      playerRot: Math.PI,
      playerHp: preservedMaxHp,
      playerMagic: BASE_PLAYER_MAX_MAGIC,
      healingPotions: STARTING_HEALING_POTIONS,
      gold: 0,
      timeSinceCombatAction: HEALTH_REGEN_DELAY_SEC,
      xp: preservedXp,
      level: preservedLevel,
      levelUpNoticeTimer: 0,
      levelUpDisplayLevel: preservedLevel,
      playerHitTimer: 0,
      isMoving: false,
      isAttacking: false,
      attackTimer: 0,
      attackCooldownTimer: 0,
      hasDealtSwingDamage: false,
      isDashing: false,
      dashTimer: 0,
      dashCooldownTimer: 0,
      dashDir: { x: 0, z: -1 },

      enemies: freshEnemies,
      destroyedObstacles: new Set<string>(),
      lootedBarrelIds: new Set<string>(),
      lootedEnemyIds: new Set<string>(),
      droppedLoot: [],
      discoveredRooms: new Set<RoomId>([1]),
      checkpointRoom: null,
      checkpointNoticeTimer: 0,
      hasKey: false,
      keyXpAwarded: false,
      collectedPotions: new Set<string>(),
      potionNoticeTimer: 0,
      potionPickupNoticeTimer: 0,
      goldNoticeTimer: 0,
      lastGoldPickedUp: 0,
      doorUnlocked: false,
      sanctumUnlocked: false,
      wardenUnlocked: false,
      dungeonCompleted: false,
      completionXpAwarded: false,

      shakeIntensity: 0,
      camTarget: { x: PLAYER_SPAWN[0] * 0.6, z: PLAYER_SPAWN[1] },
      particles: [],
      damageNumbers: [],
      impactRing: null,
    };

    camera.position.set(8.5, 11.6, PLAYER_SPAWN[1] + 8.5);
    camera.lookAt(0, 0.7, PLAYER_SPAWN[1]);

    onHudSync({
      playerHp: preservedMaxHp,
      playerMaxHp: preservedMaxHp,
      playerMagic: BASE_PLAYER_MAX_MAGIC,
      playerMaxMagic: BASE_PLAYER_MAX_MAGIC,
      healingPotions: STARTING_HEALING_POTIONS,
      gold: 0,
      inCombat: false,
      isHealthRegenerating: false,
      isMagicRegenerating: false,
      playerXp: preservedXp,
      playerLevel: preservedLevel,
      playerPos: { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1] },
      playerRot: Math.PI,
      currentRoom: 1,
      discoveredRooms: [1],
      enemies: freshEnemies.map((e) => ({
        id: e.id,
        roomId: e.roomId,
        x: e.x,
        z: e.z,
        hp: e.hp,
        variant: e.variant,
        name: e.name,
      })),
      enemiesDefeated: 0,
      totalEnemies: freshEnemies.length,
      objectiveText: getObjectiveText(1, freshEnemies, false, false, false, false, false),
      hasKey: false,
      collectedPotionIds: [],
      doorUnlocked: false,
      sanctumUnlocked: false,
      wardenUnlocked: false,
      portalActive: false,
      showHealthRestored: false,
      showPotionPickedUp: false,
      showGoldPickedUp: false,
      lastGoldPickedUp: 0,
      showLevelUp: false,
      levelUpLevel: preservedLevel,
      checkpointRoom: null,
      showCheckpointActivated: false,
      activeEnemyName: freshEnemies[0].name,
      activeEnemyHp: freshEnemies[0].hp,
      activeEnemyMaxHp: freshEnemies[0].maxHealth,
      dungeonCompleted: false,
      playerDefeated: false,
      attackCooldownRatio: 0,
      dashCooldownRatio: 0,
      damageNumbers: [],
    });
  }, [resetCounter, camera, onHudSync, characterXpRef]);

  // Respawn at active Room 3 checkpoint with full health while preserving XP, levels, attributes, potions & inventory
  useEffect(() => {
    if (checkpointCounter === prevCheckpointCounterRef.current) return;
    prevCheckpointCounterRef.current = checkpointCounter;

    const sim = simRef.current;
    const spawn = CHECKPOINT_ROOM_3_SPAWN;
    const preservedXp = characterXpRef.current;
    const preservedLevel = getLevelFromXp(preservedXp);
    const preservedMaxHp = getMaxHealthForLevel(preservedLevel);

    sim.playerPos = { x: spawn[0], z: spawn[1] };
    sim.playerRot = Math.PI;
    sim.playerHp = preservedMaxHp;
    sim.playerMagic = BASE_PLAYER_MAX_MAGIC;
    sim.timeSinceCombatAction = HEALTH_REGEN_DELAY_SEC;
    sim.xp = preservedXp;
    sim.level = preservedLevel;
    sim.levelUpNoticeTimer = 0;
    sim.playerHitTimer = 0;
    sim.isMoving = false;
    sim.isAttacking = false;
    sim.attackTimer = 0;
    sim.attackCooldownTimer = 0;
    sim.hasDealtSwingDamage = false;
    sim.isDashing = false;
    sim.dashTimer = 0;
    sim.dashCooldownTimer = 0;
    sim.dashDir = { x: 0, z: -1 };
    sim.potionNoticeTimer = 0;
    sim.potionPickupNoticeTimer = 0;
    sim.goldNoticeTimer = 0;
    sim.lastGoldPickedUp = 0;
    sim.checkpointNoticeTimer = 0;
    sim.dungeonCompleted = false;

    sim.enemies = sim.enemies.map((enemy) => {
      if (enemy.hp <= 0) {
        return {
          ...enemy,
          hp: 0,
          state: 'dead',
        };
      }
      const cfg = INITIAL_ENEMY_SPAWNS.find((s) => s.id === enemy.id);
      return {
        ...enemy,
        x: cfg ? cfg.position[0] : enemy.x,
        z: cfg ? cfg.position[1] : enemy.z,
        rot: 0,
        hp: cfg ? cfg.maxHealth : enemy.maxHealth,
        state: 'idle',
        attackTimer: 0,
        cooldownTimer: 0,
        hurtTimer: 0,
        hitFlashTimer: 0,
        hasDealtDamage: false,
      };
    });

    sim.shakeIntensity = 0;
    sim.camTarget = { x: spawn[0] * 0.58, z: spawn[1] };
    sim.particles = [];
    sim.damageNumbers = [];
    sim.impactRing = null;

    camera.position.set(8.5, 11.6, spawn[1] + 8.5);
    camera.lookAt(0, 0.7, spawn[1]);

    const portalActive = sim.enemies
      .filter((e) => e.roomId === 8)
      .every((e) => e.hp <= 0);

    setRenderState({
      playerPos: [spawn[0], 0, spawn[1]],
      playerRot: Math.PI,
      isMoving: false,
      isAttacking: false,
      attackProgress: 0,
      isDashing: false,
      playerHit: false,
      enemies: sim.enemies.map((e) => ({ ...e })),
      destroyedObstacles: new Set(sim.destroyedObstacles),
      hasKey: sim.hasKey,
      collectedPotions: new Set(sim.collectedPotions),
      droppedLoot: sim.droppedLoot.map((item) => ({ ...item })),
      doorUnlocked: sim.doorUnlocked,
      sanctumUnlocked: sim.sanctumUnlocked,
      wardenUnlocked: sim.wardenUnlocked,
      portalActive,
      particles: [],
      impactRing: null,
    });

    const respawnRoom = getRoomIdForPosition(spawn[0], spawn[1]);
    sim.discoveredRooms.add(respawnRoom);
    let nearestEnemy: EnemyRuntime | null = null;
    let nearestDist = 11.0;
    for (let i = 0; i < sim.enemies.length; i++) {
      const e = sim.enemies[i];
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - spawn[0], e.z - spawn[1]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = e;
      }
    }

    onHudSync({
      playerHp: preservedMaxHp,
      playerMaxHp: preservedMaxHp,
      playerMagic: BASE_PLAYER_MAX_MAGIC,
      playerMaxMagic: BASE_PLAYER_MAX_MAGIC,
      healingPotions: sim.healingPotions,
      gold: sim.gold,
      inCombat: false,
      isHealthRegenerating: false,
      isMagicRegenerating: false,
      playerXp: preservedXp,
      playerLevel: preservedLevel,
      playerPos: { x: spawn[0], z: spawn[1] },
      playerRot: Math.PI,
      currentRoom: respawnRoom,
      discoveredRooms: Array.from(sim.discoveredRooms),
      enemies: sim.enemies.map((e) => ({
        id: e.id,
        roomId: e.roomId,
        x: e.x,
        z: e.z,
        hp: e.hp,
        variant: e.variant,
        name: e.name,
      })),
      enemiesDefeated: sim.enemies.filter((e) => e.hp <= 0).length,
      totalEnemies: sim.enemies.length,
      objectiveText: getObjectiveText(
        respawnRoom,
        sim.enemies,
        sim.hasKey,
        sim.doorUnlocked,
        sim.sanctumUnlocked,
        sim.wardenUnlocked,
        portalActive
      ),
      hasKey: sim.hasKey,
      collectedPotionIds: Array.from(sim.collectedPotions),
      doorUnlocked: sim.doorUnlocked,
      sanctumUnlocked: sim.sanctumUnlocked,
      wardenUnlocked: sim.wardenUnlocked,
      portalActive,
      showHealthRestored: false,
      showPotionPickedUp: false,
      showGoldPickedUp: false,
      lastGoldPickedUp: 0,
      showLevelUp: false,
      levelUpLevel: preservedLevel,
      checkpointRoom: sim.checkpointRoom,
      showCheckpointActivated: false,
      activeEnemyName: nearestEnemy ? nearestEnemy.name : null,
      activeEnemyHp: nearestEnemy ? nearestEnemy.hp : 0,
      activeEnemyMaxHp: nearestEnemy ? nearestEnemy.maxHealth : 0,
      dungeonCompleted: false,
      playerDefeated: false,
      attackCooldownRatio: 0,
      dashCooldownRatio: 0,
      damageNumbers: [],
    });
  }, [checkpointCounter, camera, onHudSync, characterXpRef]);

  const spawnParticles = useCallback(
    (x: number, y: number, z: number, color: string, count: number) => {
      const list = simRef.current.particles;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 3.8;
        list.push({
          id: `${Date.now()}-${Math.random()}`,
          x,
          y,
          z,
          vx: Math.cos(angle) * speed,
          vy: 1.5 + Math.random() * 3.5,
          vz: Math.sin(angle) * speed,
          color,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.55,
          size: 0.04 + Math.random() * 0.045,
        });
      }
    },
    []
  );

  useFrame((state, rawDelta) => {
    if (!hasEnteredDungeonRef.current || isPausedRef.current) {
      attackRequestedRef.current = false;
      dashRequestedRef.current = false;
      healRequestedRef.current = false;
      return;
    }

    const dt = Math.min(rawDelta, 0.05);
    const sim = simRef.current;

    const playerAlive = sim.playerHp > 0 && !sim.dungeonCompleted;
    let forceHudSync = false;

    const awardXp = (amount: number) => {
      if (amount <= 0) return;
      sim.xp += amount;
      characterXpRef.current = sim.xp;
      const nextLevel = getLevelFromXp(sim.xp);
      if (nextLevel > sim.level) {
        const oldMaxHp = getMaxHealthForLevel(sim.level);
        const newMaxHp = getMaxHealthForLevel(nextLevel);
        sim.level = nextLevel;
        sim.playerHp = Math.min(newMaxHp, sim.playerHp + (newMaxHp - oldMaxHp));
        sim.levelUpDisplayLevel = nextLevel;
        sim.levelUpNoticeTimer = 2.8;
        spawnParticles(sim.playerPos.x, 1.15, sim.playerPos.z, '#fbbf24', 22);
      }
      forceHudSync = true;
    };

    // 1. Decay timers & advance out-of-combat clock
    if (sim.attackCooldownTimer > 0) sim.attackCooldownTimer = Math.max(0, sim.attackCooldownTimer - dt);
    if (sim.dashCooldownTimer > 0) sim.dashCooldownTimer = Math.max(0, sim.dashCooldownTimer - dt);
    if (sim.playerHitTimer > 0) sim.playerHitTimer = Math.max(0, sim.playerHitTimer - dt);
    if (sim.potionNoticeTimer > 0) sim.potionNoticeTimer = Math.max(0, sim.potionNoticeTimer - dt);
    if (sim.potionPickupNoticeTimer > 0) sim.potionPickupNoticeTimer = Math.max(0, sim.potionPickupNoticeTimer - dt);
    if (sim.goldNoticeTimer > 0) sim.goldNoticeTimer = Math.max(0, sim.goldNoticeTimer - dt);
    if (sim.levelUpNoticeTimer > 0) sim.levelUpNoticeTimer = Math.max(0, sim.levelUpNoticeTimer - dt);
    if (sim.checkpointNoticeTimer > 0) sim.checkpointNoticeTimer = Math.max(0, sim.checkpointNoticeTimer - dt);
    if (sim.shakeIntensity > 0) sim.shakeIntensity = Math.max(0, sim.shakeIntensity - dt * 1.8);
    if (playerAlive) {
      sim.timeSinceCombatAction += dt;
    }

    for (let i = 0; i < sim.enemies.length; i++) {
      const e = sim.enemies[i];
      if (e.cooldownTimer > 0) e.cooldownTimer = Math.max(0, e.cooldownTimer - dt);
      if (e.hitFlashTimer > 0) e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
    }

    // 2. Gather movement input (Virtual Joystick + WASD / Arrow Keys)
    let inputX = joystickRef.current.x;
    let inputY = joystickRef.current.y;

    const keys = keysRef.current;
    if (keys['KeyW'] || keys['ArrowUp']) inputY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) inputY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 1) {
      inputX /= inputLen;
      inputY /= inputLen;
    }

    const isoScale = Math.SQRT1_2;
    const moveWorldX = (inputX + inputY) * isoScale;
    const moveWorldZ = (-inputX + inputY) * isoScale;
    const hasMoveInput = inputLen > 0.12;

    // Helper: find nearest living enemy within distance
    const findNearestLivingEnemy = (maxDist: number): EnemyRuntime | null => {
      let best: EnemyRuntime | null = null;
      let bestDist = maxDist;
      for (let i = 0; i < sim.enemies.length; i++) {
        const e = sim.enemies[i];
        if (e.hp <= 0) continue;
        const d = Math.hypot(e.x - sim.playerPos.x, e.z - sim.playerPos.z);
        if (d < bestDist) {
          bestDist = d;
          best = e;
        }
      }
      return best;
    };

    // 3. Handle Player Attack request (auto-faces nearest living enemy)
    if (attackRequestedRef.current) {
      attackRequestedRef.current = false;
      if (playerAlive && !sim.isAttacking && sim.attackCooldownTimer <= 0 && !sim.isDashing) {
        sim.isAttacking = true;
        sim.attackTimer = 0;
        sim.attackCooldownTimer = ATTACK_COOLDOWN;
        sim.hasDealtSwingDamage = false;
        sim.timeSinceCombatAction = 0;
        soundManager.playSwordSwing();

        const targetEnemy = findNearestLivingEnemy(6.5);
        if (targetEnemy) {
          sim.playerRot = Math.atan2(
            targetEnemy.x - sim.playerPos.x,
            targetEnemy.z - sim.playerPos.z
          );
        }
      }
    }

    // 4. Handle Player Dash request
    if (dashRequestedRef.current) {
      dashRequestedRef.current = false;
      if (playerAlive && !sim.isDashing && sim.dashCooldownTimer <= 0) {
        sim.isDashing = true;
        sim.isAttacking = false;
        sim.dashTimer = DASH_DURATION;
        sim.dashCooldownTimer = DASH_COOLDOWN;
        sim.playerMagic = Math.max(0, sim.playerMagic - DASH_MAGIC_COST);
        soundManager.playDash();
        forceHudSync = true;

        if (hasMoveInput) {
          const norm = Math.hypot(moveWorldX, moveWorldZ) || 1;
          sim.dashDir = { x: moveWorldX / norm, z: moveWorldZ / norm };
          sim.playerRot = Math.atan2(sim.dashDir.x, sim.dashDir.z);
        } else {
          sim.dashDir = {
            x: Math.sin(sim.playerRot),
            z: Math.cos(sim.playerRot),
          };
        }
      }
    }

    // 4b. Handle Player HEAL request (restores 40% max HP, capped at max HP)
    if (healRequestedRef.current) {
      healRequestedRef.current = false;
      const healMaxHp = getMaxHealthForLevel(sim.level);
      if (playerAlive && sim.healingPotions > 0 && sim.playerHp < healMaxHp) {
        sim.healingPotions -= 1;
        sim.playerHp = Math.min(healMaxHp, sim.playerHp + healMaxHp * POTION_HEAL_RATIO);
        sim.potionNoticeTimer = 2.2;
        soundManager.playDash();
        spawnParticles(sim.playerPos.x, 1.1, sim.playerPos.z, '#ef4444', 16);
        spawnParticles(sim.playerPos.x, 1.25, sim.playerPos.z, '#fca5a5', 8);
        forceHudSync = true;
      }
    }

    const unlockedGates: GateUnlockState = {
      iron: sim.doorUnlocked,
      sanctum: sim.sanctumUnlocked,
      warden: sim.wardenUnlocked,
    };

    // 5. Player Attack Execution & Movement (non-exclusive: move & swing simultaneously)
    if (playerAlive) {
      if (sim.isAttacking) {
        sim.attackTimer += dt;
        const progress = Math.min(1, sim.attackTimer / ATTACK_DURATION);

        if (progress >= 0.44 && !sim.hasDealtSwingDamage) {
          sim.hasDealtSwingDamage = true;
          const ringX = sim.playerPos.x + Math.sin(sim.playerRot) * 1.1;
          const ringZ = sim.playerPos.z + Math.cos(sim.playerRot) * 1.1;
          sim.impactRing = { x: ringX, z: ringZ, progress: 0.01 };

          const fwdX = Math.sin(sim.playerRot);
          const fwdZ = Math.cos(sim.playerRot);

          // Check hits against all living enemies in swing arc
          for (let i = 0; i < sim.enemies.length; i++) {
            const enemy = sim.enemies[i];
            if (enemy.hp <= 0) continue;

            const dx = enemy.x - sim.playerPos.x;
            const dz = enemy.z - sim.playerPos.z;
            const dist = Math.hypot(dx, dz);
            const dot = dist > 0.001 ? (dx / dist) * fwdX + (dz / dist) * fwdZ : 1;
            const reach = 2.45 + (enemy.scale - 1) * 0.45;

            if (dist <= reach && (dot >= 0.08 || dist < 1.25)) {
              const isCrit = Math.random() < 0.25;
              const dmg = isCrit
                ? 34 + Math.floor(Math.random() * 8)
                : 22 + Math.floor(Math.random() * 7);

              enemy.hp = Math.max(0, enemy.hp - dmg);
              enemy.hitFlashTimer = 0.18;
              sim.shakeIntensity = Math.max(sim.shakeIntensity, isCrit ? 0.28 : 0.16);

              soundManager.playHitSound(isCrit);
              spawnParticles(
                enemy.x,
                1.05 * enemy.scale,
                enemy.z,
                isCrit ? '#fbbf24' : '#e5e7eb',
                isCrit ? 16 : 10
              );

              sim.damageNumbers.push({
                id: `${Date.now()}-${Math.random()}`,
                value: dmg,
                x: enemy.x + (Math.random() - 0.5) * 0.3,
                y: 1.85 * enemy.scale,
                z: enemy.z,
                color: isCrit ? '#fbbf24' : '#ffffff',
                lifetime: 0.9,
                isCrit,
              });

              if (dist > 0.001) {
                const kbForce =
                  enemy.variant === 'guardian' || enemy.variant === 'dreadlord'
                    ? 0.25
                    : enemy.variant === 'brute'
                      ? 0.32
                      : 0.48;
                const kb = resolveMovementCollision(
                  enemy.x + (dx / dist) * kbForce,
                  enemy.z + (dz / dist) * kbForce,
                  0.5 * enemy.scale,
                  sim.destroyedObstacles,
                  unlockedGates
                );
                enemy.x = kb.x;
                enemy.z = kb.z;
              }

              if (enemy.hp <= 0) {
                enemy.state = 'dead';
                if (!enemy.deathSoundPlayed) {
                  enemy.deathSoundPlayed = true;
                  soundManager.playBoneCrumble();
                  spawnParticles(enemy.x, 0.8, enemy.z, '#d6cbb5', 18);
                }
                if (!enemy.xpAwarded) {
                  enemy.xpAwarded = true;
                  awardXp(getEnemyXpReward(enemy.variant));
                }
                if (!sim.lootedEnemyIds.has(enemy.id)) {
                  sim.lootedEnemyIds.add(enemy.id);
                  const drop = rollEnemyLoot(enemy.id, enemy.variant, enemy.x, enemy.z);
                  if (drop) {
                    sim.droppedLoot.push(drop);
                    spawnParticles(
                      drop.x,
                      0.55,
                      drop.z,
                      drop.type === 'gold' ? '#fbbf24' : '#ef4444',
                      10
                    );
                  }
                }
              } else if (enemy.state !== 'attack') {
                enemy.state = 'hurt';
                enemy.hurtTimer = 0.22;
              }
            }
          }

          // Check hits against intact destructible barrels
          for (let i = 0; i < DUNGEON_OBSTACLES.length; i++) {
            const obs = DUNGEON_OBSTACLES[i];
            if (!obs.destructible || sim.destroyedObstacles.has(obs.id)) continue;

            const dx = obs.position[0] - sim.playerPos.x;
            const dz = obs.position[2] - sim.playerPos.z;
            const dist = Math.hypot(dx, dz);
            const dot = dist > 0.001 ? (dx / dist) * fwdX + (dz / dist) * fwdZ : 1;

            if (dist <= 2.25 && (dot >= 0.0 || dist < 1.15)) {
              sim.destroyedObstacles.add(obs.id);
              sim.shakeIntensity = Math.max(sim.shakeIntensity, 0.1);
              soundManager.playHitSound(false);
              spawnParticles(obs.position[0], 0.55, obs.position[2], '#b45309', 12);
              spawnParticles(obs.position[0], 0.65, obs.position[2], '#78350f', 8);
              if (!sim.lootedBarrelIds.has(obs.id)) {
                sim.lootedBarrelIds.add(obs.id);
                const drop = rollBarrelLoot(obs.id, obs.position[0], obs.position[2]);
                if (drop) {
                  sim.droppedLoot.push(drop);
                  spawnParticles(
                    drop.x,
                    0.55,
                    drop.z,
                    drop.type === 'gold' ? '#fbbf24' : '#ef4444',
                    10
                  );
                }
              }
            }
          }
        }

        if (sim.attackTimer >= ATTACK_DURATION) {
          sim.isAttacking = false;
          sim.attackTimer = 0;
        }
      }

      if (sim.isDashing) {
        sim.dashTimer -= dt;
        const nextX = sim.playerPos.x + sim.dashDir.x * DASH_SPEED * dt;
        const nextZ = sim.playerPos.z + sim.dashDir.z * DASH_SPEED * dt;
        const resolved = resolveMovementCollision(
          nextX,
          nextZ,
          0.48,
          sim.destroyedObstacles,
          unlockedGates
        );
        sim.playerPos.x = resolved.x;
        sim.playerPos.z = resolved.z;
        sim.isMoving = true;

        if (sim.dashTimer <= 0) {
          sim.isDashing = false;
        }
      } else if (hasMoveInput) {
        const nextX = sim.playerPos.x + moveWorldX * PLAYER_SPEED * dt;
        const nextZ = sim.playerPos.z + moveWorldZ * PLAYER_SPEED * dt;
        const resolved = resolveMovementCollision(
          nextX,
          nextZ,
          0.48,
          sim.destroyedObstacles,
          unlockedGates
        );
        sim.playerPos.x = resolved.x;
        sim.playerPos.z = resolved.z;

        const hasLockedEnemy = sim.isAttacking && findNearestLivingEnemy(6.5) !== null;
        if (!hasLockedEnemy) {
          sim.playerRot = Math.atan2(moveWorldX, moveWorldZ);
        }
        sim.isMoving = true;
      } else {
        sim.isMoving = false;
      }

      // Check Key pickup in Room 2
      if (!sim.hasKey) {
        const keyDist = Math.hypot(
          sim.playerPos.x - KEY_POSITION[0],
          sim.playerPos.z - KEY_POSITION[2]
        );
        if (keyDist <= 1.2) {
          sim.hasKey = true;
          soundManager.playDash();
          spawnParticles(KEY_POSITION[0], 0.9, KEY_POSITION[2], '#fbbf24', 16);
          if (!sim.keyXpAwarded) {
            sim.keyXpAwarded = true;
            awardXp(XP_REWARDS.dungeonKey);
          }
        }
      }

      // Check Healing Potion pickups (add to player's potion inventory regardless of current HP)
      for (let i = 0; i < POTION_SPAWNS.length; i++) {
        const potion = POTION_SPAWNS[i];
        if (sim.collectedPotions.has(potion.id)) continue;
        const potionDist = Math.hypot(
          sim.playerPos.x - potion.position[0],
          sim.playerPos.z - potion.position[2]
        );
        if (potionDist <= 1.15) {
          sim.collectedPotions.add(potion.id);
          sim.healingPotions += 1;
          sim.potionPickupNoticeTimer = 2.0;
          soundManager.playDash();
          spawnParticles(
            potion.position[0],
            0.75,
            potion.position[2],
            '#ef4444',
            16
          );
          forceHudSync = true;
        }
      }

      // Check dropped barrel & enemy loot (gold coins & red healing potions)
      for (let i = sim.droppedLoot.length - 1; i >= 0; i--) {
        const item = sim.droppedLoot[i];
        item.age += dt;
        if (item.age < 0.24) continue;

        const lootDist = Math.hypot(
          sim.playerPos.x - item.x,
          sim.playerPos.z - item.z
        );
        if (lootDist <= 1.2) {
          sim.droppedLoot.splice(i, 1);
          if (item.type === 'gold') {
            sim.gold += item.amount;
            sim.lastGoldPickedUp = item.amount;
            sim.goldNoticeTimer = 2.0;
            soundManager.playLootPickup('gold');
            spawnParticles(item.x, 0.65, item.z, '#fbbf24', 16);
          } else {
            sim.healingPotions += item.amount;
            sim.potionPickupNoticeTimer = 2.0;
            soundManager.playLootPickup('potion');
            spawnParticles(item.x, 0.75, item.z, '#ef4444', 16);
          }
          forceHudSync = true;
        }
      }

      // Check Locked Gate unlock at Room 2 -> Room 3 doorway
      if (sim.hasKey && !sim.doorUnlocked) {
        const gateDist = Math.hypot(
          sim.playerPos.x - LOCKED_GATE_POSITION[0],
          sim.playerPos.z - LOCKED_GATE_POSITION[2]
        );
        if (gateDist <= 2.35) {
          sim.doorUnlocked = true;
          unlockedGates.iron = true;
          sim.shakeIntensity = Math.max(sim.shakeIntensity, 0.16);
          soundManager.playDash();
          spawnParticles(
            LOCKED_GATE_POSITION[0],
            1.3,
            LOCKED_GATE_POSITION[2],
            '#34d399',
            18
          );
          forceHudSync = true;
        }
      }

      // Unlock Room 3 -> Room 4 Sanctum Gate once Skeleton Guardian falls
      const guardian = sim.enemies.find((e) => e.id === 'r3-guardian');
      if (guardian && guardian.hp <= 0 && !sim.sanctumUnlocked) {
        sim.sanctumUnlocked = true;
        unlockedGates.sanctum = true;
        soundManager.playDash();
        spawnParticles(
          SANCTUM_GATE_POSITION[0],
          1.3,
          SANCTUM_GATE_POSITION[2],
          '#34d399',
          20
        );
        forceHudSync = true;
      }

      // Unlock Room 7 -> Room 8 Warden Gate once Abyssal Dreadlord falls
      const dreadlord = sim.enemies.find((e) => e.id === 'r7-dreadlord');
      if (dreadlord && dreadlord.hp <= 0 && !sim.wardenUnlocked) {
        sim.wardenUnlocked = true;
        unlockedGates.warden = true;
        soundManager.playDash();
        spawnParticles(
          WARDEN_GATE_POSITION[0],
          1.3,
          WARDEN_GATE_POSITION[2],
          '#38bdf8',
          22
        );
        forceHudSync = true;
      }

      // Check Exit Portal completion in Room 8 (awaken once Room 8 defenders fall)
      const room8Cleared = sim.enemies
        .filter((e) => e.roomId === 8)
        .every((e) => e.hp <= 0);
      if (room8Cleared && !sim.dungeonCompleted) {
        const portalDist = Math.hypot(
          sim.playerPos.x - EXIT_PORTAL_POSITION[0],
          sim.playerPos.z - EXIT_PORTAL_POSITION[2]
        );
        if (portalDist <= 1.35) {
          sim.dungeonCompleted = true;
          sim.isMoving = false;
          soundManager.playVictoryFanfare();
          spawnParticles(
            EXIT_PORTAL_POSITION[0],
            1.1,
            EXIT_PORTAL_POSITION[2],
            '#38bdf8',
            26
          );
          if (!sim.completionXpAwarded) {
            sim.completionXpAwarded = true;
            awardXp(XP_REWARDS.dungeonComplete);
          }
        }
      }

      // Activate first checkpoint immediately upon entering Room 3 (before fighting the Skeleton Guardian)
      const frameRoom = getRoomIdForPosition(sim.playerPos.x, sim.playerPos.z);
      sim.discoveredRooms.add(frameRoom);
      if (frameRoom >= 3 && sim.checkpointRoom === null) {
        sim.checkpointRoom = 3;
        sim.checkpointNoticeTimer = 2.4;
        forceHudSync = true;
      }
    } else {
      sim.isMoving = false;
    }

    // 6. Actor Separation (Player vs Enemies & Enemy vs Enemy)
    if (playerAlive) {
      for (let i = 0; i < sim.enemies.length; i++) {
        const enemy = sim.enemies[i];
        if (enemy.hp <= 0) continue;

        const dx = sim.playerPos.x - enemy.x;
        const dz = sim.playerPos.z - enemy.z;
        const distSq = dx * dx + dz * dz;
        const minSep = 0.52 + 0.48 * enemy.scale;
        if (distSq < minSep * minSep && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const push = (minSep - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          const pRes = resolveMovementCollision(
            sim.playerPos.x + nx * push,
            sim.playerPos.z + nz * push,
            0.48,
            sim.destroyedObstacles,
            unlockedGates
          );
          const eRes = resolveMovementCollision(
            enemy.x - nx * push,
            enemy.z - nz * push,
            0.5 * enemy.scale,
            sim.destroyedObstacles,
            unlockedGates
          );
          sim.playerPos.x = pRes.x;
          sim.playerPos.z = pRes.z;
          enemy.x = eRes.x;
          enemy.z = eRes.z;
        }
      }
    }

    for (let i = 0; i < sim.enemies.length; i++) {
      const a = sim.enemies[i];
      if (a.hp <= 0) continue;
      for (let j = i + 1; j < sim.enemies.length; j++) {
        const b = sim.enemies[j];
        if (b.hp <= 0) continue;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const distSq = dx * dx + dz * dz;
        const minSep = 1.0;
        if (distSq < minSep * minSep && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const push = (minSep - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          const aRes = resolveMovementCollision(
            a.x + nx * push,
            a.z + nz * push,
            0.5 * a.scale,
            sim.destroyedObstacles,
            unlockedGates
          );
          const bRes = resolveMovementCollision(
            b.x - nx * push,
            b.z - nz * push,
            0.5 * b.scale,
            sim.destroyedObstacles,
            unlockedGates
          );
          a.x = aRes.x;
          a.z = aRes.z;
          b.x = bRes.x;
          b.z = bRes.z;
        }
      }
    }

    // 7. Enemy AI State Machines
    for (let i = 0; i < sim.enemies.length; i++) {
      const enemy = sim.enemies[i];
      if (enemy.hp <= 0) {
        enemy.state = 'dead';
        continue;
      }
      if (!playerAlive) {
        enemy.state = 'idle';
        continue;
      }

      const dx = sim.playerPos.x - enemy.x;
      const dz = sim.playerPos.z - enemy.z;
      const dist = Math.hypot(dx, dz);
      const canSeePlayer =
        enemy.roomId !== 1 ||
        hasLineOfSight(enemy.x, enemy.z, sim.playerPos.x, sim.playerPos.z, unlockedGates);

      if (enemy.state === 'hurt') {
        enemy.hurtTimer -= dt;
        if (enemy.hurtTimer <= 0) {
          enemy.state = canSeePlayer ? 'chase' : 'idle';
        }
      } else if (enemy.state === 'attack') {
        enemy.attackTimer += dt;
        const eProg = Math.min(1, enemy.attackTimer / ENEMY_ATTACK_DURATION);

        if (eProg >= 0.6 && !enemy.hasDealtDamage) {
          enemy.hasDealtDamage = true;
          soundManager.playSkeletonAttack();

          const hitReach = enemy.attackRange + 0.35;
          if (canSeePlayer && dist <= hitReach && !sim.isDashing) {
            const enemyDmg =
              enemy.damageMin +
              Math.floor(Math.random() * (enemy.damageMax - enemy.damageMin + 1));
            sim.playerHp = Math.max(0, sim.playerHp - enemyDmg);
            sim.timeSinceCombatAction = 0;
            if (sim.playerHp <= 0) {
              forceHudSync = true;
            }
            sim.playerHitTimer = 0.22;
            sim.shakeIntensity = Math.max(
              sim.shakeIntensity,
              enemy.variant === 'dreadlord' || enemy.variant === 'guardian' ? 0.32 : 0.2
            );
            soundManager.playPlayerHurt();
            spawnParticles(sim.playerPos.x, 1.0, sim.playerPos.z, '#ef4444', 10);

            sim.damageNumbers.push({
              id: `${Date.now()}-${Math.random()}`,
              value: enemyDmg,
              x: sim.playerPos.x,
              y: 1.9,
              z: sim.playerPos.z,
              color: '#ef4444',
              lifetime: 0.9,
            });
          }
        }

        if (enemy.attackTimer >= ENEMY_ATTACK_DURATION) {
          enemy.state = canSeePlayer && dist <= enemy.detectRange ? 'chase' : 'idle';
          enemy.cooldownTimer = ENEMY_ATTACK_COOLDOWN;
        }
      } else {
        if (canSeePlayer && dist <= enemy.attackRange && enemy.cooldownTimer <= 0) {
          enemy.state = 'attack';
          enemy.attackTimer = 0;
          enemy.hasDealtDamage = false;
          enemy.rot = Math.atan2(dx, dz);
        } else if (canSeePlayer && dist <= enemy.detectRange) {
          enemy.state = 'chase';
          enemy.rot = Math.atan2(dx, dz);
          if (dist > enemy.attackRange * 0.88) {
            const nx = dx / (dist || 1);
            const nz = dz / (dist || 1);
            const nextEnemy = resolveMovementCollision(
              enemy.x + nx * enemy.speed * dt,
              enemy.z + nz * enemy.speed * dt,
              0.5 * enemy.scale,
              sim.destroyedObstacles,
              unlockedGates
            );
            enemy.x = nextEnemy.x;
            enemy.z = nextEnemy.z;
          }
        } else {
          enemy.state = 'idle';
        }
      }
    }

    // 7b. Health & Magic Regeneration (paused/half-speed during combat; capped at max HP/Magic)
    const hasAggroedEnemy = sim.enemies.some(
      (e) => e.hp > 0 && (e.state === 'chase' || e.state === 'attack' || e.state === 'hurt')
    );
    const inCombat = hasAggroedEnemy || sim.timeSinceCombatAction < HEALTH_REGEN_DELAY_SEC;
    const regenMaxHp = getMaxHealthForLevel(sim.level);
    let isHealthRegenerating = false;
    let isMagicRegenerating = false;

    if (playerAlive) {
      if (!inCombat && sim.playerHp < regenMaxHp) {
        sim.playerHp = Math.min(regenMaxHp, sim.playerHp + regenMaxHp * HEALTH_REGEN_RATE_PER_SEC * dt);
        isHealthRegenerating = sim.playerHp < regenMaxHp;
      }

      if (sim.playerMagic < BASE_PLAYER_MAX_MAGIC) {
        const magicRate = inCombat ? MAGIC_REGEN_RATE_IN_COMBAT : MAGIC_REGEN_RATE_OUT_OF_COMBAT;
        sim.playerMagic = Math.min(
          BASE_PLAYER_MAX_MAGIC,
          sim.playerMagic + BASE_PLAYER_MAX_MAGIC * magicRate * dt
        );
        isMagicRegenerating = sim.playerMagic < BASE_PLAYER_MAX_MAGIC;
      }
    }

    // 8. Update Impact Ring & Particles
    if (sim.impactRing) {
      sim.impactRing.progress += dt * 3.8;
      if (sim.impactRing.progress >= 1) {
        sim.impactRing = null;
      }
    }

    for (let i = sim.particles.length - 1; i >= 0; i--) {
      const p = sim.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        sim.particles.splice(i, 1);
      } else {
        p.vy -= 9.5 * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.05, p.y + p.vy * dt);
        p.z += p.vz * dt;
      }
    }

    for (let i = sim.damageNumbers.length - 1; i >= 0; i--) {
      sim.damageNumbers[i].lifetime -= dt;
      if (sim.damageNumbers[i].lifetime <= 0) {
        sim.damageNumbers.splice(i, 1);
      }
    }

    // 9. Fixed 45-degree Isometric Camera Follow across all 8 rooms & both wings
    const wingBlend = THREE.MathUtils.clamp((sim.playerPos.x - 7.5) / 9.0, 0, 1);
    const wingCenterX = wingBlend * 24.0;
    const targetCamX = wingCenterX + (sim.playerPos.x - wingCenterX) * 0.58;
    sim.camTarget.x = THREE.MathUtils.damp(sim.camTarget.x, targetCamX, 6.5, dt);
    sim.camTarget.z = THREE.MathUtils.damp(sim.camTarget.z, sim.playerPos.z, 6.5, dt);

    const shakeX = sim.shakeIntensity > 0 ? (Math.random() - 0.5) * sim.shakeIntensity : 0;
    const shakeY = sim.shakeIntensity > 0 ? (Math.random() - 0.5) * sim.shakeIntensity : 0;

    camera.position.set(
      sim.camTarget.x + 8.5 + shakeX,
      11.6 + shakeY,
      sim.camTarget.z + 8.5
    );
    camera.lookAt(sim.camTarget.x, 0.7, sim.camTarget.z);

    const portalActive = sim.enemies
      .filter((e) => e.roomId === 8)
      .every((e) => e.hp <= 0);

    // 10. Sync React visual props & HUD
    setRenderState({
      playerPos: [sim.playerPos.x, 0, sim.playerPos.z],
      playerRot: sim.playerRot,
      isMoving: sim.isMoving,
      isAttacking: sim.isAttacking,
      attackProgress: sim.isAttacking ? sim.attackTimer / ATTACK_DURATION : 0,
      isDashing: sim.isDashing,
      playerHit: sim.playerHitTimer > 0,
      enemies: sim.enemies.map((e) => ({ ...e })),
      destroyedObstacles: new Set(sim.destroyedObstacles),
      hasKey: sim.hasKey,
      collectedPotions: new Set(sim.collectedPotions),
      droppedLoot: sim.droppedLoot.map((item) => ({ ...item })),
      doorUnlocked: sim.doorUnlocked,
      sanctumUnlocked: sim.sanctumUnlocked,
      wardenUnlocked: sim.wardenUnlocked,
      portalActive,
      particles: [...sim.particles],
      impactRing: sim.impactRing ? { ...sim.impactRing } : null,
    });

    const now = state.clock.getElapsedTime();
    if (now - lastHudSyncRef.current > 0.045 || sim.dungeonCompleted || forceHudSync) {
      lastHudSyncRef.current = now;
      const projectedNums: ProjectedDamageNumber[] = sim.damageNumbers.map((dn) => {
        _projVec.set(dn.x, dn.y, dn.z).project(camera);
        return {
          ...dn,
          screenX: (_projVec.x * 0.5 + 0.5) * 100,
          screenY: (-_projVec.y * 0.5 + 0.5) * 100,
        };
      });

      const currentRoom = getRoomIdForPosition(sim.playerPos.x, sim.playerPos.z);
      sim.discoveredRooms.add(currentRoom);
      const nearestEnemy = findNearestLivingEnemy(11.0);
      const enemiesDefeated = sim.enemies.filter((e) => e.hp <= 0).length;

      soundManager.setMusicTrack(
        getDesiredMusicTrack({
          currentRoom,
          playerPos: sim.playerPos,
          playerHp: sim.playerHp,
          playerMaxHp: regenMaxHp,
          timeSinceCombatAction: sim.timeSinceCombatAction,
          dungeonCompleted: sim.dungeonCompleted,
          playerDefeated: sim.playerHp <= 0,
          enemies: sim.enemies,
        })
      );

      onHudSync({
        playerHp: sim.playerHp,
        playerMaxHp: regenMaxHp,
        playerMagic: sim.playerMagic,
        playerMaxMagic: BASE_PLAYER_MAX_MAGIC,
        healingPotions: sim.healingPotions,
        gold: sim.gold,
        inCombat,
        isHealthRegenerating,
        isMagicRegenerating,
        playerXp: sim.xp,
        playerLevel: sim.level,
        playerPos: { x: sim.playerPos.x, z: sim.playerPos.z },
        playerRot: sim.playerRot,
        currentRoom,
        discoveredRooms: Array.from(sim.discoveredRooms),
        enemies: sim.enemies.map((e) => ({
          id: e.id,
          roomId: e.roomId,
          x: e.x,
          z: e.z,
          hp: e.hp,
          variant: e.variant,
          name: e.name,
        })),
        enemiesDefeated,
        totalEnemies: sim.enemies.length,
        objectiveText: getObjectiveText(
          currentRoom,
          sim.enemies,
          sim.hasKey,
          sim.doorUnlocked,
          sim.sanctumUnlocked,
          sim.wardenUnlocked,
          portalActive
        ),
        hasKey: sim.hasKey,
        collectedPotionIds: Array.from(sim.collectedPotions),
        doorUnlocked: sim.doorUnlocked,
        sanctumUnlocked: sim.sanctumUnlocked,
        wardenUnlocked: sim.wardenUnlocked,
        portalActive,
        showHealthRestored: sim.potionNoticeTimer > 0,
        showPotionPickedUp: sim.potionPickupNoticeTimer > 0,
        showGoldPickedUp: sim.goldNoticeTimer > 0,
        lastGoldPickedUp: sim.lastGoldPickedUp,
        showLevelUp: sim.levelUpNoticeTimer > 0,
        levelUpLevel: sim.levelUpDisplayLevel,
        checkpointRoom: sim.checkpointRoom,
        showCheckpointActivated: sim.checkpointNoticeTimer > 0,
        activeEnemyName: nearestEnemy ? nearestEnemy.name : null,
        activeEnemyHp: nearestEnemy ? nearestEnemy.hp : 0,
        activeEnemyMaxHp: nearestEnemy ? nearestEnemy.maxHealth : 0,
        dungeonCompleted: sim.dungeonCompleted,
        playerDefeated: sim.playerHp <= 0,
        attackCooldownRatio: sim.attackCooldownTimer / ATTACK_COOLDOWN,
        dashCooldownRatio: sim.dashCooldownTimer / DASH_COOLDOWN,
        damageNumbers: projectedNums,
      });
    }
  });

  return (
    <>
      <DungeonEnvironment
        destroyedObstacleIds={renderState.destroyedObstacles}
        hasKey={renderState.hasKey}
        collectedPotions={renderState.collectedPotions}
        droppedLoot={renderState.droppedLoot}
        doorUnlocked={renderState.doorUnlocked}
        sanctumUnlocked={renderState.sanctumUnlocked}
        wardenUnlocked={renderState.wardenUnlocked}
        portalActive={renderState.portalActive}
        playerX={renderState.playerPos[0]}
        playerZ={renderState.playerPos[2]}
      />

      <PlayerCharacter
        position={renderState.playerPos}
        rotationY={renderState.playerRot}
        isMoving={renderState.isMoving}
        isAttacking={renderState.isAttacking}
        attackProgress={renderState.attackProgress}
        isDashing={renderState.isDashing}
        isHit={renderState.playerHit}
        isPaused={!hasEnteredDungeon || isPaused}
      />

      {renderState.enemies.map((enemy) => (
        <SkeletonEnemy
          key={enemy.id}
          position={[enemy.x, 0, enemy.z]}
          rotationY={enemy.rot}
          state={enemy.state}
          attackProgress={
            enemy.state === 'attack' ? enemy.attackTimer / ENEMY_ATTACK_DURATION : 0
          }
          isHit={enemy.hitFlashTimer > 0}
          health={enemy.hp}
          maxHealth={enemy.maxHealth}
          variant={enemy.variant}
          scale={enemy.scale}
          isPaused={!hasEnteredDungeon || isPaused}
        />
      ))}

      <CombatParticles3D
        particles={renderState.particles}
        impactRing={renderState.impactRing}
      />
    </>
  );
};

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'WebGL initialization failed' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-stone-950 p-6 text-center text-stone-200">
          <div className="max-w-md rounded-xl border border-red-800/60 bg-stone-900 p-6">
            <h1 className="text-lg font-bold text-red-400">3D Renderer Unavailable</h1>
            <p className="mt-2 text-sm text-stone-300">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const joystickRef = useRef<Vector2D>({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const attackRequestedRef = useRef(false);
  const dashRequestedRef = useRef(false);
  const healRequestedRef = useRef(false);
  const characterXpRef = useRef(0);
  const hasEnteredDungeonRef = useRef(false);
  const isPausedRef = useRef(false);
  const canPauseRef = useRef(true);

  const [resetCounter, setResetCounter] = useState(0);
  const [checkpointCounter, setCheckpointCounter] = useState(0);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [hasEnteredDungeon, setHasEnteredDungeon] = useState(false);
  const [hasActiveRun, setHasActiveRun] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hudState, setHudState] = useState<HudSyncPayload>({
    playerHp: BASE_PLAYER_MAX_HP,
    playerMaxHp: BASE_PLAYER_MAX_HP,
    playerMagic: BASE_PLAYER_MAX_MAGIC,
    playerMaxMagic: BASE_PLAYER_MAX_MAGIC,
    healingPotions: STARTING_HEALING_POTIONS,
    gold: 0,
    inCombat: false,
    isHealthRegenerating: false,
    isMagicRegenerating: false,
    playerXp: 0,
    playerLevel: 1,
    playerPos: { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1] },
    playerRot: Math.PI,
    currentRoom: 1,
    discoveredRooms: [1],
    enemies: INITIAL_ENEMY_SPAWNS.map((e) => ({
      id: e.id,
      roomId: e.roomId,
      x: e.position[0],
      z: e.position[1],
      hp: e.maxHealth,
      variant: e.variant,
      name: e.name,
    })),
    enemiesDefeated: 0,
    totalEnemies: INITIAL_ENEMY_SPAWNS.length,
    objectiveText: 'Defeat the Crypt Skeleton & head north',
    hasKey: false,
    collectedPotionIds: [],
    doorUnlocked: false,
    sanctumUnlocked: false,
    wardenUnlocked: false,
    portalActive: false,
    showHealthRestored: false,
    showPotionPickedUp: false,
    showGoldPickedUp: false,
    lastGoldPickedUp: 0,
    showLevelUp: false,
    levelUpLevel: 1,
    checkpointRoom: null,
    showCheckpointActivated: false,
    activeEnemyName: INITIAL_ENEMY_SPAWNS[0].name,
    activeEnemyHp: INITIAL_ENEMY_SPAWNS[0].maxHealth,
    activeEnemyMaxHp: INITIAL_ENEMY_SPAWNS[0].maxHealth,
    dungeonCompleted: false,
    playerDefeated: false,
    attackCooldownRatio: 0,
    dashCooldownRatio: 0,
    damageNumbers: [],
  });

  canPauseRef.current =
    hasEnteredDungeon && !(hudState.dungeonCompleted || hudState.playerDefeated);

  const clearActiveInputs = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
    keysRef.current = {};
    attackRequestedRef.current = false;
    dashRequestedRef.current = false;
    healRequestedRef.current = false;
  }, []);

  const handleInteract = useCallback(() => {
    soundManager.enableAudio();
  }, []);

  const handleEnterDungeon = useCallback(() => {
    clearActiveInputs();
    isPausedRef.current = false;
    setIsPaused(false);
    if (hasActiveRun) {
      setResetCounter((c) => c + 1);
    }
    hasEnteredDungeonRef.current = true;
    setHasEnteredDungeon(true);
    setHasActiveRun(true);
    soundManager.enableAudio();
    soundManager.startMusic('explore', { restart: hasActiveRun });
  }, [clearActiveInputs, hasActiveRun]);

  const handleContinueRun = useCallback(() => {
    clearActiveInputs();
    isPausedRef.current = false;
    setIsPaused(false);
    hasEnteredDungeonRef.current = true;
    setHasEnteredDungeon(true);
    soundManager.enableAudio();
    soundManager.resumeMusic();
  }, [clearActiveInputs]);

  const handleReturnToTitle = useCallback(() => {
    clearActiveInputs();
    isPausedRef.current = false;
    setIsPaused(false);
    hasEnteredDungeonRef.current = false;
    setHasEnteredDungeon(false);
    soundManager.pauseMusic();
  }, [clearActiveInputs]);

  const handlePause = useCallback(() => {
    if (!canPauseRef.current || isPausedRef.current) return;
    isPausedRef.current = true;
    clearActiveInputs();
    setIsPaused(true);
    soundManager.pauseMusic();
  }, [clearActiveInputs]);

  const handleResume = useCallback(() => {
    clearActiveInputs();
    isPausedRef.current = false;
    setIsPaused(false);
    soundManager.enableAudio();
    soundManager.resumeMusic();
  }, [clearActiveInputs]);

  const handleMove = useCallback((vec: Vector2D) => {
    if (!hasEnteredDungeonRef.current || isPausedRef.current) {
      joystickRef.current = { x: 0, y: 0 };
      return;
    }
    joystickRef.current = vec;
  }, []);

  const handleAttack = useCallback(() => {
    if (!hasEnteredDungeonRef.current || isPausedRef.current) return;
    attackRequestedRef.current = true;
  }, []);

  const handleDash = useCallback(() => {
    if (!hasEnteredDungeonRef.current || isPausedRef.current) return;
    dashRequestedRef.current = true;
  }, []);

  const handleHeal = useCallback(() => {
    if (!hasEnteredDungeonRef.current || isPausedRef.current) return;
    healRequestedRef.current = true;
  }, []);

  const handleContinueFromCheckpoint = useCallback(() => {
    clearActiveInputs();
    isPausedRef.current = false;
    setIsPaused(false);
    setCheckpointCounter((c) => c + 1);
  }, [clearActiveInputs]);

  const handleRestart = useCallback(() => {
    clearActiveInputs();
    isPausedRef.current = false;
    setIsPaused(false);
    setResetCounter((c) => c + 1);
  }, [clearActiveInputs]);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Desktop keyboard support (WASD/Arrows to move, Space/J/Enter to attack, Shift/K to dash, H to heal, P to pause/resume)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!hasEnteredDungeonRef.current) {
        return;
      }

      if (e.code === 'KeyP') {
        e.preventDefault();
        soundManager.enableAudio();
        if (isPausedRef.current) {
          handleResume();
        } else {
          handlePause();
        }
        return;
      }

      if (e.code === 'Escape' && isPausedRef.current) {
        e.preventDefault();
        soundManager.enableAudio();
        handleResume();
        return;
      }

      if (isPausedRef.current) {
        if (
          e.code === 'Space' ||
          e.code === 'ArrowUp' ||
          e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' ||
          e.code === 'ArrowRight'
        ) {
          e.preventDefault();
        }
        return;
      }

      keysRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'Enter') {
        e.preventDefault();
        soundManager.enableAudio();
        attackRequestedRef.current = true;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') {
        e.preventDefault();
        soundManager.enableAudio();
        dashRequestedRef.current = true;
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        soundManager.enableAudio();
        healRequestedRef.current = true;
      } else if (e.code === 'KeyR') {
        handleRestart();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handlePause, handleResume, handleRestart]);

  // Prevent iOS Safari pinch/gesture zoom & rubber-band scroll
  useEffect(() => {
    const preventGesture = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-stone-950 select-none"
      style={{ touchAction: 'none' }}
    >
      <SceneErrorBoundary>
        <Canvas
          className="h-full w-full block"
          dpr={isSoftwareGl ? 1 : [1, 2]}
          shadows={!isSoftwareGl}
          camera={{
            position: [8.5, 11.6, PLAYER_SPAWN[1] + 8.5],
            fov: 42,
            near: 0.5,
            far: 120,
          }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
        >
          <GameWorld
            joystickRef={joystickRef}
            keysRef={keysRef}
            attackRequestedRef={attackRequestedRef}
            dashRequestedRef={dashRequestedRef}
            healRequestedRef={healRequestedRef}
            characterXpRef={characterXpRef}
            hasEnteredDungeon={hasEnteredDungeon}
            hasEnteredDungeonRef={hasEnteredDungeonRef}
            isPaused={isPaused}
            isPausedRef={isPausedRef}
            resetCounter={resetCounter}
            checkpointCounter={checkpointCounter}
            onHudSync={setHudState}
          />
        </Canvas>
      </SceneErrorBoundary>

      {!hasEnteredDungeon ? (
        <TitleScreen
          hasActiveRun={
            hasActiveRun && !(hudState.dungeonCompleted || hudState.playerDefeated)
          }
          currentRoom={hudState.currentRoom}
          playerLevel={hudState.playerLevel}
          playerHp={hudState.playerHp}
          playerMaxHp={hudState.playerMaxHp}
          onEnterDungeon={handleEnterDungeon}
          onContinueRun={handleContinueRun}
          onInteract={handleInteract}
        />
      ) : (
        <>
          <DamageNumbersOverlay numbers={hudState.damageNumbers} />

          <GameHUD
            playerHp={hudState.playerHp}
            playerMaxHp={hudState.playerMaxHp}
            playerMagic={hudState.playerMagic}
            playerMaxMagic={hudState.playerMaxMagic}
            healingPotions={hudState.healingPotions}
            gold={hudState.gold}
            inCombat={hudState.inCombat}
            isHealthRegenerating={hudState.isHealthRegenerating}
            isMagicRegenerating={hudState.isMagicRegenerating}
            playerXp={hudState.playerXp}
            playerLevel={hudState.playerLevel}
            playerPos={hudState.playerPos}
            playerRot={hudState.playerRot}
            currentRoom={hudState.currentRoom}
            discoveredRooms={hudState.discoveredRooms}
            enemies={hudState.enemies}
            enemiesDefeated={hudState.enemiesDefeated}
            totalEnemies={hudState.totalEnemies}
            objectiveText={hudState.objectiveText}
            hasKey={hudState.hasKey}
            collectedPotionIds={hudState.collectedPotionIds}
            doorUnlocked={hudState.doorUnlocked}
            sanctumUnlocked={hudState.sanctumUnlocked}
            wardenUnlocked={hudState.wardenUnlocked}
            portalActive={hudState.portalActive}
            showHealthRestored={hudState.showHealthRestored}
            showPotionPickedUp={hudState.showPotionPickedUp}
            showGoldPickedUp={hudState.showGoldPickedUp}
            lastGoldPickedUp={hudState.lastGoldPickedUp}
            showLevelUp={hudState.showLevelUp}
            levelUpLevel={hudState.levelUpLevel}
            checkpointRoom={hudState.checkpointRoom}
            showCheckpointActivated={hudState.showCheckpointActivated}
            activeEnemyName={hudState.activeEnemyName}
            activeEnemyHp={hudState.activeEnemyHp}
            activeEnemyMaxHp={hudState.activeEnemyMaxHp}
            dungeonCompleted={hudState.dungeonCompleted}
            playerDefeated={hudState.playerDefeated}
            attackCooldownRatio={hudState.attackCooldownRatio}
            dashCooldownRatio={hudState.dashCooldownRatio}
            isMuted={isMuted}
            isPaused={isPaused}
            onMove={handleMove}
            onAttack={handleAttack}
            onDash={handleDash}
            onHeal={handleHeal}
            onPause={handlePause}
            onResume={handleResume}
            onReturnToTitle={handleReturnToTitle}
            onContinueFromCheckpoint={handleContinueFromCheckpoint}
            onRestart={handleRestart}
            onToggleMute={handleToggleMute}
            onInteract={handleInteract}
          />
        </>
      )}
    </div>
  );
}
