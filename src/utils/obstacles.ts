import {
  DungeonObstacle,
  EnemySpawnConfig,
  GateId,
  RoomId,
  WalkableRect,
} from '../types/game';

export const PLAYER_SPAWN: [number, number] = [0, 4.4];
export const CHECKPOINT_ROOM_3_SPAWN: [number, number] = [0, -37.2];
export const KEY_POSITION: [number, number, number] = [-5.8, 0, -26.8];
export const HEALING_POTION_POSITION: [number, number, number] = [3.2, 0, -27.4];
export const LOCKED_GATE_POSITION: [number, number, number] = [0, 0, -30.0];
export const SANCTUM_GATE_POSITION: [number, number, number] = [0, 0, -52.0];
export const WARDEN_GATE_POSITION: [number, number, number] = [24.0, 0, -14.0];
export const EXIT_PORTAL_POSITION: [number, number, number] = [24.0, 0, 3.8];

export interface PotionSpawnConfig {
  id: string;
  roomId: RoomId;
  position: [number, number, number];
  hasLight?: boolean;
}

export const POTION_SPAWNS: PotionSpawnConfig[] = [
  { id: 'r2-potion', roomId: 2, position: HEALING_POTION_POSITION, hasLight: true },
  // 2 collectible healing potions immediately before entering Room 4
  { id: 'r3-potion-west', roomId: 3, position: [-1.5, 0, -49.8], hasLight: true },
  { id: 'r3-potion-east', roomId: 3, position: [1.5, 0, -49.8], hasLight: false },
  // 2 collectible healing potions inside Room 4 as loot
  { id: 'r4-potion-1', roomId: 4, position: [-2.4, 0, -71.2], hasLight: true },
  { id: 'r4-potion-2', roomId: 4, position: [5.8, 0, -68.4], hasLight: false },
  // Preserved Room 5 potion
  { id: 'r5-potion', roomId: 5, position: [29.8, 0, -68.0], hasLight: true },
];

export const ROOM_NAMES: Record<RoomId, string> = {
  1: 'Entry Crypt',
  2: 'Bone Vault',
  3: 'Abyssal Sanctum',
  4: 'Plague Catacombs',
  5: 'Shattered Ossuary',
  6: 'Arcane Conduit',
  7: "Warden's Bastion",
  8: 'Throne of Escape',
};

export const ROOM_CENTERS: { id: RoomId; x: number; z: number }[] = [
  { id: 1, x: 0, z: 0 },
  { id: 2, x: 0, z: -22 },
  { id: 3, x: 0, z: -44 },
  { id: 4, x: 0, z: -66 },
  { id: 5, x: 24, z: -66 },
  { id: 6, x: 24, z: -44 },
  { id: 7, x: 24, z: -22 },
  { id: 8, x: 24, z: 0 },
];

export interface GateUnlockState {
  iron: boolean;
  sanctum: boolean;
  warden: boolean;
}

export const WALKABLE_RECTS: WalkableRect[] = [
  // Room 1: Entry Crypt
  { id: 'room-1', minX: -7.5, maxX: 7.5, minZ: -7.5, maxZ: 7.5 },
  // Corridor 1 -> 2
  { id: 'corridor-1-2', minX: -1.95, maxX: 1.95, minZ: -15.3, maxZ: -6.8, axis: 'z' },
  // Room 2: Bone Vault
  { id: 'room-2', minX: -7.5, maxX: 7.5, minZ: -29.5, maxZ: -14.5 },
  // Corridor 2 -> 3 (requires Golden Key)
  {
    id: 'corridor-2-3',
    minX: -1.95,
    maxX: 1.95,
    minZ: -37.3,
    maxZ: -28.8,
    axis: 'z',
    requiresGate: 'iron',
  },
  // Room 3: Abyssal Sanctum
  {
    id: 'room-3',
    minX: -7.5,
    maxX: 7.5,
    minZ: -51.5,
    maxZ: -36.5,
    requiresGate: 'iron',
  },
  // Corridor 3 -> 4 (opens when Skeleton Guardian falls)
  {
    id: 'corridor-3-4',
    minX: -1.95,
    maxX: 1.95,
    minZ: -59.3,
    maxZ: -50.8,
    axis: 'z',
    requiresGate: 'sanctum',
  },
  // Room 4: Plague Catacombs
  {
    id: 'room-4',
    minX: -7.5,
    maxX: 7.5,
    minZ: -73.5,
    maxZ: -58.5,
    requiresGate: 'sanctum',
  },
  // Corridor 4 -> 5 (East bridge)
  {
    id: 'corridor-4-5',
    minX: 6.8,
    maxX: 17.2,
    minZ: -67.95,
    maxZ: -64.05,
    axis: 'x',
    requiresGate: 'sanctum',
  },
  // Room 5: Shattered Ossuary
  {
    id: 'room-5',
    minX: 16.5,
    maxX: 31.5,
    minZ: -73.5,
    maxZ: -58.5,
    requiresGate: 'sanctum',
  },
  // Corridor 5 -> 6 (South)
  {
    id: 'corridor-5-6',
    minX: 22.05,
    maxX: 25.95,
    minZ: -59.3,
    maxZ: -50.8,
    axis: 'z',
    requiresGate: 'sanctum',
  },
  // Room 6: Arcane Conduit
  {
    id: 'room-6',
    minX: 16.5,
    maxX: 31.5,
    minZ: -51.5,
    maxZ: -36.5,
    requiresGate: 'sanctum',
  },
  // Corridor 6 -> 7 (South)
  {
    id: 'corridor-6-7',
    minX: 22.05,
    maxX: 25.95,
    minZ: -37.3,
    maxZ: -28.8,
    axis: 'z',
    requiresGate: 'sanctum',
  },
  // Room 7: Warden's Bastion (Mini-Boss)
  {
    id: 'room-7',
    minX: 16.5,
    maxX: 31.5,
    minZ: -29.5,
    maxZ: -14.5,
    requiresGate: 'sanctum',
  },
  // Corridor 7 -> 8 (opens when Abyssal Dreadlord falls)
  {
    id: 'corridor-7-8',
    minX: 22.05,
    maxX: 25.95,
    minZ: -15.3,
    maxZ: -6.8,
    axis: 'z',
    requiresGate: 'warden',
  },
  // Room 8: Throne of Escape (Final Chamber & Exit Portal)
  {
    id: 'room-8',
    minX: 16.5,
    maxX: 31.5,
    minZ: -7.5,
    maxZ: 7.5,
    requiresGate: 'warden',
  },
];

export const DUNGEON_OBSTACLES: DungeonObstacle[] = [
  // ===== ROOM 1: ENTRY CRYPT =====
  {
    id: 'r1-pillar-nw',
    roomId: 1,
    type: 'pillar',
    position: [-4.2, 0, -4.0],
    radius: 0.72,
    height: 3.4,
  },
  {
    id: 'r1-pillar-ne',
    roomId: 1,
    type: 'pillar',
    position: [4.2, 0, -4.0],
    radius: 0.72,
    height: 2.3,
  },
  {
    id: 'r1-pillar-sw',
    roomId: 1,
    type: 'pillar',
    position: [-4.2, 0, 3.8],
    radius: 0.72,
    height: 1.7,
  },
  {
    id: 'r1-pillar-se',
    roomId: 1,
    type: 'pillar',
    position: [4.2, 0, 3.8],
    radius: 0.72,
    height: 2.8,
  },
  {
    id: 'r1-barrel-1',
    roomId: 1,
    type: 'barrel',
    position: [-6.0, 0, -1.6],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r1-barrel-2',
    roomId: 1,
    type: 'barrel',
    position: [-5.5, 0, -2.5],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r1-barrel-3',
    roomId: 1,
    type: 'barrel',
    position: [6.0, 0, -1.4],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r1-rubble-1',
    roomId: 1,
    type: 'rubble',
    position: [-5.2, 0, 5.0],
    radius: 0.52,
    height: 0.55,
  },
  {
    id: 'r1-rubble-2',
    roomId: 1,
    type: 'rubble',
    position: [5.0, 0, -5.2],
    radius: 0.5,
    height: 0.5,
  },

  // ===== ROOM 2: BONE VAULT =====
  {
    id: 'r2-pillar-nw',
    roomId: 2,
    type: 'pillar',
    position: [-4.2, 0, -25.8],
    radius: 0.72,
    height: 3.2,
  },
  {
    id: 'r2-pillar-ne',
    roomId: 2,
    type: 'pillar',
    position: [4.2, 0, -25.8],
    radius: 0.72,
    height: 2.4,
  },
  {
    id: 'r2-pillar-sw',
    roomId: 2,
    type: 'pillar',
    position: [-4.2, 0, -18.2],
    radius: 0.72,
    height: 2.0,
  },
  {
    id: 'r2-pillar-se',
    roomId: 2,
    type: 'pillar',
    position: [4.2, 0, -18.2],
    radius: 0.72,
    height: 2.9,
  },
  {
    id: 'r2-barrel-1',
    roomId: 2,
    type: 'barrel',
    position: [-4.6, 0, -24.4],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r2-barrel-2',
    roomId: 2,
    type: 'barrel',
    position: [-6.1, 0, -24.1],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r2-barrel-3',
    roomId: 2,
    type: 'barrel',
    position: [5.8, 0, -22.5],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r2-barrel-4',
    roomId: 2,
    type: 'barrel',
    position: [6.2, 0, -21.4],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r2-barrel-5',
    roomId: 2,
    type: 'barrel',
    position: [-5.8, 0, -19.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r2-rubble-1',
    roomId: 2,
    type: 'rubble',
    position: [5.2, 0, -27.5],
    radius: 0.52,
    height: 0.55,
  },

  // ===== ROOM 3: ABYSSAL SANCTUM =====
  {
    id: 'r3-pillar-nw',
    roomId: 3,
    type: 'pillar',
    position: [-4.4, 0, -47.5],
    radius: 0.72,
    height: 3.6,
  },
  {
    id: 'r3-pillar-ne',
    roomId: 3,
    type: 'pillar',
    position: [4.4, 0, -47.5],
    radius: 0.72,
    height: 3.1,
  },
  {
    id: 'r3-pillar-sw',
    roomId: 3,
    type: 'pillar',
    position: [-4.4, 0, -40.5],
    radius: 0.72,
    height: 2.2,
  },
  {
    id: 'r3-pillar-se',
    roomId: 3,
    type: 'pillar',
    position: [4.4, 0, -40.5],
    radius: 0.72,
    height: 2.5,
  },
  {
    id: 'r3-altar-west',
    roomId: 3,
    type: 'altar',
    position: [-6.0, 0, -44.0],
    radius: 0.85,
    height: 1.1,
    accentColor: 0xff6a1a,
  },
  {
    id: 'r3-barrel-1',
    roomId: 3,
    type: 'barrel',
    position: [-5.9, 0, -39.2],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r3-barrel-2',
    roomId: 3,
    type: 'barrel',
    position: [5.9, 0, -39.2],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r3-rubble-1',
    roomId: 3,
    type: 'rubble',
    position: [5.6, 0, -49.2],
    radius: 0.5,
    height: 0.5,
  },

  // ===== ROOM 4: PLAGUE CATACOMBS =====
  {
    id: 'r4-pillar-nw',
    roomId: 4,
    type: 'pillar',
    position: [-4.4, 0, -70.0],
    radius: 0.72,
    height: 3.2,
  },
  {
    id: 'r4-pillar-ne',
    roomId: 4,
    type: 'pillar',
    position: [4.4, 0, -70.0],
    radius: 0.72,
    height: 2.6,
  },
  {
    id: 'r4-pillar-sw',
    roomId: 4,
    type: 'pillar',
    position: [-4.4, 0, -62.0],
    radius: 0.72,
    height: 2.1,
  },
  {
    id: 'r4-pillar-se',
    roomId: 4,
    type: 'pillar',
    position: [4.4, 0, -62.0],
    radius: 0.72,
    height: 2.9,
  },
  {
    id: 'r4-sarcophagus',
    roomId: 4,
    type: 'sarcophagus',
    position: [0, 0, -71.2],
    radius: 0.95,
    height: 0.9,
    accentColor: 0x10b981,
  },
  {
    id: 'r4-crystal-west',
    roomId: 4,
    type: 'crystal',
    position: [-6.0, 0, -66.0],
    radius: 0.62,
    height: 2.2,
    accentColor: 0x10b981,
  },
  {
    id: 'r4-crystal-ne',
    roomId: 4,
    type: 'crystal',
    position: [5.8, 0, -71.5],
    radius: 0.58,
    height: 1.9,
    accentColor: 0x34d399,
  },
  {
    id: 'r4-barrel-1',
    roomId: 4,
    type: 'barrel',
    position: [-5.9, 0, -60.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r4-barrel-2',
    roomId: 4,
    type: 'barrel',
    position: [-5.1, 0, -60.0],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r4-barrel-3',
    roomId: 4,
    type: 'barrel',
    position: [5.7, 0, -60.5],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r4-rubble-1',
    roomId: 4,
    type: 'rubble',
    position: [-6.1, 0, -71.6],
    radius: 0.52,
    height: 0.52,
  },

  // ===== ROOM 5: SHATTERED OSSUARY =====
  {
    id: 'r5-pillar-nw',
    roomId: 5,
    type: 'pillar',
    position: [19.6, 0, -70.0],
    radius: 0.72,
    height: 3.4,
  },
  {
    id: 'r5-pillar-ne',
    roomId: 5,
    type: 'pillar',
    position: [28.4, 0, -70.0],
    radius: 0.72,
    height: 2.8,
  },
  {
    id: 'r5-pillar-sw',
    roomId: 5,
    type: 'pillar',
    position: [19.6, 0, -62.0],
    radius: 0.72,
    height: 2.0,
  },
  {
    id: 'r5-pillar-se',
    roomId: 5,
    type: 'pillar',
    position: [28.4, 0, -62.0],
    radius: 0.72,
    height: 3.1,
  },
  {
    id: 'r5-altar-north',
    roomId: 5,
    type: 'altar',
    position: [24.0, 0, -71.1],
    radius: 0.85,
    height: 1.1,
    accentColor: 0xf59e0b,
  },
  {
    id: 'r5-barrel-1',
    roomId: 5,
    type: 'barrel',
    position: [18.2, 0, -60.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r5-barrel-2',
    roomId: 5,
    type: 'barrel',
    position: [29.8, 0, -63.4],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r5-barrel-3',
    roomId: 5,
    type: 'barrel',
    position: [29.8, 0, -64.5],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r5-rubble-1',
    roomId: 5,
    type: 'rubble',
    position: [18.3, 0, -71.5],
    radius: 0.52,
    height: 0.55,
  },

  // ===== ROOM 6: ARCANE CONDUIT =====
  {
    id: 'r6-pillar-nw',
    roomId: 6,
    type: 'pillar',
    position: [19.6, 0, -48.0],
    radius: 0.72,
    height: 3.5,
  },
  {
    id: 'r6-pillar-ne',
    roomId: 6,
    type: 'pillar',
    position: [28.4, 0, -48.0],
    radius: 0.72,
    height: 2.9,
  },
  {
    id: 'r6-pillar-sw',
    roomId: 6,
    type: 'pillar',
    position: [19.6, 0, -40.0],
    radius: 0.72,
    height: 2.4,
  },
  {
    id: 'r6-pillar-se',
    roomId: 6,
    type: 'pillar',
    position: [28.4, 0, -40.0],
    radius: 0.72,
    height: 3.0,
  },
  {
    id: 'r6-crystal-west',
    roomId: 6,
    type: 'crystal',
    position: [18.0, 0, -44.0],
    radius: 0.65,
    height: 2.5,
    accentColor: 0xa855f7,
  },
  {
    id: 'r6-crystal-east',
    roomId: 6,
    type: 'crystal',
    position: [30.0, 0, -44.0],
    radius: 0.65,
    height: 2.5,
    accentColor: 0xc084fc,
  },
  {
    id: 'r6-barrel-1',
    roomId: 6,
    type: 'barrel',
    position: [18.2, 0, -38.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r6-barrel-2',
    roomId: 6,
    type: 'barrel',
    position: [29.8, 0, -49.2],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r6-barrel-3',
    roomId: 6,
    type: 'barrel',
    position: [29.8, 0, -38.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },

  // ===== ROOM 7: WARDEN'S BASTION =====
  {
    id: 'r7-pillar-nw',
    roomId: 7,
    type: 'pillar',
    position: [19.4, 0, -26.0],
    radius: 0.72,
    height: 3.6,
  },
  {
    id: 'r7-pillar-ne',
    roomId: 7,
    type: 'pillar',
    position: [28.6, 0, -26.0],
    radius: 0.72,
    height: 3.4,
  },
  {
    id: 'r7-pillar-sw',
    roomId: 7,
    type: 'pillar',
    position: [19.4, 0, -18.0],
    radius: 0.72,
    height: 2.7,
  },
  {
    id: 'r7-pillar-se',
    roomId: 7,
    type: 'pillar',
    position: [28.6, 0, -18.0],
    radius: 0.72,
    height: 2.7,
  },
  {
    id: 'r7-altar-west',
    roomId: 7,
    type: 'altar',
    position: [18.0, 0, -22.0],
    radius: 0.85,
    height: 1.1,
    accentColor: 0xef4444,
  },
  {
    id: 'r7-altar-east',
    roomId: 7,
    type: 'altar',
    position: [30.0, 0, -22.0],
    radius: 0.85,
    height: 1.1,
    accentColor: 0xef4444,
  },
  {
    id: 'r7-barrel-1',
    roomId: 7,
    type: 'barrel',
    position: [18.2, 0, -16.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r7-barrel-2',
    roomId: 7,
    type: 'barrel',
    position: [29.8, 0, -16.8],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },

  // ===== ROOM 8: THRONE OF ESCAPE =====
  {
    id: 'r8-pillar-nw',
    roomId: 8,
    type: 'pillar',
    position: [19.4, 0, -4.2],
    radius: 0.72,
    height: 3.6,
  },
  {
    id: 'r8-pillar-ne',
    roomId: 8,
    type: 'pillar',
    position: [28.6, 0, -4.2],
    radius: 0.72,
    height: 3.6,
  },
  {
    id: 'r8-pillar-sw',
    roomId: 8,
    type: 'pillar',
    position: [19.4, 0, 3.8],
    radius: 0.72,
    height: 2.8,
  },
  {
    id: 'r8-pillar-se',
    roomId: 8,
    type: 'pillar',
    position: [28.6, 0, 3.8],
    radius: 0.72,
    height: 2.8,
  },
  {
    id: 'r8-crystal-west',
    roomId: 8,
    type: 'crystal',
    position: [18.0, 0, 0.0],
    radius: 0.65,
    height: 2.4,
    accentColor: 0x38bdf8,
  },
  {
    id: 'r8-crystal-east',
    roomId: 8,
    type: 'crystal',
    position: [30.0, 0, 0.0],
    radius: 0.65,
    height: 2.4,
    accentColor: 0x38bdf8,
  },
  {
    id: 'r8-barrel-1',
    roomId: 8,
    type: 'barrel',
    position: [18.2, 0, 5.4],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
  {
    id: 'r8-barrel-2',
    roomId: 8,
    type: 'barrel',
    position: [29.8, 0, 5.4],
    radius: 0.45,
    height: 0.95,
    destructible: true,
    health: 20,
  },
];

export const INITIAL_ENEMY_SPAWNS: EnemySpawnConfig[] = [
  // Room 1
  {
    id: 'r1-skeleton',
    roomId: 1,
    name: 'Crypt Skeleton',
    variant: 'warrior',
    position: [0, -2.8],
    maxHealth: 100,
    speed: 2.65,
    detectRange: 4.8,
    attackRange: 1.85,
    damageMin: 11,
    damageMax: 15,
    scale: 1.0,
  },
  // Room 2
  {
    id: 'r2-skeleton-west',
    roomId: 2,
    name: 'Vault Skeleton',
    variant: 'warrior',
    position: [-2.9, -22.5],
    maxHealth: 115,
    speed: 2.75,
    detectRange: 8.6,
    attackRange: 1.85,
    damageMin: 12,
    damageMax: 16,
    scale: 1.0,
  },
  {
    id: 'r2-skeleton-east',
    roomId: 2,
    name: 'Vault Skeleton',
    variant: 'warrior',
    position: [3.1, -20.5],
    maxHealth: 115,
    speed: 2.85,
    detectRange: 8.6,
    attackRange: 1.85,
    damageMin: 12,
    damageMax: 16,
    scale: 1.0,
  },
  // Room 3
  {
    id: 'r3-guardian',
    roomId: 3,
    name: 'Skeleton Guardian',
    variant: 'guardian',
    position: [0, -44.6],
    maxHealth: 220,
    speed: 2.55,
    detectRange: 9.2,
    attackRange: 2.15,
    damageMin: 17,
    damageMax: 24,
    scale: 1.28,
  },
  // Room 4: Plague Catacombs
  {
    id: 'r4-stalker-1',
    roomId: 4,
    name: 'Plague Stalker',
    variant: 'stalker',
    position: [-2.8, -66.5],
    maxHealth: 110,
    speed: 3.45,
    detectRange: 9.0,
    attackRange: 1.75,
    damageMin: 12,
    damageMax: 17,
    scale: 0.96,
  },
  {
    id: 'r4-stalker-2',
    roomId: 4,
    name: 'Plague Stalker',
    variant: 'stalker',
    position: [3.0, -64.5],
    maxHealth: 110,
    speed: 3.45,
    detectRange: 9.0,
    attackRange: 1.75,
    damageMin: 12,
    damageMax: 17,
    scale: 0.96,
  },
  {
    id: 'r4-warrior-1',
    roomId: 4,
    name: 'Catacomb Skeleton',
    variant: 'warrior',
    position: [0, -68.2],
    maxHealth: 125,
    speed: 2.8,
    detectRange: 8.5,
    attackRange: 1.85,
    damageMin: 13,
    damageMax: 18,
    scale: 1.02,
  },
  // Room 5: Shattered Ossuary
  {
    id: 'r5-brute-1',
    roomId: 5,
    name: 'Iron Brute',
    variant: 'brute',
    position: [24.5, -66.0],
    maxHealth: 195,
    speed: 2.35,
    detectRange: 9.0,
    attackRange: 2.1,
    damageMin: 18,
    damageMax: 25,
    scale: 1.2,
  },
  {
    id: 'r5-stalker-1',
    roomId: 5,
    name: 'Plague Stalker',
    variant: 'stalker',
    position: [21.2, -62.8],
    maxHealth: 115,
    speed: 3.5,
    detectRange: 9.0,
    attackRange: 1.75,
    damageMin: 13,
    damageMax: 18,
    scale: 0.96,
  },
  {
    id: 'r5-stalker-2',
    roomId: 5,
    name: 'Plague Stalker',
    variant: 'stalker',
    position: [27.5, -63.0],
    maxHealth: 115,
    speed: 3.5,
    detectRange: 9.0,
    attackRange: 1.75,
    damageMin: 13,
    damageMax: 18,
    scale: 0.96,
  },
  // Room 6: Arcane Conduit
  {
    id: 'r6-wraith-1',
    roomId: 6,
    name: 'Arcane Wraith',
    variant: 'wraith',
    position: [21.2, -45.5],
    maxHealth: 145,
    speed: 3.1,
    detectRange: 9.2,
    attackRange: 2.05,
    damageMin: 15,
    damageMax: 21,
    scale: 1.06,
  },
  {
    id: 'r6-wraith-2',
    roomId: 6,
    name: 'Arcane Wraith',
    variant: 'wraith',
    position: [26.8, -43.5],
    maxHealth: 145,
    speed: 3.1,
    detectRange: 9.2,
    attackRange: 2.05,
    damageMin: 15,
    damageMax: 21,
    scale: 1.06,
  },
  {
    id: 'r6-brute-1',
    roomId: 6,
    name: 'Iron Brute',
    variant: 'brute',
    position: [24.0, -40.2],
    maxHealth: 205,
    speed: 2.4,
    detectRange: 8.8,
    attackRange: 2.1,
    damageMin: 19,
    damageMax: 26,
    scale: 1.22,
  },
  // Room 7: Warden's Bastion (Mini-Boss)
  {
    id: 'r7-dreadlord',
    roomId: 7,
    name: 'Abyssal Dreadlord',
    variant: 'dreadlord',
    position: [24.0, -21.8],
    maxHealth: 340,
    speed: 2.68,
    detectRange: 9.8,
    attackRange: 2.35,
    damageMin: 22,
    damageMax: 30,
    scale: 1.38,
  },
  {
    id: 'r7-guard-1',
    roomId: 7,
    name: 'Bastion Guard',
    variant: 'warrior',
    position: [21.5, -24.5],
    maxHealth: 130,
    speed: 2.85,
    detectRange: 9.0,
    attackRange: 1.9,
    damageMin: 14,
    damageMax: 19,
    scale: 1.04,
  },
  // Room 8: Throne of Escape
  {
    id: 'r8-wraith-1',
    roomId: 8,
    name: 'Sanctum Wraith',
    variant: 'wraith',
    position: [21.2, -1.2],
    maxHealth: 155,
    speed: 3.15,
    detectRange: 9.4,
    attackRange: 2.1,
    damageMin: 16,
    damageMax: 22,
    scale: 1.08,
  },
  {
    id: 'r8-wraith-2',
    roomId: 8,
    name: 'Sanctum Wraith',
    variant: 'wraith',
    position: [26.8, -1.2],
    maxHealth: 155,
    speed: 3.15,
    detectRange: 9.4,
    attackRange: 2.1,
    damageMin: 16,
    damageMax: 22,
    scale: 1.08,
  },
  {
    id: 'r8-brute-1',
    roomId: 8,
    name: 'Throne Sentinel',
    variant: 'brute',
    position: [24.0, 1.0],
    maxHealth: 220,
    speed: 2.45,
    detectRange: 9.2,
    attackRange: 2.15,
    damageMin: 20,
    damageMax: 27,
    scale: 1.24,
  },
];

export function getRoomIdForPosition(x: number, z: number): RoomId {
  // West Wing (Rooms 1 -> 2 -> 3 -> 4 going North)
  if (x < 12.0) {
    if (z < -55.0) return 4;
    if (z < -33.0) return 3;
    if (z < -11.0) return 2;
    return 1;
  }
  // East Wing (Rooms 5 -> 6 -> 7 -> 8 going South)
  if (z < -55.0) return 5;
  if (z < -33.0) return 6;
  if (z < -11.0) return 7;
  return 8;
}

export function isGateOpen(
  gate: GateId | undefined,
  unlockedGates: GateUnlockState
): boolean {
  if (!gate) return true;
  return unlockedGates[gate];
}

/**
 * Clamps (x, z) smoothly onto the union of active walkable room/corridor rectangles.
 * Ensures continuous, gap-free traversal across doorways with zero wall clipping.
 */
function clampToWalkableUnion(
  x: number,
  z: number,
  radius: number,
  unlockedGates: GateUnlockState
): { x: number; z: number } {
  let bestX = x;
  let bestZ = z;
  let bestDistSq = Infinity;

  for (let i = 0; i < WALKABLE_RECTS.length; i++) {
    const rect = WALKABLE_RECTS[i];
    if (!isGateOpen(rect.requiresGate, unlockedGates)) continue;

    // Shrink walls by radius; keep corridor ends unshrunk so transitions into rooms are gapless
    const minX = rect.axis === 'x' ? rect.minX : rect.minX + radius;
    const maxX = rect.axis === 'x' ? rect.maxX : rect.maxX - radius;
    const minZ = rect.axis === 'z' ? rect.minZ : rect.minZ + radius;
    const maxZ = rect.axis === 'z' ? rect.maxZ : rect.maxZ - radius;

    const cx = Math.max(minX, Math.min(maxX, x));
    const cz = Math.max(minZ, Math.min(maxZ, z));

    const dx = x - cx;
    const dz = z - cz;
    const distSq = dx * dx + dz * dz;

    if (distSq === 0) {
      return { x, z };
    }
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestX = cx;
      bestZ = cz;
    }
  }

  return { x: bestX, z: bestZ };
}

/**
 * Resolves circle-vs-circle collisions against active dungeon obstacles (excluding destroyed barrels)
 * and keeps actors inside the navigable room + corridor bounds.
 */
export function resolveMovementCollision(
  x: number,
  z: number,
  actorRadius: number,
  destroyedObstacleIds?: Set<string>,
  unlockedGatesOrDoorUnlocked: GateUnlockState | boolean = false
): { x: number; z: number } {
  const unlockedGates: GateUnlockState =
    typeof unlockedGatesOrDoorUnlocked === 'boolean'
      ? {
          iron: unlockedGatesOrDoorUnlocked,
          sanctum: unlockedGatesOrDoorUnlocked,
          warden: unlockedGatesOrDoorUnlocked,
        }
      : unlockedGatesOrDoorUnlocked;

  let rx = x;
  let rz = z;

  // Resolve against static obstacles & intact barrels
  for (let i = 0; i < DUNGEON_OBSTACLES.length; i++) {
    const obs = DUNGEON_OBSTACLES[i];
    if (obs.destructible && destroyedObstacleIds?.has(obs.id)) {
      continue;
    }

    const dx = rx - obs.position[0];
    const dz = rz - obs.position[2];
    const minDist = actorRadius + obs.radius;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const overlap = minDist - dist;
      rx += (dx / dist) * overlap;
      rz += (dz / dist) * overlap;
    }
  }

  // Clamp inside continuous room + corridor walkable geometry
  return clampToWalkableUnion(rx, rz, actorRadius, unlockedGates);
}

/**
 * Checks whether the straight segment between two positions stays strictly inside
 * open walkable room/corridor rectangles (i.e. not blocked by dungeon walls or closed gates).
 */
export function hasLineOfSight(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  unlockedGates: GateUnlockState
): boolean {
  const dist = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.max(1, Math.ceil(dist / 0.25));

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = x1 + (x2 - x1) * t;
    const pz = z1 + (z2 - z1) * t;

    let insideWalkable = false;
    for (let i = 0; i < WALKABLE_RECTS.length; i++) {
      const rect = WALKABLE_RECTS[i];
      if (!isGateOpen(rect.requiresGate, unlockedGates)) continue;
      if (
        px >= rect.minX &&
        px <= rect.maxX &&
        pz >= rect.minZ &&
        pz <= rect.maxZ
      ) {
        insideWalkable = true;
        break;
      }
    }

    if (!insideWalkable) {
      return false;
    }
  }

  return true;
}
