import { useParams, Navigate } from 'react-router-dom';
import ContentSessionLayout from '../components/session/ContentSessionLayout';
import { getContentByTopicId } from '../lib/content';
import { isDemoContentEnabled } from '../lib/demoMvp';

export default function TopicSession() {
  const { id } = useParams<{ id: string }>();
  if (!id || !isDemoContentEnabled('topic', id)) {
    return <Navigate to="/" replace />;
  }
  const content = id ? getContentByTopicId(id) : null;
  if (!content) return <Navigate to="/" replace />;
  return <ContentSessionLayout content={content} />;
}
