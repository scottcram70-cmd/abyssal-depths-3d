import React, { useRef, useState, useCallback } from 'react';
import { Vector2D } from '../types/game';

interface VirtualJoystickProps {
  onMove: (vector: Vector2D) => void;
  onInteract?: () => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onInteract,
}) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<Vector2D>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const maxRadius = 46;

  const updateFromClientPos = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      setKnobOffset({ x: dx, y: dy });

      // Normalized output (-1..1) with slight deadzone
      const normDist = Math.min(1, dist / maxRadius);
      if (normDist < 0.12) {
        onMove({ x: 0, y: 0 });
      } else {
        const angle = Math.atan2(dy, dx);
        const scaled = (normDist - 0.12) / 0.88;
        onMove({
          x: Math.cos(angle) * scaled,
          y: Math.sin(angle) * scaled,
        });
      }
    },
    [onMove]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onInteract?.();

    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsActive(true);
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateFromClientPos(e.clientX, e.clientY);
  };

  const resetStick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    activePointerId.current = null;
    setIsActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={resetStick}
      onPointerCancel={resetStick}
      style={{ touchAction: 'none' }}
      aria-label="Movement Joystick"
      className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center select-none transition-colors ${
        isActive
          ? 'bg-stone-900/80 border-2 border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.28)]'
          : 'bg-stone-950/75 border-2 border-stone-600/70'
      }`}
    >
      {/* Subtle Inner Crosshair Ring */}
      <div className="pointer-events-none absolute inset-4 rounded-full border border-stone-700/50" />
      <div className="pointer-events-none absolute w-2 h-2 rounded-full bg-stone-600/60" />

      {/* Movable Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
        }}
        className={`pointer-events-none w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-shadow ${
          isActive
            ? 'bg-amber-600 border-2 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.5)]'
            : 'bg-stone-700 border-2 border-stone-400/80'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-stone-950/35 border border-white/20" />
      </div>
    </div>
  );
};
