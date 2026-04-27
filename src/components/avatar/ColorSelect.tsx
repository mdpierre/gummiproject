// Color selection screen — avatar cycles through colors, child taps to claim one.
// After tapping: confirmation step (keep / change).
// On confirm: color locked, CSS var updated, phase advances to calibration.

import { useState, useEffect, useRef } from 'react';
import GummyAvatar from './GummyAvatar';
import Confetti from '../session/Confetti';
import { speak } from '../../lib/speech/tts';
import { useSession } from '../../context/SessionContext';

// Curated palette — visually distinct, child-friendly
const COLORS = [
  '#FF6B9D', // pink
  '#FF8C42', // orange
  '#FFD166', // yellow
  '#06D6A0', // mint
  '#26C7E8', // sky blue
  '#4A90D9', // blue
  '#9B5DE5', // purple
  '#F15BB5', // hot pink
];

const COLOR_NAMES: Record<string, string> = {
  '#FF6B9D': 'pink',
  '#FF8C42': 'orange',
  '#FFD166': 'yellow',
  '#06D6A0': 'mint green',
  '#26C7E8': 'sky blue',
  '#4A90D9': 'blue',
  '#9B5DE5': 'purple',
  '#F15BB5': 'hot pink',
};

const CYCLE_INTERVAL_MS = 1800;

export default function ColorSelect() {
  const { state, setConfig, setPhase } = useSession();
  const [colorIndex, setColorIndex] = useState(0);
  const [tapped, setTapped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiBurstId, setConfettiBurstId] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasGreeted = useRef(false);

  const currentColor = COLORS[colorIndex];
  const colorName = COLOR_NAMES[currentColor];

  // Start greeting TTS on mount
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      // Small delay so the screen has rendered
      const t = setTimeout(() => {
        speak("Hi! I'm Gummy! Tap me when you see the color you love!");
      }, 300);
      return () => clearTimeout(t);
    }
  }, []);

  // Cycle through colors while not tapped
  useEffect(() => {
    if (tapped) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setColorIndex(i => (i + 1) % COLORS.length);
    }, CYCLE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tapped]);

  // Apply chosen color to CSS var while cycling (live preview)
  useEffect(() => {
    document.documentElement.style.setProperty('--gummy-color', currentColor);
  }, [currentColor]);

  function handleAvatarTap() {
    if (confirmed) return;
    if (!tapped) {
      // First tap — freeze on this color
      setTapped(true);
      speak(`Ooh, ${colorName}! That's so cool! Do you want to keep it?`);
    }
  }

  function handleKeep() {
    setConfettiBurstId(id => id + 1);
    setShowConfetti(true);
    setConfirmed(true);
    speak(`${colorName} it is! Let's go!`);
    setConfig({
      ...state.config,
      chosenColor: currentColor,
    });
    // Advance to Whisper loading screen after TTS plays (~2s)
    setTimeout(() => setPhase('whisper-loading'), 2200);
  }

  function handleChange() {
    setTapped(false);
    speak("Okay! Pick another one!");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 transition-colors duration-700"
      style={{ background: `${currentColor}18` }}
    >
      {showConfetti && (
        <Confetti
          key={confettiBurstId}
          color={currentColor}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Prompt text */}
      <p
        className="text-2xl font-bold text-center max-w-xs leading-tight transition-colors duration-500"
        style={{ color: currentColor }}
      >
        {confirmed
          ? `${colorName.charAt(0).toUpperCase() + colorName.slice(1)}! Let's go! 🎉`
          : tapped
          ? `Ooh, ${colorName}! Keep it?`
          : 'Tap me when you see your color!'}
      </p>

      {/* Avatar */}
      <div className="relative">
        <GummyAvatar
          mode={confirmed ? 'celebrating' : tapped ? 'locked' : 'cycling'}
          color={currentColor}
          size={200}
          onClick={!tapped && !confirmed ? handleAvatarTap : undefined}
        />

        {/* Listening ripple rings — shown during cycling */}
        {!tapped && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full opacity-20 animate-ping"
            style={{ backgroundColor: currentColor, animationDuration: '2s' }}
          />
        )}
      </div>

      {/* Confirm / change buttons — shown after first tap */}
      {tapped && !confirmed && (
        <div className="flex gap-4">
          <button
            onClick={handleKeep}
            className="px-8 py-4 rounded-2xl text-white text-xl font-bold shadow-lg active:scale-95 transition-transform"
            style={{ backgroundColor: currentColor }}
          >
            Yes! Keep it! ✓
          </button>
          <button
            onClick={handleChange}
            className="px-8 py-4 rounded-2xl text-gray-600 text-xl font-bold bg-white shadow-lg active:scale-95 transition-transform border-2"
            style={{ borderColor: currentColor }}
          >
            Change it
          </button>
        </div>
      )}

      {/* Color dot strip — visual reference */}
      {!tapped && (
        <div className="flex gap-3 mt-2">
          {COLORS.map((c, i) => (
            <div
              key={c}
              className="rounded-full transition-all duration-300"
              style={{
                backgroundColor: c,
                width: i === colorIndex ? 16 : 10,
                height: i === colorIndex ? 16 : 10,
                opacity: i === colorIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* Accessibility: screen text for TTS fallback */}
      <p className="sr-only">
        Gummy is showing colors. Tap the avatar to choose your color.
      </p>
    </div>
  );
}
