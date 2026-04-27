# LLM Library

## What This Does

Manages all communication with the Claude API through a lightweight Node proxy server. The client never holds an API key. This library provides typed wrappers for each distinct LLM call the app makes.

## Architecture

```
Browser (React)
    │
    │  POST /api/llm  (JSON body)
    ▼
Node Proxy (server/)
    │  ANTHROPIC_API_KEY injected server-side
    ▼
Claude API
    │
    ▼
Node Proxy
    │
    ▼
Browser receives response text
```

The proxy is a thin pass-through — it injects the API key and validates that the request is one of the known call types. It does not store anything.

## Guardrailed System Prompt

Every LLM call uses the following base system prompt. Do not remove or weaken any of these constraints.

```
You are Gummy, a friendly AI tutor for children ages 6–8.

Rules:
- Respond only in age-appropriate language (short sentences, simple words, one idea at a time)
- Prefer rhyming, rap-style, or Dr. Seuss-inspired language when teaching concepts
- Topics are limited to: AI literacy (what AI is, what a chatbot is, how AI learns)
- Never answer questions outside this topic scope
- After every correct answer, ask "Why do you think that?" before moving on
- Wait [PATIENCE_WINDOW] seconds before offering any hint or sentence completion
- Never complete a child's sentence without the patience window expiring
- Model uncertainty naturally: it is okay to say "I'm not sure — good question!"
- Always respond with warmth, encouragement, and zero judgment
- Occasionally name your information source: "I learned that from reading books!"
```

`[PATIENCE_WINDOW]` is replaced at call time with the session's configured patience window in seconds.

## Call Types

### `generateCalibrationQuestions()`
- Returns 3 warm-up questions appropriate for ages 6–8
- Topic-neutral (not AI literacy content)
- Fallback: hardcoded question set in `src/lib/llm/fallbacks.ts`

### `generateHint(question: string, childResponse: string)`
- Returns a single hint sentence for the given comprehension question
- Must not give away the full answer
- Must be phrased as a Socratic nudge

### `generateGummyNote(metrics: SessionMetrics)`
- Returns 1–2 sentences summarizing the session for parents
- Warm, developmental framing — no fail language
- Input: condensed metrics summary (no PII beyond child's first name)

### `generateModuleResponse(userInput: string, moduleContext: ModuleContext)`
- Main conversational response during a session
- Fully guardrailed by base system prompt
- Returns structured: `{ responseText: string; followUpPrompt?: string }`

## Error Handling

- On API timeout or error: surface a graceful in-app message, do not crash the session
- Never show raw API errors to the child — route all errors to a parent-visible log
- Retry once on 429 (rate limit) with 2s delay before failing

## Security Notes

- The Node proxy must validate `Content-Type: application/json` and reject unexpected fields
- Rate-limit the proxy: max 30 requests per session to prevent abuse
- Input sanitization: strip any HTML/script tags from child voice transcripts before sending to LLM
