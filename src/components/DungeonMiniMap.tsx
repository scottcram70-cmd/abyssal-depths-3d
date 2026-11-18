import React from 'react';
import { X } from 'lucide-react';
import {
  EXIT_PORTAL_POSITION,
  KEY_POSITION,
  LOCKED_GATE_POSITION,
  POTION_SPAWNS,
  ROOM_CENTERS,
  ROOM_NAMES,
  SANCTUM_GATE_POSITION,
  WALKABLE_RECTS,
  WARDEN_GATE_POSITION,
  isGateOpen,
} from '../utils/obstacles';
import { MapEnemyPin, RoomId } from '../types/game';

interface DungeonMiniMapProps {
  mode?: 'compact' | 'expanded';
  playerPos: { x: number; z: number };
  playerRot: number;
  currentRoom: RoomId;
  discoveredRooms: RoomId[];
  enemies: MapEnemyPin[];
  hasKey: boolean;
  collectedPotionIds: string[];
  doorUnlocked: boolean;
  sanctumUnlocked: boolean;
  wardenUnlocked: boolean;
  portalActive: boolean;
  onClose?: () => void;
  onInteract?: () => void;
}

function getRectRoomId(rectId: string): RoomId | null {
  if (!rectId.startsWith('room-')) return null;
  const num = Number(rectId.slice(5));
  if (num >= 1 && num <= 8) return num as RoomId;
  return null;
}

function isCorridorExplored(
  rectId: string,
  discoveredSet: Set<RoomId>,
  sanctumUnlocked: boolean,
  wardenUnlocked: boolean
): boolean {
  switch (rectId) {
    case 'corridor-1-2':
      return discoveredSet.has(1) || discoveredSet.has(2);
    case 'corridor-2-3':
      return discoveredSet.has(3) || discoveredSet.has(2);
    case 'corridor-3-4':
      return discoveredSet.has(4) || sanctumUnlocked;
    case 'corridor-4-5':
      return discoveredSet.has(4) || discoveredSet.has(5);
    case 'corridor-5-6':
      return discoveredSet.has(5) || discoveredSet.has(6);
    case 'corridor-6-7':
      return discoveredSet.has(6) || discoveredSet.has(7);
    case 'corridor-7-8':
      return discoveredSet.has(8) || wardenUnlocked;
    default:
      return false;
  }
}

const MAP_BOUNDS = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const r of WALKABLE_RECTS) {
    if (r.minX < minX) minX = r.minX;
    if (r.maxX > maxX) maxX = r.maxX;
    if (r.minZ < minZ) minZ = r.minZ;
    if (r.maxZ > maxZ) maxZ = r.maxZ;
  }
  const pad = 2.6;
  return {
    x: minX - pad,
    y: minZ - pad,
    w: maxX - minX + pad * 2,
    h: maxZ - minZ + pad * 2,
  };
})();

export const DungeonMiniMap: React.FC<DungeonMiniMapProps> = ({
  mode = 'compact',
  playerPos,
  playerRot,
  currentRoom,
  discoveredRooms,
  enemies,
  hasKey,
  collectedPotionIds,
  doorUnlocked,
  sanctumUnlocked,
  wardenUnlocked,
  portalActive,
  onClose,
  onInteract,
}) => {
  const isExpanded = mode === 'expanded';
  const discoveredSet = new Set<RoomId>(discoveredRooms);
  const collectedPotionSet = new Set(collectedPotionIds);
  const unlockedGates = {
    iron: doorUnlocked,
    sanctum: sanctumUnlocked,
    warden: wardenUnlocked,
  };

  const showRoom2Details = discoveredSet.has(2);
  const showRoom8Details = discoveredSet.has(8) || wardenUnlocked || portalActive;

  // PlayerCharacter faces +sin(rot) in X and +cos(rot) in Z.
  const facingDeg =
    (Math.atan2(Math.sin(playerRot), -Math.cos(playerRot)) * 180) / Math.PI;

  const visibleEnemies = enemies.filter(
    (enemy) => enemy.hp > 0 && discoveredSet.has(enemy.roomId)
  );

  return (
    <div
      className={`pointer-events-none flex flex-col overflow-hidden rounded-xl border backdrop-blur-[3px] transition-all ${
        isExpanded
          ? 'w-56 sm:w-68 max-h-[50dvh] sm:max-h-[56dvh] border-amber-600/75 bg-stone-950/84 shadow-[0_12px_36px_rgba(0,0,0,0.82)]'
          : 'w-[84px] sm:w-[96px] border-amber-700/50 bg-stone-950/64 shadow-[0_6px_20px_rgba(0,0,0,0.6)]'
      }`}
      aria-label={isExpanded ? 'Expanded Dungeon Map' : 'Dungeon Mini-Map'}
    >
      {/* Mini-Map Header */}
      {isExpanded ? (
        <div className="flex shrink-0 items-center justify-between gap-1 border-b border-amber-800/45 bg-stone-900/80 px-2.5 py-1.5">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">
              Dungeon Map • R{currentRoom}/8
            </div>
            <div className="truncate text-[11px] font-semibold text-stone-100">
              {ROOM_NAMES[currentRoom]}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInteract?.();
                onClose();
              }}
              aria-label="Close expanded map"
              className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-stone-700/80 bg-stone-900/90 text-stone-300 active:scale-95 hover:border-amber-500/60 hover:text-amber-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-center border-b border-amber-800/35 bg-stone-900/65 px-1.5 py-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
            R{currentRoom}/8
          </span>
        </div>
      )}

      {/* Exact Coordinate SVG Layout */}
      <div className={`min-h-0 flex-1 ${isExpanded ? 'p-2' : 'p-1'}`}>
        <svg
          viewBox={`${MAP_BOUNDS.x} ${MAP_BOUNDS.y} ${MAP_BOUNDS.w} ${MAP_BOUNDS.h}`}
          preserveAspectRatio="xMidYMid meet"
          className={
            isExpanded
              ? 'h-full w-full max-h-[34dvh] sm:max-h-[40dvh]'
              : 'h-[132px] w-full sm:h-[154px]'
          }
        >
          {/* Rooms and Corridors from WALKABLE_RECTS */}
          {WALKABLE_RECTS.map((rect) => {
            const rectRoom = getRectRoomId(rect.id);
            const isCurrentRoom = rectRoom === currentRoom;
            const isLockedArea = !isGateOpen(rect.requiresGate, unlockedGates);
            const isExplored =
              rectRoom !== null
                ? discoveredSet.has(rectRoom)
                : isCorridorExplored(
                    rect.id,
                    discoveredSet,
                    sanctumUnlocked,
                    wardenUnlocked
                  );

            const width = rect.maxX - rect.minX;
            const height = rect.maxZ - rect.minZ;

            return (
              <rect
                key={rect.id}
                x={rect.minX}
                y={rect.minZ}
                width={width}
                height={height}
                rx={rectRoom ? 0.9 : 0.3}
                fill={
                  isCurrentRoom
                    ? 'rgba(245, 158, 11, 0.24)'
                    : isExplored
                      ? 'rgba(68, 64, 60, 0.85)'
                      : 'rgba(12, 10, 9, 0.42)'
                }
                stroke={
                  isCurrentRoom
                    ? '#fbbf24'
                    : isExplored
                      ? 'rgba(214, 211, 209, 0.72)'
                      : isLockedArea
                        ? 'rgba(120, 113, 108, 0.34)'
                        : 'rgba(120, 113, 108, 0.44)'
                }
                strokeWidth={
                  isCurrentRoom
                    ? isExpanded
                      ? 0.9
                      : 1.15
                    : isExplored
                      ? 0.55
                      : 0.4
                }
                strokeDasharray={!isExplored ? '1.6 1.2' : undefined}
              />
            );
          })}

          {/* Room Number Watermarks R1..R8 */}
          {ROOM_CENTERS.map((rm) => {
            const explored = discoveredSet.has(rm.id);
            return (
              <text
                key={rm.id}
                x={rm.x - 6.0}
                y={rm.z - 4.4}
                fontSize={isExpanded ? 3.2 : 3.6}
                fontWeight="bold"
                fill={
                  currentRoom === rm.id
                    ? 'rgba(251, 191, 36, 0.95)'
                    : explored
                      ? 'rgba(214, 211, 209, 0.7)'
                      : 'rgba(120, 113, 108, 0.42)'
                }
              >
                R{rm.id}
              </text>
            );
          })}

          {/* Gate 2->3 (Iron Key Gate) */}
          <line
            x1={LOCKED_GATE_POSITION[0] - 1.95}
            y1={LOCKED_GATE_POSITION[2]}
            x2={LOCKED_GATE_POSITION[0] + 1.95}
            y2={LOCKED_GATE_POSITION[2]}
            stroke={doorUnlocked ? '#34d399' : '#ef4444'}
            strokeWidth={doorUnlocked ? 0.75 : 1.15}
            strokeDasharray={doorUnlocked ? '1.0 0.8' : undefined}
          />

          {/* Gate 3->4 (Sanctum Guardian Gate) */}
          <line
            x1={SANCTUM_GATE_POSITION[0] - 1.95}
            y1={SANCTUM_GATE_POSITION[2]}
            x2={SANCTUM_GATE_POSITION[0] + 1.95}
            y2={SANCTUM_GATE_POSITION[2]}
            stroke={sanctumUnlocked ? '#34d399' : '#ef4444'}
            strokeWidth={sanctumUnlocked ? 0.75 : 1.15}
            strokeDasharray={sanctumUnlocked ? '1.0 0.8' : undefined}
          />

          {/* Gate 7->8 (Warden Mini-Boss Gate) */}
          <line
            x1={WARDEN_GATE_POSITION[0] - 1.95}
            y1={WARDEN_GATE_POSITION[2]}
            x2={WARDEN_GATE_POSITION[0] + 1.95}
            y2={WARDEN_GATE_POSITION[2]}
            stroke={wardenUnlocked ? '#38bdf8' : '#ef4444'}
            strokeWidth={wardenUnlocked ? 0.75 : 1.15}
            strokeDasharray={wardenUnlocked ? '1.0 0.8' : undefined}
          />

          {/* Room 2 Golden Key (when Room 2 explored & uncollected) */}
          {showRoom2Details && !hasKey && (
            <g transform={`translate(${KEY_POSITION[0]}, ${KEY_POSITION[2]})`}>
              <circle r={1.6} fill="rgba(251, 191, 36, 0.28)" />
              <polygon
                points="0,-1.25 1.25,0 0,1.25 -1.25,0"
                fill="#fbbf24"
                stroke="#fef3c7"
                strokeWidth={0.35}
              />
            </g>
          )}

          {/* Healing Potions (when room explored & uncollected) */}
          {POTION_SPAWNS.map((potion) => {
            if (!discoveredSet.has(potion.roomId) || collectedPotionSet.has(potion.id)) {
              return null;
            }
            return (
              <g
                key={potion.id}
                transform={`translate(${potion.position[0]}, ${potion.position[2]})`}
              >
                <circle r={1.3} fill="rgba(239, 68, 68, 0.28)" />
                <circle
                  r={0.85}
                  fill="#ef4444"
                  stroke="#fecaca"
                  strokeWidth={0.28}
                />
              </g>
            );
          })}

          {/* Room 8 Exit Portal */}
          {showRoom8Details && (
            <g
              transform={`translate(${EXIT_PORTAL_POSITION[0]}, ${EXIT_PORTAL_POSITION[2]})`}
            >
              <circle
                r={2.2}
                fill={
                  portalActive
                    ? 'rgba(56, 189, 248, 0.38)'
                    : 'rgba(120, 113, 108, 0.22)'
                }
                stroke={portalActive ? '#38bdf8' : '#78716c'}
                strokeWidth={0.6}
              />
              <circle
                r={1.0}
                fill={portalActive ? '#bae6fd' : '#57534e'}
              />
            </g>
          )}

          {/* Active Enemies in Explored Rooms */}
          {visibleEnemies.map((enemy) => {
            const isBoss =
              enemy.variant === 'guardian' || enemy.variant === 'dreadlord';
            return (
              <g key={enemy.id} transform={`translate(${enemy.x}, ${enemy.z})`}>
                {isBoss && (
                  <circle
                    r={1.9}
                    fill="rgba(239, 68, 68, 0.28)"
                    stroke={enemy.variant === 'dreadlord' ? '#fbbf24' : '#f87171'}
                    strokeWidth={0.4}
                  />
                )}
                <circle
                  r={isBoss ? 1.25 : 0.95}
                  fill="#ef4444"
                  stroke="#fee2e2"
                  strokeWidth={0.32}
                />
              </g>
            );
          })}

          {/* Player Position + Facing Chevron */}
          <g transform={`translate(${playerPos.x}, ${playerPos.z})`}>
            <circle r={2.5} fill="rgba(251, 191, 36, 0.28)" />
            <g transform={`rotate(${facingDeg})`}>
              <polygon
                points="0,-2.2 1.4,1.4 0,0.65 -1.4,1.4"
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth={0.38}
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Compact Legend (Expanded Map Only) */}
      {isExpanded && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-t border-stone-800/80 bg-stone-950/88 px-2 py-1 text-[9px] font-semibold text-stone-300">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            You
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Foe
          </span>
          {showRoom2Details && !hasKey && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rotate-45 bg-amber-300" />
              Key
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                portalActive ? 'bg-sky-400' : 'bg-stone-500'
              }`}
            />
            Exit
          </span>
        </div>
      )}
    </div>
  );
};
