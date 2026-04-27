import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { lessons } from '../data/lessons';
import { DEMO_HERO } from '../lib/demoMvp';

export default function Lessons() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="text-sm text-gray-500 hover:underline mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lessons</h1>
        <p className="text-gray-600 text-sm mb-4">
          The full lesson library is visible here, but the demo is narrowed to one polished path.
        </p>
        <Link
          to={DEMO_HERO.path}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gummy-color,#FF6B9D)] px-4 py-3 text-sm font-bold text-white shadow-sm"
        >
          Start Demo Lesson
        </Link>
        <ul className="space-y-3">
          {lessons.map(l => (
            <li key={l.id}>
              <div className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-75">
                <span className="text-2xl mr-2">{l.emoji}</span>
                <span className="font-semibold text-gray-800">{l.title}</span>
                <p className="text-xs text-gray-500 mt-1">{l.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                  <Lock className="h-3 w-3" />
                  Preview only in demo mode
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
