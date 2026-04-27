// Speech-to-text using Whisper.js (WASM, in-browser).
// Raw audio never leaves the device — only the transcript text is used downstream.

import { transcribeSamples, isWhisperReady } from './whisper';

export interface STTResult {
  transcript: string;
  durationMs: number;
}

let recordingStartMs = 0;
let activeStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let mediaSource: MediaStreamAudioSourceNode | null = null;
let processorNode: ScriptProcessorNode | null = null;
let muteNode: GainNode | null = null;
let sampleRate = 16000;
let sampleChunks: Float32Array[] = [];

// Tracks the in-flight startListening() promise so stopListening/cancelListening
// can synchronize even when callers fire-and-forget the start.
let startPromise: Promise<void> | null = null;
let cancelledFlag = false;

export async function startListening(): Promise<void> {
  if (audioContext) return;
  if (startPromise) {
    await startPromise;
    return;
  }

  cancelledFlag = false;
  startPromise = performStart();
  try {
    await startPromise;
  } finally {
    startPromise = null;
  }
}

async function performStart(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Bail out if cancelListening() was called while getUserMedia was pending.
  if (cancelledFlag) {
    stream.getTracks().forEach(track => track.stop());
    return;
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach(track => track.stop());
    throw new Error('Microphone stream did not include an audio track');
  }

  activeStream = stream;
  sampleChunks = [];
  recordingStartMs = Date.now();
  try {
    audioContext = new AudioContext();
    sampleRate = audioContext.sampleRate;
    mediaSource = audioContext.createMediaStreamSource(stream);
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    muteNode = audioContext.createGain();
    muteNode.gain.value = 0;

    processorNode.onaudioprocess = event => {
      const input = event.inputBuffer.getChannelData(0);
      sampleChunks.push(new Float32Array(input));
    };

    mediaSource.connect(processorNode);
    processorNode.connect(muteNode);
    muteNode.connect(audioContext.destination);

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  } catch (error) {
    await cleanupAudioPipeline();
    throw error;
  }
}

export async function stopListening(): Promise<STTResult> {
  // If a start is still in-flight, wait for it so we capture whatever was recorded.
  if (startPromise) {
    try {
      await startPromise;
    } catch {
      // start itself failed — nothing to stop
    }
  }

  if (!audioContext) {
    return { transcript: '', durationMs: 0 };
  }

  const durationMs = Date.now() - recordingStartMs;
  const samples = mergeChunks(sampleChunks);

  await cleanupAudioPipeline();

  if (samples.length === 0) {
    return { transcript: '', durationMs };
  }

  try {
    if (!isWhisperReady()) {
      console.warn('Whisper transcription skipped because the model is not ready.');
      return { transcript: '', durationMs };
    }
    const transcript = await transcribeSamples(samples, sampleRate);
    return { transcript, durationMs };
  } catch (err) {
    console.error('Whisper transcription error:', err);
    return { transcript: '', durationMs };
  }
}

export function cancelListening(): void {
  cancelledFlag = true;
  startPromise = null;
  cleanupAudioPipeline().catch(() => {});
  sampleChunks = [];
}

export function isListening(): boolean {
  return audioContext !== null;
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

async function cleanupAudioPipeline(): Promise<void> {
  processorNode?.disconnect();
  mediaSource?.disconnect();
  muteNode?.disconnect();
  processorNode = null;
  mediaSource = null;
  muteNode = null;

  activeStream?.getTracks().forEach(track => track.stop());
  activeStream = null;

  if (audioContext) {
    await audioContext.close().catch(() => {
      // Ignore close failures; we're already tearing down.
    });
  }
  audioContext = null;
}
