// Session end screen — generates the PDF and shows a download button.
// Gummy waves goodbye. Parent downloads report. Nothing is transmitted.

import { useState, useEffect, useRef } from 'react';
import GummyAvatar from '../avatar/GummyAvatar';
import { speak } from '../../lib/speech/tts';
import { metricsCollector } from '../../lib/metrics/collector';
import { generateGummyNote } from '../../lib/llm/client';
import { downloadSessionReport } from '../report/SessionReport';
import { getVoicePrivacyCopy } from '../../lib/speech/stt';
import { Link } from 'react-router-dom';
import { useSessionOptional } from '../../context/SessionContext';
import { useProfile } from '../../context/ProfileContext';
import type { SessionMetrics } from '../../types';

type Status = 'generating' | 'ready' | 'downloading' | 'done';

export default function EndScreen() {
  const session = useSessionOptional();
  const { profile, markContentComplete } = useProfile();
  const color = session?.state.config.chosenColor ?? profile?.chosenColor ?? '#FF6B9D';
  const childName = session?.state.config.childName ?? profile?.childName ?? 'friend';
  const initializedRef = useRef(false);

  const [status, setStatus] = useState<Status>('generating');
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [gummyNote, setGummyNote] = useState('');
  const [noSessionData, setNoSessionData] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!metricsCollector.hasActiveSession()) {
      setNoSessionData(true);
      return;
    }

    speak(`Amazing session, ${childName}! You should be so proud. I'm making your report now!`);

    const finalMetrics = metricsCollector.finalizeSession();
    setMetrics(finalMetrics);
    if (finalMetrics.moduleId) {
      markContentComplete(finalMetrics.moduleId);
    }

    const sessionId = `end-${Date.now()}`;
    generateGummyNote(finalMetrics, sessionId).then(note => {
      setGummyNote(note);
      setStatus('ready');
    });
  }, [markContentComplete, childName]);

  async function handleDownload() {
    if (!metrics) return;
    setStatus('downloading');
    try {
      await downloadSessionReport(metrics, gummyNote, color);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setStatus('done');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 text-center"
      style={{ background: `${color}12` }}
    >
      {/* Avatar wave */}
      <GummyAvatar
        mode={status === 'ready' || status === 'done' ? 'celebrating' : 'thinking'}
        color={color}
        size={180}
      />

      {/* Headline */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color }}>
          {noSessionData
            ? 'No recent session found'
            : status === 'done'
            ? 'See you next time!'
            : `Great session, ${childName}!`}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {noSessionData && 'Start a lesson, story, topic, or module, then come back for the report.'}
          {status === 'generating' && 'Building your session report...'}
          {status === 'ready' && "Your report is ready to download!"}
          {status === 'downloading' && 'Generating PDF...'}
          {status === 'done' && 'Your report has been downloaded.'}
        </p>
      </div>

      {/* Gummy's note preview */}
      {gummyNote && (
        <div
          className="bg-white rounded-2xl p-5 shadow max-w-sm text-left"
          style={{ borderLeft: `4px solid ${color}` }}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Gummy's Note</p>
          <p className="text-gray-700 text-sm leading-relaxed italic">"{gummyNote}"</p>
        </div>
      )}

      {/* Quick stats */}
      {metrics && (
        <div className="flex gap-4 flex-wrap justify-center">
          {[
            {
              label: 'Questions',
              value: `${metrics.questions.filter(q => !q.hinted).length}/${metrics.questions.length} solo`,
            },
            {
              label: 'Follow-ups',
              value: `${metrics.followUpAnsweredCount} answered`,
            },
            {
              label: 'Tier',
              value: metrics.detectedTier.charAt(0).toUpperCase() + metrics.detectedTier.slice(1),
            },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl px-5 py-3 shadow text-center min-w-[100px]">
              <p className="text-lg font-bold" style={{ color }}>{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Download button */}
      {!noSessionData && (status === 'ready' || status === 'done') && (
        <button
          onClick={handleDownload}
          disabled={status === 'done'}
          className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-default"
          style={{ backgroundColor: color }}
        >
          {status === 'done'
            ? '✓ Report downloaded'
            : `⬇ Download ${childName}'s Report`}
        </button>
      )}

      {/* Privacy note */}
      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
        🔒 {getVoicePrivacyCopy()}
        This report was generated locally.
      </p>

      <Link
        to="/"
        className="text-sm font-medium underline underline-offset-2"
        style={{ color }}
      >
        Back to home
      </Link>
    </div>
  );
}
