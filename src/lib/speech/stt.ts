// Speech-to-text orchestration.
// The browser owns mic capture and level metering. Transcription can be cloud,
// local Whisper, or cloud-first with a local fallback.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const STT_SESSION_ID = `stt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

type WhisperModule = typeof import('./whisper');
let whisperModulePromise: Promise<WhisperModule> | null = null;

export type STTProvider = 'cloud' | 'local' | 'auto';

export interface STTResult {
  transcript: string;
  durationMs: number;
  captureMode?: 'media-recorder' | 'web-audio' | 'none';
  audioBytes?: number;
  sampleCount?: number;
  maxLevel?: number;
  inputLabel?: string;
  transcriptSource?: 'cloud' | 'pcm' | 'blob' | 'none';
  transcriptionError?: string;
}

export interface MicInputDevice {
  deviceId: string;
  label: string;
}

export interface MicLevelState {
  level: number;
  speaking: boolean;
}

let recordingStartMs = 0;
let activeStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let mediaSource: MediaStreamAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let workletNode: AudioWorkletNode | null = null;
let processorNode: ScriptProcessorNode | null = null;
let muteNode: GainNode | null = null;
let mediaRecorder: MediaRecorder | null = null;
let sampleRate = 16000;
let sampleChunks: Float32Array[] = [];
let recordedChunks: Blob[] = [];
let captureMode: STTResult['captureMode'] = 'none';
let levelAnimationFrame: number | null = null;
let levelBuffer: Float32Array | null = null;
let maxObservedLevel = 0;
let activeInputLabel = '';
let selectedInputDeviceId = '';
const levelListeners = new Set<(state: MicLevelState) => void>();

// Tracks the in-flight startListening() promise so stopListening/cancelListening
// can synchronize even when callers fire-and-forget the start.
let startPromise: Promise<void> | null = null;
let cancelledFlag = false;

export function getSttProvider(): STTProvider {
  const raw = String(import.meta.env.VITE_STT_PROVIDER ?? 'cloud').toLowerCase();
  if (raw === 'local' || raw === 'auto' || raw === 'cloud') {
    return raw;
  }
  return 'cloud';
}

export function requiresLocalWhisper(): boolean {
  return getSttProvider() !== 'cloud';
}

export function getVoicePrivacyCopy(): string {
  return requiresLocalWhisper()
    ? 'No data is stored. No account is created. Voice is processed on this device.'
    : 'No data is stored. No account is created. Voice is securely transcribed by the speech service and is not stored by Gummy.';
}

export function subscribeToMicLevel(listener: (state: MicLevelState) => void): () => void {
  levelListeners.add(listener);
  listener({ level: 0, speaking: false });

  return () => {
    levelListeners.delete(listener);
  };
}

export async function runMicCaptureTest(durationMs = 2200): Promise<STTResult> {
  await startListening();
  await new Promise(resolve => setTimeout(resolve, durationMs));
  return stopListening();
}

export function setMicInputDevice(deviceId: string): void {
  selectedInputDeviceId = deviceId;
}

export async function listMicInputDevices(): Promise<MicInputDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter(device => device.kind === 'audioinput')
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${index + 1}`,
    }));
}

export async function startListening(): Promise<void> {
  if (activeStream) return;
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
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
    ...(selectedInputDeviceId
      ? { deviceId: { exact: selectedInputDeviceId } }
      : {}),
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraints,
  });

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
  recordedChunks = [];
  captureMode = 'none';
  maxObservedLevel = 0;
  activeInputLabel = audioTracks[0].label;
  recordingStartMs = Date.now();

  try {
    startMediaRecorder(stream);
  } catch (error) {
    console.warn('MediaRecorder capture unavailable; falling back to Web Audio.', error);
  }

  try {
    await startWebAudioCapture(stream);
  } catch (error) {
    console.warn('Web Audio PCM capture unavailable.', error);
  }

  if (!mediaRecorder && !audioContext) {
    await cleanupAudioPipeline();
    throw new Error('No supported microphone capture pipeline is available on this device.');
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

  if (!activeStream && !audioContext && !mediaRecorder) {
    return { transcript: '', durationMs: 0 };
  }

  const durationMs = Date.now() - recordingStartMs;
  const mode = captureMode;
  const recordedBlob = await stopMediaRecorder();
  const samples = mergeChunks(sampleChunks);
  const sampleCount = samples.length;
  const audioBytes = recordedBlob?.size ?? 0;
  const decodedBlobLevel = recordedBlob?.size ? await getBlobMaxLevel(recordedBlob) : 0;
  const sampleLevel = getSamplesMaxLevel(samples);
  const maxLevel = Math.max(maxObservedLevel, decodedBlobLevel, sampleLevel);
  const inputLabel = activeInputLabel;

  await cleanupAudioPipeline();

  if (!recordedBlob?.size && samples.length === 0) {
    return {
      transcript: '',
      durationMs,
      captureMode: 'none',
      audioBytes,
      sampleCount,
      maxLevel,
      inputLabel,
    };
  }

  try {
    const provider = getSttProvider();
    const errors: string[] = [];

    if (provider === 'cloud' || provider === 'auto') {
      const cloudBlob = recordedBlob?.size
        ? recordedBlob
        : samples.length > 0
        ? samplesToWavBlob(samples, sampleRate)
        : null;

      if (cloudBlob?.size) {
        try {
          const transcript = await transcribeWithCloud(cloudBlob);
          if (transcript) {
            return {
              transcript,
              durationMs,
              captureMode: recordedBlob?.size ? mode : 'web-audio',
              audioBytes: cloudBlob.size,
              sampleCount,
              maxLevel,
              inputLabel,
              transcriptSource: 'cloud',
            };
          }
          errors.push('Cloud returned empty transcript');
        } catch (cloudError) {
          const message = cloudError instanceof Error ? cloudError.message : 'Cloud transcription failed';
          errors.push(message);
          console.warn('Cloud transcription failed.', cloudError);
        }
      } else {
        errors.push('No audio available for cloud transcription');
      }

      if (provider === 'cloud') {
        return {
          transcript: '',
          durationMs,
          captureMode: mode,
          audioBytes,
          sampleCount,
          maxLevel,
          inputLabel,
          transcriptSource: 'none',
          transcriptionError: errors.join('; ') || 'Cloud transcription failed',
        };
      }
    }

    const whisper = await getWhisperModule();

    if (!whisper.isWhisperReady()) {
      console.warn('Whisper transcription skipped because the model is not ready.');
      return {
        transcript: '',
        durationMs,
        captureMode: mode,
        audioBytes,
        sampleCount,
        maxLevel,
        inputLabel,
        transcriptSource: 'none',
        transcriptionError: [...errors, 'Whisper model is not ready'].filter(Boolean).join('; '),
      };
    }

    if (samples.length > 0) {
      try {
        const transcript = await whisper.transcribeSamples(samples, sampleRate);
        if (transcript) {
          return {
            transcript,
            durationMs,
            captureMode: 'web-audio',
            audioBytes,
            sampleCount,
            maxLevel,
            inputLabel,
            transcriptSource: 'pcm',
          };
        }
        errors.push('PCM returned empty transcript');
      } catch (pcmError) {
        const message = pcmError instanceof Error ? pcmError.message : 'PCM transcription failed';
        errors.push(message);
        console.warn('PCM transcription failed; trying blob fallback.', pcmError);
      }
    }

    if (recordedBlob?.size) {
      try {
        const transcript = await whisper.transcribeAudio(recordedBlob);
        if (transcript) {
          return {
            transcript,
            durationMs,
            captureMode: mode,
            audioBytes,
            sampleCount,
            maxLevel,
            inputLabel,
            transcriptSource: 'blob',
          };
        }
        errors.push('Blob returned empty transcript');
      } catch (blobError) {
        const message = blobError instanceof Error ? blobError.message : 'Blob transcription failed';
        errors.push(message);
        console.warn('Blob transcription failed.', blobError);
      }
    }

    return {
      transcript: '',
      durationMs,
      captureMode: mode,
      audioBytes,
      sampleCount,
      maxLevel,
      inputLabel,
      transcriptSource: 'none',
      transcriptionError: errors.join('; ') || 'No local audio transcription path available',
    };
  } catch (err) {
    console.error('Speech transcription error:', err);
    return {
      transcript: '',
      durationMs,
      captureMode: mode,
      audioBytes,
      sampleCount,
      maxLevel,
      inputLabel,
      transcriptSource: 'none',
      transcriptionError: err instanceof Error ? err.message : 'Speech transcription error',
    };
  }
}

export function cancelListening(): void {
  cancelledFlag = true;
  startPromise = null;
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
  cleanupAudioPipeline().catch(() => {});
  sampleChunks = [];
  recordedChunks = [];
}

export function isListening(): boolean {
  return activeStream !== null;
}

function startMediaRecorder(stream: MediaStream): void {
  if (typeof MediaRecorder === 'undefined') {
    return;
  }

  const mimeType = getSupportedRecordingMimeType();
  const options = mimeType ? { mimeType } : undefined;
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  mediaRecorder.start(500);
  captureMode = 'media-recorder';
}

async function startWebAudioCapture(stream: MediaStream): Promise<void> {
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor) {
    return;
  }

  audioContext = new AudioContextCtor();
  sampleRate = audioContext.sampleRate;
  mediaSource = audioContext.createMediaStreamSource(stream);
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 512;
  levelBuffer = new Float32Array(analyserNode.fftSize);
  muteNode = audioContext.createGain();
  muteNode.gain.value = 0;

  mediaSource.connect(analyserNode);

  try {
    await startAudioWorkletCapture(analyserNode);
  } catch (error) {
    console.warn('AudioWorklet PCM capture unavailable; using ScriptProcessor fallback.', error);
    startScriptProcessorCapture(analyserNode);
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  startLevelMeter();

  if (captureMode === 'none') {
    captureMode = 'web-audio';
  }
}

async function startAudioWorkletCapture(inputNode: AudioNode): Promise<void> {
  if (!audioContext?.audioWorklet || !muteNode) {
    throw new Error('AudioWorklet is not available.');
  }

  await audioContext.audioWorklet.addModule('/gummy-pcm-worklet.js');
  workletNode = new AudioWorkletNode(audioContext, 'gummy-pcm-capture');
  workletNode.port.onmessage = event => {
    sampleChunks.push(new Float32Array(event.data));
  };
  inputNode.connect(workletNode);
  workletNode.connect(muteNode);
  muteNode.connect(audioContext.destination);
}

function startScriptProcessorCapture(inputNode: AudioNode): void {
  if (!audioContext || !muteNode) {
    return;
  }

  processorNode = audioContext.createScriptProcessor(4096, 1, 1);
  processorNode.onaudioprocess = event => {
    const input = event.inputBuffer.getChannelData(0);
    sampleChunks.push(new Float32Array(input));
  };

  inputNode.connect(processorNode);
  processorNode.connect(muteNode);
  muteNode.connect(audioContext.destination);
}

function stopMediaRecorder(): Promise<Blob | null> {
  const recorder = mediaRecorder;
  if (!recorder) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      const type = recorder.mimeType || recordedChunks[0]?.type || '';
      resolve(recordedChunks.length > 0 ? new Blob(recordedChunks, { type }) : null);
    };

    recorder.addEventListener('stop', settle, { once: true });
    recorder.addEventListener('error', settle, { once: true });

    if (recorder.state === 'inactive') {
      settle();
      return;
    }

    try {
      recorder.requestData();
    } catch {
      // Some browsers throw if requestData races with stop. The stop event will settle.
    }
    recorder.stop();
  });
}

function getSupportedRecordingMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];

  return candidates.find(type => MediaRecorder.isTypeSupported(type));
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };

  return window.AudioContext ?? browserWindow.webkitAudioContext;
}

async function getBlobMaxLevel(blob: Blob): Promise<number> {
  try {
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) return 0;

    const arrayBuffer = await blob.arrayBuffer();
    const decodeCtx = new AudioContextCtor();
    const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
    await decodeCtx.close();

    let maxLevel = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
      maxLevel = Math.max(maxLevel, getSamplesMaxLevel(audioBuffer.getChannelData(channel)));
    }

    return maxLevel;
  } catch (error) {
    console.warn('Unable to analyze recorded mic blob level.', error);
    return 0;
  }
}

function getSamplesMaxLevel(samples: Float32Array): number {
  let peak = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
  }
  return Math.min(1, peak);
}

function startLevelMeter(): void {
  stopLevelMeter();
  if (!analyserNode || !levelBuffer) {
    return;
  }

  const tick = () => {
    if (!analyserNode || !levelBuffer) {
      return;
    }

    analyserNode.getFloatTimeDomainData(levelBuffer);
    let sumSquares = 0;
    for (const sample of levelBuffer) {
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / levelBuffer.length);
    const level = Math.min(1, rms * 10);
    maxObservedLevel = Math.max(maxObservedLevel, level);
    notifyLevel({ level, speaking: level > 0.04 });
    levelAnimationFrame = requestAnimationFrame(tick);
  };

  tick();
}

function stopLevelMeter(): void {
  if (levelAnimationFrame !== null) {
    cancelAnimationFrame(levelAnimationFrame);
    levelAnimationFrame = null;
  }
  levelBuffer = null;
  notifyLevel({ level: 0, speaking: false });
}

function notifyLevel(state: MicLevelState): void {
  levelListeners.forEach(listener => listener(state));
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

async function transcribeWithCloud(audioBlob: Blob): Promise<string> {
  const response = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: await blobToBase64(audioBlob),
      mimeType: audioBlob.type || 'audio/webm',
      sessionId: STT_SESSION_ID,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown transcription error' }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return typeof data.text === 'string' ? data.text.trim() : '';
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function samplesToWavBlob(samples: Float32Array, sourceSampleRate: number): Blob {
  const bytesPerSample = 2;
  const headerBytes = 44;
  const buffer = new ArrayBuffer(headerBytes + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sourceSampleRate, true);
  view.setUint32(28, sourceSampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = headerBytes;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function getWhisperModule(): Promise<WhisperModule> {
  whisperModulePromise ??= import('./whisper');
  return whisperModulePromise;
}

async function cleanupAudioPipeline(): Promise<void> {
  stopLevelMeter();
  workletNode?.port.close();
  workletNode?.disconnect();
  processorNode?.disconnect();
  analyserNode?.disconnect();
  mediaSource?.disconnect();
  muteNode?.disconnect();
  workletNode = null;
  processorNode = null;
  analyserNode = null;
  mediaSource = null;
  muteNode = null;
  mediaRecorder = null;

  activeStream?.getTracks().forEach(track => track.stop());
  activeStream = null;

  if (audioContext) {
    await audioContext.close().catch(() => {
      // Ignore close failures; we're already tearing down.
    });
  }
  audioContext = null;
  captureMode = 'none';
  activeInputLabel = '';
}
