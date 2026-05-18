import { useEffect, useState } from 'react';
import { subscribeToMicLevel, type MicLevelState } from '../lib/speech/stt';

export default function useMicLevel(): MicLevelState {
  const [micLevel, setMicLevel] = useState<MicLevelState>({
    level: 0,
    speaking: false,
  });

  useEffect(() => subscribeToMicLevel(setMicLevel), []);

  return micLevel;
}
