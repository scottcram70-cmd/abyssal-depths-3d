import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EnemyState } from '../types/game';

interface SkeletonEnemyProps {
  position: [number, number, number];
  rotationY: number;
  state: EnemyState;
  attackProgress: number; // 0 to 1
  isHit: boolean;
  health: number;
  maxHealth: number;
}

export const SkeletonEnemy: React.FC<SkeletonEnemyProps> = ({
  position,
  rotationY,
  state,
  attackProgress,
  isHit,
  health,
  maxHealth,
}) => {
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
        color: isHit ? 0xff4444 : 0xd6cbb5,
        roughness: 0.72,
        metalness: 0.05,
        emissive: isHit ? 0x661111 : 0x000000,
      }),
    [isHit]
  );

  const rustedIronMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isHit ? 0xff5555 : 0x4b3b34,
        roughness: 0.58,
        metalness: 0.72,
      }),
    [isHit]
  );

  const darkMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x262220,
        roughness: 0.5,
        metalness: 0.85,
      }),
    []
  );

  const eyeGlowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: state === 'attack' ? 0xff2200 : 0xff5e1a,
      }),
    [state]
  );

  const telegraphMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const deathProgressRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !bodyGroupRef.current) return;

    // Smoothly track authoritative position
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

    // Smoothly track facing angle
    let diff = rotationY - groupRef.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1, delta * 14);

    const t = clock.getElapsedTime();

    if (state === 'dead') {
      deathProgressRef.current = Math.min(1, deathProgressRef.current + delta * 2.4);
      const dp = deathProgressRef.current;
      // Collapse onto floor
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
        // Telegraph windup: raise rusted cleaver overhead
        const wt = p / 0.55;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(0.1, -Math.PI * 0.85, wt);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(0, -0.25, wt);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(0.2, -0.35, wt);
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.18, wt);
        telegraphMaterial.opacity = 0.28 + Math.sin(wt * Math.PI * 4) * 0.12;
      } else if (p < 0.78) {
        // Brutal downward strike
        const st = (p - 0.55) / 0.23;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.85, Math.PI * 0.5, st);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(-0.25, 0.2, st);
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(-0.18, 0.24, st);
        telegraphMaterial.opacity = (1 - st) * 0.35;
      } else {
        // Recovery
        const rt = (p - 0.78) / 0.22;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.5, 0.1, rt);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(0.2, 0, rt);
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(0.24, 0, rt);
        telegraphMaterial.opacity = 0;
      }
      return;
    }

    telegraphMaterial.opacity = 0;

    if (state === 'chase') {
      // Menacing jerky skeletal march
      const walk = Math.sin(t * 9.5) * 0.52;
      if (leftLegRef.current) leftLegRef.current.rotation.x = walk;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -walk;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -walk * 0.45 + 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = walk * 0.35 - 0.25;
      bodyGroupRef.current.position.y = Math.abs(Math.sin(t * 9.5)) * 0.05;
      bodyGroupRef.current.rotation.x = 0.12;
    } else {
      // Idle sway
      const sway = Math.sin(t * 2.4) * 0.05;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.2 + sway;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.15 - sway;
      bodyGroupRef.current.rotation.z = sway * 0.5;
    }
  });

  const hpRatio = Math.max(0, Math.min(1, health / maxHealth));

  return (
    <group ref={groupRef} position={position} dispose={null}>
      {/* Contact Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 16]} />
        <meshBasicMaterial color={0x000000} transparent opacity={state === 'dead' ? 0.25 : 0.52} depthWrite={false} />
      </mesh>

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
            <planeGeometry args={[1.06, 0.13]} />
            <meshBasicMaterial color={0x110e0c} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-(1 - hpRatio) * 0.5, 0, 0.01]}>
            <planeGeometry args={[Math.max(0.001, hpRatio), 0.08]} />
            <meshBasicMaterial color={0xdc2626} side={THREE.DoubleSide} />
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
          {/* Pelvis */}
          <mesh position={[0, -0.18, 0]} material={boneMaterial} castShadow>
            <boxGeometry args={[0.36, 0.14, 0.2]} />
          </mesh>
          {/* Tattered Tasset Cloth */}
          <mesh position={[0, -0.28, 0.1]} material={rustedIronMaterial}>
            <boxGeometry args={[0.26, 0.22, 0.04]} />
          </mesh>
          {/* Spine Column */}
          <mesh position={[0, 0.12, -0.04]} material={boneMaterial} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.56, 6]} />
          </mesh>

          {/* Ribcage */}
          {[0.08, 0.19, 0.3].map((ry, idx) => (
            <mesh key={`rib-${idx}`} position={[0, ry, 0.02]} material={boneMaterial} castShadow>
              <boxGeometry args={[0.42 - idx * 0.02, 0.055, 0.24]} />
            </mesh>
          ))}
          {/* Sternum */}
          <mesh position={[0, 0.2, 0.13]} material={boneMaterial}>
            <boxGeometry args={[0.08, 0.28, 0.04]} />
          </mesh>

          {/* Shoulder Clavicle */}
          <mesh position={[0, 0.39, 0]} material={boneMaterial}>
            <boxGeometry args={[0.56, 0.06, 0.09]} />
          </mesh>

          {/* SKULL & HORNED IRON HELM */}
          <group ref={skullRef} position={[0, 0.62, 0]}>
            {/* Cranium */}
            <mesh position={[0, 0.04, 0]} material={boneMaterial} castShadow>
              <sphereGeometry args={[0.165, 10, 10]} />
            </mesh>
            {/* Cheekbones & Jaw */}
            <mesh position={[0, -0.09, 0.04]} material={boneMaterial} castShadow>
              <boxGeometry args={[0.17, 0.11, 0.18]} />
            </mesh>
            {/* Dark Eye Sockets */}
            <mesh position={[-0.065, 0.02, 0.145]}>
              <sphereGeometry args={[0.036, 6, 6]} />
              <meshBasicMaterial color={0x050404} />
            </mesh>
            <mesh position={[0.065, 0.02, 0.145]}>
              <sphereGeometry args={[0.036, 6, 6]} />
              <meshBasicMaterial color={0x050404} />
            </mesh>
            {/* Glowing Undead Embers */}
            <mesh position={[-0.065, 0.02, 0.168]} material={eyeGlowMaterial}>
              <sphereGeometry args={[0.018, 6, 6]} />
            </mesh>
            <mesh position={[0.065, 0.02, 0.168]} material={eyeGlowMaterial}>
              <sphereGeometry args={[0.018, 6, 6]} />
            </mesh>
            {/* Rusty Crown / Horned Helm */}
            <mesh position={[0, 0.11, -0.01]} material={rustedIronMaterial} castShadow>
              <cylinderGeometry args={[0.175, 0.185, 0.12, 10]} />
            </mesh>
            {/* Left & Right Broken Horns */}
            <mesh position={[-0.19, 0.18, 0]} rotation={[0, 0, 0.55]} material={boneMaterial}>
              <coneGeometry args={[0.04, 0.22, 6]} />
            </mesh>
            <mesh position={[0.19, 0.18, 0]} rotation={[0, 0, -0.55]} material={boneMaterial}>
              <coneGeometry args={[0.04, 0.22, 6]} />
            </mesh>
          </group>

          {/* LEFT ARM & SPIKED IRON BUCKLER */}
          <group ref={leftArmRef} position={[-0.31, 0.36, 0]}>
            <mesh position={[-0.03, 0.04, 0]} material={rustedIronMaterial} castShadow>
              <sphereGeometry args={[0.13, 8, 8]} />
            </mesh>
            <mesh position={[-0.03, -0.18, 0.04]} material={boneMaterial} castShadow>
              <cylinderGeometry args={[0.038, 0.035, 0.34, 6]} />
            </mesh>
            {/* Tattered Round Buckler */}
            <group position={[-0.1, -0.24, 0.14]} rotation={[0, 0.35, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={rustedIronMaterial} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
              </mesh>
              <mesh position={[0, 0, 0.03]} material={darkMetalMaterial}>
                <coneGeometry args={[0.06, 0.1, 6]} />
              </mesh>
            </group>
          </group>

          {/* RIGHT ARM & RUSTED CLEAVER BLADE */}
          <group ref={rightArmRef} position={[0.31, 0.36, 0]}>
            <mesh position={[0.03, 0.04, 0]} material={rustedIronMaterial} castShadow>
              <sphereGeometry args={[0.13, 8, 8]} />
            </mesh>
            <mesh position={[0.03, -0.18, 0.04]} material={boneMaterial} castShadow>
              <cylinderGeometry args={[0.038, 0.035, 0.34, 6]} />
            </mesh>
            {/* Rusted Broad Cleaver */}
            <group position={[0.03, -0.34, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
              {/* Hilt */}
              <mesh position={[0, -0.1, 0]} material={darkMetalMaterial}>
                <cylinderGeometry args={[0.025, 0.025, 0.2, 6]} />
              </mesh>
              {/* Guard */}
              <mesh position={[0, 0.01, 0]} material={rustedIronMaterial}>
                <boxGeometry args={[0.26, 0.04, 0.05]} />
              </mesh>
              {/* Wide Notched Blade */}
              <mesh position={[0, 0.52, 0]} material={darkMetalMaterial} castShadow>
                <boxGeometry args={[0.13, 0.98, 0.02]} />
              </mesh>
              <mesh position={[0.02, 1.04, 0]} rotation={[0, 0, 0.3]} material={darkMetalMaterial}>
                <coneGeometry args={[0.08, 0.2, 4]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
