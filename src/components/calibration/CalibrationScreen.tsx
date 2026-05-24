// Runs 3 warm-up Q&A turns to detect the child's reading tier.
// Records calibration signals → detectTierFromCalibration → stored in SessionContext.

import { useState, useEffect, useRef, useCallback } from 'react';
import GummyAvatar from '../avatar/GummyAvatar';
import Confetti from '../session/Confetti';
import ManualAnswerControls from '../ManualAnswerControls';
import MicLevelMeter from '../MicLevelMeter';
import { speak, stopSpeaking } from '../../lib/speech/tts';
import { startListening, stopListening, type STTResult } from '../../lib/speech/stt';
import { generateCalibrationQuestions } from '../../lib/llm/client';
import { detectTierFromCalibration } from '../../lib/adaptive/tier';
import { useSession } from '../../context/SessionContext';
import useMicLevel from '../../hooks/useMicLevel';
import type { CalibrationSignal } from '../../types';
import { FALLBACK_CALIBRATION_QUESTIONS } from '../../lib/llm/fallbacks';

type InternalPhase = 'loading' | 'intro' | 'asking' | 'listening' | 'transcribing' | 'done';

// Simple heuristic: did the response use a multi-syllabic word?
function hasComplexWord(text: string): boolean {
  return text.split(/\s+/).some(w => {
    const vowelGroups = w.toLowerCase().replace(/[^aeiou]/g, ' ').trim().split(/\s+/);
    return vowelGroups.filter(Boolean).length >= 3;
  });
}

export default function CalibrationScreen() {
  const { state, setCalibration, setPhase } = useSession();
  const color = state.config.chosenColor;
  const childName = state.config.childName;
  const isIepMode = state.config.iepMode;
  const listeningWindowMs = isIepMode
    ? Math.max(state.config.patienceWindowMs, 15_000)
    : Math.max(state.config.patienceWindowMs, 8_000);

  const [internalPhase, setInternalPhase] = useState<InternalPhase>('loading');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [avatarMode, setAvatarMode] = useState<'thinking' | 'listening' | 'celebrating'>('thinking');
  const [statusText, setStatusText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiBurstId, setConfettiBurstId] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualAnswer, setManualAnswer] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastCaptureResult, setLastCaptureResult] = useState<STTResult | null>(null);
  const micLevel = useMicLevel();

  const signals = useRef<CalibrationSignal[]>([]);
  const questionStartMs = useRef(0);
  const extraTimeUsed = useRef<Set<number>>(new Set());
  const noSignalRetries = useRef<Set<number>>(new Set());

  const triggerConfetti = useCallback(() => {
    setConfettiBurstId(id => id + 1);
    setShowConfetti(true);
  }, []);

  // Load questions
  useEffect(() => {
    const sessionId = `cal-${Date.now()}`;
    generateCalibrationQuestions(sessionId)
      .then(qs => setQuestions(qs.length ? qs : FALLBACK_CALIBRATION_QUESTIONS.slice(0, 3)))
      .catch(() => setQuestions(FALLBACK_CALIBRATION_QUESTIONS.slice(0, 3)))
      .finally(() => setInternalPhase('intro'));
  }, []);

  // Intro speech
  useEffect(() => {
    if (internalPhase !== 'intro') return;
    const intro = `Hey ${childName}! Before we start, let's warm up. I'll ask you a couple of easy questions. Just answer out loud — there's no wrong answer!`;
    speak(intro, {
      onEnd: () => setInternalPhase('asking'),
    });
    return () => stopSpeaking();
  }, [internalPhase, childName]);

  // Ask each question
  const askQuestion = useCallback((idx: number) => {
    if (idx >= questions.length) {
      setInternalPhase('done');
      return;
    }
    setManualMode(false);
    setManualAnswer('');
    setLastTranscript('');
    setLastCaptureResult(null);
    setAvatarMode('thinking');
    setStatusText(questions[idx]);
    speak(questions[idx], {
      onEnd: () => {
        questionStartMs.current = Date.now();
        setAvatarMode('listening');
        setInternalPhase('listening');
        startListening().catch(console.error);
      },
    });
  }, [questions]);

  useEffect(() => {
    if (internalPhase === 'asking' && questions.length > 0) {
      askQuestion(currentIdx);
    }
  }, [internalPhase, currentIdx, questions, askQuestion]);

  // Auto-stop recording after the calibration listening window.
  useEffect(() => {
    if (internalPhase !== 'listening') return;
    const timeout = setTimeout(() => handleDone(), listeningWindowMs);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalPhase, currentIdx, listeningWindowMs]);

  async function handleDone(overrideTranscript?: string) {
    if (internalPhase !== 'listening') return;
    setInternalPhase('transcribing'); // prevents double-trigger while Whisper runs

    let result: STTResult = { transcript: '', durationMs: 0 };
    try {
      result = await stopListening();
    } catch { /* ignore */ }

    const transcript = (overrideTranscript ?? result.transcript).trim();
    setManualMode(false);
    setManualAnswer('');
    setLastTranscript(transcript);
    setLastCaptureResult(result);

    if (!overrideTranscript && (result.maxLevel ?? 0) < 0.02 && !noSignalRetries.current.has(currentIdx)) {
      noSignalRetries.current.add(currentIdx);
      setAvatarMode('thinking');
      speak("I didn't hear that one. Let's try again.", {
        onEnd: () => {
          questionStartMs.current = Date.now();
          setAvatarMode('listening');
          setInternalPhase('listening');
          startListening().catch(console.error);
        },
      });
      return;
    }

    if (isIepMode && !transcript && !extraTimeUsed.current.has(currentIdx)) {
      extraTimeUsed.current.add(currentIdx);
      setAvatarMode('thinking');
      speak("That's okay. Take your time. I'll listen again.", {
        onEnd: () => {
          questionStartMs.current = Date.now();
          setAvatarMode('listening');
          setInternalPhase('listening');
          startListening().catch(console.error);
        },
      });
      return;
    }

    const latencyMs = Date.now() - questionStartMs.current;
    signals.current.push({
      responseLatencyMs: latencyMs,
      sentenceComplete: transcript.split(/\s+/).filter(Boolean).length >= 3,
      complexWordUsed: hasComplexWord(transcript),
    });

    const next = currentIdx + 1;
    if (next >= questions.length) {
      setInternalPhase('done');
    } else {
      triggerConfetti();
      setCurrentIdx(next);
      setInternalPhase('asking');
    }
  }

  // Finalize when done
  useEffect(() => {
    if (internalPhase !== 'done') return;
    const tier = detectTierFromCalibration(signals.current);
    setCalibration({ detectedTier: tier, signals: signals.current });

    setAvatarMode('celebrating');
    triggerConfetti();
    speak("Amazing! You're all warmed up. Let's learn something cool!", {
      onEnd: () => setPhase('story'),
    });
    return () => stopSpeaking();
  }, [internalPhase, setCalibration, setPhase]);

  const questionNumber = Math.min(currentIdx + 1, questions.length);
  const total = questions.length;

  async function handleManualSubmit() {
    if (!manualAnswer.trim()) return;
    await handleDone(manualAnswer);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-6"
      style={{ background: `${color}12` }}
    >
      {showConfetti && (
        <Confetti
          key={confettiBurstId}
          color={color}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 10,
              height: 10,
              backgroundColor: i < currentIdx ? color : i === currentIdx ? color : '#e5e7eb',
              opacity: i <= currentIdx ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      <GummyAvatar mode={avatarMode} color={color} size={180} />

      {/* Status / question text */}
      <div className="text-center max-w-sm">
        {internalPhase === 'loading' && (
          <p className="text-lg text-gray-400">Getting ready...</p>
        )}
        {internalPhase === 'intro' && (
          <p className="text-xl font-semibold" style={{ color }}>
            Let's warm up, {childName}!
          </p>
        )}
        {(internalPhase === 'asking' || internalPhase === 'listening' || internalPhase === 'transcribing') && (
          <>
            <p className="text-xs text-gray-400 mb-2">
              Warm-up question {questionNumber} of {total}
            </p>
            <p className="text-2xl font-bold leading-snug" style={{ color }}>
              {statusText}
            </p>
          </>
        )}
        {internalPhase === 'done' && (
          <p className="text-xl font-bold" style={{ color }}>
            Great job warming up!
          </p>
        )}
      </div>

      {/* Listening indicator + done button */}
      {(internalPhase === 'listening' || internalPhase === 'transcribing' || lastCaptureResult) && (
        <div className="flex flex-col items-center gap-4">
          {(internalPhase === 'listening' || internalPhase === 'transcribing') && (
          <div className="flex items-center gap-2 text-gray-500">
            <span
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <MicLevelMeter color={color} level={micLevel.level} />
            <span className="text-sm">
              {internalPhase === 'transcribing'
                ? 'Gummy is turning voice into words...'
                : micLevel.speaking
                ? 'Gummy hears you...'
                : isIepMode
                  ? 'Gummy is listening. Take your time...'
                  : 'Gummy is listening...'}
            </span>
          </div>
          )}
          {internalPhase === 'listening' && (
          <>
          <button
            onClick={() => {
              void handleDone();
            }}
            className="px-6 py-3 rounded-2xl text-white font-semibold text-sm active:scale-95 transition-transform"
            style={{ backgroundColor: color }}
          >
            Done talking ✓
          </button>
          <ManualAnswerControls
            color={color}
            value={manualAnswer}
            visible={manualMode}
            promptLabel="Type the warm-up answer"
            toggleLabel="Type answer instead"
            submitLabel="Use typed answer"
            onChange={setManualAnswer}
            onToggle={() => setManualMode(value => !value)}
            onSubmit={handleManualSubmit}
          />
          </>
          )}
          <div className="w-full max-w-sm bg-white/80 rounded-3xl px-4 py-3 shadow-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Gummy heard
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {lastTranscript || 'Nothing captured yet.'}
            </p>
            {lastCaptureResult && (
              <div className="text-[11px] text-gray-400 mt-2 space-y-1">
                <p>
                  Signal {Math.round((lastCaptureResult.maxLevel ?? 0) * 100)}% · {lastCaptureResult.captureMode ?? 'none'} · {lastCaptureResult.inputLabel || 'Unknown mic'}
                </p>
                <p>
                  Transcription: {lastCaptureResult.transcriptSource ?? 'none'}
                  {lastCaptureResult.transcriptionError ? ` · ${lastCaptureResult.transcriptionError}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
