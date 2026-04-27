// Falling gummies timer — gummy candies fall into a basket as time passes.
// No clock language, no numbers. Purely visual urgency.

import { useEffect, useRef, useState } from 'react';

interface FallingGummiesProps {
  durationMs: number;
  color: string;
  onComplete: (result: 'before' | 'after') => void;
  /** Call this when the child says they're done reading */
  onChildFinished?: () => void;
}

const GUMMY_COUNT = 8;

// Each gummy has a random horizontal position, stagger delay, and shape
const GUMMY_SHAPES = ['●', '◆', '▲', '★', '♥', '●', '◆', '▲'];
const GUMMY_SIZES  = [18, 22, 16, 20, 18, 24, 16, 20];

interface GummyParticle {
  id: number;
  x: number;       // % from left
  delay: number;   // ms before starting to fall
  shape: string;
  size: number;
  color: string;
}

function makeParticles(color: string): GummyParticle[] {
  return Array.from({ length: GUMMY_COUNT }, (_, i) => ({
    id: i,
    x: 10 + (i * 10) + Math.random() * 5,
    delay: (i * 300) + Math.random() * 200,
    shape: GUMMY_SHAPES[i],
    size: GUMMY_SIZES[i],
    color,
  }));
}

export default function FallingGummies({ durationMs, color, onComplete, onChildFinished }: FallingGummiesProps) {
  const [particles] = useState(() => makeParticles(color));
  const [basketLevel, setBasketLevel] = useState(0); // 0–100%
  const [finished, setFinished] = useState(false);
  const startMs = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - startMs.current;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setBasketLevel(pct);

      if (pct >= 100 && !doneRef.current) {
        doneRef.current = true;
        setFinished(true);
        onComplete('after');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [durationMs, onComplete]);

  function handleChildDone() {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setFinished(true);
    onChildFinished?.();
    onComplete('before');
  }

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Falling area */}
      <div className="relative w-64 h-48 overflow-hidden rounded-2xl bg-white/50">
        {!finished && particles.map(p => (
          <div
            key={p.id}
            className="absolute top-0"
            style={{
              left: `${p.x}%`,
              fontSize: p.size,
              color: p.color,
              animation: `gummyFall ${durationMs / 1000}s linear ${p.delay}ms forwards`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          >
            {p.shape}
          </div>
        ))}
        {finished && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🍬</span>
          </div>
        )}
      </div>

      {/* Basket */}
      <div className="w-48 h-14 relative">
        <div className="absolute inset-0 rounded-b-3xl rounded-t-lg border-4 border-gray-300 bg-gray-100 overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-200 rounded-b-2xl"
            style={{ height: `${basketLevel}%`, backgroundColor: color, opacity: 0.6 }}
          />
        </div>
        <div className="absolute -top-1 left-0 right-0 h-3 bg-gray-300 rounded-t-lg" />
      </div>

      {/* Done button */}
      {!finished && onChildFinished && (
        <button
          onClick={handleChildDone}
          className="mt-2 px-6 py-3 rounded-2xl text-white font-bold text-base active:scale-95 transition-transform shadow"
          style={{ backgroundColor: color }}
        >
          I'm done reading! ✓
        </button>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes gummyFall {
          0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(220px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
