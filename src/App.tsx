import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import Home from './pages/Home';
import OnboardingFlow from './pages/OnboardingFlow';
import ModuleSession from './pages/ModuleSession';
import Lessons from './pages/Lessons';
import LessonSession from './pages/LessonSession';
import Stories from './pages/Stories';
import StorySession from './pages/StorySession';
import TopicSession from './pages/TopicSession';
import ReportPage from './pages/ReportPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/modules/:id" element={<ModuleSession />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:id" element={<LessonSession />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:id" element={<StorySession />} />
          <Route path="/topics/:id" element={<TopicSession />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}
