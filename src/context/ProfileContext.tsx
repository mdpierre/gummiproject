import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ReadingTier } from '../types';

const STORAGE_KEY = 'gummy-profile';

export interface ChildProfile {
  childName: string;
  chosenColor: string;
  iepMode: boolean;
  patienceWindowMs: number;
  detectedTier: ReadingTier;
  calibrated: boolean;
  completedContent: string[];
}

interface ProfileContextValue {
  profile: ChildProfile | null;
  saveProfile: (p: ChildProfile) => void;
  markContentComplete: (contentId: string) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function loadProfile(): ChildProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ChildProfile | null>(() => loadProfile());

  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      document.documentElement.style.setProperty('--gummy-color', profile.chosenColor);
    } else {
      document.documentElement.style.removeProperty('--gummy-color');
    }
  }, [profile]);

  const saveProfile = useCallback((p: ChildProfile) => {
    setProfile(p);
  }, []);

  const markContentComplete = useCallback((contentId: string) => {
    setProfile(prev => {
      if (!prev) return prev;
      if (prev.completedContent.includes(contentId)) return prev;
      return { ...prev, completedContent: [...prev.completedContent, contentId] };
    });
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.style.removeProperty('--gummy-color');
    setProfile(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, saveProfile, markContentComplete, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
