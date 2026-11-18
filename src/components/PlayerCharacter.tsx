import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createShieldTexture } from '../utils/textures';

interface PlayerCharacterProps {
  position: [number, number, number];
  rotationY: number;
  isMoving: boolean;
  isAttacking: boolean;
  attackProgress: number; // 0 to 1
  isDashing: boolean;
  isHit: boolean;
  isPaused?: boolean;
}

export const PlayerCharacter: React.FC<PlayerCharacterProps> = ({
  position,
  rotationY,
  isMoving,
  isAttacking,
  attackProgress,
  isDashing,
  isHit,
  isPaused = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const slashArcRef = useRef<THREE.Mesh>(null);

  // Procedural shield texture
  const shieldTexture = useMemo(() => createShieldTexture(), []);

  // Armored knight materials
  const armorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isHit ? 0xff3333 : 0x7c858e,
      roughness: 0.35,
      metalness: 0.85,
    });
  }, [isHit]);

  const goldTrimMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isHit ? 0xff6666 : 0xd4af37,
      roughness: 0.28,
      metalness: 0.9,
    });
  }, [isHit]);

  const underClothMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x1f2421,
      roughness: 0.8,
      metalness: 0.1,
    });
  }, []);

  const bladeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xebf2fa,
      roughness: 0.15,
      metalness: 0.95,
    });
  }, []);

  const shieldMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: shieldTexture,
      roughness: 0.4,
      metalness: 0.6,
    });
  }, [shieldTexture]);

  // Sword slash arc material
  const slashMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Update position and rotation smoothly
  useFrame((state, delta) => {
    if (isPaused || !groupRef.current) return;

    // Smooth position interpolation
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, position[0], 25, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, position[1], 25, delta);
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, position[2], 25, delta);

    // Smooth rotation interpolation
    const currentRot = groupRef.current.rotation.y;
    let diff = rotationY - currentRot;
    // Normalize shortest rotation delta around circle
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1, delta * 18);

    const time = state.clock.getElapsedTime();

    // Walking / Idle lower-body & shield-arm animation (runs even while swinging sword)
    if (isDashing) {
      // Dash pose: low crouch forward
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.75;
        torsoRef.current.rotation.x = 0.4;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = -0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.6;
    } else if (isMoving) {
      const walkFreq = 12;
      const legAngle = Math.sin(time * walkFreq) * 0.55;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle;

      if (leftArmRef.current) leftArmRef.current.rotation.x = -legAngle * 0.4;
      if (rightArmRef.current && !isAttacking) {
        rightArmRef.current.rotation.x = legAngle * 0.4;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = -0.15;
      }

      if (torsoRef.current) {
        torsoRef.current.position.y = 0.95 + Math.abs(Math.sin(time * walkFreq)) * 0.06;
        torsoRef.current.rotation.x = 0;
      }
    } else {
      // Idle breathing
      const breath = Math.sin(time * 3) * 0.02;
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.95 + breath;
        torsoRef.current.rotation.x = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current && !isAttacking) {
        rightArmRef.current.rotation.x = 0.1;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = -0.15;
      }
    }

    // Attack animation: Overhead slash
    if (isAttacking && rightArmRef.current && swordRef.current && slashArcRef.current) {
      const p = attackProgress;
      if (p < 0.3) {
        // Windup: raise arm high backwards
        const t = p / 0.3;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(0.1, -Math.PI * 0.75, t);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(0, -0.4, t);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(-0.15, 0.3, t);
        slashMaterial.opacity = 0;
      } else if (p < 0.75) {
        // Fast powerful overhead downward-forward swing
        const t = (p - 0.3) / 0.45;
        // Cubic ease for snappy swing impact
        const easeT = t * t * (3 - 2 * t);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.75, Math.PI * 0.45, easeT);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(-0.4, 0.3, easeT);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(0.3, -0.3, easeT);

        // Show slash arc
        slashMaterial.opacity = Math.sin(t * Math.PI) * 0.85;
        slashArcRef.current.rotation.z = -Math.PI * 0.2 + easeT * Math.PI * 0.8;
      } else {
        // Recovery back to idle
        const t = (p - 0.75) / 0.25;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.45, 0.1, t);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(0.3, 0, t);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(-0.3, -0.15, t);
        slashMaterial.opacity = (1 - t) * 0.3;
      }
    } else if (slashArcRef.current) {
      slashMaterial.opacity = 0;
    }
  });

  return (
    <group ref={groupRef} position={position} dispose={null}>
      {/* Contact Shadow Disk */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* DASH GHOST EFFECT */}
      {isDashing && (
        <mesh position={[0, 0.8, -0.3]}>
          <boxGeometry args={[0.6, 1.2, 0.4]} />
          <meshBasicMaterial color={0x60a5fa} transparent opacity={0.25} />
        </mesh>
      )}

      {/* LOWER BODY: Left & Right Armored Legs */}
      <group ref={leftLegRef} position={[-0.2, 0.48, 0]}>
        {/* Thigh Plate */}
        <mesh position={[0, 0, 0]} material={underClothMaterial} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.3, 8]} />
        </mesh>
        {/* Knee Poleyn */}
        <mesh position={[0, -0.14, 0.03]} material={goldTrimMaterial} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
        </mesh>
        {/* Greave / Shin */}
        <mesh position={[0, -0.28, 0]} material={armorMaterial} castShadow>
          <cylinderGeometry args={[0.075, 0.065, 0.25, 8]} />
        </mesh>
        {/* Armored Boot / Sabaton */}
        <mesh position={[0, -0.42, 0.06]} material={armorMaterial} castShadow>
          <boxGeometry args={[0.13, 0.1, 0.24]} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.2, 0.48, 0]}>
        {/* Thigh Plate */}
        <mesh position={[0, 0, 0]} material={underClothMaterial} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.3, 8]} />
        </mesh>
        {/* Knee Poleyn */}
        <mesh position={[0, -0.14, 0.03]} material={goldTrimMaterial} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
        </mesh>
        {/* Greave / Shin */}
        <mesh position={[0, -0.28, 0]} material={armorMaterial} castShadow>
          <cylinderGeometry args={[0.075, 0.065, 0.25, 8]} />
        </mesh>
        {/* Armored Boot / Sabaton */}
        <mesh position={[0, -0.42, 0.06]} material={armorMaterial} castShadow>
          <boxGeometry args={[0.13, 0.1, 0.24]} />
        </mesh>
      </group>

      {/* TORSO & UPPER BODY */}
      <group ref={torsoRef} position={[0, 0.95, 0]}>
        {/* Pelvis & Faulds Armor Belt */}
        <mesh position={[0, 0, 0]} material={goldTrimMaterial} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 0.16, 8]} />
        </mesh>

        {/* Steel Cuirass (Chestplate) */}
        <mesh position={[0, 0.22, 0]} material={armorMaterial} castShadow>
          <boxGeometry args={[0.44, 0.34, 0.26]} />
        </mesh>
        {/* Gorget (Neck guard) */}
        <mesh position={[0, 0.4, 0]} material={goldTrimMaterial} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.08, 8]} />
        </mesh>

        {/* KNIGHT GREATHELM */}
        <group position={[0, 0.58, 0]}>
          {/* Main Helm Cylinder/Dome */}
          <mesh position={[0, 0, 0]} material={armorMaterial} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.28, 12]} />
          </mesh>
          <mesh position={[0, 0.14, 0]} material={armorMaterial} castShadow>
            <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          {/* Golden Visor Eyeglass Slit */}
          <mesh position={[0, 0.03, 0.185]} material={goldTrimMaterial}>
            <boxGeometry args={[0.22, 0.04, 0.02]} />
          </mesh>
          {/* Dark Eye Slit Inset */}
          <mesh position={[0, 0.03, 0.19]}>
            <boxGeometry args={[0.18, 0.015, 0.02]} />
            <meshBasicMaterial color={0x000000} />
          </mesh>
          {/* Helmet Golden Plume/Ridge */}
          <mesh position={[0, 0.16, -0.04]} material={goldTrimMaterial}>
            <boxGeometry args={[0.04, 0.14, 0.28]} />
          </mesh>
        </group>

        {/* LEFT ARM & SHIELD */}
        <group ref={leftArmRef} position={[-0.28, 0.32, 0]}>
          {/* Left Pauldron (Curved Shoulder Plate) */}
          <mesh position={[-0.04, 0.05, 0]} material={armorMaterial} castShadow>
            <sphereGeometry args={[0.14, 8, 8]} />
          </mesh>
          <mesh position={[-0.04, 0.05, 0]} material={goldTrimMaterial}>
            <torusGeometry args={[0.13, 0.02, 6, 12]} />
          </mesh>
          {/* Arm & Gauntlet */}
          <mesh position={[-0.02, -0.16, 0.06]} material={underClothMaterial} castShadow>
            <cylinderGeometry args={[0.065, 0.06, 0.26, 8]} />
          </mesh>
          <mesh position={[-0.02, -0.28, 0.1]} material={armorMaterial} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
          </mesh>

          {/* HEATER SHIELD (Mounted on forearm) */}
          <group position={[-0.12, -0.18, 0.16]} rotation={[0, 0.3, 0]}>
            {/* Main Shield Plate */}
            <mesh material={shieldMaterial} castShadow>
              <boxGeometry args={[0.4, 0.55, 0.04]} />
            </mesh>
            {/* Shield Boss (Center Metal Stud) */}
            <mesh position={[0, 0, 0.03]} material={goldTrimMaterial}>
              <sphereGeometry args={[0.06, 8, 8]} />
            </mesh>
          </group>
        </group>

        {/* RIGHT ARM & BROADSWORD */}
        <group ref={rightArmRef} position={[0.28, 0.32, 0]}>
          {/* Right Pauldron */}
          <mesh position={[0.04, 0.05, 0]} material={armorMaterial} castShadow>
            <sphereGeometry args={[0.14, 8, 8]} />
          </mesh>
          <mesh position={[0.04, 0.05, 0]} material={goldTrimMaterial}>
            <torusGeometry args={[0.13, 0.02, 6, 12]} />
          </mesh>
          {/* Arm */}
          <mesh position={[0.02, -0.16, 0]} material={underClothMaterial} castShadow>
            <cylinderGeometry args={[0.065, 0.06, 0.26, 8]} />
          </mesh>
          {/* Gauntlet */}
          <mesh position={[0.02, -0.28, 0]} material={armorMaterial} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
          </mesh>

          {/* BROADSWORD */}
          <group ref={swordRef} position={[0.02, -0.32, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Sword Grip / Hilt */}
            <mesh position={[0, -0.1, 0]} material={underClothMaterial}>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
            </mesh>
            {/* Crossguard */}
            <mesh position={[0, 0, 0]} material={goldTrimMaterial} castShadow>
              <boxGeometry args={[0.28, 0.04, 0.04]} />
            </mesh>
            {/* Pommel */}
            <mesh position={[0, -0.2, 0]} material={goldTrimMaterial}>
              <sphereGeometry args={[0.04, 8, 8]} />
            </mesh>
            {/* Steel Blade */}
            <mesh position={[0, 0.5, 0]} material={bladeMaterial} castShadow>
              <boxGeometry args={[0.08, 0.95, 0.015]} />
            </mesh>
            {/* Blade Tip */}
            <mesh position={[0, 1.02, 0]} material={bladeMaterial} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.056, 0.056, 0.015]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* SWORD SLASH ARC EFFECT (Visual impact during attack) */}
      <mesh
        ref={slashArcRef}
        position={[0, 0.9, 0.6]}
        rotation={[Math.PI / 2, 0, 0]}
        material={slashMaterial}
      >
        <ringGeometry args={[0.6, 1.35, 24, 1, 0, Math.PI * 0.9]} />
      </mesh>
    </group>
  );
};
