// Client-side PDF session report using @react-pdf/renderer.
// Nothing is transmitted — the PDF is generated and downloaded in-browser.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { SessionMetrics } from '../../types';
import { getVoicePrivacyCopy } from '../../lib/speech/stt';

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(accentColor: string) {
  return StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      padding: 40,
      fontSize: 11,
      color: '#1a1a2e',
      backgroundColor: '#ffffff',
    },
    // Header
    header: { marginBottom: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    emoji: { fontSize: 28, marginRight: 10 },
    appName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: accentColor },
    tagline: { fontSize: 10, color: '#6b7280', marginTop: 2 },
    divider: { height: 2, backgroundColor: accentColor, marginBottom: 20, opacity: 0.3 },

    // Section
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    row: { flexDirection: 'row', marginBottom: 5 },
    label: { width: 160, color: '#6b7280', fontSize: 10 },
    value: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 10 },

    // Tier badge
    tierBadge: {
      alignSelf: 'flex-start',
      backgroundColor: accentColor,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      marginBottom: 6,
    },
    tierBadgeText: { color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold' },
    tierMovement: { fontSize: 10, color: '#374151', marginTop: 2 },

    // Comprehension bars
    barTrack: { height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, marginBottom: 4 },
    barFill: { height: 10, borderRadius: 5, backgroundColor: accentColor },

    // Quote block
    quoteBlock: {
      backgroundColor: `${accentColor}18`,
      borderLeft: `3px solid ${accentColor}`,
      padding: 10,
      borderRadius: 4,
      marginTop: 6,
    },
    quoteText: { fontSize: 10, color: '#374151', fontStyle: 'italic', lineHeight: 1.5 },

    // Gummy note
    noteBlock: {
      backgroundColor: '#f9fafb',
      padding: 12,
      borderRadius: 6,
      marginTop: 6,
    },
    noteText: { fontSize: 11, color: '#1f2937', lineHeight: 1.6 },

    // Privacy footer
    footer: { marginTop: 28, borderTop: '1px solid #e5e7eb', paddingTop: 10 },
    footerText: { fontSize: 8, color: '#9ca3af', lineHeight: 1.5, textAlign: 'center' },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

const TIER_LABELS: Record<string, string> = {
  early: 'Early Reader',
  developmental: 'Developmental Reader',
  fluent: 'Fluent Reader',
};

const MODULE_TITLES: Record<string, string> = {
  'what-is-ai': 'What Is AI?',
  'what-is-a-chatbot': 'What Is a Chatbot?',
  'how-ai-gets-information': 'How Does AI Get Its Information?',
};

// ─── PDF Document component ───────────────────────────────────────────────────

interface ReportDocProps {
  metrics: SessionMetrics;
  gummyNote: string;
  accentColor: string;
}

function ReportDoc({ metrics, gummyNote, accentColor }: ReportDocProps) {
  const S = makeStyles(accentColor);

  const independent = metrics.questions.filter(q => !q.hinted).length;
  const hinted = metrics.questions.filter(q => q.hinted).length;
  const total = metrics.questions.length;
  const indPct = total > 0 ? independent / total : 0;

  const tierLabel = TIER_LABELS[metrics.detectedTier] ?? metrics.detectedTier;
  const moduleTitle =
    metrics.sessionDisplayTitle ||
    MODULE_TITLES[metrics.moduleId as keyof typeof MODULE_TITLES] ||
    metrics.moduleId;

  const movementText: Record<string, string> = {
    improved: '↑ Showing growth — answered most questions independently',
    stable: '→ Solid performance — some hints needed, steady progress',
    'needs-support': '↓ Needed extra support today — keep practicing!',
  };

  return (
    <Document title={`Gummy Session Report — ${metrics.childName}`}>
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View style={S.headerRow}>
            <Text style={S.emoji}>🍬</Text>
            <View>
              <Text style={S.appName}>Gummy</Text>
              <Text style={S.tagline}>AI Reading Comprehension &amp; AI Literacy for Kids</Text>
            </View>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.label}>Child</Text>
            <Text style={S.value}>{metrics.childName}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Date</Text>
            <Text style={S.value}>{fmtDate(metrics.sessionDate)}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Duration</Text>
            <Text style={S.value}>{fmtDuration(metrics.durationMs)}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Module</Text>
            <Text style={S.value}>{moduleTitle}</Text>
          </View>
        </View>

        {/* ── Reading Tier ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Reading Tier</Text>
          <View style={S.tierBadge}>
            <Text style={S.tierBadgeText}>{tierLabel}</Text>
          </View>
          <Text style={S.tierMovement}>
            {movementText[metrics.tierMovement] ?? ''}
          </Text>
        </View>

        {/* ── Comprehension ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Comprehension</Text>
          <View style={S.row}>
            <Text style={S.label}>Questions answered independently</Text>
            <Text style={S.value}>{independent} of {total}</Text>
          </View>
          <View style={S.barTrack}>
            <View style={[S.barFill, { width: `${Math.round(indPct * 100)}%` }]} />
          </View>
          {hinted > 0 && (
            <View style={S.row}>
              <Text style={S.label}>Answered with a hint</Text>
              <Text style={S.value}>{hinted}</Text>
            </View>
          )}
          <View style={S.row}>
            <Text style={S.label}>Timed read</Text>
            <Text style={S.value}>
              {metrics.timerResult === 'before'
                ? 'Finished before timer — great reading speed!'
                : metrics.timerResult === 'after'
                ? 'Still developing reading pace — keep practicing!'
                : 'Not recorded'}
            </Text>
          </View>
        </View>

        {/* ── Speech ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Speaking & Fluency</Text>
          <View style={S.row}>
            <Text style={S.label}>Avg. speaking pace</Text>
            <Text style={S.value}>
              {metrics.avgPaceWpm > 0 ? `~${metrics.avgPaceWpm} words/min` : 'Not measured'}
            </Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Sentence completion rate</Text>
            <Text style={S.value}>
              {metrics.sentenceCompletionRate > 0
                ? `${Math.round(metrics.sentenceCompletionRate * 100)}%`
                : 'Not measured'}
            </Text>
          </View>
        </View>

        {/* ── Critical Thinking ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Critical Thinking</Text>
          <View style={S.row}>
            <Text style={S.label}>"Why do you think that?" answered</Text>
            <Text style={S.value}>{metrics.followUpAnsweredCount} time{metrics.followUpAnsweredCount !== 1 ? 's' : ''}</Text>
          </View>
          {metrics.bigQuestionResponse && (
            <View>
              <Text style={[S.label, { marginBottom: 4 }]}>
                {metrics.childName}'s big question response:
              </Text>
              <View style={S.quoteBlock}>
                <Text style={S.quoteText}>"{metrics.bigQuestionResponse}"</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Gummy's Note ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Gummy's Note</Text>
          <View style={S.noteBlock}>
            <Text style={S.noteText}>{gummyNote}</Text>
          </View>
        </View>

        {/* ── Privacy Footer ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {getVoicePrivacyCopy()}{' '}
            This report was generated locally and contains no data from external servers.
            {'\n'}Gummy v0.1 — AI Reading Comprehension &amp; Literacy for Kids Ages 6–8
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ─── Download helper ──────────────────────────────────────────────────────────

export async function downloadSessionReport(
  metrics: SessionMetrics,
  gummyNote: string,
  accentColor: string,
): Promise<void> {
  const blob = await pdf(
    <ReportDoc metrics={metrics} gummyNote={gummyNote} accentColor={accentColor} />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gummy-session-${metrics.childName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
