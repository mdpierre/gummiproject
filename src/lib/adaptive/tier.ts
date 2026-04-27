import type { ReadingTier, CalibrationSignal } from '../../types';

// ─── Tier detection from calibration signals ──────────────────────────────────

export function detectTierFromCalibration(signals: CalibrationSignal[]): ReadingTier {
  if (signals.length === 0) return 'developmental';

  const avgLatencyMs = signals.reduce((s, r) => s + r.responseLatencyMs, 0) / signals.length;
  const completionRate = signals.filter(r => r.sentenceComplete).length / signals.length;
  const complexWordRate = signals.filter(r => r.complexWordUsed).length / signals.length;

  // Score: 0 (early) → 2 (fluent)
  let score = 0;

  // Latency: <2s = +1, 2–5s = +0, >5s = -0 (can't go below early)
  if (avgLatencyMs < 2000) score += 1;

  // Sentence completion: >75% = +1
  if (completionRate > 0.75) score += 1;

  // Complex word use: >50% = +1 (override to fluent if strong signal)
  if (complexWordRate > 0.5) score += 1;

  if (score >= 2) return 'fluent';
  if (score >= 1) return 'developmental';
  return 'early';
}

// ─── Tier refinement based on timed-read result ───────────────────────────────
// Only bumps UP — never demotes mid-session (would feel punishing).

export function refineTierWithTimerResult(
  current: ReadingTier,
  timerResult: 'before' | 'after',
): ReadingTier {
  if (timerResult !== 'before') return current;

  // Child finished reading before gummies landed → bump up one step
  const order: ReadingTier[] = ['early', 'developmental', 'fluent'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : current;
}

// ─── Select questions for this tier ──────────────────────────────────────────

import type { ModuleQuestion } from '../../types';

/** Module questions or normalized content questions — same shape for selection. */
export type QuestionLike = Pick<ModuleQuestion, 'id' | 'text' | 'tier' | 'hint'>;

export function selectQuestions(
  questions: QuestionLike[],
  tier: ReadingTier,
  maxCount = 3,
): QuestionLike[] {
  const eligible = questions.filter(q => q.tier === 'all' || q.tier === tier);
  // Prefer 'all' tagged questions first, then tier-specific
  const sorted = [
    ...eligible.filter(q => q.tier === 'all'),
    ...eligible.filter(q => q.tier === tier),
  ];
  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = sorted.filter(q => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
  return deduped.slice(0, maxCount);
}
