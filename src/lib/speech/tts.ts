// Text-to-speech using Web Speech API (primary).
// Real from Phase 0 — no stub needed here.

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  onBoundary?: (word: string, charIndex: number) => void;
  onEnd?: () => void;
}

function getCurrentWord(text: string, charIndex: number): string {
  const before = text.slice(0, charIndex);
  const after = text.slice(charIndex);
  const wordEnd = after.search(/\s|$/) + charIndex;
  const wordStart = before.lastIndexOf(' ') + 1;
  return text.slice(wordStart, wordEnd).replace(/[^a-zA-Z0-9']/g, '');
}

export function speak(text: string, options: TTSOptions = {}): void {
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 0.85;
  utterance.pitch = options.pitch ?? 1.1;

  if (options.onBoundary) {
    utterance.addEventListener('boundary', (e: SpeechSynthesisEvent) => {
      if (e.name === 'word') {
        const word = getCurrentWord(text, e.charIndex);
        options.onBoundary!(word, e.charIndex);
      }
    });
  }

  if (options.onEnd) {
    utterance.addEventListener('end', options.onEnd);
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}
