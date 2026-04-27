import type { ReadingTier, SessionMetrics, ModuleContent } from '../../types';
import type { ContentItem } from '../content/types';
import { moduleToContentItem } from '../content/adapters';
import { buildSystemPrompt } from './systemPrompt';
import {
  FALLBACK_CALIBRATION_QUESTIONS,
  FALLBACK_HINTS,
  FALLBACK_GUMMY_NOTE,
  FALLBACK_MODULE_RESPONSE,
} from './fallbacks';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function callProxy(payload: {
  callType: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  systemPrompt: string;
  sessionId: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.text as string;
}

// ─── Sanitize child input before sending to LLM ───────────────────────────────

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function cleanModelText(text: string): string {
  return stripCodeFences(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_~`>#]+/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// ─── Public call types ────────────────────────────────────────────────────────

/**
 * Returns 3 warm-up calibration questions appropriate for ages 6–8.
 * Topic-neutral — not AI literacy content.
 */
export async function generateCalibrationQuestions(sessionId: string): Promise<string[]> {
  try {
    const text = await callProxy({
      callType: 'generateCalibrationQuestions',
      sessionId,
      systemPrompt:
        'You are a friendly assistant. Generate exactly 3 simple, open-ended warm-up questions for a child aged 6–8. Each question should be fun, age-appropriate, and topic-neutral (not about AI). Return them as a JSON array of strings.',
      messages: [
        { role: 'user', content: 'Give me the 3 warm-up questions as a JSON array.' },
      ],
    });

    const parsed = JSON.parse(stripCodeFences(text));
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
    return FALLBACK_CALIBRATION_QUESTIONS.slice(0, 3);
  } catch {
    return FALLBACK_CALIBRATION_QUESTIONS.slice(0, 3);
  }
}

/**
 * Returns a single Socratic hint for a comprehension question.
 * Does not give away the full answer.
 */
export async function generateHint(
  question: string,
  childResponse: string,
  tier: ReadingTier,
  iepMode: boolean,
  patienceWindowMs: number,
  sessionId: string,
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(tier, iepMode, patienceWindowMs / 1000);
    const text = await callProxy({
      callType: 'generateHint',
      sessionId,
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `The question was: "${sanitize(question)}"\nThe child responded: "${sanitize(childResponse)}"\n\nGive ONE short Socratic hint that nudges the child toward the answer without giving it away. Use the tier-appropriate language.`,
        },
      ],
    });
    return cleanModelText(text);
  } catch {
    return FALLBACK_HINTS.default;
  }
}

/**
 * Returns 1–2 sentences summarizing the session for parents.
 * Child name is NOT sent — privacy.
 */
export async function generateGummyNote(
  metrics: SessionMetrics,
  sessionId: string,
): Promise<string> {
  try {
    const summary = {
      module: metrics.moduleId,
      sessionTitle: metrics.sessionDisplayTitle,
      tier: metrics.detectedTier,
      questionsTotal: metrics.questions.length,
      answeredIndependently: metrics.questions.filter(q => !q.hinted).length,
      followUpsAnswered: metrics.followUpAnsweredCount,
      bigQuestionResponse: metrics.bigQuestionResponse,
    };

    const text = await callProxy({
      callType: 'generateGummyNote',
      sessionId,
      systemPrompt:
        'You are Gummy, a friendly AI tutor. Write 1–2 warm, encouraging sentences for a parent summarizing how their child did in this session. Use developmental framing — no fail language. No child name.',
      messages: [
        {
          role: 'user',
          content: `Session summary: ${JSON.stringify(summary)}\n\nWrite the parent note now.`,
        },
      ],
    });
    return cleanModelText(text);
  } catch {
    return FALLBACK_GUMMY_NOTE;
  }
}

/**
 * Main conversational LLM response during a session.
 */
export async function generateModuleResponse(
  userInput: string,
  context: string,
  tier: ReadingTier,
  iepMode: boolean,
  patienceWindowMs: number,
  sessionId: string,
): Promise<{ responseText: string; followUpPrompt?: string }> {
  try {
    const systemPrompt = buildSystemPrompt(tier, iepMode, patienceWindowMs / 1000);
    const text = await callProxy({
      callType: 'generateModuleResponse',
      sessionId,
      systemPrompt,
      messages: [
        { role: 'user', content: `Context: ${context}\n\nChild said: "${sanitize(userInput)}"` },
      ],
    });
    const cleaned = cleanModelText(text);

    // If text ends with a "why do you think that?" style question, split it out
    const whyPattern = /([.!?])\s*(Why do you think that\??|What makes you say that\??)$/i;
    const match = cleaned.match(whyPattern);
    if (match) {
      const splitIndex = cleaned.lastIndexOf(match[2]);
      return {
        responseText: cleaned.slice(0, splitIndex).trim(),
        followUpPrompt: match[2],
      };
    }

    return { responseText: cleaned };
  } catch {
    return { responseText: FALLBACK_MODULE_RESPONSE };
  }
}

/**
 * Evaluate a child's answer for any normalized session content (module, story, lesson, topic).
 * Uses dedicated proxy call type for observability; same guardrails as module sessions.
 */
export async function evaluateContentAnswer(
  question: string,
  childResponse: string,
  content: ContentItem,
  tier: ReadingTier,
  iepMode: boolean,
  patienceWindowMs: number,
  sessionId: string,
): Promise<{ correct: boolean; responseText: string }> {
  const fallback = {
    correct: false,
    responseText: "Hmm, great try! Here's a little clue — think about what Gummy said in the story!",
  };

  try {
    const passageSnippet = content.passages[tier].slice(0, 300);
    const systemPrompt =
      buildSystemPrompt(tier, iepMode, patienceWindowMs / 1000) +
      '\n\nIMPORTANT: You must begin your response with exactly "CORRECT:" if the child demonstrated understanding, or "HINT:" if they need more guidance. Then give your warm, age-appropriate response.';

    const text = await callProxy({
      callType: 'evaluateContentAnswer',
      sessionId,
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Session focus: "${sanitize(content.title)}"\nStory or reading passage (for context): "${sanitize(passageSnippet)}"\n\nQuestion asked: "${sanitize(question)}"\n\nChild answered: "${sanitize(childResponse || '(silence — child did not respond)')}"`,
        },
      ],
    });

    const correct = text.startsWith('CORRECT:');
    const responseText = cleanModelText(text.replace(/^(CORRECT:|HINT:)\s*/i, '').trim());
    return { correct, responseText };
  } catch {
    return fallback;
  }
}

/**
 * Evaluate a child's answer to a comprehension question (legacy module content).
 * Returns { correct, responseText } where responseText is Gummy's spoken reply.
 * The LLM is instructed to start with CORRECT: or HINT: so we can parse verdict.
 */
export async function evaluateAnswer(
  question: string,
  childResponse: string,
  module: ModuleContent,
  tier: ReadingTier,
  iepMode: boolean,
  patienceWindowMs: number,
  sessionId: string,
): Promise<{ correct: boolean; responseText: string }> {
  return evaluateContentAnswer(
    question,
    childResponse,
    moduleToContentItem(module),
    tier,
    iepMode,
    patienceWindowMs,
    sessionId,
  );
}

/**
 * Optional: generate one more comprehension question from a passage (not wired into the default loop).
 */
export async function generateContentQuestion(
  passageSnippet: string,
  contentTitle: string,
  tier: ReadingTier,
  iepMode: boolean,
  patienceWindowMs: number,
  sessionId: string,
): Promise<string> {
  try {
    const systemPrompt =
      buildSystemPrompt(tier, iepMode, patienceWindowMs / 1000) +
      '\n\nWrite ONE short comprehension question about the passage. Do not include the answer. Keep it open-ended for ages 6–8.';

    const text = await callProxy({
      callType: 'generateContentQuestion',
      sessionId,
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Title: "${sanitize(contentTitle)}"\nPassage excerpt: "${sanitize(passageSnippet.slice(0, 500))}"`,
        },
      ],
    });
    return cleanModelText(text);
  } catch {
    return 'What is one thing you remember from what we read?';
  }
}
