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
app.use(express.json({ limit: '12mb' }));

// ─── Rate limiting (simple per-session counter via in-memory map) ─────────────

const sessionRequestCounts = new Map();
const sessionTranscriptionCounts = new Map();
const MAX_REQUESTS_PER_SESSION = 30;
const MAX_TRANSCRIPTIONS_PER_SESSION = 60;
const MAX_TRANSCRIBE_BYTES = 8 * 1024 * 1024;

function checkRateLimit(counterMap, sessionId, maxRequests) {
  if (!sessionId) return false;
  const count = counterMap.get(sessionId) ?? 0;
  if (count >= maxRequests) return false;
  counterMap.set(sessionId, count + 1);
  return true;
}

// Clean up old session counters every hour
setInterval(() => {
  sessionRequestCounts.clear();
  sessionTranscriptionCounts.clear();
}, 60 * 60 * 1000);

// ─── STT Route ───────────────────────────────────────────────────────────────

app.post('/api/transcribe', async (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { audioBase64, mimeType, sessionId } = req.body;
  const allowedKeys = new Set(['audioBase64', 'mimeType', 'sessionId']);
  const unknownKeys = Object.keys(req.body).filter(k => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return res.status(400).json({ error: `Unknown fields: ${unknownKeys.join(', ')}` });
  }

  if (!checkRateLimit(sessionTranscriptionCounts, sessionId, MAX_TRANSCRIPTIONS_PER_SESSION)) {
    return res.status(429).json({ error: 'Session rate limit reached' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
  }

  if (typeof audioBase64 !== 'string' || audioBase64.length === 0) {
    return res.status(400).json({ error: 'audioBase64 is required' });
  }

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  if (audioBuffer.length === 0) {
    return res.status(400).json({ error: 'Audio payload is empty' });
  }

  if (audioBuffer.length > MAX_TRANSCRIBE_BYTES) {
    return res.status(413).json({ error: 'Audio payload is too large' });
  }

  const safeMimeType = typeof mimeType === 'string' && mimeType
    ? mimeType.split(';')[0]
    : 'audio/webm';
  const fileName = `speech.${extensionForMimeType(safeMimeType)}`;
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';

  try {
    const formData = new FormData();
    formData.append('model', model);
    formData.append('language', 'en');
    formData.append(
      'file',
      new Blob([audioBuffer], { type: safeMimeType }),
      fileName,
    );

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('STT proxy error:', {
        status: response.status,
        error: body?.error?.message ?? body?.error ?? 'Unknown transcription error',
      });
      return res.status(502).json({ error: 'Transcription request failed' });
    }

    return res.json({ text: typeof body.text === 'string' ? body.text : '' });
  } catch (err) {
    console.error('STT proxy exception:', err);
    return res.status(502).json({ error: 'Transcription request failed' });
  }
});

function extensionForMimeType(mimeType) {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

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

  if (!checkRateLimit(sessionRequestCounts, sessionId, MAX_REQUESTS_PER_SESSION)) {
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
