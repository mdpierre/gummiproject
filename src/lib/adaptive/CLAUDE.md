# Adaptive Language Engine

## What This Does

Determines and maintains the child's reading tier, then injects tier-appropriate parameters into every LLM call so Gummy's language complexity matches where the child is.

## Reading Tiers

| Tier | Vocabulary | Sentence Length | Delivery Style |
|---|---|---|---|
| `early` | 1–2 syllable words only | ≤6 words per sentence | Heavy rhyme, Dr. Seuss-style |
| `developmental` | Up to 3 syllables, common words | ≤10 words per sentence | Rhyme preferred, rap/rhythm |
| `fluent` | No vocabulary restriction | Normal sentence length | Still warm, can be playful |

## Tier Detection

### Input Sources

1. **Calibration signals** (initial detection): response latency, sentence completion, vocabulary use
2. **Timer result** (refinement): if child finishes timed read before gummies land → bump tier up one step
3. **Patience window outcomes** (ongoing): if child consistently needs hints → flag for review (don't auto-demote mid-session)

### Logic

```ts
// lib/adaptive/tier.ts
export function detectTierFromCalibration(signals: CalibrationSignal[]): ReadingTier { ... }

export function refineTierWithTimerResult(
  current: ReadingTier,
  timerResult: 'before' | 'after'
): ReadingTier { ... }
```

Tier is never demoted mid-session — this would feel punishing. Only upward adjustment is allowed during a session. Tier is re-detected fresh each session.

## LLM Prompt Injection

Each LLM call receives a `TierContext` block appended to the system prompt:

```ts
// lib/adaptive/promptBuilder.ts
export function buildTierInstructions(tier: ReadingTier, iepMode: boolean): string {
  // Returns instructions like:
  // "Use only 1-2 syllable words. Maximum 6 words per sentence. Use heavy rhyme."
  // + IEP addendum if active:
  // "This child has IEP accommodations. Never rush. Extended patience is set."
}
```

## IEP Mode Adjustments

When `SessionConfig.iepMode === true`:
- Complexity floor drops by one tier (fluent → developmental, developmental → early)
- Patience window is enforced at max configured value (never auto-reduced)
- Gummy's response style includes more explicit repetition prompts
- LLM is instructed: "This child benefits from repetition and patience. Repeat key ideas in different words."

## Module Script Adaptation

The 3 MVP module scripts exist in `src/modules/` as templates. The adaptive engine selects the appropriate tier variant of each passage and question set:

```
src/modules/
  module-1-what-is-ai/
    passage.early.txt
    passage.developmental.txt
    passage.fluent.txt
    questions.json   // questions tagged by tier
```
