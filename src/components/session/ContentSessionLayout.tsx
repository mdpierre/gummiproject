import { Navigate } from 'react-router-dom';
import {
  SessionProvider,
  buildStoryPhaseSnapshotFromProfile,
} from '../../context/SessionContext';
import { useProfile } from '../../context/ProfileContext';
import type { ContentItem } from '../../lib/content/types';
import SessionScreen from './SessionScreen';

/**
 * Wraps a route-driven voice session: seeds SessionContext from the saved child profile,
 * runs SessionScreen with normalized content, then navigates to /report when complete.
 */
export default function ContentSessionLayout({ content }: { content: ContentItem }) {
  const { profile } = useProfile();

  if (!profile?.calibrated) {
    return <Navigate to="/onboarding" replace />;
  }

  const initialState = buildStoryPhaseSnapshotFromProfile(
    profile,
    content.moduleId ?? 'what-is-ai',
  );

  return (
    <SessionProvider initialState={initialState}>
      <SessionScreen content={content} navigateWhenDone="/report" />
    </SessionProvider>
  );
}
