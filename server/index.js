import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT ?? 3001;
const HOST = process.env.HOST ?? '0.0.0.0';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// ─── Allowed call types ───────────────────────────────────────────────────────

const ALLOWED_CALL_TYPES = new Set([
  'generateCalibrationQuestions',
  'generateHint',
  'generateGummyNote',
  'generateModuleResponse',
  'evaluateContentAnswer',
  'generateContentQuestion',
]);

// ─── Middleware ───────────────────────────────────────────────────────────────

const LOCAL_ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

const DEPLOYED_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const RENDER_ALLOWED_ORIGINS = [
  process.env.RENDER_EXTERNAL_URL,
  process.env.PUBLIC_ORIGIN,
]
  .map(origin => origin?.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...DEPLOYED_ALLOWED_ORIGINS, ...RENDER_ALLOWED_ORIGINS])];

function isAllowedOrigin(origin) {
  return (
    LOCAL_ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin)) ||
    ALLOWED_ORIGINS.includes(origin)
  );
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests, local dev ports, and configured deployed frontends.
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  }),
);
app.use(express.json());

// ─── Rate limiting (simple per-session counter via in-memory map) ─────────────

const sessionRequestCounts = new Map();
const MAX_REQUESTS_PER_SESSION = 30;

function checkRateLimit(sessionId) {
  if (!sessionId) return false;
  const count = sessionRequestCounts.get(sessionId) ?? 0;
  if (count >= MAX_REQUESTS_PER_SESSION) return false;
  sessionRequestCounts.set(sessionId, count + 1);
  return true;
}

// Clean up old session counters every hour
setInterval(() => sessionRequestCounts.clear(), 60 * 60 * 1000);

// ─── LLM Route ───────────────────────────────────────────────────────────────

app.post('/api/llm', async (req, res) => {
  // Validate Content-Type
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { callType, messages, systemPrompt, sessionId } = req.body;

  // Validate known fields only
  const allowedKeys = new Set(['callType', 'messages', 'systemPrompt', 'sessionId']);
  const unknownKeys = Object.keys(req.body).filter(k => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return res.status(400).json({ error: `Unknown fields: ${unknownKeys.join(', ')}` });
  }

  if (!ALLOWED_CALL_TYPES.has(callType)) {
    return res.status(400).json({ error: `Unknown callType: ${callType}` });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  if (!checkRateLimit(sessionId)) {
    return res.status(429).json({ error: 'Session rate limit reached' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let attempt = 0;
  while (attempt < 2) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      const text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      return res.json({ text });
    } catch (err) {
      if (err?.status === 429 && attempt === 0) {
        // Retry once after 2s on rate limit
        await new Promise(r => setTimeout(r, 2000));
        attempt++;
        continue;
      }
      console.error('LLM proxy error:', err);
      return res.status(502).json({ error: 'LLM request failed' });
    }
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ─── Frontend hosting (production) ────────────────────────────────────────────

app.use(express.static(DIST_DIR));

app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, HOST, () => {
  console.log(`Gummy app listening on http://${HOST}:${PORT}`);
});
