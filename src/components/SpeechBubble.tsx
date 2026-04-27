import { Volume2, VolumeX } from 'lucide-react';

interface SpeechBubbleProps {
  text: string;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
}

export function SpeechBubble({ text, isSpeaking, onToggleSpeak }: SpeechBubbleProps) {
  return (
    <div className="relative bg-card rounded-2xl p-4 shadow-lg border-2 border-primary/20 max-w-md">
      <div className="absolute -left-3 top-6 w-0 h-0 border-t-[10px] border-t-transparent border-r-[12px] border-r-card border-b-[10px] border-b-transparent" />
      <p className="text-foreground font-body text-base leading-relaxed">{text}</p>
      {onToggleSpeak && (
        <button
          onClick={onToggleSpeak}
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
        >
          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {isSpeaking ? 'Stop' : 'Read aloud'}
        </button>
      )}
    </div>
  );
}
