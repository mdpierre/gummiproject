// Main session loop: story → timed-read → questions (with patience window) → big question.
// Manages internal phase state machine and all TTS/STT orchestration.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GummyAvatar, { type AvatarMode } from '../avatar/GummyAvatar';
import KaraokeText from './KaraokeText';
import Confetti from './Confetti';
import FallingGummies from '../timer/FallingGummies';
import BalloonCountdown from '../timer/BalloonCountdown';
import ManualAnswerControls from '../ManualAnswerControls';
import { speak, stopSpeaking } from '../../lib/speech/tts';
import { startListening, stopListening, cancelListening } from '../../lib/speech/stt';
import { evaluateContentAnswer } from '../../lib/llm/client';
import { refineTierWithTimerResult, selectQuestions, type QuestionLike } from '../../lib/adaptive/tier';
import { metricsCollector } from '../../lib/metrics/collector';
import { useSession } from '../../context/SessionContext';
import { getModule } from '../../modules';
import { moduleToContentItem } from '../../lib/content/adapters';
import type { ContentItem } from '../../lib/content/types';

export type SessionScreenProps = {
  /** When set, drives passage, questions, and big question instead of activeModule only */
  content?: ContentItem;
  /** If set, Router navigates here when the session completes (e.g. /report) */
  navigateWhenDone?: string;
};

// ─── Internal phase ───────────────────────────────────────────────────────────
type SPhase =
  | 'story-playing'
  | 'timed-read'
  | 'q-asking'
  | 'q-listening'
  | 'q-evaluating'
  | 'q-correct'
  | 'q-hinted'
  | 'followup-ask'
  | 'followup-listen'
  | 'bigq-asking'
  | 'bigq-listening'
  | 'bigq-celebrate'
  | 'session-done';

const TIMED_READ_DURATION: Record<string, number> = {
  early: 120_000,
  developmental: 90_000,
  fluent: 60_000,
};

export default function SessionScreen({ content, navigateWhenDone }: SessionScreenProps = {}) {
  const navigate = useNavigate();
  const { state, setActiveTier, setPhase: setAppPhase } = useSession();
  const { config, activeTier, activeModule } = state;
  const color = config.chosenColor;
  const patienceMs = config.patienceWindowMs;
  const sessionId = useRef(`session-${Date.now()}`);

  const contentItem = useMemo(
    () => content ?? moduleToContentItem(getModule(activeModule)),
    [content, activeModule],
  );
  const passage = contentItem.passages[activeTier];
  const questions = useRef<QuestionLike[]>(
    selectQuestions(contentItem.questions, activeTier, 3),
  );

  // ─── State ────────────────────────────────────────────────────────────────
  const [sPhase, setSPhase] = useState<SPhase>('story-playing');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [gummyText, setGummyText] = useState('');
  const [activeCharIndex, setActiveCharIndex] = useState(-1);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('locked');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiBurstId, setConfettiBurstId] = useState(0);
  const [showBalloon, setShowBalloon] = useState(false);
  const [isListeningUI, setIsListeningUI] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualAnswer, setManualAnswer] = useState('');

  // Prevent double-triggers in effects
  const advanceLock = useRef(false);

  // ─── Metrics init ──────────────────────────────────────────────────────────
  useEffect(() => {
    metricsCollector.startSession({
      moduleId: contentItem.metricsKey,
      sessionDisplayTitle: contentItem.title,
      childName: config.childName,
      tier: activeTier,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── TTS helper ───────────────────────────────────────────────────────────
  const say = useCallback(
    (text: string, onEnd?: () => void) => {
      setGummyText(text);
      setActiveCharIndex(-1);
      setAvatarMode('locked');
      speak(text, {
        onBoundary: (_, charIndex) => setActiveCharIndex(charIndex),
        onEnd: () => {
          setActiveCharIndex(-1);
          onEnd?.();
        },
      });
    },
    [],
  );

  const triggerConfetti = useCallback(() => {
    setConfettiBurstId(id => id + 1);
    setShowConfetti(true);
  }, []);

  const resetManualAnswer = useCallback(() => {
    setManualMode(false);
    setManualAnswer('');
  }, []);

  function hasSpokenResponse(transcript: string): boolean {
    return transcript.trim().length > 0;
  }

  // ─── STT helpers ──────────────────────────────────────────────────────────
  async function listenAndGet(): Promise<string> {
    try {
      setIsListeningUI(true);
      setAvatarMode('listening');
      await startListening();
      return ''; // stops on balloon expiry or done-button tap
    } catch {
      return '';
    }
  }

  async function stopAndTranscribe(): Promise<string> {
    try {
      const result = await stopListening();
      setIsListeningUI(false);
      setAvatarMode('locked');
      // Rough speech metrics
      const words = result.transcript.trim().split(/\s+/).filter(Boolean);
      const paceWpm = result.durationMs > 0
        ? Math.round((words.length / result.durationMs) * 60_000)
        : 0;
      metricsCollector.recordSpeechSample(paceWpm, 0, words.length >= 3);
      return result.transcript;
    } catch {
      setIsListeningUI(false);
      setAvatarMode('locked');
      return '';
    }
  }

  // ─── Phase: story-playing ──────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'story-playing') return;
    advanceLock.current = false;
    const intro = `Let me tell you about: ${contentItem.title}!`;
    say(intro, () => {
      // Short pause then read the passage
      setTimeout(() => {
        setGummyText(passage);
        setActiveCharIndex(-1);
        speak(passage, {
          onBoundary: (_, ci) => setActiveCharIndex(ci),
          onEnd: () => {
            setActiveCharIndex(-1);
            setTimeout(() => {
              say(
                "Great! Now it's your turn to read it! Let's see if you can finish before the gummies stop falling!",
                () => setSPhase('timed-read'),
              );
            }, 600);
          },
        });
      }, 400);
    });
    return () => stopSpeaking();
  }, [sPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase: timed-read ────────────────────────────────────────────────────
  function handleTimedReadComplete(result: 'before' | 'after') {
    if (advanceLock.current) return;
    advanceLock.current = true;
    triggerConfetti();
    metricsCollector.recordTimerResult(result);
    const refined = refineTierWithTimerResult(activeTier, result);
    if (refined !== activeTier) {
      setActiveTier(refined);
      metricsCollector.setDetectedTier(refined);
    }
    questions.current = selectQuestions(contentItem.questions, refined, 3);
    const praise =
      result === 'before'
        ? 'Wow, you finished before the gummies landed! Super reading!'
        : "Nice work reading! Let's talk about the story!";
    say(praise, () => {
      setQuestionIdx(0);
      setHintCount(0);
      setSPhase('q-asking');
    });
  }

  // ─── Phase: q-asking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'q-asking') return;
    advanceLock.current = false;
    resetManualAnswer();
    const q = questions.current[questionIdx];
    if (!q) {
      // All questions done → big question
      setSPhase('bigq-asking');
      return;
    }
    setGummyText(q.text);
    say(q.text, async () => {
      setSPhase('q-listening');
    });
    return () => stopSpeaking();
  }, [sPhase, questionIdx, resetManualAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase: q-listening ───────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'q-listening') return;
    advanceLock.current = false;
    listenAndGet();
    setShowBalloon(true);
    return () => {
      setShowBalloon(false);
      cancelListening();
      setIsListeningUI(false);
    };
  }, [sPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePatienceExpire() {
    if (advanceLock.current) return;
    advanceLock.current = true;
    setShowBalloon(false);
    const transcript = await stopAndTranscribe();
    handleAnswerReceived(transcript, true);
  }

  async function handleChildDoneListening() {
    if (advanceLock.current) return;
    advanceLock.current = true;
    setShowBalloon(false);
    const transcript = await stopAndTranscribe();
    resetManualAnswer();
    handleAnswerReceived(transcript, false);
  }

  async function handleTypedAnswer() {
    if (advanceLock.current || !manualAnswer.trim()) return;
    advanceLock.current = true;
    setShowBalloon(false);
    await stopAndTranscribe();
    const transcript = manualAnswer.trim();
    resetManualAnswer();
    handleAnswerReceived(transcript, false);
  }

  async function handleAnswerReceived(transcript: string, patienceExpired: boolean) {
    setSPhase('q-evaluating');
    setAvatarMode('thinking');
    const q = questions.current[questionIdx];
    const hinted = hintCount > 0 || patienceExpired;
    const { correct, responseText } = await evaluateContentAnswer(
      q.text,
      transcript,
      contentItem,
      activeTier,
      config.iepMode,
      patienceMs,
      sessionId.current,
    );

    if (correct) {
      metricsCollector.recordQuestion({
        questionText: q.text,
        childResponse: transcript,
        hinted,
        patienceWindowExpired: patienceExpired,
        responseLatencyMs: patienceMs,
      });
      triggerConfetti();
      say(responseText, () => setSPhase('followup-ask'));
      setSPhase('q-correct');
    } else if (hintCount === 0) {
      // First hint
      setHintCount(1);
      say(responseText, () => {
        setTimeout(() => {
          advanceLock.current = false;
          setSPhase('q-listening');
        }, 500);
      });
      setSPhase('q-hinted');
    } else {
      // Second attempt failed — give the answer and move on
      metricsCollector.recordQuestion({
        questionText: q.text,
        childResponse: transcript,
        hinted: true,
        patienceWindowExpired: patienceExpired,
        responseLatencyMs: patienceMs,
      });
      const giveaway = `${responseText} Let's say the answer together — ${q.hint}! Great job trying!`;
      say(giveaway, () => {
        setHintCount(0);
        setQuestionIdx(i => i + 1);
        setSPhase('q-asking');
      });
      setSPhase('q-hinted');
    }
  }

  // ─── Phase: followup-ask ──────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'followup-ask') return;
    resetManualAnswer();
    setTimeout(() => {
      say('Why do you think that?', () => setSPhase('followup-listen'));
    }, 600);
    return () => stopSpeaking();
  }, [sPhase, resetManualAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase: followup-listen ───────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'followup-listen') return;
    advanceLock.current = false;
    listenAndGet();
    // Auto-advance after patience window
    const timer = setTimeout(async () => {
      if (advanceLock.current) return;
      advanceLock.current = true;
      const transcript = await stopAndTranscribe();
      if (hasSpokenResponse(transcript)) {
        metricsCollector.recordFollowUp();
      }
      advanceLock.current = false;
      setHintCount(0);
      setQuestionIdx(i => i + 1);
      setSPhase('q-asking');
    }, patienceMs);
    return () => {
      clearTimeout(timer);
      cancelListening();
      setIsListeningUI(false);
    };
  }, [sPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFollowupDone() {
    if (advanceLock.current) return;
    advanceLock.current = true;
    const transcript = await stopAndTranscribe();
    resetManualAnswer();
    if (hasSpokenResponse(transcript)) {
      metricsCollector.recordFollowUp();
    }
    triggerConfetti();
    say('Great thinking!', () => {
      setHintCount(0);
      setQuestionIdx(i => i + 1);
      setSPhase('q-asking');
    });
  }

  // ─── Phase: bigq-asking ───────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'bigq-asking') return;
    resetManualAnswer();
    say(
      `Here's the big question — and there's no wrong answer! ${contentItem.bigQuestion}`,
      () => setSPhase('bigq-listening'),
    );
    return () => stopSpeaking();
  }, [sPhase, resetManualAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase: bigq-listening ────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'bigq-listening') return;
    advanceLock.current = false;
    listenAndGet();
    const timer = setTimeout(() => handleBigQDone(), patienceMs * 2);
    return () => {
      clearTimeout(timer);
      cancelListening();
      setIsListeningUI(false);
    };
  }, [sPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBigQDone() {
    if (advanceLock.current) return;
    advanceLock.current = true;
    const result = await stopAndTranscribe();
    resetManualAnswer();
    metricsCollector.recordBigQuestion(result);
    triggerConfetti();
    setAvatarMode('celebrating');
    say(
      `Wow, what a great answer! You should be so proud. You learned about ${contentItem.title} today — that's huge!`,
      () => setSPhase('session-done'),
    );
    setSPhase('bigq-celebrate');
  }

  async function handleTypedFollowup() {
    if (advanceLock.current || !manualAnswer.trim()) return;
    advanceLock.current = true;
    await stopAndTranscribe();
    const transcript = manualAnswer.trim();
    resetManualAnswer();
    if (hasSpokenResponse(transcript)) {
      metricsCollector.recordFollowUp();
    }
    triggerConfetti();
    say('Great thinking!', () => {
      setHintCount(0);
      setQuestionIdx(i => i + 1);
      setSPhase('q-asking');
    });
  }

  async function handleTypedBigQ() {
    if (advanceLock.current || !manualAnswer.trim()) return;
    advanceLock.current = true;
    await stopAndTranscribe();
    const transcript = manualAnswer.trim();
    resetManualAnswer();
    metricsCollector.recordBigQuestion(transcript);
    triggerConfetti();
    setAvatarMode('celebrating');
    say(
      `Wow, what a great answer! You should be so proud. You learned about ${contentItem.title} today — that's huge!`,
      () => setSPhase('session-done'),
    );
    setSPhase('bigq-celebrate');
  }

  // ─── Phase: session-done ──────────────────────────────────────────────────
  useEffect(() => {
    if (sPhase !== 'session-done') return;
    if (navigateWhenDone) {
      const t = setTimeout(() => navigate(navigateWhenDone), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAppPhase('end'), 1200);
    return () => clearTimeout(t);
  }, [sPhase, setAppPhase, navigateWhenDone, navigate]);

  // ─── Render helpers ───────────────────────────────────────────────────────
  const isInStory = sPhase === 'story-playing';
  const isInTimedRead = sPhase === 'timed-read';
  const isEvaluating = sPhase === 'q-evaluating';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6 gap-4"
      style={{ background: `${color}0e` }}
    >
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          key={confettiBurstId}
          color={color}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Patience balloon */}
      {showBalloon && sPhase === 'q-listening' && (
        <BalloonCountdown
          durationMs={patienceMs}
          color={color}
          onExpire={handlePatienceExpire}
        />
      )}

      {/* Top: module title */}
      <div className="w-full text-center pt-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{contentItem.title}</p>
        {questions.current.length > 0 && (sPhase.startsWith('q-') || sPhase.startsWith('followup')) && (
          <div className="flex justify-center gap-1 mt-2">
            {questions.current.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ backgroundColor: i <= questionIdx ? color : '#e5e7eb' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <GummyAvatar
        mode={
          isEvaluating ? 'thinking' :
          isListeningUI ? 'listening' :
          showConfetti ? 'celebrating' :
          avatarMode
        }
        color={color}
        size={160}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-lg">

        {/* Story / timed-read: passage display */}
        {(isInStory || isInTimedRead) && (
          <div className="bg-white rounded-3xl p-6 shadow-md w-full">
            <KaraokeText
              text={passage}
              activeCharIndex={activeCharIndex}
              color={color}
              fontSize="1.35rem"
            />
          </div>
        )}

        {/* Timed read: falling gummies */}
        {isInTimedRead && (
          <FallingGummies
            durationMs={TIMED_READ_DURATION[activeTier] ?? 90_000}
            color={color}
            onComplete={handleTimedReadComplete}
            onChildFinished={() => handleTimedReadComplete('before')}
          />
        )}

        {/* Q&A / follow-up: Gummy speech bubble */}
        {!isInStory && !isInTimedRead && gummyText && (
          <div
            className="bg-white rounded-3xl px-6 py-4 shadow-md text-center max-w-sm"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <p className="text-lg font-semibold text-gray-800 leading-snug">{gummyText}</p>
          </div>
        )}

        {/* Evaluating spinner */}
        {isEvaluating && (
          <div className="flex items-center gap-2 text-gray-400">
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${color} transparent transparent transparent` }}
            />
            <span className="text-sm">Gummy is thinking...</span>
          </div>
        )}
      </div>

      {/* Bottom: listening controls */}
      <div className="w-full flex flex-col items-center gap-3 pb-4">
        {isListeningUI && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-sm text-gray-500">Gummy is listening...</span>
          </div>
        )}
        {sPhase === 'q-listening' && isListeningUI && (
          <>
            <button
              onClick={handleChildDoneListening}
              className="px-8 py-3 rounded-2xl text-white font-bold text-base active:scale-95 transition-transform shadow"
              style={{ backgroundColor: color }}
            >
              Done talking ✓
            </button>
            <ManualAnswerControls
              color={color}
              value={manualAnswer}
              visible={manualMode}
              promptLabel="Type the child's answer"
              toggleLabel="Type answer instead"
              submitLabel="Use typed answer"
              onChange={setManualAnswer}
              onToggle={() => setManualMode(value => !value)}
              onSubmit={handleTypedAnswer}
            />
          </>
        )}
        {sPhase === 'followup-listen' && isListeningUI && (
          <>
            <button
              onClick={handleFollowupDone}
              className="px-8 py-3 rounded-2xl text-white font-bold text-base active:scale-95 transition-transform shadow"
              style={{ backgroundColor: color }}
            >
              Done ✓
            </button>
            <ManualAnswerControls
              color={color}
              value={manualAnswer}
              visible={manualMode}
              promptLabel="Type the follow-up answer"
              toggleLabel="Type answer instead"
              submitLabel="Use typed answer"
              onChange={setManualAnswer}
              onToggle={() => setManualMode(value => !value)}
              onSubmit={handleTypedFollowup}
            />
          </>
        )}
        {sPhase === 'bigq-listening' && isListeningUI && (
          <>
            <button
              onClick={handleBigQDone}
              className="px-8 py-3 rounded-2xl text-white font-bold text-base active:scale-95 transition-transform shadow"
              style={{ backgroundColor: color }}
            >
              I shared my answer ✓
            </button>
            <ManualAnswerControls
              color={color}
              value={manualAnswer}
              visible={manualMode}
              promptLabel="Type the big answer"
              toggleLabel="Type answer instead"
              submitLabel="Use typed answer"
              onChange={setManualAnswer}
              onToggle={() => setManualMode(value => !value)}
              onSubmit={handleTypedBigQ}
            />
          </>
        )}
      </div>
    </div>
  );
}
