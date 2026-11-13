import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { DungeonEnvironment } from './components/DungeonEnvironment';
import { PlayerCharacter } from './components/PlayerCharacter';
import { SkeletonEnemy } from './components/SkeletonEnemy';
import {
  CombatParticles3D,
  DamageNumbersOverlay,
  ProjectedDamageNumber,
} from './components/CombatEffects';
import { GameHUD } from './components/GameHUD';
import { soundManager } from './audio/soundManager';
import { resolveMovementCollision } from './utils/obstacles';
import { EnemyState, SparkParticle, Vector2D } from './types/game';

// Probe software WebGL once (never throttle game logic, only GPU cost)
const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 120;
const PLAYER_SPEED = 4.6;
const DASH_SPEED = 11.5;
const DASH_DURATION = 0.18;
const DASH_COOLDOWN = 1.1;
const ATTACK_DURATION = 0.36;
const ATTACK_COOLDOWN = 0.54;
const ENEMY_DETECT_RANGE = 7.0;
const ENEMY_ATTACK_RANGE = 1.85;
const ENEMY_SPEED = 2.65;
const ENEMY_ATTACK_DURATION = 0.78;
const ENEMY_ATTACK_COOLDOWN = 1.35;

const _projVec = new THREE.Vector3();

interface GameWorldProps {
  joystickRef: React.MutableRefObject<Vector2D>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  attackRequestedRef: React.MutableRefObject<boolean>;
  dashRequestedRef: React.MutableRefObject<boolean>;
  resetCounter: number;
  onHudSync: (data: {
    playerHp: number;
    enemyHp: number;
    enemyDefeated: boolean;
    playerDefeated: boolean;
    attackCooldownRatio: number;
    dashCooldownRatio: number;
    damageNumbers: ProjectedDamageNumber[];
  }) => void;
}

const GameWorld: React.FC<GameWorldProps> = ({
  joystickRef,
  keysRef,
  attackRequestedRef,
  dashRequestedRef,
  resetCounter,
  onHudSync,
}) => {
  const { camera } = useThree();

  // Mutable simulation state inside refs for 60fps loop without stale closures
  const simRef = useRef({
    playerPos: { x: 0, z: 3.6 },
    playerRot: Math.PI, // Facing north toward the skeleton
    playerHp: PLAYER_MAX_HP,
    playerHitTimer: 0,
    isMoving: false,
    isAttacking: false,
    attackTimer: 0,
    attackCooldownTimer: 0,
    hasDealtSwingDamage: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldownTimer: 0,
    dashDir: { x: 0, z: -1 },

    enemyPos: { x: 0, z: -3.2 },
    enemyRot: 0, // Facing south toward player
    enemyHp: ENEMY_MAX_HP,
    enemyState: 'idle' as EnemyState,
    enemyAttackTimer: 0,
    enemyCooldownTimer: 0,
    enemyHurtTimer: 0,
    enemyHitFlashTimer: 0,
    hasDealtEnemyDamage: false,
    victoryTriggered: false,

    shakeIntensity: 0,
    camTarget: { x: 0, z: 1.5 },
    particles: [] as SparkParticle[],
    damageNumbers: [] as {
      id: string;
      value: number;
      x: number;
      y: number;
      z: number;
      color: string;
      lifetime: number;
      isCrit?: boolean;
    }[],
    impactRing: null as { x: number; z: number; progress: number } | null,
  });

  // React render state for animated 3D props
  const [renderState, setRenderState] = useState({
    playerPos: [0, 0, 3.6] as [number, number, number],
    playerRot: Math.PI,
    isMoving: false,
    isAttacking: false,
    attackProgress: 0,
    isDashing: false,
    playerHit: false,
    enemyPos: [0, 0, -3.2] as [number, number, number],
    enemyRot: 0,
    enemyState: 'idle' as EnemyState,
    enemyAttackProgress: 0,
    enemyHit: false,
    enemyHp: ENEMY_MAX_HP,
    particles: [] as SparkParticle[],
    impactRing: null as { x: number; z: number; progress: number } | null,
  });

  const lastHudSyncRef = useRef(0);

  // Reset entire encounter when Restart is triggered
  useEffect(() => {
    simRef.current = {
      playerPos: { x: 0, z: 3.6 },
      playerRot: Math.PI,
      playerHp: PLAYER_MAX_HP,
      playerHitTimer: 0,
      isMoving: false,
      isAttacking: false,
      attackTimer: 0,
      attackCooldownTimer: 0,
      hasDealtSwingDamage: false,
      isDashing: false,
      dashTimer: 0,
      dashCooldownTimer: 0,
      dashDir: { x: 0, z: -1 },

      enemyPos: { x: 0, z: -3.2 },
      enemyRot: 0,
      enemyHp: ENEMY_MAX_HP,
      enemyState: 'idle',
      enemyAttackTimer: 0,
      enemyCooldownTimer: 0,
      enemyHurtTimer: 0,
      enemyHitFlashTimer: 0,
      hasDealtEnemyDamage: false,
      victoryTriggered: false,

      shakeIntensity: 0,
      camTarget: { x: 0, z: 1.5 },
      particles: [],
      damageNumbers: [],
      impactRing: null,
    };

    camera.position.set(8.5, 11.6, 12.1);
    camera.lookAt(0, 0.7, 1.5);

    onHudSync({
      playerHp: PLAYER_MAX_HP,
      enemyHp: ENEMY_MAX_HP,
      enemyDefeated: false,
      playerDefeated: false,
      attackCooldownRatio: 0,
      dashCooldownRatio: 0,
      damageNumbers: [],
    });
  }, [resetCounter, camera, onHudSync]);

  const spawnParticles = useCallback(
    (x: number, y: number, z: number, color: string, count: number) => {
      const list = simRef.current.particles;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 3.8;
        list.push({
          id: `${Date.now()}-${Math.random()}`,
          x,
          y,
          z,
          vx: Math.cos(angle) * speed,
          vy: 1.5 + Math.random() * 3.5,
          vz: Math.sin(angle) * speed,
          color,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.55,
          size: 0.04 + Math.random() * 0.045,
        });
      }
    },
    []
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const sim = simRef.current;

    const playerAlive = sim.playerHp > 0;
    const enemyAlive = sim.enemyHp > 0;

    // 1. Decay timers
    if (sim.attackCooldownTimer > 0) sim.attackCooldownTimer = Math.max(0, sim.attackCooldownTimer - dt);
    if (sim.dashCooldownTimer > 0) sim.dashCooldownTimer = Math.max(0, sim.dashCooldownTimer - dt);
    if (sim.playerHitTimer > 0) sim.playerHitTimer = Math.max(0, sim.playerHitTimer - dt);
    if (sim.enemyCooldownTimer > 0) sim.enemyCooldownTimer = Math.max(0, sim.enemyCooldownTimer - dt);
    if (sim.enemyHitFlashTimer > 0) sim.enemyHitFlashTimer = Math.max(0, sim.enemyHitFlashTimer - dt);
    if (sim.shakeIntensity > 0) sim.shakeIntensity = Math.max(0, sim.shakeIntensity - dt * 1.8);

    // 2. Gather movement input (Virtual Joystick + WASD / Arrow Keys)
    let inputX = joystickRef.current.x;
    let inputY = joystickRef.current.y;

    const keys = keysRef.current;
    if (keys['KeyW'] || keys['ArrowUp']) inputY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) inputY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 1) {
      inputX /= inputLen;
      inputY /= inputLen;
    }

    // Map screen-space input onto 45-degree isometric camera axes:
    // Screen Right (+inputX) => World (+0.7071, -0.7071)
    // Screen Up (-inputY)    => World (-0.7071, -0.7071)
    const isoScale = Math.SQRT1_2;
    const moveWorldX = (inputX + inputY) * isoScale;
    const moveWorldZ = (-inputX + inputY) * isoScale;
    const hasMoveInput = inputLen > 0.12;

    // 3. Handle Player Attack request (auto-faces nearest living enemy)
    if (attackRequestedRef.current) {
      attackRequestedRef.current = false;
      if (playerAlive && !sim.isAttacking && sim.attackCooldownTimer <= 0 && !sim.isDashing) {
        sim.isAttacking = true;
        sim.attackTimer = 0;
        sim.attackCooldownTimer = ATTACK_COOLDOWN;
        sim.hasDealtSwingDamage = false;
        soundManager.playSwordSwing();

        // Auto-face nearest enemy within generous engagement radius
        if (enemyAlive) {
          const dx = sim.enemyPos.x - sim.playerPos.x;
          const dz = sim.enemyPos.z - sim.playerPos.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 6.5) {
            sim.playerRot = Math.atan2(dx, dz);
          }
        }
      }
    }

    // 4. Handle Player Dash request
    if (dashRequestedRef.current) {
      dashRequestedRef.current = false;
      if (playerAlive && !sim.isDashing && sim.dashCooldownTimer <= 0) {
        sim.isDashing = true;
        sim.isAttacking = false;
        sim.dashTimer = DASH_DURATION;
        sim.dashCooldownTimer = DASH_COOLDOWN;
        soundManager.playDash();

        if (hasMoveInput) {
          const norm = Math.hypot(moveWorldX, moveWorldZ) || 1;
          sim.dashDir = { x: moveWorldX / norm, z: moveWorldZ / norm };
          sim.playerRot = Math.atan2(sim.dashDir.x, sim.dashDir.z);
        } else {
          sim.dashDir = {
            x: Math.sin(sim.playerRot),
            z: Math.cos(sim.playerRot),
          };
        }
      }
    }

    // 5. Player Attack Execution & Movement (non-exclusive: player can move while swinging)
    if (playerAlive) {
      if (sim.isAttacking) {
        sim.attackTimer += dt;
        const progress = Math.min(1, sim.attackTimer / ATTACK_DURATION);

        // Trigger impact check at apex of overhead swing
        if (progress >= 0.44 && !sim.hasDealtSwingDamage) {
          sim.hasDealtSwingDamage = true;
          const ringX = sim.playerPos.x + Math.sin(sim.playerRot) * 1.1;
          const ringZ = sim.playerPos.z + Math.cos(sim.playerRot) * 1.1;
          sim.impactRing = { x: ringX, z: ringZ, progress: 0.01 };

          if (enemyAlive) {
            const dx = sim.enemyPos.x - sim.playerPos.x;
            const dz = sim.enemyPos.z - sim.playerPos.z;
            const dist = Math.hypot(dx, dz);
            const fwdX = Math.sin(sim.playerRot);
            const fwdZ = Math.cos(sim.playerRot);
            const dot = dist > 0.001 ? (dx / dist) * fwdX + (dz / dist) * fwdZ : 1;

            if (dist <= 2.45 && (dot >= 0.1 || dist < 1.2)) {
              const isCrit = Math.random() < 0.25;
              const dmg = isCrit
                ? 34 + Math.floor(Math.random() * 8)
                : 22 + Math.floor(Math.random() * 7);

              sim.enemyHp = Math.max(0, sim.enemyHp - dmg);
              sim.enemyHitFlashTimer = 0.18;
              sim.shakeIntensity = isCrit ? 0.28 : 0.16;

              soundManager.playHitSound(isCrit);
              spawnParticles(
                sim.enemyPos.x,
                1.05,
                sim.enemyPos.z,
                isCrit ? '#fbbf24' : '#e5e7eb',
                isCrit ? 16 : 10
              );

              sim.damageNumbers.push({
                id: `${Date.now()}-${Math.random()}`,
                value: dmg,
                x: sim.enemyPos.x + (Math.random() - 0.5) * 0.3,
                y: 1.9,
                z: sim.enemyPos.z,
                color: isCrit ? '#fbbf24' : '#ffffff',
                lifetime: 0.9,
                isCrit,
              });

              // Knockback enemy away from player
              if (dist > 0.001) {
                const kb = resolveMovementCollision(
                  sim.enemyPos.x + (dx / dist) * 0.48,
                  sim.enemyPos.z + (dz / dist) * 0.48,
                  0.5
                );
                sim.enemyPos.x = kb.x;
                sim.enemyPos.z = kb.z;
              }

              if (sim.enemyHp <= 0) {
                sim.enemyState = 'dead';
                if (!sim.victoryTriggered) {
                  sim.victoryTriggered = true;
                  soundManager.playBoneCrumble();
                  setTimeout(() => soundManager.playVictoryFanfare(), 220);
                  spawnParticles(sim.enemyPos.x, 0.8, sim.enemyPos.z, '#d6cbb5', 20);
                }
              } else if (sim.enemyState !== 'attack') {
                sim.enemyState = 'hurt';
                sim.enemyHurtTimer = 0.22;
              }
            }
          }
        }

        if (sim.attackTimer >= ATTACK_DURATION) {
          sim.isAttacking = false;
          sim.attackTimer = 0;
        }
      }

      if (sim.isDashing) {
        sim.dashTimer -= dt;
        const nextX = sim.playerPos.x + sim.dashDir.x * DASH_SPEED * dt;
        const nextZ = sim.playerPos.z + sim.dashDir.z * DASH_SPEED * dt;
        const resolved = resolveMovementCollision(nextX, nextZ, 0.48);
        sim.playerPos.x = resolved.x;
        sim.playerPos.z = resolved.z;
        sim.isMoving = true;

        if (sim.dashTimer <= 0) {
          sim.isDashing = false;
        }
      } else if (hasMoveInput) {
        const nextX = sim.playerPos.x + moveWorldX * PLAYER_SPEED * dt;
        const nextZ = sim.playerPos.z + moveWorldZ * PLAYER_SPEED * dt;
        const resolved = resolveMovementCollision(nextX, nextZ, 0.48);
        sim.playerPos.x = resolved.x;
        sim.playerPos.z = resolved.z;

        // Preserve auto-facing toward nearby enemy during an active swing; otherwise face movement direction
        const hasLockedEnemy =
          sim.isAttacking &&
          enemyAlive &&
          Math.hypot(sim.enemyPos.x - sim.playerPos.x, sim.enemyPos.z - sim.playerPos.z) < 6.5;
        if (!hasLockedEnemy) {
          sim.playerRot = Math.atan2(moveWorldX, moveWorldZ);
        }
        sim.isMoving = true;
      } else {
        sim.isMoving = false;
      }
    } else {
      sim.isMoving = false;
    }

    // 6. Actor-vs-Actor separation (Player & living Skeleton shouldn't clip inside each other)
    if (playerAlive && enemyAlive) {
      const dx = sim.playerPos.x - sim.enemyPos.x;
      const dz = sim.playerPos.z - sim.enemyPos.z;
      const distSq = dx * dx + dz * dz;
      const minSep = 0.96;
      if (distSq < minSep * minSep && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const push = (minSep - dist) * 0.5;
        const nx = dx / dist;
        const nz = dz / dist;
        const pRes = resolveMovementCollision(
          sim.playerPos.x + nx * push,
          sim.playerPos.z + nz * push,
          0.48
        );
        const eRes = resolveMovementCollision(
          sim.enemyPos.x - nx * push,
          sim.enemyPos.z - nz * push,
          0.5
        );
        sim.playerPos.x = pRes.x;
        sim.playerPos.z = pRes.z;
        sim.enemyPos.x = eRes.x;
        sim.enemyPos.z = eRes.z;
      }
    }

    // 7. Skeleton Warrior AI State Machine
    if (enemyAlive && playerAlive) {
      const dx = sim.playerPos.x - sim.enemyPos.x;
      const dz = sim.playerPos.z - sim.enemyPos.z;
      const dist = Math.hypot(dx, dz);

      if (sim.enemyState === 'hurt') {
        sim.enemyHurtTimer -= dt;
        if (sim.enemyHurtTimer <= 0) {
          sim.enemyState = 'chase';
        }
      } else if (sim.enemyState === 'attack') {
        sim.enemyAttackTimer += dt;
        const eProg = Math.min(1, sim.enemyAttackTimer / ENEMY_ATTACK_DURATION);

        if (eProg >= 0.6 && !sim.hasDealtEnemyDamage) {
          sim.hasDealtEnemyDamage = true;
          soundManager.playSkeletonAttack();

          if (dist <= 2.15 && !sim.isDashing) {
            const enemyDmg = 12 + Math.floor(Math.random() * 5);
            sim.playerHp = Math.max(0, sim.playerHp - enemyDmg);
            sim.playerHitTimer = 0.22;
            sim.shakeIntensity = 0.22;
            soundManager.playPlayerHurt();
            spawnParticles(sim.playerPos.x, 1.0, sim.playerPos.z, '#ef4444', 10);

            sim.damageNumbers.push({
              id: `${Date.now()}-${Math.random()}`,
              value: enemyDmg,
              x: sim.playerPos.x,
              y: 1.9,
              z: sim.playerPos.z,
              color: '#ef4444',
              lifetime: 0.9,
            });
          }
        }

        if (sim.enemyAttackTimer >= ENEMY_ATTACK_DURATION) {
          sim.enemyState = 'chase';
          sim.enemyCooldownTimer = ENEMY_ATTACK_COOLDOWN;
        }
      } else {
        // Idle or Chase
        if (dist <= ENEMY_ATTACK_RANGE && sim.enemyCooldownTimer <= 0) {
          sim.enemyState = 'attack';
          sim.enemyAttackTimer = 0;
          sim.hasDealtEnemyDamage = false;
          sim.enemyRot = Math.atan2(dx, dz);
        } else if (dist <= ENEMY_DETECT_RANGE) {
          sim.enemyState = 'chase';
          sim.enemyRot = Math.atan2(dx, dz);
          if (dist > ENEMY_ATTACK_RANGE * 0.88) {
            const nx = dx / (dist || 1);
            const nz = dz / (dist || 1);
            const nextEnemy = resolveMovementCollision(
              sim.enemyPos.x + nx * ENEMY_SPEED * dt,
              sim.enemyPos.z + nz * ENEMY_SPEED * dt,
              0.5
            );
            sim.enemyPos.x = nextEnemy.x;
            sim.enemyPos.z = nextEnemy.z;
          }
        } else {
          sim.enemyState = 'idle';
        }
      }
    } else if (enemyAlive && !playerAlive) {
      sim.enemyState = 'idle';
    }

    // 8. Update Impact Ring & Particles
    if (sim.impactRing) {
      sim.impactRing.progress += dt * 3.8;
      if (sim.impactRing.progress >= 1) {
        sim.impactRing = null;
      }
    }

    for (let i = sim.particles.length - 1; i >= 0; i--) {
      const p = sim.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        sim.particles.splice(i, 1);
      } else {
        p.vy -= 9.5 * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.05, p.y + p.vy * dt);
        p.z += p.vz * dt;
      }
    }

    for (let i = sim.damageNumbers.length - 1; i >= 0; i--) {
      sim.damageNumbers[i].lifetime -= dt;
      if (sim.damageNumbers[i].lifetime <= 0) {
        sim.damageNumbers.splice(i, 1);
      }
    }

    // 9. Fixed 45-degree Isometric Camera Follow with Subtle Impact Shake
    sim.camTarget.x = THREE.MathUtils.damp(sim.camTarget.x, sim.playerPos.x * 0.55, 6, dt);
    sim.camTarget.z = THREE.MathUtils.damp(sim.camTarget.z, sim.playerPos.z * 0.55, 6, dt);

    const shakeX = sim.shakeIntensity > 0 ? (Math.random() - 0.5) * sim.shakeIntensity : 0;
    const shakeY = sim.shakeIntensity > 0 ? (Math.random() - 0.5) * sim.shakeIntensity : 0;

    camera.position.set(
      sim.camTarget.x + 8.5 + shakeX,
      11.6 + shakeY,
      sim.camTarget.z + 8.5
    );
    camera.lookAt(sim.camTarget.x, 0.7, sim.camTarget.z);

    // 10. Sync React visual props & HUD
    setRenderState({
      playerPos: [sim.playerPos.x, 0, sim.playerPos.z],
      playerRot: sim.playerRot,
      isMoving: sim.isMoving,
      isAttacking: sim.isAttacking,
      attackProgress: sim.isAttacking ? sim.attackTimer / ATTACK_DURATION : 0,
      isDashing: sim.isDashing,
      playerHit: sim.playerHitTimer > 0,
      enemyPos: [sim.enemyPos.x, 0, sim.enemyPos.z],
      enemyRot: sim.enemyRot,
      enemyState: sim.enemyState,
      enemyAttackProgress:
        sim.enemyState === 'attack' ? sim.enemyAttackTimer / ENEMY_ATTACK_DURATION : 0,
      enemyHit: sim.enemyHitFlashTimer > 0,
      enemyHp: sim.enemyHp,
      particles: [...sim.particles],
      impactRing: sim.impactRing ? { ...sim.impactRing } : null,
    });

    const now = state.clock.getElapsedTime();
    if (now - lastHudSyncRef.current > 0.045) {
      lastHudSyncRef.current = now;
      const projectedNums: ProjectedDamageNumber[] = sim.damageNumbers.map((dn) => {
        _projVec.set(dn.x, dn.y, dn.z).project(camera);
        return {
          ...dn,
          screenX: (_projVec.x * 0.5 + 0.5) * 100,
          screenY: (-_projVec.y * 0.5 + 0.5) * 100,
        };
      });

      onHudSync({
        playerHp: sim.playerHp,
        enemyHp: sim.enemyHp,
        enemyDefeated: sim.enemyHp <= 0,
        playerDefeated: sim.playerHp <= 0,
        attackCooldownRatio: sim.attackCooldownTimer / ATTACK_COOLDOWN,
        dashCooldownRatio: sim.dashCooldownTimer / DASH_COOLDOWN,
        damageNumbers: projectedNums,
      });
    }
  });

  return (
    <>
      <DungeonEnvironment />

      <PlayerCharacter
        position={renderState.playerPos}
        rotationY={renderState.playerRot}
        isMoving={renderState.isMoving}
        isAttacking={renderState.isAttacking}
        attackProgress={renderState.attackProgress}
        isDashing={renderState.isDashing}
        isHit={renderState.playerHit}
      />

      <SkeletonEnemy
        position={renderState.enemyPos}
        rotationY={renderState.enemyRot}
        state={renderState.enemyState}
        attackProgress={renderState.enemyAttackProgress}
        isHit={renderState.enemyHit}
        health={renderState.enemyHp}
        maxHealth={ENEMY_MAX_HP}
      />

      <CombatParticles3D
        particles={renderState.particles}
        impactRing={renderState.impactRing}
      />
    </>
  );
};

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'WebGL initialization failed' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-stone-950 p-6 text-center text-stone-200">
          <div className="max-w-md rounded-xl border border-red-800/60 bg-stone-900 p-6">
            <h1 className="text-lg font-bold text-red-400">3D Renderer Unavailable</h1>
            <p className="mt-2 text-sm text-stone-300">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const joystickRef = useRef<Vector2D>({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const attackRequestedRef = useRef(false);
  const dashRequestedRef = useRef(false);

  const [resetCounter, setResetCounter] = useState(0);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [hudState, setHudState] = useState({
    playerHp: PLAYER_MAX_HP,
    enemyHp: ENEMY_MAX_HP,
    enemyDefeated: false,
    playerDefeated: false,
    attackCooldownRatio: 0,
    dashCooldownRatio: 0,
    damageNumbers: [] as ProjectedDamageNumber[],
  });

  const handleInteract = useCallback(() => {
    soundManager.enableAudio();
  }, []);

  const handleMove = useCallback((vec: Vector2D) => {
    joystickRef.current = vec;
  }, []);

  const handleAttack = useCallback(() => {
    attackRequestedRef.current = true;
  }, []);

  const handleDash = useCallback(() => {
    dashRequestedRef.current = true;
  }, []);

  const handleRestart = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
    attackRequestedRef.current = false;
    dashRequestedRef.current = false;
    setResetCounter((c) => c + 1);
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Desktop keyboard support (WASD/Arrows to move, Space/J/Enter to attack, Shift/K to dash)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'Enter') {
        e.preventDefault();
        soundManager.enableAudio();
        attackRequestedRef.current = true;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') {
        e.preventDefault();
        soundManager.enableAudio();
        dashRequestedRef.current = true;
      } else if (e.code === 'KeyR') {
        handleRestart();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleRestart]);

  // Prevent iOS Safari pinch/gesture zoom & rubber-band scroll
  useEffect(() => {
    const preventGesture = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-stone-950 select-none"
      style={{ touchAction: 'none' }}
    >
      <SceneErrorBoundary>
        <Canvas
          className="h-full w-full block"
          dpr={isSoftwareGl ? 1 : [1, 2]}
          shadows={!isSoftwareGl}
          camera={{
            position: [8.5, 11.6, 12.1],
            fov: 42,
            near: 0.5,
            far: 80,
          }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
        >
          <GameWorld
            joystickRef={joystickRef}
            keysRef={keysRef}
            attackRequestedRef={attackRequestedRef}
            dashRequestedRef={dashRequestedRef}
            resetCounter={resetCounter}
            onHudSync={setHudState}
          />
        </Canvas>
      </SceneErrorBoundary>

      <DamageNumbersOverlay numbers={hudState.damageNumbers} />

      <GameHUD
        playerHp={hudState.playerHp}
        playerMaxHp={PLAYER_MAX_HP}
        enemyHp={hudState.enemyHp}
        enemyMaxHp={ENEMY_MAX_HP}
        enemyDefeated={hudState.enemyDefeated}
        playerDefeated={hudState.playerDefeated}
        attackCooldownRatio={hudState.attackCooldownRatio}
        dashCooldownRatio={hudState.dashCooldownRatio}
        isMuted={isMuted}
        onMove={handleMove}
        onAttack={handleAttack}
        onDash={handleDash}
        onRestart={handleRestart}
        onToggleMute={handleToggleMute}
        onInteract={handleInteract}
      />
    </div>
  );
}
