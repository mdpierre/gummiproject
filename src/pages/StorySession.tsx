import { useParams, Navigate } from 'react-router-dom';
import ContentSessionLayout from '../components/session/ContentSessionLayout';
import { getContentByStoryId } from '../lib/content';
import { isDemoContentEnabled } from '../lib/demoMvp';

export default function StorySession() {
  const { id } = useParams<{ id: string }>();
  if (!id || !isDemoContentEnabled('story', id)) {
    return <Navigate to="/" replace />;
  }
  const content = id ? getContentByStoryId(id) : null;
  if (!content) return <Navigate to="/" replace />;
  return <ContentSessionLayout content={content} />;
}
