# FinPilot V3

[Live website](https://finpilot.cn) · [Visual product tour](../README.md) · [Documentation](INDEX.md) · [v3.0.0 release](https://github.com/zxy6688/FinPilot/releases/tag/v3.0.0)

FinPilot is a financial education and experimentation platform for university students and beginners. Start with a practical question, read an explanation, change model inputs, check understanding, and save a result to revisit.

## Five product spaces

- **Home:** find relevant existing content and resume a real task. Search suggestions are not generated AI answers.
- **Discover:** five original interactive stories about budgets, purchasing power, bonds, ETFs and loans; teaching assumptions and sources are distinguished from current events.
- **Money Lab:** five deterministic workbenches for budgeting, savings, inflation, loan costs and compound growth, with A/B comparisons and restorable parameter snapshots. Eight earlier teaching experiments remain accessible.
- **Concept Studio:** six domains, 36 concepts, 28 lessons, 64 original questions and five learning paths. ETF classification is interactive. Only 27 concept checks link to original question IDs; nine are instant practice, not formal review records.
- **My World:** find, preview, rename, delete and reopen saved work. Guest records remain in the current browser; explicitly saved account records are isolated by user on the backend.

Fin is a secondary 3D companion with optional visibility, animations, rule-based scripts, mood interactions, focus timing, room items, accessories and memories. Its GLB is still a procedural art candidate, not professionally approved character art. Toys are not full rigid-body simulations. FinChat runs in explicitly labelled AI Demo mode; no paid AI service is required for basic pet behaviour. Physical-phone thermal and battery testing has not been completed.

## Local setup

Verified development environment: Windows, Node 24.18.0, Python 3.13.2. Production runs Python 3.12.3 on Ubuntu 24.04.4 LTS. Use the committed npm and Python lockfiles.

```powershell
git clone https://github.com/zxy6688/FinPilot.git
cd FinPilot
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Setup-FinPilot.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Start-FinPilot.ps1
```

The launcher opens localhost:5176; FastAPI health is localhost:8004/api/health. Occupied ports produce an explicit error rather than terminating another process. Stop with `scripts/Stop-FinPilot.ps1`; run checks with `scripts/Check.ps1`. Frontend commands: `npm run typecheck`, `npm run build`. Backend: `python -m pytest backend/tests -q` using the project virtual environment. The release passed 165 backend tests, a clean-clone installation/build and Linux CI; [evidence and limits](release/VALIDATION.md).

`.env.example` contains configuration names, not credentials. Production requires a random JWT secret and disables shared Demo accounts. Never commit `.env`, databases, API keys or SSH keys. [Chinese README](../README.md#run-locally) includes manual Linux/macOS commands.

## Architecture and operations

React / Vite / TypeScript → Caddy HTTPS → FastAPI / SQLAlchemy → persistent SQLite. Three.js and React Three Fiber render the companion. Static builds are prepared locally for a 2-core / 2GB Hong Kong Lighthouse server.

https://finpilot.cn is live. Production source is tag **v3.0.0**, commit `ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5`; documentation commits may put main ahead without deploying them. CI does not deploy. Updates follow local tests → reviewed main push → CI → explicit human deployment approval.

Program releases, database and secrets live in separate server paths. Backup restore was tested in an isolated server instance; application rollback to the previous compatible V3 and back was also tested. **Backups currently remain on the same server; there is no offsite disaster recovery.** [Production status](deployment/PRODUCTION_STATUS.md) · [Operations](deployment/PRODUCTION.md).

The maintainer's Windows wrapper at `D:\finpilot开发\Publish-FinPilot.ps1` is outside Git and is not included in a clone. Other maintainers configure their own authorized SSH environment and use `scripts/Release-Production.ps1`; production builds must hide the shared Demo login entry.

## Assets, history and scope

Fresh README screenshots come from the real HTTPS production site, isolated guest data and teaching inputs: [capture manifest](readme/CAPTURE_MANIFEST.json). Blender projects and recordings are in the authorized public release asset; runtime GLB files remain in source control. [Asset details](release/ASSETS.md).

V1 history, the v2 branch and the old-main backup are preserved. The remote v3 branch is an earlier candidate, so use main or v3.0.0 for the released product. [Version history](repository/VERSION_HISTORY.md) · [repository audit](repository/REPO_AUDIT_2026-11-10.md).

No project-level LICENSE file was found; this README does not grant a new license. Check code, artwork and dependency rights separately. FinPilot is for financial education, **not personalized investment advice**. Model outputs are conditional examples, not promised returns or product recommendations.
