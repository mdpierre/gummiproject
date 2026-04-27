// Canvas-based confetti burst. Fires once and clears itself.
// Uses the child's chosen gummy color as the dominant hue.

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  color: string;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  opacity: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeColor(base: string, variation: number): string {
  const [r, g, b] = hexToRgb(base);
  const rand = () => Math.floor((Math.random() - 0.5) * variation);
  return `rgb(${Math.min(255, Math.max(0, r + rand()))},${Math.min(255, Math.max(0, g + rand()))},${Math.min(255, Math.max(0, b + rand()))})`;
}

export default function Confetti({ color, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COUNT = 120;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 10 + 4),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      color: makeColor(color, 80),
      width: Math.random() * 10 + 4,
      height: Math.random() * 6 + 3,
      opacity: 1,
    }));

    let rafId: number;
    const startMs = Date.now();
    const DURATION = 2200;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const elapsed = Date.now() - startMs;

      for (const p of particles) {
        p.vy += 0.35; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / DURATION);

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx!.restore();
      }

      if (elapsed < DURATION) {
        rafId = requestAnimationFrame(draw);
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        onComplete?.();
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [color, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden
    />
  );
}
