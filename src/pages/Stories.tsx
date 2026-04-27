import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { stories } from '../data/stories';
import { DEMO_HERO } from '../lib/demoMvp';

export default function Stories() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="text-sm text-gray-500 hover:underline mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stories</h1>
        <p className="text-gray-600 text-sm mb-4">
          These story paths are part of the broader product direction, but only one flagship flow
          is active in the current demo.
        </p>
        <Link
          to={DEMO_HERO.path}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gummy-color,#FF6B9D)] px-4 py-3 text-sm font-bold text-white shadow-sm"
        >
          Return To Demo Flow
        </Link>
        <ul className="space-y-3">
          {stories.map(s => (
            <li key={s.id}>
              <div className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-75">
                <span className="text-2xl mr-2">{s.emoji}</span>
                <span className="font-semibold text-gray-800">{s.title}</span>
                <span className="text-xs text-gray-400 ml-2 capitalize">({s.difficulty})</span>
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
