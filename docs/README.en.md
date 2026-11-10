# FinPilot V3

FinPilot helps students and financial beginners understand money through interactive reading, deterministic calculations and connected learning records. It is an educational application, not personalized investment advice.

## Product

- Home: search existing content and continue a task.
- Discover: five interactive stories covering budgets, purchasing power, bonds, ETFs and loan costs.
- Money Lab: savings, compounding, inflation, loans and budget scenarios, with comparison and saved parameters.
- Concept Studio: 36 concepts in six domains, 28 lessons, 64 questions and five learning paths; ETF matrix and concept experiments.
- My World: personal records, notes, experiments, favorites and review links.
- Fin Pet: a real rigged GLB companion, 120 deterministic scripts, opt-in mood interaction, focus timer, room, accessories, toys and explicitly saved memories.

The character remains a procedural art candidate. Facial integration, shoulders, leaf shapes and accessory fitting still need professional art review. No claim of final art approval or physical-phone thermal certification is made. Without configured AI credentials, chat uses a labelled demo mode. Basic pet interactions require no paid AI service.

## Stack and setup

React 19 / TypeScript / Vite, FastAPI / SQLAlchemy / SQLite, Three.js / React Three Fiber. Tested locally with Node 24.18.0 and Python 3.13.2. Dependencies are locked in `frontend/package-lock.json` and `backend/requirements.lock.txt`.

```bash
git clone https://github.com/zxy6688/FinPilot.git
cd FinPilot
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.lock.txt
mkdir -p data logs tmp
cp .env.example .env
PYTHONPATH=backend python -m app.seed
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8004
```

In another terminal: `cd frontend && npm ci && npm run dev`. Open `http://127.0.0.1:5176`. On Windows, use `scripts/Setup-FinPilot.ps1` and `scripts/Start-FinPilot.ps1` instead.

Tests: `python -m pytest backend/tests -q`; frontend: `npm run typecheck` and `npm run build`; pet checks: `node scripts/test-pet-director.mjs` and `node scripts/test-fin-scripts.mjs` from the repository root.

## Data and production

Guest data stays in the current browser. Account data is persisted by the backend. Production disables the shared demo account and requires an explicit random JWT secret. Never commit environment files, databases or access credentials.

The intended production domain is `https://finpilot.cn` on Hong Kong Lighthouse. **See [actual deployment status](deployment/PRODUCTION_STATUS.md); the domain alone is not evidence of a completed V3 deployment.** Caddy terminates HTTPS and serves static assets. FastAPI listens on loopback. Application releases and the SQLite database live in separate directories.

Pushes run CI only. Deployment requires a separate manual approval using `scripts/Release-Production.ps1`. SQLite online backups are verified before use; application rollback does not roll back user data. See [operations](deployment/PRODUCTION.md).

Editable Blender files and recordings are distributed separately from daily source checkouts; the runtime GLB remains in the repository. See [asset policy](release/ASSETS.md).

No new open-source license is asserted by this README. Check project rights and third-party licenses before redistribution.
