import { DungeonObstacle } from '../types/game';

export const DUNGEON_BOUNDS = 7.1; // Playable half-width/depth inside walls at +-8

export const DUNGEON_OBSTACLES: DungeonObstacle[] = [
  // Four corner/mid-room broken pillars creating tactical sightlines & cover
  {
    id: 'pillar-nw',
    type: 'pillar',
    position: [-3.8, 0, -3.8],
    radius: 0.72,
    height: 3.4,
  },
  {
    id: 'pillar-ne',
    type: 'pillar',
    position: [3.8, 0, -3.8],
    radius: 0.72,
    height: 2.2,
  },
  {
    id: 'pillar-sw',
    type: 'pillar',
    position: [-3.8, 0, 3.8],
    radius: 0.72,
    height: 1.6,
  },
  {
    id: 'pillar-se',
    type: 'pillar',
    position: [3.8, 0, 3.8],
    radius: 0.72,
    height: 2.8,
  },
  // Ancient stone altar near North-Center
  {
    id: 'altar-north',
    type: 'altar',
    position: [0, 0, -5.8],
    radius: 0.95,
    height: 1.1,
  },
  // Barrel clusters along walls
  {
    id: 'barrel-1',
    type: 'barrel',
    position: [-6.1, 0, -1.6],
    radius: 0.45,
    height: 0.95,
  },
  {
    id: 'barrel-2',
    type: 'barrel',
    position: [-5.6, 0, -2.4],
    radius: 0.45,
    height: 0.95,
  },
  {
    id: 'barrel-3',
    type: 'barrel',
    position: [6.0, 0, -1.2],
    radius: 0.45,
    height: 0.95,
  },
  {
    id: 'barrel-4',
    type: 'barrel',
    position: [-1.8, 0, -6.2],
    radius: 0.45,
    height: 0.95,
  },
  // Scattered fallen rubble / debris chunks
  {
    id: 'rubble-1',
    type: 'rubble',
    position: [-4.9, 0, 4.6],
    radius: 0.52,
    height: 0.55,
  },
  {
    id: 'rubble-2',
    type: 'rubble',
    position: [4.8, 0, -4.7],
    radius: 0.5,
    height: 0.5,
  },
];

/**
 * Resolves circle-vs-circle collisions against dungeon obstacles and clamps to room walls.
 */
export function resolveMovementCollision(
  x: number,
  z: number,
  actorRadius: number
): { x: number; z: number } {
  let rx = x;
  let rz = z;

  // Resolve against static obstacles
  for (let i = 0; i < DUNGEON_OBSTACLES.length; i++) {
    const obs = DUNGEON_OBSTACLES[i];
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

  // Clamp inside dungeon walls
  const limit = DUNGEON_BOUNDS - actorRadius;
  rx = Math.max(-limit, Math.min(limit, rx));
  rz = Math.max(-limit, Math.min(limit, rz));

  return { x: rx, z: rz };
}
