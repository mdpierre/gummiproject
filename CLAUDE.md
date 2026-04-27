# Gummy — Claude Code Guide

## What This Project Is

Gummy is a voice-first, AI-powered web app that teaches reading comprehension and AI literacy to children ages 6–8. It wraps a guardrailed LLM in a child-friendly, gamified experience anchored by an animated color-changing avatar called Gummy.

**Core philosophy:** Gummy is an AI assistant, not an AI replacement. It builds confidence and independent reasoning — never supplying answers on demand.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| STT | Whisper.js (WASM, in-browser) — zero audio network hop |
| LLM | Claude API — guardrailed system prompt wrapper |
| TTS | Web Speech API (primary) or ElevenLabs (expressive fallback) |
| PDF Export | @react-pdf/renderer — fully client-side |
| Backend | Lightweight Node proxy for LLM API calls only |
| Hosting | Vercel (frontend) + Railway (API proxy) |

## Project Structure

```
gummy/
├── src/
│   ├── components/
│   │   ├── avatar/        # Gummy avatar, color cycling, color lock
│   │   ├── calibration/   # Warm-up questions, tier detection
│   │   ├── session/       # Core session loop, Q&A flow, patience window
│   │   ├── timer/         # Falling gummies timer, balloon countdown
│   │   ├── report/        # PDF session report generation
│   │   └── onboarding/    # Parent onboarding, IEP config
│   ├── lib/
│   │   ├── llm/           # LLM wrapper, system prompt, guardrails
│   │   ├── adaptive/      # Tier detection, language adaptation logic
│   │   ├── speech/        # Whisper STT + TTS bridge
│   │   └── metrics/       # Session metrics collector
│   ├── modules/           # AI literacy module scripts (3 MVP modules)
│   └── App.tsx
├── server/                # Node proxy for LLM API calls
└── IMPLEMENTATION_PLAN.md
```

## Critical Constraints

### Voice Privacy (Non-Negotiable)
- Whisper.js runs entirely in-browser via WASM
- Raw audio NEVER leaves the device
- Only the STT transcript text is sent to the cloud LLM
- The PDF report is generated client-side — nothing stored server-side

### Child Safety
- All LLM responses are filtered through the guardrailed system prompt (see `src/lib/llm/CLAUDE.md`)
- The LLM proxy must never expose the API key to the client
- No accounts, no SMS, no persistent server-side storage of child data

### No AI Reliance Design
- Gummy always waits the patience window before offering any hint
- Gummy never completes a child's sentence before the window expires
- Every correct answer triggers the "Why do you think that?" follow-up before moving on

## Reading Tiers

| Tier | Description |
|---|---|
| `early` | Recognizes sight words, decodes simple CVC words, needs very short sentences |
| `developmental` | Some multisyllabic words, mild speech delays possible, benefits from rhyme |
| `fluent` | Reads chapter-level text, can handle more complex sentence structures |

Tier is detected during the calibration phase and adjusted dynamically by timer performance.

## IEP Accommodations

When the IEP flag is active:
- Patience window is multiplied (default 3–10s becomes up to 15s)
- Complexity floor is reduced (simpler vocabulary, shorter sentences)
- Gummy never finishes sentences — longer silence is not treated as non-response

## Modules (MVP)

1. **What is AI?** — AI is a tool, not a person; it learned from reading; it has no feelings
2. **What is a Chatbot?** — A chatbot answers based on patterns; it can be wrong
3. **How Does AI Get Its Information?** — Training data, not real-time browsing; can be out of date

## Development Phases

See `IMPLEMENTATION_PLAN.md` for the full phased plan with task breakdown.

## Environment Variables

```
VITE_API_BASE_URL=        # URL of the Node LLM proxy
ANTHROPIC_API_KEY=        # Server-side only, never exposed to client
VITE_TTS_PROVIDER=        # "web-speech" | "elevenlabs"
ELEVENLABS_API_KEY=       # Server-side only if using ElevenLabs
```

## Key Behaviors to Preserve

- The avatar color chosen by the child tints the full session UI
- The falling gummies timer uses no clock language and no countdown numbers
- Confetti fires on every correct answer, even hinted ones
- The "big question" at module close has no wrong answer — Gummy celebrates any response
- The PDF privacy footer must always read: *"Voice data was processed on this device and was not transmitted or stored."*
