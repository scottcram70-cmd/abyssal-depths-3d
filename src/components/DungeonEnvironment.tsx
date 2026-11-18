import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createStoneFloorTexture,
  createStoneWallTexture,
  createWoodBarrelTexture,
} from '../utils/textures';
import {
  DUNGEON_OBSTACLES,
  EXIT_PORTAL_POSITION,
  KEY_POSITION,
  LOCKED_GATE_POSITION,
  POTION_SPAWNS,
  SANCTUM_GATE_POSITION,
  WARDEN_GATE_POSITION,
} from '../utils/obstacles';

interface TorchProps {
  position: [number, number, number];
  rotationY?: number;
  phaseOffset?: number;
  hasLight?: boolean;
  flameColor?: number;
}

const WallTorch: React.FC<TorchProps> = ({
  position,
  rotationY = 0,
  phaseOffset = 0,
  hasLight = true,
  flameColor = 0xff7a1a,
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 8.5 + phaseOffset;
    const flicker =
      Math.sin(t) * 0.18 +
      Math.sin(t * 2.3) * 0.12 +
      Math.cos(t * 4.1) * 0.06;

    if (lightRef.current) {
      lightRef.current.intensity = 5.5 + flicker * 2.8;
    }
    if (flameRef.current) {
      const scaleY = 1 + flicker * 0.35;
      const scaleXZ = 1 - flicker * 0.12;
      flameRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    }
    if (innerFlameRef.current) {
      innerFlameRef.current.scale.setScalar(1 + flicker * 0.25);
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, -0.05, 0.1]} castShadow>
        <boxGeometry args={[0.1, 0.24, 0.2]} />
        <meshStandardMaterial color={0x22201e} metalness={0.8} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.08, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.02, 6, 12]} />
        <meshStandardMaterial color={0x1a1817} metalness={0.85} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.05, 0.22]} rotation={[0.22, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.03, 0.52, 8]} />
        <meshStandardMaterial color={0x4a2e1a} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.2, 0.27]}>
        <cylinderGeometry args={[0.07, 0.05, 0.12, 8]} />
        <meshStandardMaterial color={0x1c1510} roughness={0.95} />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.35, 0.27]}>
        <coneGeometry args={[0.085, 0.28, 7]} />
        <meshBasicMaterial color={flameColor} transparent opacity={0.9} />
      </mesh>
      <mesh ref={innerFlameRef} position={[0, 0.31, 0.27]}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshBasicMaterial color={0xfff0a8} />
      </mesh>
      {hasLight && (
        <pointLight
          ref={lightRef}
          position={[0, 0.48, 0.42]}
          color={0xff8c38}
          intensity={5.5}
          distance={13}
          decay={1.7}
        />
      )}
    </group>
  );
};

interface BrokenPillarProps {
  position: [number, number, number];
  height: number;
  stoneMat: THREE.Material;
  darkStoneMat: THREE.Material;
}

const BrokenPillar: React.FC<BrokenPillarProps> = ({
  position,
  height,
  stoneMat,
  darkStoneMat,
}) => {
  const shaftHeight = Math.max(0.8, height - 0.35);
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={darkStoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.3, 1.3]} />
      </mesh>
      <mesh position={[0, 0.34, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.08, 0.12, 1.08]} />
      </mesh>
      <mesh
        position={[0, 0.35 + shaftHeight / 2, 0]}
        material={stoneMat}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.42, 0.46, shaftHeight, 10]} />
      </mesh>
      <mesh
        position={[0.05, 0.35 + shaftHeight + 0.06, -0.04]}
        rotation={[0.22, 0.4, -0.18]}
        material={darkStoneMat}
        castShadow
      >
        <cylinderGeometry args={[0.28, 0.42, 0.28, 7]} />
      </mesh>
      <mesh
        position={[0.58, 0.11, 0.42]}
        rotation={[0.4, 0.8, 0.2]}
        material={darkStoneMat}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.18, 0]} />
      </mesh>
      <mesh
        position={[-0.55, 0.09, -0.35]}
        rotation={[0.1, 1.2, 0.5]}
        material={stoneMat}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.14, 0]} />
      </mesh>
    </group>
  );
};

interface WoodBarrelProps {
  position: [number, number, number];
  woodMat: THREE.Material;
  ironMat: THREE.Material;
}

const WoodBarrel: React.FC<WoodBarrelProps> = ({ position, woodMat, ironMat }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.46, 0]} material={woodMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.88, 12]} />
      </mesh>
      <mesh position={[0, 0.46, 0]} material={woodMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.46, 12]} />
      </mesh>
      <mesh position={[0, 0.89, 0]} material={woodMat} receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.04, 12]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={ironMat}>
        <torusGeometry args={[0.385, 0.022, 6, 14]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={ironMat}>
        <torusGeometry args={[0.385, 0.022, 6, 14]} />
      </mesh>
    </group>
  );
};

const CrystalObelisk: React.FC<{
  position: [number, number, number];
  height: number;
  color: number;
  stoneMat: THREE.Material;
}> = ({ position, height, color, stoneMat }) => {
  const shardRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (shardRef.current) {
      const t = clock.getElapsedTime();
      shardRef.current.rotation.y = t * 0.45;
      shardRef.current.position.y = 1.05 + Math.sin(t * 2.2 + position[0]) * 0.07;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} material={stoneMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.62, 0.4, 8]} />
      </mesh>
      <mesh position={[0, 0.56, 0]} material={stoneMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.32, 6]} />
      </mesh>
      <mesh ref={shardRef} position={[0, 1.05, 0]} castShadow>
        <octahedronGeometry args={[Math.min(0.45, height * 0.18), 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.85}
          roughness={0.2}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.48, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} depthWrite={false} />
      </mesh>
    </group>
  );
};

const StoneSarcophagus: React.FC<{
  position: [number, number, number];
  color: number;
  stoneMat: THREE.Material;
  darkStoneMat: THREE.Material;
}> = ({ position, color, stoneMat, darkStoneMat }) => (
  <group position={position}>
    <mesh position={[0, 0.28, 0]} material={darkStoneMat} castShadow receiveShadow>
      <boxGeometry args={[1.65, 0.56, 1.05]} />
    </mesh>
    <mesh position={[0, 0.62, 0]} material={stoneMat} castShadow receiveShadow>
      <boxGeometry args={[1.76, 0.14, 1.15]} />
    </mesh>
    <mesh position={[0, 0.7, 0]}>
      <boxGeometry args={[1.05, 0.04, 0.22]} />
      <meshBasicMaterial color={color} />
    </mesh>
  </group>
);

const AltarBrazier: React.FC<{
  position: [number, number, number];
  accentColor: number;
  stoneMat: THREE.Material;
  darkStoneMat: THREE.Material;
  ironMat: THREE.Material;
  hasLight?: boolean;
}> = ({ position, accentColor, stoneMat, darkStoneMat, ironMat, hasLight = true }) => {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 6.5 + position[0] * 0.3;
    const pulse = Math.sin(t) * 0.25 + Math.cos(t * 2.1) * 0.15;
    if (lightRef.current) {
      lightRef.current.intensity = 4.2 + pulse * 1.5;
    }
    if (flameRef.current) {
      flameRef.current.scale.set(
        1 - pulse * 0.08,
        1 + pulse * 0.22,
        1 - pulse * 0.08
      );
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]} material={darkStoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.28, 1.2]} />
      </mesh>
      <mesh position={[0, 0.56, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.58, 0.85]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={darkStoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.38, 0.14, 1.0]} />
      </mesh>
      <mesh position={[0, 1.06, 0]} material={ironMat} castShadow>
        <cylinderGeometry args={[0.34, 0.18, 0.22, 10]} />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.24, 0]}>
        <coneGeometry args={[0.18, 0.34, 8]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.92} />
      </mesh>
      {hasLight && (
        <pointLight
          ref={lightRef}
          position={[0, 1.45, 0]}
          color={accentColor}
          intensity={4.2}
          distance={9}
          decay={2}
        />
      )}
    </group>
  );
};

const CollectibleKey: React.FC<{ collected: boolean; stoneMat: THREE.Material }> = ({
  collected,
  stoneMat,
}) => {
  const keyRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (keyRef.current && !collected) {
      keyRef.current.rotation.y += delta * 2.1;
      keyRef.current.position.y = 0.85 + Math.sin(t * 3.2) * 0.11;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 1.1;
    }
  });

  return (
    <group position={KEY_POSITION}>
      <mesh position={[0, 0.12, 0]} material={stoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[0.52, 0.62, 0.24, 12]} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.56, 18]} />
        <meshBasicMaterial
          color={collected ? 0x44403c : 0xfbbf24}
          transparent
          opacity={collected ? 0.35 : 0.85}
        />
      </mesh>

      {!collected && (
        <>
          <group ref={keyRef} position={[0, 0.85, 0]} rotation={[0.2, 0, 0.3]}>
            <mesh position={[0, 0.22, 0]}>
              <torusGeometry args={[0.14, 0.035, 8, 16]} />
              <meshStandardMaterial
                color={0xfbbf24}
                metalness={0.92}
                roughness={0.2}
                emissive={0xb45309}
                emissiveIntensity={0.45}
              />
            </mesh>
            <mesh position={[0, -0.06, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
              <meshStandardMaterial
                color={0xfcd34d}
                metalness={0.92}
                roughness={0.22}
                emissive={0xb45309}
                emissiveIntensity={0.35}
              />
            </mesh>
            <mesh position={[0.07, -0.18, 0]}>
              <boxGeometry args={[0.12, 0.05, 0.035]} />
              <meshStandardMaterial color={0xfcd34d} metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0.06, -0.26, 0]}>
              <boxGeometry args={[0.09, 0.045, 0.035]} />
              <meshStandardMaterial color={0xfcd34d} metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
          <pointLight
            position={[0, 1.1, 0]}
            color={0xfbbf24}
            intensity={3.6}
            distance={6}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

const HealingPotion: React.FC<{
  position: [number, number, number];
  collected: boolean;
  hasLight?: boolean;
}> = ({ position, collected, hasLight = true }) => {
  const bottleRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }, delta) => {
    if (lightRef.current) {
      if (collected) {
        lightRef.current.intensity = 0;
      } else {
        const t = clock.getElapsedTime();
        lightRef.current.intensity = 4.2 + Math.sin(t * 4.5) * 0.7;
      }
    }
    if (collected) return;
    const t = clock.getElapsedTime();
    if (bottleRef.current) {
      bottleRef.current.rotation.y += delta * 1.8;
      bottleRef.current.position.y = 0.56 + Math.sin(t * 3.0) * 0.09;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group position={position}>
      {!collected && (
        <>
          <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.32, 0.5, 20]} />
            <meshBasicMaterial color={0xef4444} transparent opacity={0.85} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.32, 16]} />
            <meshBasicMaterial color={0x991b1b} transparent opacity={0.55} depthWrite={false} />
          </mesh>

          <group ref={bottleRef} position={[0, 0.56, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.24, 14, 12]} />
              <meshStandardMaterial
                color={0xdc2626}
                emissive={0xef4444}
                emissiveIntensity={0.85}
                roughness={0.18}
                metalness={0.15}
              />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <sphereGeometry args={[0.17, 10, 10]} />
              <meshBasicMaterial color={0xff6b6b} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.08, 0.11, 0.16, 10]} />
              <meshStandardMaterial
                color={0xfca5a5}
                emissive={0xb91c1c}
                emissiveIntensity={0.35}
                roughness={0.2}
                metalness={0.2}
              />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.04, 10]} />
              <meshStandardMaterial color={0xd4af37} metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.39, 0]}>
              <cylinderGeometry args={[0.065, 0.06, 0.08, 8]} />
              <meshStandardMaterial color={0x78350f} roughness={0.9} />
            </mesh>
          </group>
        </>
      )}

      {hasLight && (
        <pointLight
          ref={lightRef}
          position={[0, 0.85, 0]}
          color={0xff3b4e}
          intensity={collected ? 0 : 4.2}
          distance={6.5}
          decay={1.8}
        />
      )}
    </group>
  );
};

const LockedGateBarrier: React.FC<{
  position: [number, number, number];
  unlocked: boolean;
  readyToOpen: boolean;
  lockedColor: number;
  readyColor: number;
  ironMat: THREE.Material;
  withLight?: boolean;
}> = ({
  position,
  unlocked,
  readyToOpen,
  lockedColor,
  readyColor,
  ironMat,
  withLight = false,
}) => {
  const gateRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!gateRef.current) return;
    const targetY = unlocked ? 3.2 : 0;
    gateRef.current.position.y = THREE.MathUtils.damp(
      gateRef.current.position.y,
      targetY,
      7,
      delta
    );
  });

  const sigilColor = readyToOpen ? readyColor : lockedColor;

  return (
    <group position={position}>
      <group ref={gateRef}>
        {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((bx, i) => (
          <mesh key={`bar-${i}`} position={[bx, 1.4, 0]} material={ironMat} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 2.8, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.65, 0]} material={ironMat} castShadow>
          <boxGeometry args={[3.9, 0.14, 0.14]} />
        </mesh>
        <mesh position={[0, 1.95, 0]} material={ironMat} castShadow>
          <boxGeometry args={[3.9, 0.14, 0.14]} />
        </mesh>
        {!unlocked && (
          <group position={[0, 1.3, 0.12]}>
            <mesh>
              <octahedronGeometry args={[0.24, 0]} />
              <meshBasicMaterial color={sigilColor} />
            </mesh>
            {withLight && (
              <pointLight
                color={sigilColor}
                intensity={2.4}
                distance={5}
                decay={2}
              />
            )}
          </group>
        )}
      </group>
    </group>
  );
};

const ExitPortal: React.FC<{
  active: boolean;
  stoneMat: THREE.Material;
  darkStoneMat: THREE.Material;
}> = ({ active, stoneMat, darkStoneMat }) => {
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += delta * (active ? 2.2 : 0.25);
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= delta * (active ? 1.4 : 0.15);
    }
  });

  return (
    <group position={EXIT_PORTAL_POSITION}>
      <mesh position={[0, 0.06, 0]} material={darkStoneMat} receiveShadow>
        <cylinderGeometry args={[1.65, 1.8, 0.12, 24]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} material={stoneMat} receiveShadow>
        <cylinderGeometry args={[1.35, 1.45, 0.06, 24]} />
      </mesh>

      {[-1.55, 1.55].map((ox, i) => (
        <group key={`obelisk-${i}`} position={[ox, 0, 0]}>
          <mesh position={[0, 1.15, 0]} material={darkStoneMat} castShadow>
            <boxGeometry args={[0.42, 2.3, 0.42]} />
          </mesh>
          <mesh position={[0, 2.38, 0]} material={stoneMat}>
            <coneGeometry args={[0.29, 0.45, 4]} />
          </mesh>
          <mesh position={[0, 1.55, 0.22]}>
            <boxGeometry args={[0.14, 0.45, 0.04]} />
            <meshBasicMaterial color={active ? 0x38bdf8 : 0x57534e} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 24]} />
        <meshBasicMaterial
          color={active ? 0x0ea5e9 : 0x1c1917}
          transparent
          opacity={active ? 0.85 : 0.9}
        />
      </mesh>
      <mesh ref={outerRingRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.18, 24]} />
        <meshBasicMaterial
          color={active ? 0x7dd3fc : 0x78716c}
          transparent
          opacity={active ? 0.95 : 0.45}
        />
      </mesh>
      <mesh ref={innerRingRef} position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.68, 16]} />
        <meshBasicMaterial
          color={active ? 0xfde047 : 0x44403c}
          transparent
          opacity={active ? 0.9 : 0.35}
        />
      </mesh>

      {active && (
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.85, 1.05, 2.4, 18, 1, true]} />
          <meshBasicMaterial
            color={0x38bdf8}
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      <pointLight
        position={[0, 1.4, 0]}
        color={0x38bdf8}
        intensity={active ? 6.5 : 2.2}
        distance={11}
        decay={1.8}
      />
    </group>
  );
};

const SceneEnvironmentProbe: React.FC = () => {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;

    return () => {
      scene.environment = null;
      envTarget.dispose();
      roomEnv.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  return null;
};

interface DungeonEnvironmentProps {
  destroyedObstacleIds: Set<string>;
  hasKey: boolean;
  collectedPotions: Set<string>;
  doorUnlocked: boolean;
  sanctumUnlocked: boolean;
  wardenUnlocked: boolean;
  portalActive: boolean;
  playerX: number;
  playerZ: number;
}

export const DungeonEnvironment: React.FC<DungeonEnvironmentProps> = ({
  destroyedObstacleIds,
  hasKey,
  collectedPotions,
  doorUnlocked,
  sanctumUnlocked,
  wardenUnlocked,
  portalActive,
  playerX,
  playerZ,
}) => {
  const { gl } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const dirTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  const floorTexture = useMemo(() => {
    const tex = createStoneFloorTexture();
    tex.repeat.set(4, 4);
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);

  const corridorFloorTexture = useMemo(() => {
    const tex = createStoneFloorTexture();
    tex.repeat.set(1.2, 2);
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);

  const wallTexture = useMemo(() => {
    const tex = createStoneWallTexture();
    tex.repeat.set(4, 1);
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);

  const woodTexture = useMemo(() => {
    const tex = createWoodBarrelTexture();
    tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.88,
        metalness: 0.08,
      }),
    [floorTexture]
  );

  const corridorFloorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: corridorFloorTexture,
        roughness: 0.88,
        metalness: 0.08,
      }),
    [corridorFloorTexture]
  );

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.92,
        metalness: 0.05,
      }),
    [wallTexture]
  );

  const pillarStoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x45403b,
        roughness: 0.85,
        metalness: 0.08,
      }),
    []
  );

  const darkStoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2a2623,
        roughness: 0.92,
        metalness: 0.06,
      }),
    []
  );

  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.82,
        metalness: 0.05,
      }),
    [woodTexture]
  );

  const ironMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x26282a,
        roughness: 0.45,
        metalness: 0.82,
      }),
    []
  );

  useFrame(() => {
    // Keep key directional shadow frustum centered near the player across both wings
    if (dirLightRef.current) {
      dirLightRef.current.position.set(playerX + 7, 13, playerZ + 6);
      dirTargetRef.current.position.set(playerX, 0, playerZ);
      dirTargetRef.current.updateMatrixWorld();
    }
  });

  const renderDoorwayWall = (
    zPos: number,
    torchSide: 'both' | 'south',
    centerX: number = 0,
    withLight: boolean = true,
    flameColor: number = 0xff7a1a
  ) => (
    <group>
      <mesh position={[centerX - 5.25, 0.72, zPos]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[5.9, 1.45, 0.65]} />
      </mesh>
      <mesh position={[centerX + 5.25, 0.72, zPos]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[5.9, 1.45, 0.65]} />
      </mesh>
      <mesh position={[centerX - 2.25, 1.45, zPos]} material={darkStoneMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.75, 2.9, 0.85]} />
      </mesh>
      <mesh position={[centerX + 2.25, 1.45, zPos]} material={darkStoneMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.75, 2.9, 0.85]} />
      </mesh>
      <WallTorch
        position={[centerX - 2.25, 2.25, zPos + 0.42]}
        rotationY={0}
        phaseOffset={1.2}
        hasLight={withLight}
        flameColor={flameColor}
      />
      <WallTorch
        position={[centerX + 2.25, 2.25, zPos + 0.42]}
        rotationY={0}
        phaseOffset={3.1}
        hasLight={false}
        flameColor={flameColor}
      />
      {torchSide === 'both' && (
        <WallTorch
          position={[centerX - 2.25, 2.25, zPos - 0.42]}
          rotationY={Math.PI}
          phaseOffset={4.6}
          hasLight={false}
          flameColor={flameColor}
        />
      )}
    </group>
  );

  const renderCorridorZ = (
    zCenter: number,
    centerX: number = 0,
    hasTorchLight: boolean = false,
    flameColor: number = 0xff7a1a
  ) => (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, zCenter]} material={corridorFloorMaterial} receiveShadow>
        <planeGeometry args={[4.6, 7.2]} />
      </mesh>
      <mesh position={[centerX - 2.4, 1.7, zCenter]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[7.0, 3.4, 0.6]} />
      </mesh>
      <mesh position={[centerX + 2.4, 0.38, zCenter]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.76, 7.0]} />
      </mesh>
      <WallTorch
        position={[centerX - 1.95, 2.2, zCenter]}
        rotationY={Math.PI / 2}
        phaseOffset={3.8}
        hasLight={hasTorchLight}
        flameColor={flameColor}
      />
    </group>
  );

  const renderSplitPartitionCurbZ = (zPos: number, centerX: number = 0) => (
    <group>
      <mesh position={[centerX - 5.25, 0.38, zPos]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[5.9, 0.76, 0.55]} />
      </mesh>
      <mesh position={[centerX + 5.25, 0.38, zPos]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[5.9, 0.76, 0.55]} />
      </mesh>
    </group>
  );

  return (
    <>
      <SceneEnvironmentProbe />

      {/* Atmospheric Dark Cavern Background & Fog */}
      <color attach="background" args={['#0b0908']} />
      <fogExp2 attach="fog" args={['#0b0908', 0.024]} />

      {/* Base Cool/Warm Contrast Rig */}
      <hemisphereLight args={['#3b4b63', '#16100c', 0.58]} />
      <primitive object={dirTargetRef.current} />
      <directionalLight
        ref={dirLightRef}
        target={dirTargetRef.current}
        position={[7, 13, 6]}
        intensity={1.35}
        color="#ffd7a8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[12, 8, -32]} intensity={0.45} color="#4d6b8a" />

      {/* Outer Dark Abyss Sub-Floor spanning all 8 rooms across West & East wings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.15, -33]}>
        <planeGeometry args={[120, 160]} />
        <meshBasicMaterial color={0x070505} />
      </mesh>

      {/* ================= ROOM 1: ENTRY CRYPT (0, 0) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[2.1, 2.35, 32]} />
        <meshStandardMaterial color={0x3a3228} roughness={0.75} metalness={0.2} />
      </mesh>
      <mesh position={[-8.1, 2.0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[-8.1, 4.12, 0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[-7.45, 2.4, -4.2]} rotationY={Math.PI / 2} phaseOffset={0.5} hasLight={false} />
      <WallTorch position={[-7.45, 2.4, 4.2]} rotationY={Math.PI / 2} phaseOffset={2.7} />
      <mesh position={[0, 0.32, 8.05]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.4, 0.64, 0.55]} />
      </mesh>
      <mesh position={[8.05, 0.32, 0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      {renderDoorwayWall(-8.0, 'south', 0, true)}

      {/* ================= CORRIDOR 1 -> 2 (0, -11) ================= */}
      {renderCorridorZ(-11.0, 0, true)}

      {/* ================= ROOM 2: BONE VAULT (0, -22) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -22.0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      {renderSplitPartitionCurbZ(-14.0, 0)}
      <mesh position={[-8.1, 2.0, -22.0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[-8.1, 4.12, -22.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[-7.45, 2.4, -26.2]} rotationY={Math.PI / 2} phaseOffset={1.6} hasLight={false} />
      <WallTorch position={[-7.45, 2.4, -17.8]} rotationY={Math.PI / 2} phaseOffset={4.4} />
      <mesh position={[8.05, 0.32, -22.0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      <CollectibleKey collected={hasKey} stoneMat={darkStoneMaterial} />
      {renderDoorwayWall(-30.0, 'south', 0, true)}
      <LockedGateBarrier
        position={LOCKED_GATE_POSITION}
        unlocked={doorUnlocked}
        readyToOpen={hasKey}
        lockedColor={0xef4444}
        readyColor={0x34d399}
        ironMat={ironMaterial}
        withLight={true}
      />

      {/* ================= CORRIDOR 2 -> 3 (0, -33) ================= */}
      {renderCorridorZ(-33.0, 0, false)}

      {/* ================= ROOM 3: ABYSSAL SANCTUM (0, -44) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -44.0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -44.6]} receiveShadow>
        <ringGeometry args={[2.3, 2.6, 32]} />
        <meshStandardMaterial color={0x4a2525} roughness={0.75} metalness={0.25} />
      </mesh>
      {renderSplitPartitionCurbZ(-36.0, 0)}
      <mesh position={[-8.1, 2.0, -44.0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[-8.1, 4.12, -44.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[-7.45, 2.4, -48.2]} rotationY={Math.PI / 2} phaseOffset={4.0} hasLight={false} />
      <WallTorch position={[-7.45, 2.4, -39.8]} rotationY={Math.PI / 2} phaseOffset={5.5} hasLight={false} />
      <mesh position={[8.05, 0.32, -44.0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      {/* Room 3 -> Room 4 Sanctum Doorway & Guardian Seal Gate */}
      {renderDoorwayWall(-52.0, 'both', 0, false)}
      <LockedGateBarrier
        position={SANCTUM_GATE_POSITION}
        unlocked={sanctumUnlocked}
        readyToOpen={sanctumUnlocked}
        lockedColor={0xdc2626}
        readyColor={0x34d399}
        ironMat={ironMaterial}
      />

      {/* ================= CORRIDOR 3 -> 4 (0, -55) ================= */}
      {renderCorridorZ(-55.0, 0, false, 0x10b981)}

      {/* ================= ROOM 4: PLAGUE CATACOMBS (0, -66) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -66.0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -66.0]} receiveShadow>
        <ringGeometry args={[2.2, 2.48, 32]} />
        <meshStandardMaterial color={0x174234} roughness={0.75} metalness={0.25} />
      </mesh>
      <pointLight position={[0, 3.2, -66.0]} color={0x10b981} intensity={4.8} distance={16} decay={1.7} />
      {renderSplitPartitionCurbZ(-58.0, 0)}
      {/* North Back Wall (Full Height) */}
      <mesh position={[0, 2.0, -74.1]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.8, 4.0, 0.7]} />
      </mesh>
      <mesh position={[0, 4.12, -74.1]} material={darkStoneMaterial}>
        <boxGeometry args={[17.0, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[-4.2, 2.4, -73.45]} rotationY={0} phaseOffset={1.1} hasLight={false} flameColor={0x10b981} />
      <WallTorch position={[4.2, 2.4, -73.45]} rotationY={0} phaseOffset={3.3} hasLight={false} flameColor={0x10b981} />
      {/* West Wall (Full Height) */}
      <mesh position={[-8.1, 2.0, -66.0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[-8.1, 4.12, -66.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <mesh position={[-8.0, 2.2, -74.0]} material={darkStoneMaterial} castShadow receiveShadow>
        <boxGeometry args={[1.2, 4.4, 1.2]} />
      </mesh>
      {/* East Partition Curb with 4.5m Doorway Opening at z = -66 */}
      <mesh position={[8.05, 0.38, -71.225]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.76, 5.95]} />
      </mesh>
      <mesh position={[8.05, 0.38, -60.775]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.76, 5.95]} />
      </mesh>
      <mesh position={[8.05, 1.45, -68.25]} material={darkStoneMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.85, 2.9, 0.75]} />
      </mesh>
      <mesh position={[8.05, 1.45, -63.75]} material={darkStoneMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.85, 2.9, 0.75]} />
      </mesh>

      {/* ================= CORRIDOR 4 -> 5 (East Bridge at x = 12, z = -66) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12.0, 0, -66.0]} material={corridorFloorMaterial} receiveShadow>
        <planeGeometry args={[9.6, 4.6]} />
      </mesh>
      <mesh position={[12.0, 1.7, -68.4]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[9.2, 3.4, 0.6]} />
      </mesh>
      <mesh position={[12.0, 0.38, -63.6]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[9.2, 0.76, 0.5]} />
      </mesh>
      <WallTorch position={[12.0, 2.2, -67.95]} rotationY={0} phaseOffset={2.1} hasLight={false} flameColor={0xf59e0b} />

      {/* ================= ROOM 5: SHATTERED OSSUARY (24, -66) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0, -66.0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0.012, -66.0]} receiveShadow>
        <ringGeometry args={[2.2, 2.5, 32]} />
        <meshStandardMaterial color={0x5c3c18} roughness={0.75} metalness={0.2} />
      </mesh>
      {/* North Wall (Full Height) */}
      <mesh position={[24.0, 2.0, -74.1]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.8, 4.0, 0.7]} />
      </mesh>
      <mesh position={[24.0, 4.12, -74.1]} material={darkStoneMaterial}>
        <boxGeometry args={[17.0, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[19.8, 2.4, -73.45]} rotationY={0} phaseOffset={0.8} hasLight={false} />
      <WallTorch position={[28.2, 2.4, -73.45]} rotationY={0} phaseOffset={2.6} hasLight={false} />
      {/* West Wall with Archway Opening at z = -66 */}
      <mesh position={[15.9, 2.0, -71.275]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[6.05, 4.0, 0.7]} />
      </mesh>
      <mesh position={[15.9, 2.0, -60.725]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[6.05, 4.0, 0.7]} />
      </mesh>
      <mesh position={[15.9, 3.45, -66.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[4.6, 1.1, 0.76]} />
      </mesh>
      <mesh position={[15.9, 4.12, -66.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      {/* East Low Curb */}
      <mesh position={[32.05, 0.32, -66.0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      {/* South Doorway 5 -> 6 */}
      {renderDoorwayWall(-58.0, 'south', 24.0, false)}

      {/* ================= CORRIDOR 5 -> 6 (24, -55) ================= */}
      {renderCorridorZ(-55.0, 24.0, false, 0xa855f7)}

      {/* ================= ROOM 6: ARCANE CONDUIT (24, -44) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0, -44.0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0.012, -44.0]} receiveShadow>
        <ringGeometry args={[2.3, 2.6, 32]} />
        <meshStandardMaterial color={0x3b1f5e} roughness={0.65} metalness={0.35} />
      </mesh>
      <pointLight position={[24.0, 3.2, -44.0]} color={0xa855f7} intensity={5.2} distance={17} decay={1.7} />
      {renderSplitPartitionCurbZ(-52.0, 24.0)}
      <mesh position={[15.9, 2.0, -44.0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[15.9, 4.12, -44.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[16.55, 2.4, -48.2]} rotationY={Math.PI / 2} phaseOffset={1.9} hasLight={false} flameColor={0xa855f7} />
      <WallTorch position={[16.55, 2.4, -39.8]} rotationY={Math.PI / 2} phaseOffset={4.1} hasLight={false} flameColor={0xa855f7} />
      <mesh position={[32.05, 0.32, -44.0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      {/* South Doorway 6 -> 7 */}
      {renderDoorwayWall(-36.0, 'south', 24.0, false, 0xef4444)}

      {/* ================= CORRIDOR 6 -> 7 (24, -33) ================= */}
      {renderCorridorZ(-33.0, 24.0, false, 0xef4444)}

      {/* ================= ROOM 7: WARDEN'S BASTION (24, -22) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0, -22.0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0.012, -22.0]} receiveShadow>
        <ringGeometry args={[2.45, 2.8, 32]} />
        <meshStandardMaterial color={0x6b1c1c} roughness={0.7} metalness={0.3} />
      </mesh>
      {renderSplitPartitionCurbZ(-30.0, 24.0)}
      <mesh position={[15.9, 2.0, -22.0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[15.9, 4.12, -22.0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[16.55, 2.4, -26.2]} rotationY={Math.PI / 2} phaseOffset={1.2} hasLight={false} flameColor={0xff3b30} />
      <WallTorch position={[16.55, 2.4, -17.8]} rotationY={Math.PI / 2} phaseOffset={3.5} hasLight={false} flameColor={0xff3b30} />
      <mesh position={[32.05, 0.32, -22.0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      {/* South Doorway 7 -> 8 + Warden Seal Gate */}
      {renderDoorwayWall(-14.0, 'both', 24.0, false, 0x38bdf8)}
      <LockedGateBarrier
        position={WARDEN_GATE_POSITION}
        unlocked={wardenUnlocked}
        readyToOpen={wardenUnlocked}
        lockedColor={0xef4444}
        readyColor={0x38bdf8}
        ironMat={ironMaterial}
      />

      {/* ================= CORRIDOR 7 -> 8 (24, -11) ================= */}
      {renderCorridorZ(-11.0, 24.0, false, 0x38bdf8)}

      {/* ================= ROOM 8: THRONE OF ESCAPE (24, 0) ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24.0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[2.3, 2.6, 32]} />
        <meshStandardMaterial color={0x1e40af} roughness={0.7} metalness={0.3} />
      </mesh>
      {renderSplitPartitionCurbZ(-8.0, 24.0)}
      <mesh position={[15.9, 2.0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.6, 4.0, 0.7]} />
      </mesh>
      <mesh position={[15.9, 4.12, 0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[16.8, 0.26, 0.88]} />
      </mesh>
      <WallTorch position={[16.55, 2.4, -4.2]} rotationY={Math.PI / 2} phaseOffset={0.9} hasLight={false} flameColor={0x38bdf8} />
      <WallTorch position={[16.55, 2.4, 4.2]} rotationY={Math.PI / 2} phaseOffset={2.9} hasLight={false} flameColor={0x38bdf8} />
      <mesh position={[32.05, 0.32, 0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>
      <mesh position={[24.0, 0.32, 8.05]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.4, 0.64, 0.55]} />
      </mesh>
      {/* Final Exit Portal in Room 8 */}
      <ExitPortal
        active={portalActive}
        stoneMat={pillarStoneMaterial}
        darkStoneMat={darkStoneMaterial}
      />

      {/* ================= HEALING POTIONS ================= */}
      {POTION_SPAWNS.map((potion) => (
        <HealingPotion
          key={potion.id}
          position={potion.position}
          collected={collectedPotions.has(potion.id)}
          hasLight={potion.hasLight !== false}
        />
      ))}

      {/* ================= OBSTACLES & ARCHITECTURAL PROPS ================= */}
      {DUNGEON_OBSTACLES.map((obs) => {
        if (obs.destructible && destroyedObstacleIds.has(obs.id)) {
          return null;
        }

        if (obs.type === 'pillar') {
          return (
            <BrokenPillar
              key={obs.id}
              position={obs.position}
              height={obs.height}
              stoneMat={pillarStoneMaterial}
              darkStoneMat={darkStoneMaterial}
            />
          );
        }

        if (obs.type === 'barrel') {
          return (
            <WoodBarrel
              key={obs.id}
              position={obs.position}
              woodMat={woodMaterial}
              ironMat={ironMaterial}
            />
          );
        }

        if (obs.type === 'crystal') {
          return (
            <CrystalObelisk
              key={obs.id}
              position={obs.position}
              height={obs.height}
              color={obs.accentColor ?? 0x38bdf8}
              stoneMat={darkStoneMaterial}
            />
          );
        }

        if (obs.type === 'sarcophagus') {
          return (
            <StoneSarcophagus
              key={obs.id}
              position={obs.position}
              color={obs.accentColor ?? 0x10b981}
              stoneMat={pillarStoneMaterial}
              darkStoneMat={darkStoneMaterial}
            />
          );
        }

        if (obs.type === 'altar') {
          return (
            <AltarBrazier
              key={obs.id}
              position={obs.position}
              accentColor={obs.accentColor ?? 0xff6a1a}
              stoneMat={pillarStoneMaterial}
              darkStoneMat={darkStoneMaterial}
              ironMat={ironMaterial}
              hasLight={obs.id !== 'r7-altar-east'}
            />
          );
        }

        return (
          <group key={obs.id} position={obs.position}>
            <mesh
              position={[0, 0.22, 0]}
              rotation={[0.3, 0.5, 0.1]}
              material={darkStoneMaterial}
              castShadow
              receiveShadow
            >
              <dodecahedronGeometry args={[0.38, 0]} />
            </mesh>
            <mesh
              position={[0.28, 0.14, -0.18]}
              rotation={[0.7, 0.2, 0.4]}
              material={pillarStoneMaterial}
              castShadow
              receiveShadow
            >
              <dodecahedronGeometry args={[0.22, 0]} />
            </mesh>
            <mesh
              position={[-0.26, 0.12, 0.22]}
              rotation={[0.1, 0.9, 0.3]}
              material={darkStoneMaterial}
              castShadow
              receiveShadow
            >
              <dodecahedronGeometry args={[0.19, 0]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};
