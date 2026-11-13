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
  type: 'pillar' | 'barrel' | 'altar' | 'rubble';
  position: [number, number, number];
  radius: number;
  height: number;
  health?: number;
  destroyed?: boolean;
}
