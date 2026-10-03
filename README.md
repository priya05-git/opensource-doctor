# OpenSource Doctor — AI Maintainer Agent

An open-source AI maintainer that scans a GitHub repo, understands it with **Gemma**, and turns it into beginner-friendly contribution tasks.

> Open source has a contribution problem, not a code problem.

```
GitHub repo → context (README, tree, issues) → Gemma → health score + tasks + explanations
```

## Features
- Repository health score and AI summary
- 5 tasks ranked beginner → advanced, with files, time and difficulty
- **Find my first contribution**: 3 beginner-only tasks
- **Explain this issue to me**: why it fits, what to learn, steps, common mistakes

## Quick start (Node 18+)
```bash
cp .env.example backend/.env      # add GEMMA_API_KEY (Google AI Studio)
cd backend && npm install && npm start
cd ../frontend && npm install && npm run dev
```
Open http://localhost:5173. Keys stay on the server; the browser only talks to `/api`.

## Structure
```
backend/   Express proxy: GitHub fetch, Gemma calls, 10-min cache
frontend/  React + Vite + Tailwind dashboard
```

## API
- `POST /api/analyze` `{ repoUrl, firstContribution }`
- `POST /api/explain` `{ repo, task }`

## Roadmap
Issue-level analysis, PR-ready checklists, GitHub OAuth, self-hosted Gemma via Ollama.

MIT licensed. PRs welcome.
