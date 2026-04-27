// Whisper.js singleton — loads once, reused for all transcription calls.
// Uses @xenova/transformers (WASM, in-browser). Audio never leaves the device.
//
// Important: keep the transformers import lazy. App startup imports session code
// before the child ever reaches the Whisper loader, and eager-loading ONNX on the
// first screen can crash the app in browsers that are missing the expected runtime.

import ortWasmUrl from '@xenova/transformers/dist/ort-wasm.wasm?url';
import ortWasmThreadedUrl from '@xenova/transformers/dist/ort-wasm-threaded.wasm?url';
import ortWasmSimdUrl from '@xenova/transformers/dist/ort-wasm-simd.wasm?url';
import ortWasmSimdThreadedUrl from '@xenova/transformers/dist/ort-wasm-simd-threaded.wasm?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranscriberPipeline = any;

type TransformersModule = typeof import('@xenova/transformers');

let transcriber: TranscriberPipeline | null = null;
let initPromise: Promise<TranscriberPipeline> | null = null;
let transformersModulePromise: Promise<TransformersModule> | null = null;
const WHISPER_MODEL_ID = 'Xenova/whisper-tiny.en';

export type WhisperLoadProgress = {
  status: 'downloading' | 'loading' | 'ready' | 'error';
  progress: number; // 0–100
  file?: string;
  error?: string;
};

export async function initWhisper(
  onProgress?: (p: WhisperLoadProgress) => void,
): Promise<void> {
  assertSupportedWhisperBrowser();

  if (transcriber) {
    onProgress?.({ status: 'ready', progress: 100 });
    return;
  }
  if (initPromise) {
    try {
      await initPromise;
      onProgress?.({ status: 'ready', progress: 100 });
      return;
    } catch (error) {
      initPromise = null;
      transcriber = null;
      throw error;
    }
  }

  initPromise = (async () => {
    const { pipeline, env } = await loadTransformers();

    env.allowRemoteModels = true;
    // In Vite dev/prod, missing `/models/*` paths fall through to index.html.
    // Force browser builds to skip local model lookup and fetch from Hugging Face.
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    env.backends.onnx.wasm.proxy = false;
    env.backends.onnx.wasm.numThreads = 1;
    env.backends.onnx.wasm.wasmPaths = {
      'ort-wasm.wasm': ortWasmUrl,
      'ort-wasm-threaded.wasm': ortWasmThreadedUrl,
      'ort-wasm-simd.wasm': ortWasmSimdUrl,
      'ort-wasm-simd-threaded.wasm': ortWasmSimdThreadedUrl,
    };

    // Safari/iOS WebAssembly support is still the most fragile target.
    if (isAppleWebKitBrowser()) {
      env.backends.onnx.wasm.simd = false;
    }

    await clearStaleLocalModelCacheEntries(WHISPER_MODEL_ID);

    return pipeline('automatic-speech-recognition', WHISPER_MODEL_ID, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (p: any) => {
        if (!onProgress) return;
        if (p.status === 'downloading' || p.status === 'fetching') {
          onProgress({
            status: 'downloading',
            progress: Math.round(p.progress ?? 0),
            file: p.file,
          });
        } else if (p.status === 'initiate') {
          onProgress({ status: 'downloading', progress: 0, file: p.file });
        } else if (p.status === 'loading') {
          onProgress({ status: 'loading', progress: 95 });
        } else if (p.status === 'done') {
          onProgress({ status: 'ready', progress: 100 });
        }
      },
    });
  })();

  try {
    transcriber = await initPromise;
    onProgress?.({ status: 'ready', progress: 100 });
  } catch (error) {
    initPromise = null;
    transcriber = null;
    throw error;
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!transcriber) {
    throw new Error('Whisper not initialized. Call initWhisper() first.');
  }

  const float32 = await blobToFloat32At16kHz(audioBlob);
  return transcribePreparedAudio(float32);
}

export async function transcribeSamples(
  samples: Float32Array,
  sampleRate: number,
): Promise<string> {
  if (!transcriber) {
    throw new Error('Whisper not initialized. Call initWhisper() first.');
  }

  const float32 = sampleRate === 16000 ? samples : resampleMonoTo16kHz(samples, sampleRate);
  return transcribePreparedAudio(float32);
}

async function transcribePreparedAudio(float32: Float32Array): Promise<string> {
  const result = await transcriber(float32, {
    sampling_rate: 16000,
    language: 'english',
    task: 'transcribe',
  });

  // result.text is the transcript
  const text: string = (result as { text: string }).text ?? '';
  return text.trim();
}

export function isWhisperReady(): boolean {
  return transcriber !== null;
}

function assertSupportedWhisperBrowser(): void {
  if (typeof window === 'undefined') return;

  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };

  const missingApis = [
    typeof AudioContext === 'undefined' && typeof browserWindow.webkitAudioContext === 'undefined'
      ? 'AudioContext'
      : null,
    typeof MediaRecorder === 'undefined' ? 'MediaRecorder' : null,
  ].filter(Boolean);

  if (missingApis.length > 0) {
    throw new Error(`Whisper is not supported in this browser: missing ${missingApis.join(', ')}`);
  }
}

function isAppleWebKitBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /AppleWebKit/i.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|Edg/i.test(navigator.userAgent);
}

async function loadTransformers(): Promise<TransformersModule> {
  if (!transformersModulePromise) {
    transformersModulePromise = import('@xenova/transformers');
  }
  return transformersModulePromise;
}

async function clearStaleLocalModelCacheEntries(modelId: string): Promise<void> {
  if (typeof caches === 'undefined') return;

  try {
    const cache = await caches.open('transformers-cache');
    const keys = await cache.keys();
    const stalePrefix = `/models/${modelId}/`;

    await Promise.all(
      keys
        .filter(request => request.url.includes(stalePrefix))
        .map(request => cache.delete(request)),
    );
  } catch {
    // Cache access can fail in restricted browser modes. Ignore and continue.
  }
}

// ─── Audio conversion: Blob → Float32Array at 16 kHz ─────────────────────────

async function blobToFloat32At16kHz(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  // Decode the compressed audio (WebM/Opus from MediaRecorder)
  const decodeCtx = new AudioContext();
  const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  // If already 16 kHz mono, return directly
  if (audioBuffer.sampleRate === 16000 && audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  // Resample to 16 kHz mono using OfflineAudioContext
  const targetSampleRate = 16000;
  const targetLength = Math.ceil(audioBuffer.duration * targetSampleRate);
  const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

function resampleMonoTo16kHz(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000 || input.length === 0) {
    return input;
  }

  const outputLength = Math.max(1, Math.round((input.length * 16000) / inputSampleRate));
  const output = new Float32Array(outputLength);
  const ratio = inputSampleRate / 16000;

  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const weight = position - left;
    output[i] = input[left] * (1 - weight) + input[right] * weight;
  }

  return output;
}
