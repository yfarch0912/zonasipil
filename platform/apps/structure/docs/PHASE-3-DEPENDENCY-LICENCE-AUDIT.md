# Phase 3 — Dependency & Licence Audit

Date: **2026-11-01** · Node v24.22.1, npm 10.9.4.
Method: licence fields read from the **installed** `node_modules` tree
(277 packages including nested duplicates), direct deps from
`package.json`. This closes the Phase 1 gap "full transitive scan not
yet performed" for licence *declarations*.

## Security audit status: NOT RUN

`npm audit` was retried this phase; the npm audit endpoint again
returned an error from this machine (exit code 1, `npm error audit
endpoint returned an error`, log `~/.npm/_logs/2026-11-01T04_15_46_543Z-debug-0.log`).
No TLS/registry controls were bypassed and no dependency was changed to
work around it. **No vulnerability claim is made in either direction.**
Re-run from a network where the endpoint answers before any release.

## Direct dependencies

Runtime (shipped): react 19 / react-dom 19 (MIT) · @radix-ui/* ×10
(MIT) · clsx (MIT) · tailwind-merge (MIT) · class-variance-authority
(Apache-2.0) · autoprefixer (MIT, build-time CSS) · **lucide-react
(ISC)** — licence permissive; the issue remains *policy* (Anti-Slop
prohibits generic icon libraries), tracked since Phase 1, unchanged.

Dev-only: typescript (Apache-2.0) · vite, vitest, eslint, prettier,
tailwindcss 4, @vitejs/plugin-react (MIT) · **@playwright/test 1.64.1
(Apache-2.0)** + playwright/playwright-core (Apache-2.0) — added in
Phase 2 for E2E; browsers live outside the repo (`~/.cache/ms-playwright`)
and ship nothing to production.

## Transitive licence tally (277 installed packages)

| Licence | Count | Note |
|---|---|---|
| MIT | 231 | — |
| Apache-2.0 | 19 | NOTICE obligations on distribution |
| ISC | 13 | incl. lucide-react |
| BSD-2-Clause / BSD-3-Clause | 6 / 2 | permissive |
| **MPL-2.0** | 3 | `lightningcss` + 2 platform binaries — **build-time only** (Tailwind CSS toolchain); MPL is file-level weak copyleft: it would matter only if its source files were modified and redistributed; the app ships compiled CSS output, not lightningcss. Flagged for awareness, not a blocker. |
| CC-BY-4.0 | 1 | `caniuse-lite` (browser-support *data*, dev-only, via autoprefixer/browserslist) — attribution licence for data, not code in the bundle |
| BlueOak-1.0.0 | 1 | `minimatch` (dev tooling glob library) — permissive |
| 0BSD | 1 | permissive |

**No GPL, AGPL, or LGPL package exists anywhere in the installed tree.
No package lacks a licence declaration** (zero UNKNOWN in this scan —
an improvement over sampling: the Phase 1 audit could only sample).

## Project licence chain (unchanged)

App: MIT (`LICENSE` carried from STRUKTURA). Upstream OpenAnstruk-2D:
MIT, attribution in `NOTICE` (preserved). No licence or copyright
notice was modified in Phase 3; the main `zonasipil` repository's
missing LICENSE remains the user's open decision (Phase 0 finding),
out of this workspace's scope.

## Outstanding risks / follow-up

1. `npm audit` NOT RUN (environment) — the only open item; rerun
   pre-release from a working network.
2. MPL-2.0 build tooling (lightningcss): keep unmodified; if the CSS
   pipeline ever vendors/patches it, re-review.
3. lucide-react remains Anti-Slop policy debt (not a licence risk);
   replacement is scheduled UI work, explicitly not mixed into this
   sprint.
4. Licence *declarations* were audited; a formal legal review of
   distribution obligations (Apache-2.0 NOTICE propagation etc.)
   remains a pre-commercial-release task for the user.
