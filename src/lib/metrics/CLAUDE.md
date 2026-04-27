# Metrics Library

## What This Does

Collects session data throughout the child's session. This data feeds the PDF report at session end and the LLM call that generates Gummy's session note. All data lives in memory only — nothing is persisted to disk or transmitted until the LLM note generation call at session end.

## Data Collected

```ts
interface SessionMetrics {
  // Session metadata
  sessionDate: string;           // ISO date string
  durationMs: number;
  moduleId: ModuleId;
  childName: string;

  // Tier
  detectedTier: ReadingTier;
  tierMovement: 'improved' | 'stable' | 'needs-support';

  // Comprehension
  questions: QuestionRecord[];

  // Speech
  avgPaceWpm: number;
  avgPauseLengthMs: number;
  sentenceCompletionRate: number;   // 0–1

  // Critical thinking
  followUpAnsweredCount: number;
  bigQuestionResponse: string;      // verbatim transcript

  // Timer
  timerResult: 'before' | 'after' | null;
}

interface QuestionRecord {
  questionText: string;
  childResponse: string;            // verbatim transcript
  hinted: boolean;
  patienceWindowExpired: boolean;
  responseLatencyMs: number;
}
```

## API

```ts
// lib/metrics/collector.ts
export const metricsCollector = {
  startSession(config: SessionConfig): void,
  recordQuestion(record: QuestionRecord): void,
  recordSpeechSample(paceWpm: number, pauseMs: number, sentenceComplete: boolean): void,
  recordTimerResult(result: 'before' | 'after'): void,
  recordBigQuestion(response: string): void,
  finalizeSession(): SessionMetrics,
};
```

## Usage Pattern

The session orchestrator calls into `metricsCollector` as events happen. At session end, `finalizeSession()` computes derived values (averages, rates) and returns the full `SessionMetrics` object.

## Privacy Notes

- `childName` is included only for the PDF report — it is not sent in the LLM metrics call
- Speech samples are aggregated locally into averages before any LLM call — raw audio and transcripts are not sent in the metrics call
- The verbatim `bigQuestionResponse` is sent to the LLM only for the `generateGummyNote()` call, stripped of the child's name
