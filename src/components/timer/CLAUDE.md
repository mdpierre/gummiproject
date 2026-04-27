# Timer Component

## What This Does

Two distinct timer visuals exist in the app. Both avoid clock language (no numbers, no seconds, no countdown) to keep the experience playful rather than stressful.

---

## 1. Falling Gummies Timer (Timed Reading)

Used during the timed reading passage. Gummies (candy pieces) fall from the top of the screen into a basket at the bottom. The basket fills as time passes.

### Behavior
- Runs for a configurable duration (default: 90s for developmental tier, 60s for fluent)
- Gummy intro: *"Let's see if you can read this before the gummies finish falling!"*
- No number display — purely visual
- When timer ends: basket is "full", gentle chime plays
- Timer result (`before` or `after`) is recorded in session state as a tier signal

### Props
```tsx
interface FallingGummiesProps {
  durationMs: number;
  onComplete: (result: 'before' | 'after') => void;
  onChildFinished: () => void; // child says "done" → records 'before'
}
```

### Visual Spec
- 6–8 candy/gummy shapes fall at staggered intervals using CSS animation
- Use `--gummy-color` for particle colors (matches child's chosen color)
- Basket fills with an SVG level animation
- Keep animation GPU-composited (transform/opacity only) — tablets may be slow

---

## 2. Balloon Countdown (Patience Window)

Used during the comprehension Q&A patience window. A single balloon (or cluster) slowly deflates or rises off-screen. Subtle — should not feel urgent.

### Behavior
- Appears after Gummy asks a question
- Duration matches `SessionConfig.patienceWindowMs`
- On child speech detected: balloon disappears immediately (patience window cancelled)
- On expiry: balloon fully gone → hint delivery begins

### Props
```tsx
interface BalloonCountdownProps {
  durationMs: number;
  onExpire: () => void;
  onCancelled?: () => void;
}
```

### Visual Spec
- Single balloon, child's chosen color
- Slowly rises upward and shrinks using CSS keyframes
- No sound — purely visual, non-distracting
- Positioned in the corner of the screen, not center stage

---

## Shared Notes

- Neither timer uses numeric displays, clock icons, or percentage bars
- Both are controlled components — they do not manage their own start/stop; the session orchestrator drives them
- Both emit completion callbacks rather than managing session state themselves
