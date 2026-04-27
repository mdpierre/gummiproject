import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  SessionConfig,
  SessionMetrics,
  CalibrationResult,
  SessionPhase,
  ReadingTier,
  ModuleId,
  QuestionRecord,
} from '../types';
import { getModule } from '../modules';

// ─── State Shape ──────────────────────────────────────────────────────────────

export interface SessionState {
  phase: SessionPhase;
  config: SessionConfig;
  calibration: CalibrationResult | null;
  activeModule: ModuleId;
  activeTier: ReadingTier;
  metrics: Partial<SessionMetrics>;
  sessionStartMs: number | null;
}

// ─── Context API ──────────────────────────────────────────────────────────────

interface SessionContextValue {
  state: SessionState;
  setPhase: (phase: SessionPhase) => void;
  setConfig: (config: SessionConfig) => void;
  setCalibration: (result: CalibrationResult) => void;
  setActiveTier: (tier: ReadingTier) => void;
  recordQuestion: (record: QuestionRecord) => void;
  recordTimerResult: (result: 'before' | 'after') => void;
  recordBigQuestion: (response: string) => void;
  recordFollowUp: () => void;
  recordSpeechSample: (paceWpm: number, pauseMs: number, sentenceComplete: boolean) => void;
  startSession: () => void;
  finalizeMetrics: () => SessionMetrics;
  reset: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SessionConfig = {
  childName: '',
  iepMode: false,
  patienceWindowMs: 8000,
  tierOverride: 'auto',
  chosenColor: '#FF6B9D',
};

const DEFAULT_STATE: SessionState = {
  phase: 'onboarding',
  config: DEFAULT_CONFIG,
  calibration: null,
  activeModule: 'what-is-ai',
  activeTier: 'developmental',
  metrics: {},
  sessionStartMs: null,
};

/** Start a voice session at `story` using a saved child profile (after onboarding). */
export function buildStoryPhaseSnapshotFromProfile(
  profile: {
    childName: string;
    chosenColor: string;
    iepMode: boolean;
    patienceWindowMs: number;
    detectedTier: ReadingTier;
  },
  activeModule: ModuleId = 'what-is-ai',
): SessionState {
  return {
    ...DEFAULT_STATE,
    phase: 'story',
    sessionStartMs: Date.now(),
    activeModule,
    activeTier: profile.detectedTier,
    config: {
      childName: profile.childName,
      chosenColor: profile.chosenColor,
      iepMode: profile.iepMode,
      patienceWindowMs: profile.patienceWindowMs,
      tierOverride: profile.detectedTier,
    },
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

/** Use when SessionProvider may be absent (e.g. standalone report route). */
export function useSessionOptional(): SessionContextValue | null {
  return useContext(SessionContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  /** Full initial session state (e.g. from buildStoryPhaseSnapshotFromProfile) */
  initialState?: SessionState;
}) {
  const [state, setState] = useState<SessionState>(() =>
    initialState
      ? {
          ...initialState,
          config: { ...DEFAULT_CONFIG, ...initialState.config },
        }
      : DEFAULT_STATE,
  );

  // Speech sample accumulators (kept in refs would be fine; using state for simplicity)
  const [speechSamples, setSpeechSamples] = useState<{
    paces: number[];
    pauses: number[];
    completions: boolean[];
  }>({ paces: [], pauses: [], completions: [] });

  const setPhase = useCallback((phase: SessionPhase) => {
    setState(s => ({ ...s, phase }));
  }, []);

  const setConfig = useCallback((config: SessionConfig) => {
    setState(s => ({ ...s, config }));
    // Apply CSS variable for chosen color immediately
    document.documentElement.style.setProperty('--gummy-color', config.chosenColor);
  }, []);

  const setCalibration = useCallback((result: CalibrationResult) => {
    setState(s => ({
      ...s,
      calibration: result,
      activeTier: s.config.tierOverride === 'auto' ? result.detectedTier : s.config.tierOverride,
    }));
  }, []);

  const setActiveTier = useCallback((tier: ReadingTier) => {
    setState(s => ({ ...s, activeTier: tier }));
  }, []);

  const recordQuestion = useCallback((record: QuestionRecord) => {
    setState(s => ({
      ...s,
      metrics: {
        ...s.metrics,
        questions: [...(s.metrics.questions ?? []), record],
      },
    }));
  }, []);

  const recordTimerResult = useCallback((result: 'before' | 'after') => {
    setState(s => ({ ...s, metrics: { ...s.metrics, timerResult: result } }));
  }, []);

  const recordBigQuestion = useCallback((response: string) => {
    setState(s => ({ ...s, metrics: { ...s.metrics, bigQuestionResponse: response } }));
  }, []);

  const recordFollowUp = useCallback(() => {
    setState(s => ({
      ...s,
      metrics: {
        ...s.metrics,
        followUpAnsweredCount: (s.metrics.followUpAnsweredCount ?? 0) + 1,
      },
    }));
  }, []);

  const recordSpeechSample = useCallback(
    (paceWpm: number, pauseMs: number, sentenceComplete: boolean) => {
      setSpeechSamples(prev => ({
        paces: [...prev.paces, paceWpm],
        pauses: [...prev.pauses, pauseMs],
        completions: [...prev.completions, sentenceComplete],
      }));
    },
    [],
  );

  const startSession = useCallback(() => {
    setState(s => ({ ...s, sessionStartMs: Date.now() }));
  }, []);

  const finalizeMetrics = useCallback((): SessionMetrics => {
    const { state: s } = { state };
    const durationMs = s.sessionStartMs ? Date.now() - s.sessionStartMs : 0;

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const completionRate =
      speechSamples.completions.length > 0
        ? speechSamples.completions.filter(Boolean).length / speechSamples.completions.length
        : 0;

    const questions = s.metrics.questions ?? [];
    const hintsUsed = questions.filter(q => q.hinted).length;
    const tierMovement =
      hintsUsed === 0 ? 'improved' : hintsUsed <= 1 ? 'stable' : 'needs-support';

    return {
      sessionDate: new Date().toISOString(),
      durationMs,
      moduleId: s.activeModule,
      sessionDisplayTitle: getModule(s.activeModule).title,
      childName: s.config.childName,
      detectedTier: s.activeTier,
      tierMovement,
      questions,
      avgPaceWpm: Math.round(avg(speechSamples.paces)),
      avgPauseLengthMs: Math.round(avg(speechSamples.pauses)),
      sentenceCompletionRate: Math.round(completionRate * 100) / 100,
      followUpAnsweredCount: s.metrics.followUpAnsweredCount ?? 0,
      bigQuestionResponse: s.metrics.bigQuestionResponse ?? '',
      timerResult: s.metrics.timerResult ?? null,
    };
  }, [state, speechSamples]);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    setSpeechSamples({ paces: [], pauses: [], completions: [] });
    document.documentElement.style.removeProperty('--gummy-color');
  }, []);

  return (
    <SessionContext.Provider
      value={{
        state,
        setPhase,
        setConfig,
        setCalibration,
        setActiveTier,
        recordQuestion,
        recordTimerResult,
        recordBigQuestion,
        recordFollowUp,
        recordSpeechSample,
        startSession,
        finalizeMetrics,
        reset,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
