import { useParams, Navigate } from 'react-router-dom';
import ContentSessionLayout from '../components/session/ContentSessionLayout';
import { getContentByLessonId } from '../lib/content';
import { isDemoContentEnabled } from '../lib/demoMvp';

export default function LessonSession() {
  const { id } = useParams<{ id: string }>();
  if (!id || !isDemoContentEnabled('lesson', id)) {
    return <Navigate to="/" replace />;
  }
  const content = id ? getContentByLessonId(id) : null;
  if (!content) return <Navigate to="/" replace />;
  return <ContentSessionLayout content={content} />;
}
