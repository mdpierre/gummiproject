// Patience-window balloon — rises slowly off-screen over the configured duration.
// Disappears immediately when the child speaks. No numbers, no urgency text.

import { useEffect, useRef } from 'react';

interface BalloonCountdownProps {
  durationMs: number;
  color: string;
  onExpire: () => void;
}

export default function BalloonCountdown({ durationMs, color, onExpire }: BalloonCountdownProps) {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const timer = setTimeout(() => onExpireRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  const durationSec = durationMs / 1000;

  return (
    <div className="fixed bottom-8 right-8 pointer-events-none" aria-hidden>
      <div
        style={{
          animation: `balloonRise ${durationSec}s linear forwards`,
          fontSize: 48,
          filter: `drop-shadow(0 4px 8px ${color}66)`,
        }}
      >
        🎈
      </div>
      <style>{`
        @keyframes balloonRise {
          0%   { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-110vh) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
