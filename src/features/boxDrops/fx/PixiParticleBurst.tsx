import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export type ParticleBurstPreset = 'foam' | 'sparks' | 'motes' | 'tape' | 'rarity_gold';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'line';
}

interface PixiParticleBurstProps {
  preset: ParticleBurstPreset;
  count?: number;
  durationMs?: number;
  className?: string;
  onComplete?: () => void;
}

/**
 * Ephemeral Particle Burst Component
 * Simulates high-velocity particle effects (foam crumbs, connector sparks, tape fragments, golden motes)
 * using an efficient lightweight canvas. Cleans up RAF and canvas context automatically upon completion.
 */
export const PixiParticleBurst: React.FC<PixiParticleBurstProps> = ({
  preset,
  count = 48,
  durationMs = 1200,
  className = '',
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.offsetWidth || 300);
    const height = (canvas.height = canvas.offsetHeight || 200);

    const originX = width / 2;
    const originY = height / 2;

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      let speed = 2 + Math.random() * 5;
      let size = 2 + Math.random() * 3;
      let color = '#78716c';
      let decay = 0.015 + Math.random() * 0.02;
      let shape: 'rect' | 'circle' | 'line' = 'rect';

      if (preset === 'foam') {
        // Charcoal foam bits
        color = Math.random() > 0.4 ? '#292524' : '#57534e';
        size = 2 + Math.random() * 4;
        speed = 1.5 + Math.random() * 4;
        decay = 0.018;
      } else if (preset === 'sparks') {
        // High-velocity electric sparks
        color = Math.random() > 0.3 ? '#f59e0b' : '#38bdf8';
        size = 1.5 + Math.random() * 2;
        speed = 4 + Math.random() * 7;
        shape = 'line';
        decay = 0.028;
      } else if (preset === 'motes' || preset === 'rarity_gold') {
        // Gentle golden rising motes
        color = Math.random() > 0.5 ? '#facc15' : '#fbbf24';
        size = 2 + Math.random() * 3;
        speed = 1 + Math.random() * 2.5;
        shape = 'circle';
        decay = 0.012;
      } else if (preset === 'tape') {
        // Magnetic tape ribbon flakes
        color = '#451a03';
        size = 3 + Math.random() * 5;
        shape = 'rect';
        speed = 2 + Math.random() * 3.5;
      }

      particles.push({
        x: originX + (Math.random() - 0.5) * 20,
        y: originY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (preset === 'motes' ? 1.5 : 0),
        size,
        alpha: 1.0,
        decay,
        color,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        shape,
      });
    }

    let animId: number;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > durationMs) {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      let anyAlive = false;

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        anyAlive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, p.alpha - p.decay);

        // Air drag & gravity
        if (preset === 'foam' || preset === 'tape') {
          p.vy += 0.12; // Gravity
          p.vx *= 0.98; // Air resistance
        } else if (preset === 'sparks') {
          p.vy += 0.08;
          p.vx *= 0.96;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'line') {
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(-p.size * 2, 0);
          ctx.lineTo(p.size * 2, 0);
          ctx.stroke();
        }

        ctx.restore();
      }

      if (anyAlive) {
        animId = requestAnimationFrame(render);
      } else {
        onComplete?.();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, width, height);
    };
  }, [preset, count, durationMs, reducedMotion, onComplete]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 w-full h-full ${className}`}
    />
  );
};
