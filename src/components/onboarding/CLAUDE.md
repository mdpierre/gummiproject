# Onboarding Component

## What This Does

The parent-facing onboarding screen collects configuration before the child's session begins. It sets the IEP flag, patience window, and child name. No account is created — this data exists only in session state.

## Parent Onboarding Form

### Fields

| Field | Type | Default | Notes |
|---|---|---|---|
| Child's name | Text input | — | Used to personalize Gummy's speech |
| IEP accommodation | Toggle | Off | Extends patience windows, lowers complexity floor |
| Patience window | Slider (3–15s) | 8s | Overridden to max if IEP is on |
| Reading tier override | Select (auto / early / developmental / fluent) | Auto | Auto = calibration phase determines tier |

### IEP Toggle Behavior
- When IEP is toggled on, patience window slider moves to 12s and locks
- Show explainer copy: *"IEP mode gives [name] extra time to find their words. Gummy will never rush."*

## Mic Permission Flow

After the form, guide the user through microphone permission:
1. Explain the selected STT provider honestly. Cloud mode: *"Voice is securely transcribed by the speech service and is not stored by Gummy."* Local mode: *"Voice stays on this device."*
2. Trigger browser mic permission prompt
3. On grant: proceed to avatar/color selection
4. On deny: show a non-blocking explainer — voice is required, offer to re-try

## Data Flow

Onboarding data is stored in a top-level React context (`SessionContext`) and referenced throughout the session:

```ts
interface SessionConfig {
  childName: string;
  iepMode: boolean;
  patienceWindowMs: number;   // 3000–15000
  tierOverride: 'auto' | 'early' | 'developmental' | 'fluent';
}
```

## Design Notes

- This screen is for parents — use adult-readable type sizes and plain language
- Keep it short: 4 fields max, single screen, no pagination
- Do not use child-friendly cartoon UI here — parents need to trust this feels serious
- Show the privacy statement clearly: *"No data is stored. No account is created."*
