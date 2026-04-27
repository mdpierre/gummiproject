import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/context/ProfileContext';

/** Redirects to onboarding when there is no calibrated child profile. */
export function useRequireCalibratedProfile() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.calibrated) {
      navigate('/onboarding', { replace: true });
    }
  }, [profile, navigate]);

  return profile?.calibrated ? profile : null;
}
