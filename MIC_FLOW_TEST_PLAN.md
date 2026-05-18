# Mic Flow Test Plan

## Mechanism

Gummy uses `getUserMedia` to open the selected browser microphone, records locally with `MediaRecorder`, and transcribes locally with Whisper through Transformers.js. A Web Audio path runs at the same time for live input level feedback and PCM fallback. Raw audio stays on the device.

## Required Device Checks

For each target below:

1. Open the app over HTTPS, localhost, or `127.0.0.1`.
2. Complete onboarding and allow microphone permission.
3. During "Checking the microphone", speak for two seconds.
4. Confirm onboarding advances only when audio bytes or PCM samples are captured.
5. Confirm the listening meter moves while speaking in calibration.
6. Confirm "Whisper heard" shows a transcript after tapping Done talking.
7. Refresh and repeat once to catch stale permission or cached model issues.

## Matrix

| Target | Browser | Expected capture path |
|---|---|---|
| macOS | Chrome | MediaRecorder + AudioWorklet |
| macOS | Safari | MediaRecorder + AudioWorklet or ScriptProcessor fallback |
| iPadOS/iOS | Safari | MediaRecorder + AudioWorklet or ScriptProcessor fallback |
| Android | Chrome | MediaRecorder + AudioWorklet |
| Windows | Chrome or Edge | MediaRecorder + AudioWorklet |
| Desktop | Firefox | MediaRecorder + AudioWorklet or ScriptProcessor fallback |

## Failure Clues

| Symptom | Likely issue |
|---|---|
| Browser mic indicator appears, onboarding does not advance | Permission succeeded, but no audio bytes or PCM samples were captured |
| Meter never moves while speaking | Web Audio graph is not receiving mic signal or the wrong input device is selected |
| Meter moves, transcript is empty | Whisper decode/transcription failed or the recording was too short/quiet |
| Works once, then fails after refresh | Browser permission/device state is stale; revoke permission and retry |
