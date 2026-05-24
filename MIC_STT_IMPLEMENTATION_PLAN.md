# Mic and Transcription Implementation Plan

## Decision

Use cloud speech-to-text as the primary transcription path and keep local Whisper as an opt-in or automatic fallback.

Claude/Haiku should stay as the tutoring LLM, not the speech-to-text engine. The Anthropic Messages API is built around JSON message content such as text and images, while the app needs an audio transcription endpoint. For STT, use OpenAI `gpt-4o-mini-transcribe` by default and allow `gpt-4o-transcribe` when higher accuracy matters more than cost.

## Five Steps

1. **Provider switch**
   - Add `VITE_STT_PROVIDER=cloud | local | auto`.
   - Default to `cloud` so onboarding does not wait for the browser Whisper model.
   - Keep `local` for fully on-device demos and `auto` for cloud-first with local fallback.

2. **Backend STT proxy**
   - Add `POST /api/transcribe`.
   - Accept short microphone clips as base64 audio from the browser.
   - Keep `OPENAI_API_KEY` server-side only.
   - Return transcript text only.

3. **Client STT flow**
   - Continue using `getUserMedia`, `MediaRecorder`, and Web Audio signal metering.
   - On stop, send the recorded audio blob to `/api/transcribe` in cloud mode.
   - If no blob is available, convert captured PCM samples to WAV and send that.
   - Preserve local Whisper transcription for `local` and `auto` modes.

4. **Honest privacy UX**
   - In local mode, say voice is processed on device.
   - In cloud or auto mode, say audio is securely transcribed by the configured speech service and not stored by Gummy.
   - Update report/footer copy so it does not promise on-device processing when cloud STT is active.

5. **Verification**
   - Run TypeScript/build checks.
   - Test onboarding mic signal, warm-up transcription, question response transcription, and typed-answer fallback.
   - Confirm diagnostics show `Transcription: cloud` when the cloud path is used.

## Environment

```env
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
VITE_STT_PROVIDER=cloud
VITE_API_BASE_URL=
```

## Notes

- Raw audio leaves the browser only when `VITE_STT_PROVIDER` is `cloud` or `auto`.
- Transcript text continues to be the only child speech content sent to the tutoring LLM.
- For production consent, the onboarding copy must remain aligned with the selected STT provider.
