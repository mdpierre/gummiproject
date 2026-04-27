// Energy-based silence detector using Web Audio API AnalyserNode.
// Used to cancel the patience window balloon countdown when the child starts speaking.

export interface SilenceDetectorOptions {
  silenceThresholdDb?: number;  // default: -50
  silenceDurationMs?: number;   // default: 1500 — ms of silence before onSilence fires
  onSilence?: () => void;
  onSpeechStart?: () => void;
}

export interface SilenceDetector {
  stop: () => void;
}

export function createSilenceDetector(
  stream: MediaStream,
  options: SilenceDetectorOptions = {},
): SilenceDetector {
  const {
    silenceThresholdDb = -50,
    silenceDurationMs = 1500,
    onSilence,
    onSpeechStart,
  } = options;

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  let speaking = false;
  let silenceStart: number | null = null;
  let rafId: number;

  function getVolumeDb(): number {
    analyser.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((acc, v) => acc + v, 0);
    const avg = sum / dataArray.length;
    // Convert 0–255 byte value to approximate dB
    return avg === 0 ? -Infinity : 20 * Math.log10(avg / 255);
  }

  function tick() {
    const db = getVolumeDb();
    const now = Date.now();

    if (db > silenceThresholdDb) {
      // Sound detected
      if (!speaking) {
        speaking = true;
        silenceStart = null;
        onSpeechStart?.();
      } else {
        silenceStart = null;
      }
    } else {
      // Below threshold
      if (speaking) {
        if (silenceStart === null) {
          silenceStart = now;
        } else if (now - silenceStart >= silenceDurationMs) {
          speaking = false;
          silenceStart = null;
          onSilence?.();
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return {
    stop() {
      cancelAnimationFrame(rafId);
      source.disconnect();
      audioCtx.close();
    },
  };
}
