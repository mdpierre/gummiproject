import { useParams, Navigate } from 'react-router-dom';
import ContentSessionLayout from '../components/session/ContentSessionLayout';
import { getContentByModuleId } from '../lib/content';
import { isDemoContentEnabled } from '../lib/demoMvp';

export default function ModuleSession() {
  const { id } = useParams<{ id: string }>();
  if (!id || !isDemoContentEnabled('module', id)) {
    return <Navigate to="/" replace />;
  }
  const content = id ? getContentByModuleId(id) : null;
  if (!content) return <Navigate to="/" replace />;
  return <ContentSessionLayout content={content} />;
}
