// Shown after onboarding while Whisper downloads and initializes.
// Resolves once the model is ready, then advances to calibration.

import { useEffect, useState } from 'react';
import { requiresLocalWhisper } from '../lib/speech/stt';
import GummyAvatar from './avatar/GummyAvatar';
import { useSession } from '../context/SessionContext';

type WhisperLoadProgress = {
  status: 'downloading' | 'loading' | 'ready' | 'error';
  progress: number;
  file?: string;
  error?: string;
};

export default function WhisperLoader() {
  const { state, setPhase } = useSession();
  const color = state.config.chosenColor;

  const [progress, setProgress] = useState<WhisperLoadProgress>({
    status: 'downloading',
    progress: 0,
  });
  const [dots, setDots] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Animated dots for the status label
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!requiresLocalWhisper()) {
      setPhase('calibration');
      return () => {
        cancelled = true;
      };
    }

    setProgress({ status: 'downloading', progress: 0 });

    import('../lib/speech/whisper').then(({ initWhisper }) => initWhisper(p => {
      if (cancelled) return;
      setProgress(p);
      if (p.status === 'ready') {
        // Small pause so the "Ready!" state is visible before advancing
        setTimeout(() => {
          if (!cancelled) setPhase('calibration');
        }, 800);
      }
    })).catch(err => {
      console.error('Whisper init failed:', err);
      if (cancelled) return;
      setProgress({
        status: 'error',
        progress: 0,
        error:
          err instanceof Error
            ? err.message
            : 'Whisper could not start on this device.',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, setPhase]);

  const label =
    progress.status === 'error'
      ? 'Voice setup needs attention'
      : progress.status === 'ready'
      ? "All set — let's go!"
      : progress.status === 'loading'
      ? `Getting Gummy ready${dots}`
      : `Loading Gummy's brain${dots}`;

  const helperText =
    progress.status === 'ready'
      ? 'Gummy is ready for voice time.'
      : progress.status === 'error'
      ? progress.error ??
        'This browser could not load on-device voice. Try again, or switch to a supported browser/device.'
      : "First-time setup — Gummy is downloading its thinking brain.";

  const barWidth = `${progress.progress}%`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8"
      style={{ background: `${color}12` }}
    >
      <GummyAvatar
        mode={progress.status === 'ready' ? 'celebrating' : 'thinking'}
        color={color}
        size={180}
      />

      <div className="text-center max-w-xs">
        <p className="text-xl font-bold mb-1" style={{ color }}>
          {label}
        </p>
        <p className="text-sm text-gray-400">{helperText}</p>
      </div>

      {progress.status !== 'error' && (
        <div className="w-64 bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{ width: barWidth, backgroundColor: color }}
          />
        </div>
      )}

      {progress.status === 'downloading' && progress.file && (
        <p className="text-xs text-gray-400 text-center max-w-xs truncate">
          {progress.file}
        </p>
      )}

      {progress.status === 'error' && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setAttempt(a => a + 1)}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-transform active:scale-95"
            style={{ backgroundColor: color }}
          >
            Try voice setup again
          </button>
          <button
            onClick={() => setPhase('onboarding')}
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-gray-600 shadow-sm"
          >
            Back to setup
          </button>
        </div>
      )}
    </div>
  );
}
