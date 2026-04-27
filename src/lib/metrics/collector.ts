import type { SessionMetrics, QuestionRecord, ReadingTier, TierMovement } from '../../types';

// ─── In-memory accumulator ────────────────────────────────────────────────────
// All data lives in module-level variables for the duration of the session.
// Nothing is persisted — finalizeSession() returns the complete snapshot.

let sessionStartMs = 0;
let moduleId = 'what-is-ai';
let sessionDisplayTitle = '';
let childName = '';
let detectedTier: ReadingTier = 'developmental';
let timerResult: 'before' | 'after' | null = null;
let followUpAnsweredCount = 0;
let bigQuestionResponse = '';

const questions: QuestionRecord[] = [];
const speechSamples: { paceWpm: number; pauseMs: number; sentenceComplete: boolean }[] = [];

function resetInternalState() {
  sessionStartMs = 0;
  moduleId = 'what-is-ai';
  sessionDisplayTitle = '';
  childName = '';
  detectedTier = 'developmental';
  timerResult = null;
  followUpAnsweredCount = 0;
  bigQuestionResponse = '';
  questions.length = 0;
  speechSamples.length = 0;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const metricsCollector = {
  startSession(opts: {
    moduleId: string;
    sessionDisplayTitle: string;
    childName: string;
    tier: ReadingTier;
  }) {
    sessionStartMs = Date.now();
    moduleId = opts.moduleId;
    sessionDisplayTitle = opts.sessionDisplayTitle;
    childName = opts.childName;
    detectedTier = opts.tier;
    timerResult = null;
    followUpAnsweredCount = 0;
    bigQuestionResponse = '';
    questions.length = 0;
    speechSamples.length = 0;
  },

  setDetectedTier(tier: ReadingTier) {
    detectedTier = tier;
  },

  recordQuestion(record: QuestionRecord) {
    questions.push(record);
  },

  recordTimerResult(result: 'before' | 'after') {
    timerResult = result;
  },

  recordBigQuestion(response: string) {
    bigQuestionResponse = response;
  },

  recordFollowUp() {
    followUpAnsweredCount++;
  },

  recordSpeechSample(paceWpm: number, pauseMs: number, sentenceComplete: boolean) {
    speechSamples.push({ paceWpm, pauseMs, sentenceComplete });
  },

  hasActiveSession() {
    return sessionStartMs > 0;
  },

  finalizeSession(): SessionMetrics {
    const durationMs = sessionStartMs > 0 ? Date.now() - sessionStartMs : 0;

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const avgPaceWpm = Math.round(avg(speechSamples.map(s => s.paceWpm)));
    const avgPauseLengthMs = Math.round(avg(speechSamples.map(s => s.pauseMs)));
    const sentenceCompletionRate =
      speechSamples.length > 0
        ? Math.round(
            (speechSamples.filter(s => s.sentenceComplete).length / speechSamples.length) * 100,
          ) / 100
        : 0;

    const hintsUsed = questions.filter(q => q.hinted).length;
    const tierMovement: TierMovement =
      hintsUsed === 0 ? 'improved' : hintsUsed <= 1 ? 'stable' : 'needs-support';

    const snapshot: SessionMetrics = {
      sessionDate: new Date().toISOString(),
      durationMs,
      moduleId,
      sessionDisplayTitle,
      childName,
      detectedTier,
      tierMovement,
      questions: [...questions],
      avgPaceWpm,
      avgPauseLengthMs,
      sentenceCompletionRate,
      followUpAnsweredCount,
      bigQuestionResponse,
      timerResult,
    };
    resetInternalState();
    return snapshot;
  },
};
