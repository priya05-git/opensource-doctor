import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const { GEMMA_API_KEY, GEMMA_MODEL = 'gemma-3-27b-it', GITHUB_TOKEN, PORT = 8787 } = process.env;
const app = express();
app.use(cors());
app.use(express.json());

// ---- tiny TTL cache (protects GitHub + Gemma quotas during demos)
const cache = new Map();
const TTL = 10 * 60 * 1000;
const memo = async (key, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  const v = await fn();
  cache.set(key, { v, t: Date.now() });
  return v;
};

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function parseRepo(url = '') {
  const m = url.trim().replace(/\.git$/, '').match(/(?:github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/);
  if (!m) throw new HttpError(400, 'Enter a valid GitHub URL like https://github.com/owner/repo');
  return `${m[1]}/${m[2]}`;
}

async function gh(path, raw = false) {
  const headers = { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json' };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${path}`, { headers });
  if (r.status === 403 || r.status === 429) throw new HttpError(429, 'GitHub rate limit hit. Set GITHUB_TOKEN in backend/.env.');
  if (r.status === 404) throw new HttpError(404, 'Repository not found (is it public?).');
  if (!r.ok) throw new HttpError(502, `GitHub error ${r.status}`);
  return raw ? r.text() : r.json();
}

// Retry with backoff, then fall back to smaller models when Gemma is overloaded (503/429/500).
const MODELS = [GEMMA_MODEL, ...(process.env.GEMMA_FALLBACKS || 'gemma-3-12b-it,gemma-3-4b-it')
  .split(',').map(m => m.trim()).filter(m => m && m !== GEMMA_MODEL)];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gemma(prompt) {
  if (!GEMMA_API_KEY) throw new HttpError(500, 'GEMMA_API_KEY is missing in backend/.env');
  let lastMsg = '';
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMMA_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }) });
      if (r.ok) {
        const d = await r.json();
        console.log(`Gemma OK via ${model} (attempt ${attempt + 1})`);
        return d.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
      }
      const e = await r.json().catch(() => ({}));
      lastMsg = `${model}: ${r.status} ${e.error?.message || ''}`;
      console.warn('Gemma retry ->', lastMsg);
      if (![429, 500, 503].includes(r.status)) throw new HttpError(502, `Gemma error ${r.status}: ${e.error?.message || ''}`);
      await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    }
  }
  throw new HttpError(503, 'Gemma is busy right now (high demand on Google’s side). Please click Analyze again in a minute.');
}

// Gemma has no JSON mode: strip fences and extract the outermost object.
function toJSON(text) {
  const s = text.replace(/```json|```/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  try { return JSON.parse(s.slice(a, b + 1)); }
  catch { throw new HttpError(502, 'Gemma returned malformed JSON. Please try again.'); }
}

async function buildContext(repo) {
  return memo(`ctx:${repo}`, async () => {
    const [meta, readme, tree, issues] = await Promise.all([
      gh(repo),
      gh(`${repo}/readme`, true).catch(() => ''),
      gh(`${repo}/git/trees/HEAD?recursive=1`).catch(() => ({ tree: [] })),
      gh(`${repo}/issues?state=open&per_page=15`).catch(() => []),
    ]);
    const files = (tree.tree || [])
      .filter(f => f.type === 'blob' && !/node_modules|\.(png|jpe?g|svg|lock|ico|gif)$/.test(f.path))
      .slice(0, 150).map(f => f.path).join('\n');
    const iss = issues.filter(i => !i.pull_request)
      .map(i => `#${i.number} ${i.title} [${i.labels.map(l => l.name).join(',')}]`).join('\n');
    return `REPO: ${meta.full_name}
DESC: ${meta.description}
LANG: ${meta.language}
STARS: ${meta.stargazers_count}
OPEN ISSUES: ${meta.open_issues_count}
LAST PUSH: ${meta.pushed_at}
LICENSE: ${meta.license?.spdx_id}

README:
${readme.slice(0, 3500)}

FILES:
${files}

ISSUES:
${iss || 'none'}`;
  });
}

const schema = n => `Return ONLY valid JSON, no markdown fences:
{"summary":"2-3 sentences: what the project is and who it is for","health_score":0-100,"health_reason":"one sentence",
"contribution_tasks":[{"title":"","difficulty":"beginner|intermediate|advanced","stars":1-5,"minutes":20,"files":["paths from FILES"],"reason":"why this matters","learn":[""],"steps":[""]}]}
Produce ${n} tasks. Only use file paths that appear in FILES.`;

app.post('/api/analyze', async (req, res, next) => {
  try {
    const repo = parseRepo(req.body.repoUrl);
    const first = !!req.body.firstContribution;
    const result = await memo(`an:${repo}:${first}`, async () => {
      const ctx = await buildContext(repo);
      const ask = first
        ? 'Only beginner-level tasks suitable for a first-time contributor.'
        : 'Mix of 1-2 beginner, 1-2 intermediate and 1 advanced tasks.';
      return toJSON(await gemma(
        `You are OpenSource Doctor, an AI maintainer. Analyze this GitHub repository and turn it into contribution tasks.\n${ask}\n${schema(first ? 3 : 5)}\n\n${ctx}`));
    });
    res.json({ repo, ...result });
  } catch (e) { next(e); }
});

app.post('/api/explain', async (req, res, next) => {
  try {
    const repo = parseRepo(req.body.repo);
    const ctx = await buildContext(repo);
    const out = toJSON(await gemma(
      `You are a friendly mentor. Explain this task to a first-time open-source contributor.
Return ONLY JSON: {"why_suitable":"","learn":[""],"approach":[""],"common_mistakes":[""]}
TASK: ${JSON.stringify(req.body.task)}

REPO CONTEXT:
${ctx.slice(0, 3000)}`));
    res.json(out);
  } catch (e) { next(e); }
});

app.get('/api/health', (_, res) => res.json({ ok: true, model: GEMMA_MODEL }));

app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: err.message }));
app.listen(PORT, () => console.log(`OpenSource Doctor API on :${PORT} (model: ${GEMMA_MODEL})`));
