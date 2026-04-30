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

### Render (single service)

This repo now supports a single Render web service:

- the Vite app is built during deploy
- the Express server serves both the frontend and `/api/*`
- React Router routes resolve through the server in production

Create a new Render `Web Service` from this repo and use:

- Build command: `npm install && npm run build`
- Start command: `npm start`

Set these environment variables in Render:

- `ANTHROPIC_API_KEY=...`
- `VITE_TTS_PROVIDER=web-speech`
- `VITE_API_BASE_URL=` (leave blank for same-origin API calls)
- `ALLOWED_ORIGINS=` (optional when frontend and API share the same Render URL)

Notes:

- `render.yaml` is included if you want to use Render Blueprints.
- The app listens on `0.0.0.0` and `process.env.PORT`, which matches Render's web service requirements.

### Vercel + Railway (older split setup)

If you prefer separate frontend and backend hosting, the older split deployment still works:

- frontend on Vercel
- backend on Railway

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
