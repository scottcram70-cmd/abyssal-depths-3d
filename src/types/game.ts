export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type EnemyState = 'idle' | 'chase' | 'attack' | 'hurt' | 'dead';

export type RoomId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type EnemyVariant =
  | 'warrior'
  | 'guardian'
  | 'stalker'
  | 'brute'
  | 'wraith'
  | 'dreadlord';

export type GateId = 'iron' | 'sanctum' | 'warden';

export interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  z: number;
  color: string;
  lifetime: number;
  isCrit?: boolean;
}

export interface SparkParticle {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface CombatFeedback {
  damageNumbers: DamageNumber[];
  particles: SparkParticle[];
  shakeIntensity: number;
}

export interface DungeonObstacle {
  id: string;
  roomId: RoomId;
  type: 'pillar' | 'barrel' | 'altar' | 'rubble' | 'crystal' | 'sarcophagus';
  position: [number, number, number];
  radius: number;
  height: number;
  destructible?: boolean;
  health?: number;
  destroyed?: boolean;
  accentColor?: number;
}

export interface WalkableRect {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  axis?: 'x' | 'z';
  requiresGate?: GateId;
}

export interface EnemySpawnConfig {
  id: string;
  roomId: RoomId;
  name: string;
  variant: EnemyVariant;
  position: [number, number];
  maxHealth: number;
  speed: number;
  detectRange: number;
  attackRange: number;
  damageMin: number;
  damageMax: number;
  scale: number;
}

export interface EnemyRuntime extends EnemySpawnConfig {
  x: number;
  z: number;
  rot: number;
  hp: number;
  state: EnemyState;
  attackTimer: number;
  cooldownTimer: number;
  hurtTimer: number;
  hitFlashTimer: number;
  hasDealtDamage: boolean;
  deathSoundPlayed: boolean;
  xpAwarded: boolean;
}

export interface MapEnemyPin {
  id: string;
  roomId: RoomId;
  x: number;
  z: number;
  hp: number;
  variant: EnemyVariant;
  name: string;
}
