# Gummy — Implementation Plan

## Overview

Hackathon build. Target: working end-to-end demo covering the full Jimmy scenario (blue color, developmental tier, IEP flag active). Phases are ordered by dependency — each phase must be shippable before the next begins.

---

## Phase 0 — Foundation (Hours 1–2)

### Goal
Working scaffold with all integrations stubbed. The shell of the app runs without crashing.

### Tasks

- [ ] `npm create vite@latest gummy -- --template react-ts`
- [ ] Install dependencies:
  - `tailwindcss` + config
  - `@anthropic-ai/sdk` (server-side)
  - `@xenova/transformers` (Whisper.js)
  - `@react-pdf/renderer`
  - `express` or `fastify` (Node proxy)
- [ ] Set up `.env` with `ANTHROPIC_API_KEY`, `VITE_API_BASE_URL`, `VITE_TTS_PROVIDER`
- [ ] Scaffold `SessionContext` with `SessionConfig` and `SessionMetrics` types
- [ ] Build Node proxy (`server/index.ts`):
  - Single `POST /api/llm` endpoint
  - Injects `ANTHROPIC_API_KEY` from env
  - Validates request shape, strips unknown fields
  - Returns Claude response text
- [ ] Stub `src/lib/llm/` with all 4 call types returning hardcoded fixtures
- [ ] Stub `src/lib/speech/stt.ts` to return a fixed transcript (enable real Whisper in Phase 2)
- [ ] Stub `src/lib/speech/tts.ts` using Web Speech API (real from the start)
- [ ] Write `src/modules/` content:
  - 3 passage variants per module (early / developmental / fluent)
  - `questions.json` with 3 questions per module, tagged by tier
- [ ] `npm run dev` boots without error

### Acceptance
App shell loads in browser, no console errors, proxy responds to a test `curl`.

---

## Phase 1 — Avatar & Onboarding (Hours 2–4)

### Goal
The child can open the app, pick a color, and the parent can configure IEP settings. Session context is populated.

### Tasks

- [ ] **Parent Onboarding Screen** (`src/components/onboarding/`)
  - Form: child name, IEP toggle, patience window slider (3–15s)
  - IEP toggle locks patience window to 12s
  - Mic permission flow (request → grant → proceed / deny → retry)
  - Stores result in `SessionContext`

- [ ] **Gummy Avatar** (`src/components/avatar/`)
  - SVG or Lottie avatar with color fill driven by `--gummy-color` CSS variable
  - Color cycling animation (CSS keyframes, ~2s per color, continuous loop)
  - `onColorTap` handler: freeze color, verbal acknowledgment via TTS
  - Confirm/change flow
  - Avatar animation states: `cycling`, `locked`, `listening`, `thinking`, `celebrating`

- [ ] **Theme Wiring**
  - Apply `--gummy-color` to: button accents, background tints, confetti
  - Verify color change updates the full UI

### Acceptance
Full onboarding → color selection flow works. `SessionContext` has `childName`, `iepMode`, `patienceWindowMs`, chosen color.

---

## Phase 2 — Voice Pipeline (Hours 3–5, parallel with Phase 1)

### Goal
Real STT and TTS working. Child can speak, transcript comes back in ≤2s. Gummy can speak with karaoke word highlighting.

### Tasks

- [ ] **Whisper.js STT** (`src/lib/speech/stt.ts`)
  - Load `Xenova/whisper-tiny.en` pipeline on app init (show loading state)
  - `startListening()` / `stopListening()` / `onTranscript(cb)` interface
  - Test on target tablet — if latency >3s p50, document fallback path to Deepgram

- [ ] **Silence Detector** (`src/lib/speech/silence.ts`)
  - Energy-based silence detection using Web Audio API AnalyserNode
  - `onSpeechStart` → cancel patience window
  - `onSilence` → trigger patience window countdown

- [ ] **TTS with Boundary Events** (`src/lib/speech/tts.ts`)
  - `speak(text, onBoundary)` using Web Speech API
  - `onBoundary` fires per word with `charIndex` for karaoke sync
  - Rate: 0.85, pitch: 1.1

- [ ] **Karaoke Story Display** (in `session/`)
  - Words rendered as individual `<span>` elements
  - Active word highlighted via `charIndex` from `onBoundary`
  - Large font, high contrast

### Acceptance
Speak into mic → transcript returned <2s. Gummy speaks a line → words highlight in sync.

---

## Phase 3 — Core Session Loop (Hours 5–8)

### Goal
The full session flow runs end-to-end with real LLM calls. Jimmy can complete a session.

### Tasks

- [ ] **LLM Integration** (`src/lib/llm/`)
  - Replace stubs with real Claude API calls through proxy
  - Build guardrailed system prompt with tier + IEP injection via `src/lib/adaptive/promptBuilder.ts`
  - Implement all 4 call types: `generateCalibrationQuestions`, `generateHint`, `generateGummyNote`, `generateModuleResponse`
  - Error handling: retry once on 429, graceful failure UX

- [ ] **Calibration Phase** (`src/components/calibration/`)
  - Fetch 2–3 questions from LLM (or fallback set)
  - Run through Q&A flow with Whisper STT
  - Score signals → `detectTierFromCalibration()` → store in `SessionContext`

- [ ] **Adaptive Engine** (`src/lib/adaptive/`)
  - `detectTierFromCalibration()` implementation
  - `refineTierWithTimerResult()` implementation
  - `buildTierInstructions()` for LLM prompt injection

- [ ] **Session Orchestrator** (`src/components/session/`)
  - State machine: `story → timed-read → question → patience → followup → big-question → end`
  - Story display with karaoke highlighting (from Phase 2)
  - Comprehension Q&A flow
  - Patience window: drive `BalloonCountdown`, fire hint on expiry
  - "Why do you think that?" follow-up layer
  - Reinforcement: confetti on correct, repetition prompt on incomplete

- [ ] **Falling Gummies Timer** (`src/components/timer/FallingGummies.tsx`)
  - Staggered gummy CSS animation falling into basket
  - Configurable duration
  - `onComplete` callback, child "done" detection

- [ ] **Balloon Countdown** (`src/components/timer/BalloonCountdown.tsx`)
  - Rising balloon CSS animation
  - Cancels on `onChildSpoke`, fires `onExpire`

- [ ] **Metrics Collector** (`src/lib/metrics/collector.ts`)
  - Hook into session events throughout the loop

### Acceptance
Full Jimmy scenario runs: blue color → developmental tier → IEP → story → timed read → 4 questions → big question → end.

---

## Phase 4 — PDF Report & Polish (Hours 8–10)

### Goal
Session produces a downloadable PDF. Demo is presentable.

### Tasks

- [ ] **PDF Report** (`src/components/report/SessionReport.tsx`)
  - `@react-pdf/renderer` document
  - All sections: header, tier, comprehension, speech, critical thinking, Gummy's note
  - Chosen color as accent
  - Privacy footer (exact copy required — see `src/components/report/CLAUDE.md`)

- [ ] **Gummy's Session Note**
  - At session end, call `generateGummyNote(metrics)` via LLM
  - Strip child name from LLM call input
  - Inject returned note into PDF

- [ ] **Download Flow**
  - Render PDF to blob client-side
  - Display download button: *"Download [Name]'s Session Report"*
  - Test on mobile Safari (common failure point for PDF generation)

- [ ] **End-to-End Smoke Test**
  - Run full Jimmy scenario: blue, developmental, IEP, complete session, download PDF
  - Verify PDF opens and is readable on mobile

- [ ] **Polish**
  - Confetti particle component (canvas-based, `--gummy-color` tinted)
  - "Gummy is listening..." animation during patience window (avatar `thinking` state)
  - Loading state during Whisper model init
  - Session end: Gummy waves goodbye animation

### Acceptance
PDF generates, downloads, opens on mobile. Privacy footer present. All content correct.

---

## Phase 5 — Demo Prep (Hours 10–11)

- [ ] Demo script written (Jimmy scenario, narrated)
- [ ] Adversarial prompt test: try to get Gummy to go off-topic, verify guardrails hold
- [ ] Mobile layout check (tablet aspect ratio)
- [ ] Deploy to Vercel (frontend) + Railway (proxy)
- [ ] Verify env vars set in Vercel + Railway dashboards
- [ ] Test deployed URL end-to-end

---

## Dependency Graph

```
Phase 0 (Foundation)
    ├── Phase 1 (Avatar/Onboarding)
    ├── Phase 2 (Voice Pipeline)
    └── Phase 1 + 2 → Phase 3 (Session Loop)
                            └── Phase 3 → Phase 4 (PDF + Polish)
                                                └── Phase 4 → Phase 5 (Demo)
```

Phases 1 and 2 can be built in parallel by two people.

---

## Risk Flags

| Risk | Mitigation |
|---|---|
| Whisper.js >3s p50 on tablet | Step up to `whisper-base.en`; fallback to Deepgram with consent UI |
| Web Speech API `onboundary` unreliable in some browsers | Fallback to estimated per-word timing based on average WPM |
| PDF generation fails on mobile Safari | Test early in Phase 4; `@react-pdf/renderer` is the safer choice over jsPDF |
| LLM breaks guardrails | Add output classifier check before passing LLM response to TTS |
| Karaoke sync drifts | Fallback: highlight words at fixed 300ms intervals during TTS playback |

---

## Key Files Quick Reference

| What | Where |
|---|---|
| Session state + config types | `src/context/SessionContext.tsx` |
| LLM guardrailed system prompt | `src/lib/llm/systemPrompt.ts` |
| Tier detection logic | `src/lib/adaptive/tier.ts` |
| Whisper STT | `src/lib/speech/stt.ts` |
| Node LLM proxy | `server/index.ts` |
| PDF report component | `src/components/report/SessionReport.tsx` |
| Module content (passages) | `src/modules/` |
