import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EnemyState, EnemyVariant } from '../types/game';

interface SkeletonEnemyProps {
  position: [number, number, number];
  rotationY: number;
  state: EnemyState;
  attackProgress: number; // 0 to 1
  isHit: boolean;
  health: number;
  maxHealth: number;
  variant?: EnemyVariant;
  scale?: number;
  isPaused?: boolean;
}

const VARIANT_THEME: Record<
  EnemyVariant,
  {
    boneColor: number;
    armorColor: number;
    metalColor: number;
    metalness: number;
    eyeColor: number;
    eyeAttackColor: number;
    auraColor?: number;
  }
> = {
  warrior: {
    boneColor: 0xd6cbb5,
    armorColor: 0x4b3b34,
    metalColor: 0x262220,
    metalness: 0.72,
    eyeColor: 0xff5e1a,
    eyeAttackColor: 0xff1e00,
  },
  guardian: {
    boneColor: 0xc2b299,
    armorColor: 0x3b1f1e,
    metalColor: 0x1a1518,
    metalness: 0.82,
    eyeColor: 0xff1e00,
    eyeAttackColor: 0xff1e00,
    auraColor: 0x991b1b,
  },
  stalker: {
    boneColor: 0xa7b89c,
    armorColor: 0x1f3529,
    metalColor: 0x19241e,
    metalness: 0.68,
    eyeColor: 0x10b981,
    eyeAttackColor: 0x34d399,
  },
  brute: {
    boneColor: 0xbcb3a6,
    armorColor: 0x2b2d34,
    metalColor: 0x14151a,
    metalness: 0.88,
    eyeColor: 0xf59e0b,
    eyeAttackColor: 0xff4500,
  },
  wraith: {
    boneColor: 0xc4b5fd,
    armorColor: 0x2e1f47,
    metalColor: 0x1a132b,
    metalness: 0.76,
    eyeColor: 0xa855f7,
    eyeAttackColor: 0x38bdf8,
    auraColor: 0x7e22ce,
  },
  dreadlord: {
    boneColor: 0xa89f96,
    armorColor: 0x45121b,
    metalColor: 0x120d10,
    metalness: 0.9,
    eyeColor: 0xff2a2a,
    eyeAttackColor: 0xfbbf24,
    auraColor: 0xdc2626,
  },
};

export const SkeletonEnemy: React.FC<SkeletonEnemyProps> = ({
  position,
  rotationY,
  state,
  attackProgress,
  isHit,
  health,
  maxHealth,
  variant = 'warrior',
  scale = 1,
  isPaused = false,
}) => {
  const theme = VARIANT_THEME[variant];
  const isBoss = variant === 'guardian' || variant === 'dreadlord';
  const isDreadlord = variant === 'dreadlord';
  const isStalker = variant === 'stalker';
  const isBrute = variant === 'brute';
  const isWraith = variant === 'wraith';

  const groupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const skullRef = useRef<THREE.Group>(null);
  const slashTelegraphRef = useRef<THREE.Mesh>(null);

  const boneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isHit ? 0xff4444 : theme.boneColor,
        roughness: isWraith ? 0.48 : 0.72,
        metalness: isWraith ? 0.15 : 0.05,
        emissive: isHit ? 0x661111 : isWraith ? 0x2e1065 : 0x000000,
        emissiveIntensity: isWraith && !isHit ? 0.35 : 1,
      }),
    [isHit, theme.boneColor, isWraith]
  );

  const rustedIronMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isHit ? 0xff5555 : theme.armorColor,
        roughness: 0.5,
        metalness: theme.metalness,
      }),
    [isHit, theme.armorColor, theme.metalness]
  );

  const darkMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: theme.metalColor,
        roughness: 0.42,
        metalness: 0.88,
      }),
    [theme.metalColor]
  );

  const accentGlowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: isDreadlord
          ? 0xfbbf24
          : isWraith
            ? 0xc084fc
            : isStalker
              ? 0x34d399
              : 0xef4444,
      }),
    [isDreadlord, isWraith, isStalker]
  );

  const eyeGlowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: state === 'attack' ? theme.eyeAttackColor : theme.eyeColor,
      }),
    [state, theme.eyeAttackColor, theme.eyeColor]
  );

  const telegraphMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: isWraith ? 0xa855f7 : 0xdc2626,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    [isWraith]
  );

  const deathProgressRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (isPaused || !groupRef.current || !bodyGroupRef.current) return;

    groupRef.current.position.x = THREE.MathUtils.damp(
      groupRef.current.position.x,
      position[0],
      22,
      delta
    );
    groupRef.current.position.z = THREE.MathUtils.damp(
      groupRef.current.position.z,
      position[2],
      22,
      delta
    );

    let diff = rotationY - groupRef.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1, delta * 14);

    const t = clock.getElapsedTime();

    if (state === 'dead') {
      deathProgressRef.current = Math.min(1, deathProgressRef.current + delta * 2.4);
      const dp = deathProgressRef.current;
      bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, dp);
      bodyGroupRef.current.position.y = THREE.MathUtils.lerp(0, 0.22, dp);
      if (skullRef.current) {
        skullRef.current.position.z = THREE.MathUtils.lerp(0, 0.32, dp);
        skullRef.current.rotation.y = dp * 0.6;
      }
      if (slashTelegraphRef.current) {
        telegraphMaterial.opacity = 0;
      }
      return;
    } else {
      deathProgressRef.current = 0;
      bodyGroupRef.current.rotation.x = 0;
      bodyGroupRef.current.position.y = 0;
      if (skullRef.current) {
        skullRef.current.position.z = 0;
        skullRef.current.rotation.y = 0;
      }
    }

    if (state === 'hurt') {
      bodyGroupRef.current.rotation.x = -0.28;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.4;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.3;
      telegraphMaterial.opacity = 0;
      return;
    }

    if (state === 'attack' && rightArmRef.current && leftArmRef.current) {
      const p = attackProgress;
      if (p < 0.55) {
        const wt = p / 0.55;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(0.1, -Math.PI * 0.85, wt);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(0, -0.25, wt);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          0.2,
          isStalker ? -Math.PI * 0.7 : -0.35,
          wt
        );
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.18, wt);
        telegraphMaterial.opacity = 0.28 + Math.sin(wt * Math.PI * 4) * 0.12;
      } else if (p < 0.78) {
        const st = (p - 0.55) / 0.23;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.85, Math.PI * 0.5, st);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(-0.25, 0.2, st);
        if (isStalker) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.7, Math.PI * 0.45, st);
        }
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(-0.18, 0.24, st);
        telegraphMaterial.opacity = (1 - st) * 0.35;
      } else {
        const rt = (p - 0.78) / 0.22;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.5, 0.1, rt);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(0.2, 0, rt);
        if (isStalker) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.45, 0.2, rt);
        }
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(0.24, 0, rt);
        telegraphMaterial.opacity = 0;
      }
      return;
    }

    telegraphMaterial.opacity = 0;

    if (state === 'chase') {
      const pace = isStalker ? 13.0 : isBrute ? 7.2 : 9.5;
      const walk = Math.sin(t * pace) * 0.52;
      if (leftLegRef.current) leftLegRef.current.rotation.x = walk;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -walk;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -walk * 0.45 + 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = walk * 0.35 - 0.25;
      bodyGroupRef.current.position.y = isWraith
        ? 0.08 + Math.sin(t * 4.5) * 0.06
        : Math.abs(Math.sin(t * pace)) * 0.05;
      bodyGroupRef.current.rotation.x = isStalker ? 0.24 : 0.12;
    } else {
      const sway = Math.sin(t * 2.4) * 0.05;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.2 + sway;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.15 - sway;
      bodyGroupRef.current.rotation.z = sway * 0.5;
      bodyGroupRef.current.position.y = isWraith ? 0.06 + Math.sin(t * 3.0) * 0.04 : 0;
    }
  });

  const hpRatio = Math.max(0, Math.min(1, health / maxHealth));

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]} dispose={null}>
      {/* Contact Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 16]} />
        <meshBasicMaterial color={0x000000} transparent opacity={state === 'dead' ? 0.25 : 0.52} depthWrite={false} />
      </mesh>

      {/* Variant Aura Ring (Guardian / Wraith / Dreadlord) */}
      {theme.auraColor && state !== 'dead' && (
        <>
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.78, 24]} />
            <meshBasicMaterial color={theme.auraColor} transparent opacity={0.55} depthWrite={false} />
          </mesh>
          {isDreadlord && (
            <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.84, 0.94, 24]} />
              <meshBasicMaterial color={0xfbbf24} transparent opacity={0.45} depthWrite={false} />
            </mesh>
          )}
        </>
      )}

      {/* Attack Telegraph Ground Ring */}
      <mesh
        ref={slashTelegraphRef}
        position={[0, 0.03, 0.65]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={telegraphMaterial}
      >
        <ringGeometry args={[0.55, 1.15, 20]} />
      </mesh>

      {/* World-Space Mini Health Bar above living Skeleton */}
      {state !== 'dead' && (
        <group position={[0, 2.25, 0]}>
          <mesh>
            <planeGeometry args={[isBoss ? 1.24 : 1.06, 0.13]} />
            <meshBasicMaterial color={0x110e0c} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-(1 - hpRatio) * (isBoss ? 0.58 : 0.5), 0, 0.01]}>
            <planeGeometry args={[Math.max(0.001, hpRatio * (isBoss ? 1.16 : 1)), 0.08]} />
            <meshBasicMaterial color={isDreadlord ? 0xf59e0b : 0xdc2626} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* SKELETAL BODY HIERARCHY */}
      <group ref={bodyGroupRef}>
        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.17, 0.48, 0]}>
          <mesh position={[0, 0.1, 0]} material={boneMaterial} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.34, 6]} />
          </mesh>
          <mesh position={[0, -0.1, 0.02]} material={boneMaterial}>
            <sphereGeometry args={[0.055, 6, 6]} />
          </mesh>
          <mesh position={[0, -0.26, 0]} material={boneMaterial} castShadow>
            <cylinderGeometry args={[0.038, 0.035, 0.32, 6]} />
          </mesh>
          <mesh position={[0, -0.44, 0.05]} material={rustedIronMaterial} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.2]} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.17, 0.48, 0]}>
          <mesh position={[0, 0.1, 0]} material={boneMaterial} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.34, 6]} />
          </mesh>
          <mesh position={[0, -0.1, 0.02]} material={boneMaterial}>
            <sphereGeometry args={[0.055, 6, 6]} />
          </mesh>
          <mesh position={[0, -0.26, 0]} material={boneMaterial} castShadow>
            <cylinderGeometry args={[0.038, 0.035, 0.32, 6]} />
          </mesh>
          <mesh position={[0, -0.44, 0.05]} material={rustedIronMaterial} castShadow>
            <boxGeometry args={[0.1, 0.08, 0.2]} />
          </mesh>
        </group>

        {/* Pelvis & Spine */}
        <group position={[0, 0.92, 0]}>
          <mesh position={[0, -0.18, 0]} material={boneMaterial} castShadow>
            <boxGeometry args={[0.36, 0.14, 0.2]} />
          </mesh>
          <mesh position={[0, -0.28, 0.1]} material={rustedIronMaterial}>
            <boxGeometry args={[isDreadlord ? 0.34 : 0.26, isWraith ? 0.38 : 0.22, 0.04]} />
          </mesh>
          <mesh position={[0, 0.12, -0.04]} material={boneMaterial} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.56, 6]} />
          </mesh>

          {/* Ribcage or Brute Breastplate */}
          {isBrute || isDreadlord ? (
            <mesh position={[0, 0.18, 0.02]} material={rustedIronMaterial} castShadow>
              <boxGeometry args={[0.46, 0.36, 0.28]} />
            </mesh>
          ) : (
            [0.08, 0.19, 0.3].map((ry, idx) => (
              <mesh key={`rib-${idx}`} position={[0, ry, 0.02]} material={boneMaterial} castShadow>
                <boxGeometry args={[0.42 - idx * 0.02, 0.055, 0.24]} />
              </mesh>
            ))
          )}
          <mesh position={[0, 0.2, 0.13]} material={boneMaterial}>
            <boxGeometry args={[0.08, 0.28, 0.04]} />
          </mesh>

          <mesh position={[0, 0.39, 0]} material={boneMaterial}>
            <boxGeometry args={[0.56, 0.06, 0.09]} />
          </mesh>

          {/* SKULL & VARIANT HELM / CROWN */}
          <group ref={skullRef} position={[0, 0.62, 0]}>
            <mesh position={[0, 0.04, 0]} material={boneMaterial} castShadow>
              <sphereGeometry args={[0.165, 10, 10]} />
            </mesh>
            <mesh position={[0, -0.09, 0.04]} material={boneMaterial} castShadow>
              <boxGeometry args={[0.17, 0.11, 0.18]} />
            </mesh>
            <mesh position={[-0.065, 0.02, 0.145]}>
              <sphereGeometry args={[0.036, 6, 6]} />
              <meshBasicMaterial color={0x050404} />
            </mesh>
            <mesh position={[0.065, 0.02, 0.145]}>
              <sphereGeometry args={[0.036, 6, 6]} />
              <meshBasicMaterial color={0x050404} />
            </mesh>
            <mesh position={[-0.065, 0.02, 0.168]} material={eyeGlowMaterial}>
              <sphereGeometry args={[0.018, 6, 6]} />
            </mesh>
            <mesh position={[0.065, 0.02, 0.168]} material={eyeGlowMaterial}>
              <sphereGeometry args={[0.018, 6, 6]} />
            </mesh>

            {/* Variant Headgear */}
            {isWraith ? (
              <mesh position={[0, 0.12, -0.03]} material={rustedIronMaterial} castShadow>
                <coneGeometry args={[0.21, 0.34, 8]} />
              </mesh>
            ) : (
              <mesh position={[0, 0.11, -0.01]} material={rustedIronMaterial} castShadow>
                <cylinderGeometry args={[0.175, 0.185, isDreadlord ? 0.16 : 0.12, 10]} />
              </mesh>
            )}

            {isDreadlord && (
              <mesh position={[0, 0.24, 0.06]} material={accentGlowMaterial}>
                <octahedronGeometry args={[0.065, 0]} />
              </mesh>
            )}

            {/* Horns */}
            <mesh
              position={[-0.19, isDreadlord ? 0.24 : 0.18, 0]}
              rotation={[0, 0, 0.55]}
              material={isDreadlord ? darkMetalMaterial : boneMaterial}
            >
              <coneGeometry args={[isDreadlord ? 0.055 : 0.04, isDreadlord ? 0.32 : 0.22, 6]} />
            </mesh>
            <mesh
              position={[0.19, isDreadlord ? 0.24 : 0.18, 0]}
              rotation={[0, 0, -0.55]}
              material={isDreadlord ? darkMetalMaterial : boneMaterial}
            >
              <coneGeometry args={[isDreadlord ? 0.055 : 0.04, isDreadlord ? 0.32 : 0.22, 6]} />
            </mesh>
          </group>

          {/* LEFT ARM (Shield or Off-hand Dagger) */}
          <group ref={leftArmRef} position={[-0.31, 0.36, 0]}>
            <mesh position={[-0.03, 0.04, 0]} material={rustedIronMaterial} castShadow>
              <sphereGeometry args={[isBrute || isDreadlord ? 0.16 : 0.13, 8, 8]} />
            </mesh>
            <mesh position={[-0.03, -0.18, 0.04]} material={boneMaterial} castShadow>
              <cylinderGeometry args={[0.038, 0.035, 0.34, 6]} />
            </mesh>

            {isStalker ? (
              /* Off-hand curved dagger */
              <group position={[-0.03, -0.34, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, -0.06, 0]} material={darkMetalMaterial}>
                  <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
                </mesh>
                <mesh position={[0, 0.3, 0]} material={darkMetalMaterial} castShadow>
                  <boxGeometry args={[0.08, 0.56, 0.02]} />
                </mesh>
                <mesh position={[0, 0.62, 0]} material={accentGlowMaterial}>
                  <coneGeometry args={[0.04, 0.14, 4]} />
                </mesh>
              </group>
            ) : isBrute ? (
              /* Heavy Tower Shield */
              <group position={[-0.12, -0.22, 0.15]} rotation={[0, 0.35, 0]}>
                <mesh material={rustedIronMaterial} castShadow>
                  <boxGeometry args={[0.42, 0.62, 0.06]} />
                </mesh>
                <mesh position={[0, 0, 0.05]} material={darkMetalMaterial}>
                  <coneGeometry args={[0.08, 0.12, 6]} />
                </mesh>
              </group>
            ) : (
              /* Round Buckler */
              <group position={[-0.1, -0.24, 0.14]} rotation={[0, 0.35, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={rustedIronMaterial} castShadow>
                  <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
                </mesh>
                <mesh position={[0, 0, 0.03]} material={darkMetalMaterial}>
                  <coneGeometry args={[0.06, 0.1, 6]} />
                </mesh>
              </group>
            )}
          </group>

          {/* RIGHT ARM & VARIANT WEAPON */}
          <group ref={rightArmRef} position={[0.31, 0.36, 0]}>
            <mesh position={[0.03, 0.04, 0]} material={rustedIronMaterial} castShadow>
              <sphereGeometry args={[isBrute || isDreadlord ? 0.16 : 0.13, 8, 8]} />
            </mesh>
            <mesh position={[0.03, -0.18, 0.04]} material={boneMaterial} castShadow>
              <cylinderGeometry args={[0.038, 0.035, 0.34, 6]} />
            </mesh>

            {isBrute ? (
              /* Heavy Spiked Maul */
              <group position={[0.03, -0.34, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0.36, 0]} material={darkMetalMaterial} castShadow>
                  <cylinderGeometry args={[0.032, 0.032, 1.05, 8]} />
                </mesh>
                <mesh position={[0, 0.88, 0]} material={rustedIronMaterial} castShadow>
                  <boxGeometry args={[0.34, 0.24, 0.24]} />
                </mesh>
              </group>
            ) : isWraith ? (
              /* Arcane Rune Halberd */
              <group position={[0.03, -0.34, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0.45, 0]} material={darkMetalMaterial} castShadow>
                  <cylinderGeometry args={[0.024, 0.024, 1.25, 8]} />
                </mesh>
                <mesh position={[0, 1.12, 0]} material={accentGlowMaterial}>
                  <octahedronGeometry args={[0.13, 0]} />
                </mesh>
              </group>
            ) : isStalker ? (
              /* Twin Stalker Blade */
              <group position={[0.03, -0.34, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, -0.06, 0]} material={darkMetalMaterial}>
                  <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
                </mesh>
                <mesh position={[0, 0.32, 0]} material={darkMetalMaterial} castShadow>
                  <boxGeometry args={[0.08, 0.6, 0.02]} />
                </mesh>
                <mesh position={[0, 0.66, 0]} material={accentGlowMaterial}>
                  <coneGeometry args={[0.04, 0.14, 4]} />
                </mesh>
              </group>
            ) : (
              /* Cleaver / Dreadlord Greatsword */
              <group position={[0.03, -0.34, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, -0.1, 0]} material={darkMetalMaterial}>
                  <cylinderGeometry args={[0.025, 0.025, 0.2, 6]} />
                </mesh>
                <mesh position={[0, 0.01, 0]} material={rustedIronMaterial}>
                  <boxGeometry args={[isDreadlord ? 0.34 : 0.26, 0.04, 0.05]} />
                </mesh>
                <mesh position={[0, isDreadlord ? 0.65 : 0.52, 0]} material={darkMetalMaterial} castShadow>
                  <boxGeometry args={[isDreadlord ? 0.16 : 0.13, isDreadlord ? 1.25 : 0.98, 0.025]} />
                </mesh>
                <mesh
                  position={[0.02, isDreadlord ? 1.32 : 1.04, 0]}
                  rotation={[0, 0, isDreadlord ? 0 : 0.3]}
                  material={isDreadlord ? accentGlowMaterial : darkMetalMaterial}
                >
                  <coneGeometry args={[isDreadlord ? 0.09 : 0.08, 0.22, 4]} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
