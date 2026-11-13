import React from 'react';
import { SparkParticle, DamageNumber } from '../types/game';

interface CombatParticles3DProps {
  particles: SparkParticle[];
  impactRing?: {
    x: number;
    z: number;
    progress: number; // 0 to 1
  } | null;
}

export const CombatParticles3D: React.FC<CombatParticles3DProps> = ({
  particles,
  impactRing,
}) => {
  return (
    <group>
      {/* Sword Swing Ground Shockwave Ring */}
      {impactRing && impactRing.progress > 0 && impactRing.progress < 1 && (
        <mesh
          position={[impactRing.x, 0.05, impactRing.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.6 + impactRing.progress * 1.4}
        >
          <ringGeometry args={[0.55, 0.78, 24]} />
          <meshBasicMaterial
            color={0x93c5fd}
            transparent
            opacity={(1 - impactRing.progress) * 0.65}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Hit Sparks & Bone Fragments */}
      {particles.map((p) => {
        const alpha = Math.max(0, p.life / p.maxLife);
        const s = p.size * (0.4 + alpha * 0.6);
        return (
          <mesh key={p.id} position={[p.x, p.y, p.z]} scale={[s, s, s]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={alpha}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export interface ProjectedDamageNumber extends DamageNumber {
  screenX: number; // 0..100 viewport %
  screenY: number; // 0..100 viewport %
}

interface DamageNumbersOverlayProps {
  numbers: ProjectedDamageNumber[];
}

export const DamageNumbersOverlay: React.FC<DamageNumbersOverlayProps> = ({
  numbers,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-20">
      {numbers.map((num) => {
        const opacity = Math.min(1, num.lifetime * 2.2);
        const riseOffset = (1 - num.lifetime) * 42;
        return (
          <div
            key={num.id}
            style={{
              left: `${num.screenX}%`,
              top: `${num.screenY}%`,
              transform: `translate(-50%, calc(-50% - ${riseOffset}px))`,
              opacity,
              color: num.color,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.95), 0 0 2px #000',
            }}
            className={`absolute font-black tracking-tight select-none whitespace-nowrap ${
              num.isCrit ? 'text-2xl sm:text-3xl scale-110' : 'text-lg sm:text-xl'
            }`}
          >
            {num.isCrit ? `CRIT -${num.value}!` : `-${num.value}`}
          </div>
        );
      })}
    </div>
  );
};
