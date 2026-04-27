import GummyAvatar from '@/components/avatar/GummyAvatar';
import { useProfile } from '@/context/ProfileContext';

interface GummyMascotProps {
  size?: 'sm' | 'md' | 'lg';
  speaking?: boolean;
  className?: string;
  /** Hex color; defaults to profile or CSS --gummy-color. */
  color?: string;
}

const sizePixels = { sm: 64, md: 112, lg: 176 } as const;

export function GummyMascot({ size = 'md', speaking = false, className = '', color: colorProp }: GummyMascotProps) {
  const { profile } = useProfile();
  const fromDom =
    typeof document !== 'undefined'
      ? document.documentElement.style.getPropertyValue('--gummy-color').trim()
      : '';
  const color = colorProp ?? profile?.chosenColor ?? (fromDom || '#FF6B9D');
  const mode = speaking ? 'listening' : 'locked';

  return (
    <div className={`inline-flex drop-shadow-lg ${className}`}>
      <GummyAvatar mode={mode} color={color} size={sizePixels[size]} />
    </div>
  );
}
