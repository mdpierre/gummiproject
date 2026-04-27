// ─── Reading Tiers ────────────────────────────────────────────────────────────

export type ReadingTier = 'early' | 'developmental' | 'fluent';

export type TierMovement = 'improved' | 'stable' | 'needs-support';

// ─── Module IDs ───────────────────────────────────────────────────────────────

export type ModuleId = 'what-is-ai' | 'what-is-a-chatbot' | 'how-ai-gets-information';

// ─── Session Configuration (from onboarding) ─────────────────────────────────

export interface SessionConfig {
  childName: string;
  iepMode: boolean;
  patienceWindowMs: number;   // 3000–15000
  tierOverride: 'auto' | ReadingTier;
  chosenColor: string;        // hex string, e.g. "#4A90D9"
}

// ─── Calibration ──────────────────────────────────────────────────────────────

export interface CalibrationSignal {
  responseLatencyMs: number;
  sentenceComplete: boolean;
  complexWordUsed: boolean;
}

export interface CalibrationResult {
  detectedTier: ReadingTier;
  signals: CalibrationSignal[];
}

// ─── Session Metrics ──────────────────────────────────────────────────────────

export interface QuestionRecord {
  questionText: string;
  childResponse: string;
  hinted: boolean;
  patienceWindowExpired: boolean;
  responseLatencyMs: number;
}

export interface SessionMetrics {
  sessionDate: string;
  durationMs: number;
  /** Stable session id for reports and completion (module id or e.g. story:robot-garden) */
  moduleId: string;
  /** Human-readable title for PDF / parent note (always set at session start) */
  sessionDisplayTitle: string;
  childName: string;

  detectedTier: ReadingTier;
  tierMovement: TierMovement;

  questions: QuestionRecord[];

  avgPaceWpm: number;
  avgPauseLengthMs: number;
  sentenceCompletionRate: number;

  followUpAnsweredCount: number;
  bigQuestionResponse: string;

  timerResult: 'before' | 'after' | null;
}

// ─── Session Phase ─────────────────────────────────────────────────────────────

export type SessionPhase =
  | 'onboarding'
  | 'color-select'
  | 'whisper-loading'  // Whisper model downloading/initializing
  | 'calibration'
  | 'story'            // SessionScreen manages all phases from here to 'end'
  | 'end';

// ─── Module Content ───────────────────────────────────────────────────────────

export interface ModuleQuestion {
  id: string;
  text: string;
  tier: ReadingTier | 'all';
  hint: string;
}

export interface ModuleContent {
  id: ModuleId;
  title: string;
  passages: Record<ReadingTier, string>;
  bigQuestion: string;
  questions: ModuleQuestion[];
}
