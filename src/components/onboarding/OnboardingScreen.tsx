// Parent-facing onboarding screen.
// Collects: child name, IEP toggle, patience window.
// Then guides through mic permission before advancing to color selection.

import { useEffect, useState } from 'react';
import MicLevelMeter from '../MicLevelMeter';
import { useSession } from '../../context/SessionContext';
import {
  listMicInputDevices,
  getVoicePrivacyCopy,
  runMicCaptureTest,
  setMicInputDevice,
  type MicInputDevice,
  type STTResult,
} from '../../lib/speech/stt';
import useMicLevel from '../../hooks/useMicLevel';
import type { SessionConfig } from '../../types';

type Step = 'form' | 'mic-request' | 'mic-testing' | 'mic-quiet' | 'mic-denied';

export default function OnboardingScreen() {
  const { state, setConfig, setPhase, startSession } = useSession();
  const [step, setStep] = useState<Step>('form');
  const [lastMicTest, setLastMicTest] = useState<STTResult | null>(null);
  const [micDevices, setMicDevices] = useState<MicInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const micLevel = useMicLevel();
  const voicePrivacyCopy = getVoicePrivacyCopy();

  // Form state
  const [childName, setChildName] = useState(state.config.childName);
  const [iepMode, setIepMode] = useState(state.config.iepMode);
  const [patienceWindow, setPatienceWindow] = useState(
    Math.round(state.config.patienceWindowMs / 1000),
  );

  const effectivePatienceWindow = iepMode ? 15 : patienceWindow;

  useEffect(() => {
    if (step !== 'mic-request' && step !== 'mic-quiet') return;
    listMicInputDevices()
      .then(devices => {
        setMicDevices(devices);
        if (!selectedDeviceId && devices.length > 0) {
          setSelectedDeviceId(devices[0].deviceId);
        }
      })
      .catch(() => setMicDevices([]));
  }, [step, selectedDeviceId]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const config: SessionConfig = {
      childName: childName.trim() || 'friend',
      iepMode,
      patienceWindowMs: effectivePatienceWindow * 1000,
      tierOverride: 'auto',
      chosenColor: state.config.chosenColor,
    };
    setConfig(config);
    setStep('mic-request');
  }

  async function requestMic() {
    setStep('mic-testing');
    try {
      setMicInputDevice(selectedDeviceId);
      const result = await runMicCaptureTest();
      setLastMicTest(result);
      const devices = await listMicInputDevices().catch(() => []);
      setMicDevices(devices);
      if (!hasAudibleSignal(result)) {
        setStep('mic-quiet');
        return;
      }
      startSession();
      setPhase('color-select');
    } catch {
      setStep('mic-denied');
    }
  }

  function hasAudibleSignal(result: STTResult): boolean {
    return (result.maxLevel ?? 0) >= 0.02;
  }

  function formatPercent(value = 0): string {
    return `${Math.round(value * 100)}%`;
  }

  // ─── Form step ──────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-5xl">🍬</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">Welcome to Gummy</h1>
            <p className="text-gray-500 text-sm mt-1">
              AI reading for kids — let's get set up
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
            {/* Child name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Child's name
              </label>
              <input
                type="text"
                value={childName}
                onChange={e => setChildName(e.target.value)}
                placeholder="e.g. Jimmy"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-[--gummy-color] transition"
                maxLength={40}
              />
            </div>

            {/* IEP toggle */}
            <div>
              <label className="flex items-start gap-4 cursor-pointer">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={iepMode}
                    onChange={e => setIepMode(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setIepMode(v => !v)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      iepMode ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        iepMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    IEP accommodations
                    {iepMode && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        ON
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {iepMode
                      ? `IEP mode is on — Gummy will give ${childName || 'your child'} extra time to find their words and will never rush.`
                      : 'Turn on if your child has an IEP or benefits from extra processing time.'}
                  </p>
                </div>
              </label>
            </div>

            {/* Patience window — hidden when IEP is on */}
            {!iepMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wait time before hint
                  <span className="ml-2 text-gray-400 font-normal">
                    {patienceWindow}s
                  </span>
                </label>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={patienceWindow}
                  onChange={e => setPatienceWindow(Number(e.target.value))}
                  className="w-full accent-[--gummy-color]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>3s (faster hints)</span>
                  <span>15s (more patience)</span>
                </div>
              </div>
            )}

            {/* Privacy note */}
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-600">🔒 Privacy first.</span>{' '}
              {voicePrivacyCopy}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-transform active:scale-95"
              style={{ backgroundColor: 'var(--gummy-color)' }}
            >
              Let's go →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Mic request step ────────────────────────────────────────────────────────
  if (step === 'mic-request') {
    const name = childName.trim() || 'your child';
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">🎤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Gummy needs to hear {name}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Gummy listens through the microphone so {name} can answer out loud.
            <br /><br />
            <strong className="text-gray-700">Privacy first.</strong>
            {' '}{voicePrivacyCopy}
          </p>
          {micDevices.length > 0 && (
            <label className="block text-left text-sm font-semibold text-gray-700 mb-5">
              Microphone
              <select
                value={selectedDeviceId}
                onChange={event => setSelectedDeviceId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-gray-300"
              >
                {micDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={requestMic}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-transform active:scale-95"
            style={{ backgroundColor: 'var(--gummy-color)' }}
          >
            Allow microphone →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'mic-testing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">🎤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Checking the microphone
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Say “hello Gummy” while Gummy checks that audio is really coming through.
          </p>
          <div className="flex justify-center mb-4">
            <MicLevelMeter color="var(--gummy-color)" level={micLevel.level} />
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full animate-pulse"
              style={{ width: '70%', backgroundColor: 'var(--gummy-color)' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === 'mic-quiet') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">🎤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Gummy could not hear the mic
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            The browser allowed microphone access, but Gummy did not hear a clear voice signal.
            Check the device microphone, browser input, and system privacy settings, then try again.
          </p>
          {lastMicTest && (
            <div className="bg-gray-50 rounded-xl p-3 text-left text-xs text-gray-500 mb-5">
              <p>Input: {lastMicTest.inputLabel || 'Unknown microphone'}</p>
              <p>Signal: {formatPercent(lastMicTest.maxLevel)}</p>
              <p>Capture: {lastMicTest.captureMode ?? 'none'}</p>
            </div>
          )}
          {micDevices.length > 0 && (
            <label className="block text-left text-sm font-semibold text-gray-700 mb-5">
              Try a different microphone
              <select
                value={selectedDeviceId}
                onChange={event => setSelectedDeviceId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-gray-300"
              >
                {micDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={requestMic}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-transform active:scale-95"
            style={{ backgroundColor: 'var(--gummy-color)' }}
          >
            Test microphone again
          </button>
          <button
            onClick={() => setStep('form')}
            className="w-full mt-3 py-3 rounded-2xl text-gray-500 font-medium text-sm bg-gray-100"
          >
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  // ─── Mic denied step ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Microphone permission needed
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Gummy is a voice-first app — speaking aloud is how the learning happens.
          <br /><br />
          To allow the mic: tap the lock icon in your browser's address bar and set
          Microphone to <strong>Allow</strong>, then try again.
        </p>
        <button
          onClick={() => setStep('mic-request')}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-transform active:scale-95"
          style={{ backgroundColor: 'var(--gummy-color)' }}
        >
          Try again
        </button>
        <button
          onClick={() => setStep('form')}
          className="w-full mt-3 py-3 rounded-2xl text-gray-500 font-medium text-sm bg-gray-100"
        >
          Back to setup
        </button>
      </div>
    </div>
  );
}
