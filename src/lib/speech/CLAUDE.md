# Speech Library

## What This Does

Manages both directions of the voice pipeline: STT (child's voice → text) and TTS (Gummy's text → speech). This is the most privacy-sensitive part of the stack.

## STT: Whisper.js (In-Browser)

### Critical Constraint
Raw audio NEVER leaves the device. Whisper runs via WASM entirely in the browser. Only the resulting text transcript is sent anywhere.

### Implementation

Use `@xenova/transformers` to run `Whisper` models in-browser:

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

Use `whisper-tiny.en` for speed — latency target is ≤2s p50. If accuracy is insufficient on first test, step up to `whisper-base.en`.

### Recording

Use the Web Audio API + `MediaRecorder`:
1. Request mic permission (handled in onboarding)
2. Stream audio to `MediaRecorder`
3. On stop: collect blob → pass to `transcribe()`
4. Expose `startListening()` / `stopListening()` / `onTranscript(cb)` interface

### Fallback

If Whisper.js WASM is too slow (>3s p50 on target tablet hardware): fall back to Deepgram cloud STT. If fallback is used, display an on-screen consent disclosure:
> *"For faster responses, your voice is being sent securely to a transcription service. No audio is stored."*

This fallback is a last resort — prefer tuning the Whisper model size first.

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
