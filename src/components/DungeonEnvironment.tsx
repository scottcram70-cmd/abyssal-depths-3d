import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createStoneFloorTexture,
  createStoneWallTexture,
  createWoodBarrelTexture,
} from '../utils/textures';
import { DUNGEON_OBSTACLES } from '../utils/obstacles';

interface TorchProps {
  position: [number, number, number];
  rotationY?: number;
  phaseOffset?: number;
}

const WallTorch: React.FC<TorchProps> = ({
  position,
  rotationY = 0,
  phaseOffset = 0,
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
      {/* Iron wall bracket */}
      <mesh position={[0, -0.05, 0.1]} castShadow>
        <boxGeometry args={[0.1, 0.24, 0.2]} />
        <meshStandardMaterial color={0x22201e} metalness={0.8} roughness={0.45} />
      </mesh>
      {/* Iron ring collar */}
      <mesh position={[0, 0.08, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.02, 6, 12]} />
        <meshStandardMaterial color={0x1a1817} metalness={0.85} roughness={0.4} />
      </mesh>
      {/* Wooden torch handle */}
      <mesh position={[0, -0.05, 0.22]} rotation={[0.22, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.03, 0.52, 8]} />
        <meshStandardMaterial color={0x4a2e1a} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Charred oil-soaked head */}
      <mesh position={[0, 0.2, 0.27]}>
        <cylinderGeometry args={[0.07, 0.05, 0.12, 8]} />
        <meshStandardMaterial color={0x1c1510} roughness={0.95} />
      </mesh>
      {/* Outer orange flame */}
      <mesh ref={flameRef} position={[0, 0.35, 0.27]}>
        <coneGeometry args={[0.085, 0.28, 7]} />
        <meshBasicMaterial color={0xff7a1a} transparent opacity={0.9} />
      </mesh>
      {/* Bright yellow-white core */}
      <mesh ref={innerFlameRef} position={[0, 0.31, 0.27]}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshBasicMaterial color={0xfff0a8} />
      </mesh>
      {/* Warm flickering light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.48, 0.42]}
        color={0xff8c38}
        intensity={5.5}
        distance={11}
        decay={1.8}
      />
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
      {/* Stepped stone plinth base */}
      <mesh position={[0, 0.15, 0]} material={darkStoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.3, 1.3]} />
      </mesh>
      <mesh position={[0, 0.34, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[1.08, 0.12, 1.08]} />
      </mesh>
      {/* Fluted column shaft */}
      <mesh
        position={[0, 0.35 + shaftHeight / 2, 0]}
        material={stoneMat}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.42, 0.46, shaftHeight, 10]} />
      </mesh>
      {/* Jagged broken cap */}
      <mesh
        position={[0.05, 0.35 + shaftHeight + 0.06, -0.04]}
        rotation={[0.22, 0.4, -0.18]}
        material={darkStoneMat}
        castShadow
      >
        <cylinderGeometry args={[0.28, 0.42, 0.28, 7]} />
      </mesh>
      {/* Fallen stone chunks at base */}
      <mesh position={[0.58, 0.11, 0.42]} rotation={[0.4, 0.8, 0.2]} material={darkStoneMat} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
      </mesh>
      <mesh position={[-0.55, 0.09, -0.35]} rotation={[0.1, 1.2, 0.5]} material={stoneMat} castShadow receiveShadow>
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
      {/* Bulging barrel body */}
      <mesh position={[0, 0.46, 0]} material={woodMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.88, 12]} />
      </mesh>
      {/* Wider middle belly */}
      <mesh position={[0, 0.46, 0]} material={woodMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.46, 12]} />
      </mesh>
      {/* Top & bottom lids */}
      <mesh position={[0, 0.89, 0]} material={woodMat} receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.04, 12]} />
      </mesh>
      {/* Iron binding hoops */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={ironMat}>
        <torusGeometry args={[0.385, 0.022, 6, 14]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={ironMat}>
        <torusGeometry args={[0.385, 0.022, 6, 14]} />
      </mesh>
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

export const DungeonEnvironment: React.FC = () => {
  const { gl } = useThree();
  const brazierLightRef = useRef<THREE.PointLight>(null);
  const brazierFlameRef = useRef<THREE.Mesh>(null);

  const floorTexture = useMemo(() => {
    const tex = createStoneFloorTexture();
    tex.repeat.set(4, 4);
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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 6.5;
    const pulse = Math.sin(t) * 0.25 + Math.cos(t * 2.1) * 0.15;
    if (brazierLightRef.current) {
      brazierLightRef.current.intensity = 4.2 + pulse * 1.5;
    }
    if (brazierFlameRef.current) {
      brazierFlameRef.current.scale.set(1 - pulse * 0.08, 1 + pulse * 0.22, 1 - pulse * 0.08);
    }
  });

  return (
    <>
      <SceneEnvironmentProbe />

      {/* Atmospheric Dark Cavern Background & Fog */}
      <color attach="background" args={['#0b0908']} />
      <fogExp2 attach="fog" args={['#0b0908', 0.028]} />

      {/* Base Cool/Warm Contrast Rig */}
      <hemisphereLight args={['#3b4b63', '#16100c', 0.55]} />
      <directionalLight
        position={[7, 13, 6]}
        intensity={1.35}
        color="#ffd7a8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {/* Cool abyssal rim backlight for silhouette separation */}
      <directionalLight position={[-8, 6, -8]} intensity={0.45} color="#4d6b8a" />

      {/* Main Stone Dungeon Floor (16x16 playable arena) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[16.2, 16.2]} />
      </mesh>

      {/* Outer Dark Abyss Sub-Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color={0x070505} />
      </mesh>

      {/* Center Stone Medallion Inlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[2.1, 2.35, 32]} />
        <meshStandardMaterial color={0x3a3228} roughness={0.75} metalness={0.2} />
      </mesh>

      {/* BACK WALLS (North & West — full height stone masonry) */}
      {/* North Wall (z = -8.1) */}
      <mesh position={[0, 2.0, -8.1]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.8, 4.0, 0.7]} />
      </mesh>
      {/* North Wall Top Coping */}
      <mesh position={[0, 4.12, -8.1]} material={darkStoneMaterial}>
        <boxGeometry args={[17.0, 0.26, 0.88]} />
      </mesh>

      {/* West Wall (x = -8.1) */}
      <mesh position={[-8.1, 2.0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.8, 4.0, 0.7]} />
      </mesh>
      {/* West Wall Top Coping */}
      <mesh position={[-8.1, 4.12, 0]} rotation={[0, Math.PI / 2, 0]} material={darkStoneMaterial}>
        <boxGeometry args={[17.0, 0.26, 0.88]} />
      </mesh>

      {/* Corner Bastion Block (NW) */}
      <mesh position={[-8.0, 2.2, -8.0]} material={darkStoneMaterial} castShadow receiveShadow>
        <boxGeometry args={[1.2, 4.4, 1.2]} />
      </mesh>

      {/* FRONT LOW RUINED PERIMETER CURBS (South & East — low height so camera never occluded) */}
      {/* South Ruined Curb */}
      <mesh position={[0, 0.32, 8.05]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[16.4, 0.64, 0.55]} />
      </mesh>
      {/* East Ruined Curb */}
      <mesh position={[8.05, 0.32, 0]} material={darkStoneMaterial} receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.64, 16.4]} />
      </mesh>

      {/* WALL ARCHWAYS & PILASTERS */}
      {[-4.2, 4.2].map((xPos, i) => (
        <mesh key={`pilaster-n-${i}`} position={[xPos, 2.0, -7.65]} material={darkStoneMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.7, 4.0, 0.4]} />
        </mesh>
      ))}
      {[-4.2, 4.2].map((zPos, i) => (
        <mesh key={`pilaster-w-${i}`} position={[-7.65, 2.0, zPos]} material={darkStoneMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.4, 4.0, 0.7]} />
        </mesh>
      ))}

      {/* FLICKERING WALL TORCHES */}
      <WallTorch position={[-4.2, 2.4, -7.45]} rotationY={0} phaseOffset={0.4} />
      <WallTorch position={[4.2, 2.4, -7.45]} rotationY={0} phaseOffset={2.1} />
      <WallTorch position={[-7.45, 2.4, -4.2]} rotationY={Math.PI / 2} phaseOffset={4.0} />
      <WallTorch position={[-7.45, 2.4, 4.2]} rotationY={Math.PI / 2} phaseOffset={5.7} />

      {/* DUNGEON OBSTACLES (Pillars, Altar, Barrels, Rubble) */}
      {DUNGEON_OBSTACLES.map((obs) => {
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

        if (obs.type === 'altar') {
          return (
            <group key={obs.id} position={obs.position}>
              {/* Stone Altar Pedestal */}
              <mesh position={[0, 0.14, 0]} material={darkStoneMaterial} castShadow receiveShadow>
                <boxGeometry args={[1.8, 0.28, 1.3]} />
              </mesh>
              <mesh position={[0, 0.56, 0]} material={pillarStoneMaterial} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.58, 0.9]} />
              </mesh>
              <mesh position={[0, 0.9, 0]} material={darkStoneMaterial} castShadow receiveShadow>
                <boxGeometry args={[1.55, 0.14, 1.05]} />
              </mesh>
              {/* Iron Brazier Bowl on Altar */}
              <mesh position={[0, 1.06, 0]} material={ironMaterial} castShadow>
                <cylinderGeometry args={[0.36, 0.2, 0.22, 10]} />
              </mesh>
              {/* Glowing Ritual Embers */}
              <mesh ref={brazierFlameRef} position={[0, 1.24, 0]}>
                <coneGeometry args={[0.18, 0.34, 8]} />
                <meshBasicMaterial color={0xff6a1a} transparent opacity={0.92} />
              </mesh>
              <pointLight
                ref={brazierLightRef}
                position={[0, 1.45, 0]}
                color={0xff7b2e}
                intensity={4.2}
                distance={8}
                decay={2}
              />
            </group>
          );
        }

        // Rubble pile
        return (
          <group key={obs.id} position={obs.position}>
            <mesh position={[0, 0.22, 0]} rotation={[0.3, 0.5, 0.1]} material={darkStoneMaterial} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.38, 0]} />
            </mesh>
            <mesh position={[0.28, 0.14, -0.18]} rotation={[0.7, 0.2, 0.4]} material={pillarStoneMaterial} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.22, 0]} />
            </mesh>
            <mesh position={[-0.26, 0.12, 0.22]} rotation={[0.1, 0.9, 0.3]} material={darkStoneMaterial} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.19, 0]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};
