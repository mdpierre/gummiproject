# Gummy

Gummy is a voice-first AI literacy app for kids ages 6-8. This repo is currently tuned for one polished demo path:

- onboarding
- microphone permission
- color selection
- calibration
- one hero lesson: `What Is AI?`
- parent-ready report flow

## Stack

- React + Vite + Tailwind
- Whisper via `@xenova/transformers` in the browser
- Web Speech API for TTS
- Express proxy for LLM calls

## Local Dev

```bash
npm install
npm run dev
```

Frontend:

- `http://127.0.0.1:5173`

Backend:

- `http://localhost:3001`

## Environment

Copy `.env.example` to `.env`.

Frontend:

- `VITE_API_BASE_URL`
- `VITE_TTS_PROVIDER`

Backend:

- `ANTHROPIC_API_KEY`
- `ALLOWED_ORIGINS`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

## Deploy

### Frontend on Vercel

Set these in the Vercel project:

- `VITE_API_BASE_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app`
- `VITE_TTS_PROVIDER=web-speech`

Notes:

- `vercel.json` includes an SPA rewrite so React Router routes like `/modules/what-is-ai` resolve correctly.
- The frontend is static. The API should point to Railway in production.

### Backend on Railway

Set these in Railway:

- `ANTHROPIC_API_KEY=...`
- `ALLOWED_ORIGINS=https://YOUR-VERCEL-FRONTEND.vercel.app`

Runtime:

- Start command: `npm run start:server`

The server listens on `process.env.PORT`, so Railway can assign the port automatically.

## Whisper In Production

Whisper does not need to be preinstalled on the device.

In this app, the browser downloads the model and WASM runtime on first use, then caches it locally. That means:

- deployed usage is supported
- first-time setup takes longer
- performance depends on browser/device support
- raw audio still stays on-device in the intended architecture

## Demo Notes

The MVP is intentionally narrowed:

- only `What Is AI?` is selectable for the public demo
- other lessons, stories, and topics are visible as previews but locked

This keeps the product story focused for demos, LinkedIn posts, and early feedback.
