// Gummy avatar — SVG gummy bear shape.
// Color is driven by the `color` prop (hex string).
// Animation state controls the active CSS class.

export type AvatarMode =
  | 'cycling'      // slow hue rotation, gentle bounce — color selection
  | 'locked'       // settled color, idle pulse
  | 'listening'    // sound-wave ripple
  | 'thinking'     // slow bob, slightly dimmed — patience window
  | 'celebrating'; // scale pop — confetti moment

interface GummyAvatarProps {
  mode: AvatarMode;
  color: string;
  size?: number;
  onClick?: () => void;
}

// Animation class map
const modeClasses: Record<AvatarMode, string> = {
  cycling:     'animate-[gentleBounce_1.8s_ease-in-out_infinite]',
  locked:      'animate-[gentlePulse_3s_ease-in-out_infinite]',
  listening:   'animate-[listening_0.6s_ease-in-out_infinite]',
  thinking:    'animate-[thinking_2.4s_ease-in-out_infinite] opacity-80',
  celebrating: 'animate-[celebrating_0.4s_ease-in-out_3]',
};

// Derive a slightly darker shade for shading details
function darken(hex: string, amount = 30): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount = 40): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export default function GummyAvatar({ mode, color, size = 160, onClick }: GummyAvatarProps) {
  const dark = darken(color);
  const light = lighten(color);

  return (
    <div
      className={`select-none ${modeClasses[mode]} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'Tap to choose this color' : 'Gummy avatar'}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Drop shadow */}
        <ellipse cx="50" cy="115" rx="22" ry="5" fill="rgba(0,0,0,0.12)" />

        {/* Left ear */}
        <circle cx="24" cy="28" r="11" fill={color} />
        <circle cx="24" cy="28" r="6" fill={dark} />

        {/* Right ear */}
        <circle cx="76" cy="28" r="11" fill={color} />
        <circle cx="76" cy="28" r="6" fill={dark} />

        {/* Body */}
        <path
          d="M18 60 C18 38 82 38 82 60 L80 100 C80 110 20 110 20 100 Z"
          fill={color}
        />

        {/* Head */}
        <circle cx="50" cy="46" r="28" fill={color} />

        {/* Belly shine */}
        <ellipse cx="50" cy="78" rx="18" ry="22" fill={dark} opacity="0.35" />

        {/* Highlight on head */}
        <ellipse cx="40" cy="34" rx="8" ry="5" fill={light} opacity="0.5" transform="rotate(-20 40 34)" />

        {/* Eyes */}
        <circle cx="41" cy="44" r="4.5" fill="white" />
        <circle cx="59" cy="44" r="4.5" fill="white" />
        <circle cx="42" cy="45" r="2.5" fill="#1a1a2e" />
        <circle cx="60" cy="45" r="2.5" fill="#1a1a2e" />
        {/* Eye shine */}
        <circle cx="43" cy="44" r="1" fill="white" />
        <circle cx="61" cy="44" r="1" fill="white" />

        {/* Smile */}
        <path
          d="M42 54 Q50 62 58 54"
          stroke="#1a1a2e"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeks */}
        <circle cx="36" cy="52" r="5" fill={dark} opacity="0.3" />
        <circle cx="64" cy="52" r="5" fill={dark} opacity="0.3" />

        {/* Left arm */}
        <path
          d="M20 68 Q8 72 10 84 Q12 90 22 86"
          fill={color}
          stroke={dark}
          strokeWidth="1"
        />

        {/* Right arm */}
        <path
          d="M80 68 Q92 72 90 84 Q88 90 78 86"
          fill={color}
          stroke={dark}
          strokeWidth="1"
        />

        {/* Left leg */}
        <path
          d="M30 104 Q26 114 34 116 Q42 118 40 108"
          fill={color}
          stroke={dark}
          strokeWidth="1"
        />

        {/* Right leg */}
        <path
          d="M70 104 Q74 114 66 116 Q58 118 60 108"
          fill={color}
          stroke={dark}
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
