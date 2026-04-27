# Avatar Component

## What This Does

The Gummy avatar is the emotional core of the app — a color-cycling animated character that the child "claims" by tapping their favorite color. The chosen color persists as a theme throughout the entire session.

## Behavior Spec

### On App Load
1. Avatar starts slowly cycling through colors (continuous loop, ~2s per color)
2. Voice prompt plays: *"Hi! I'm Gummy. Tap the color you love!"*
3. Text appears on screen simultaneously with the voice for accessibility

### Color Selection (Tap-to-Lock)
1. Child taps the avatar while it's displaying their preferred color
2. Avatar locks to that color
3. Gummy speaks: *"Ooh, I love [color] too! Want to keep it?"*
4. Child says yes (voice) or taps confirm
5. Color is stored in session state and applied as a CSS theme tint across the full UI

### Color Change Flow
- If child says "no" or taps the change option, cycling resumes from current color
- Child can re-tap to claim again

## Component API

```tsx
// components/avatar/GummyAvatar.tsx
interface GummyAvatarProps {
  mode: 'cycling' | 'locked' | 'listening' | 'thinking' | 'celebrating';
  color?: string;           // hex or tailwind color token
  onColorTap?: () => void;  // fires when child taps during cycling
}
```

## Animation States

| State | Description |
|---|---|
| `cycling` | Slow hue rotation, ~2s per color, gentle bounce |
| `locked` | Settled on chosen color, idle gentle pulse |
| `listening` | Subtle sound-wave ripple animation around avatar |
| `thinking` | Slow bob, slightly dimmed — used during patience window |
| `celebrating` | Bounce + scale pop, triggers confetti emitter |

## Implementation Notes

- Use CSS keyframe animations or Lottie for the color cycling
- Color should be applied as a CSS variable (`--gummy-color`) so all themed UI elements update automatically via Tailwind's arbitrary value syntax or a CSS-in-JS approach
- The avatar SVG/Lottie should accept a `color` prop that maps to a fill or overlay tint
- Keep animation lightweight — this runs on tablets, some low-end

## Session Color Theme

When color is locked, apply `--gummy-color` to:
- Avatar fill
- Button accents
- Progress indicators
- Confetti particle color
- PDF report accent color

## Accessibility

- Text always appears on screen alongside TTS — never voice-only
- Color cycling includes a pause/select button as a fallback for motor accessibility
