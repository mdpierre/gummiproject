# Speech Library

## What This Does

Manages both directions of the voice pipeline: STT (child's voice → text) and TTS (Gummy's text → speech). This is the most privacy-sensitive part of the stack.

## STT: Provider-Based Transcription

### Current Default
`VITE_STT_PROVIDER=cloud` is the default because browser Whisper has been unreliable across target devices. The browser captures short mic clips, sends them to the server-side `/api/transcribe` proxy, and the proxy uses `OPENAI_TRANSCRIBE_MODEL` (`gpt-4o-mini-transcribe` by default). API keys never ship to the client.

### Privacy Constraint
Keep the UI copy aligned with the configured provider:
- `cloud` or `auto`: audio is securely transcribed by the configured speech service and is not stored by Gummy.
- `local`: voice is processed on device with Whisper.js.

Only transcript text is sent to the tutoring LLM.

### Implementation

Keep local Whisper available for `VITE_STT_PROVIDER=local` or `auto`:

```ts
// lib/speech/stt.ts
import { pipeline } from '@xenova/transformers';

let sttPipeline: any = null;

export async function initSTT() {
  sttPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
}

export async function transcribe(audioBlob: Blob): Promise<string> {
  // Convert blob to Float32Array, pass to pipeline
  // Return transcript string
}
```

Use `whisper-tiny.en` for speed if local mode is enabled. Latency target is ≤2s p50. If accuracy is insufficient on first test, step up to `whisper-base.en`.

### Recording

Use the Web Audio API + `MediaRecorder`:
1. Request mic permission (handled in onboarding)
2. Stream audio to `MediaRecorder`
3. On stop: collect blob → cloud proxy or local `transcribe()`
4. Expose `startListening()` / `stopListening()` / `onTranscript(cb)` interface

### Fallback

`VITE_STT_PROVIDER=auto` tries cloud transcription first, then local Whisper if it is ready.

---

## TTS: Web Speech API

### Primary TTS

Use the browser-native `SpeechSynthesis` API:

```ts
// lib/speech/tts.ts
export function speak(text: string, onBoundary?: (word: string, charIndex: number) => void) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;    // Slightly slower for child comprehension
  utterance.pitch = 1.1;    // Slightly higher for Gummy character voice
  if (onBoundary) {
    utterance.addEventListener('boundary', (e) => {
      // Extract current word using charIndex + text
      onBoundary(getCurrentWord(text, e.charIndex), e.charIndex);
    });
  }
  window.speechSynthesis.speak(utterance);
}
```

The `onBoundary` callback drives karaoke word highlighting in the session component.

### ElevenLabs Fallback

If the native voice quality is inadequate for demo purposes, route TTS through ElevenLabs via the Node proxy (API key server-side only). The proxy streams the audio back as a blob.

Set `VITE_TTS_PROVIDER=elevenlabs` to switch. Keep a consistent Gummy voice ID across all calls.

---

## Silence Detection

The patience window needs to know when the child has stopped speaking. Use an energy-based silence detector:

```ts
// lib/speech/silence.ts
export function createSilenceDetector(stream: MediaStream, options: {
  silenceThresholdDb: number;  // default: -50
  silenceDurationMs: number;   // default: 1500
  onSilence: () => void;
  onSpeechStart: () => void;
}): { stop: () => void }
```

This feeds into the patience window — when `onSpeechStart` fires, it cancels the balloon countdown.
