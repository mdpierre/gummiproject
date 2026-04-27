// Renders passage text word-by-word with the currently spoken word highlighted.
// charIndex from TTS onBoundary event drives the active word.

interface KaraokeTextProps {
  text: string;
  activeCharIndex: number; // -1 = none highlighted
  color: string;
  fontSize?: string;
}

function splitIntoWords(text: string): { word: string; start: number }[] {
  const result: { word: string; start: number }[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    result.push({ word: match[0], start: match.index });
  }
  return result;
}

export default function KaraokeText({
  text,
  activeCharIndex,
  color,
  fontSize = '1.5rem',
}: KaraokeTextProps) {
  const words = splitIntoWords(text);

  // Find which word contains activeCharIndex
  let activeWordIdx = -1;
  if (activeCharIndex >= 0) {
    for (let i = 0; i < words.length; i++) {
      const { start, word } = words[i];
      const end = start + word.length;
      if (activeCharIndex >= start && activeCharIndex < end) {
        activeWordIdx = i;
        break;
      }
    }
  }

  return (
    <div
      className="leading-relaxed text-gray-800 font-medium text-center max-w-lg whitespace-pre-wrap"
      style={{ fontSize }}
    >
      {words.map(({ word, start }, i) => {
        const isActive = i === activeWordIdx;
        const isPast = activeWordIdx >= 0 && i < activeWordIdx;
        return (
          <span key={`${start}-${word}`}>
            <span
              className="transition-colors duration-100 rounded px-0.5"
              style={{
                backgroundColor: isActive ? color : 'transparent',
                color: isActive ? 'white' : isPast ? '#9ca3af' : 'inherit',
                fontWeight: isActive ? 700 : 'inherit',
              }}
            >
              {word}
            </span>
            {' '}
          </span>
        );
      })}
    </div>
  );
}
