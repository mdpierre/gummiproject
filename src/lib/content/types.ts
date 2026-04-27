import type { ModuleId, ReadingTier } from '../../types';

/** Where normalized session content came from */
export type ContentSourceKind = 'module' | 'topic' | 'lesson' | 'story';

/** Question shape used by SessionScreen (aligned with ModuleQuestion) */
export interface ContentQuestion {
  id: string;
  text: string;
  tier: ReadingTier | 'all';
  hint: string;
}

/**
 * Unified content for the voice session engine: passage by tier, comprehension
 * questions, and closing “big question” (no wrong answer).
 */
export interface ContentItem {
  kind: ContentSourceKind;
  /** Stable id for completion + metrics (e.g. story:robot-garden, topic:trust) */
  metricsKey: string;
  title: string;
  passages: Record<ReadingTier, string>;
  questions: ContentQuestion[];
  bigQuestion: string;
  /** When kind === 'module', the legacy ModuleId for routing and reports */
  moduleId?: ModuleId;
}
