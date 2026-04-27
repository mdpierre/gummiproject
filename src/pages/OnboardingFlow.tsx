import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionProvider, useSession } from '../context/SessionContext';
import { useProfile } from '../context/ProfileContext';
import OnboardingScreen from '../components/onboarding/OnboardingScreen';
import ColorSelect from '../components/avatar/ColorSelect';
import WhisperLoader from '../components/WhisperLoader';
import CalibrationScreen from '../components/calibration/CalibrationScreen';

function OnboardingRouter() {
  const { state } = useSession();
  const { profile, saveProfile } = useProfile();
  const navigate = useNavigate();
  const hasSavedProfileRef = useRef(false);

  useEffect(() => {
    if (profile?.calibrated) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (state.phase === 'story' && !hasSavedProfileRef.current) {
      hasSavedProfileRef.current = true;
      saveProfile({
        childName: state.config.childName,
        chosenColor: state.config.chosenColor,
        iepMode: state.config.iepMode,
        patienceWindowMs: state.config.patienceWindowMs,
        detectedTier: state.activeTier,
        calibrated: true,
        completedContent: profile?.completedContent ?? [],
      });
    }
  }, [state.phase, state.config, state.activeTier, profile, saveProfile, navigate]);

  switch (state.phase) {
    case 'onboarding':
      return <OnboardingScreen />;
    case 'color-select':
      return <ColorSelect />;
    case 'whisper-loading':
      return <WhisperLoader />;
    case 'calibration':
      return <CalibrationScreen />;
    case 'story':
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <p className="text-gray-600 text-sm">Finishing setup...</p>
        </div>
      );
    default:
      return <OnboardingScreen />;
  }
}

export default function OnboardingFlow() {
  return (
    <SessionProvider>
      <OnboardingRouter />
    </SessionProvider>
  );
}
