# V3 Build Gates

Base: origin/v2 @ a3fa070a55a4d4efd0fa47e8e835e0da6e0581c2. Independent v3 worktree. No server work.

## Gate A · Visual foundation

Implemented tokens, navigation, small SVG Fin, evidence-backed seven-node constellation with accessible in-place topic detail, quiet Home with one Today task. V2 evidence and relevance remain reused. Local ports 5176 / 8004; separate runtime/dependencies/database.

Visual review against actual V1/V2 Home images: V1 uses a large tinted hero and several equal cards; V2 uses five recommendation blocks before its compass. V3 gives typography/constellation one focal area, removes the repeated card grid, limits supporting content to Today/Continue/Signal/Explore. Review iteration moved a label away from Fin and placed mobile CTA after the mini map. Visual quality is a design judgment, not a proven user preference.

Validation: typecheck passes; browser checks one Today, seven true topics, keyboard detail/Esc, widths 375/390/430/768 without horizontal overflow. Real images in screenshots/v3/gate-a-*.png. Persistent memory and final Today selection are implemented in subsequent gates; no V3 READY claim yet.

## Remaining

Gate B: durable reading and Article Reader; glossary/selection AI; compare/review/misconceptions.
Gate C: persisted actionable routes; prediction/reflection notebook; same-session AI.
Gate D: My World, connections, rate-limited deterministic moments and companion growth.
Gate E: Discover/Learn/FinTalk/Search consistency, complete regression and screenshots, docs and origin/v3 push.

Gate B: original article reading, persisted reading positions, four comparisons, spaced review and misconception lifecycle implemented. Existing 42 API tests passed; 6 new state/privacy tests passed. Browser checks cover Article/Lesson/Compare/Review at desktop and 375/390/430/768 widths. Actual article screenshot reviewed: quiet reading column and contextual rail, no card wall. Gate C/D/E remain in progress.
