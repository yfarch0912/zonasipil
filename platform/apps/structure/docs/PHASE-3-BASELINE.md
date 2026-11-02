# Phase 3 — Baseline

Date: **2026-11-01** · Captured before any Phase 3 edit.
Workspace: `~/workspace/zonasipil-structure/` — **not a git checkout**
(no `.git`; state is the file tree itself, as in Phases 1–2). Because
there is no VCS here, "working-tree state" = the tree as delivered by
Phase 2 plus the combined-documents file the user requested afterwards
(`~/workspace/zonasipil/ZONASIPIL-SEMUA-DOKUMEN.md`, outside this
workspace). Nothing in the tree was modified between Phase 2 close-out
and this baseline.

## Configuration inspected

- Scripts (`package.json`): `test` = `vitest run -c config/vitest.config.ts`,
  `build` = `tsc -b config/tsconfig.json && vite -c config/vite.config.ts build`
  (typecheck is part of build), `lint` = `eslint -c config/eslint.config.js .`,
  `test:e2e` = `playwright test -c config/playwright.config.ts`.
- Vitest include: `tests/**/*.test.ts` + `benchmarks/**/*.test.ts`
  (24 files: 22 in `tests/`, 2 in `benchmarks/`).
- Playwright: `e2e/smoke.spec.ts`, production build served by
  `vite preview` on 127.0.0.1:4317.
- Investigation tooling lives in `investigation/` (probe config +
  ILL_CONDITIONED probe), outside the production bundle and outside the
  default Vitest include.

## Baseline results (executed this session)

| Check | Command | Result |
|---|---|---|
| Unit + regression + benchmark suite | `npm test` | **206/206 PASS (24 files)** |
| Production build + typecheck | `npm run build` | PASS (6.47 s) |
| Lint | `npm run lint` | **37 problems (6 errors, 31 warnings)** — identical to Phase 2 baseline |
| Original STRUKTURA | `git status` in `~/workspace/struktura` | branch `feature/struktura-engineering-platform`, HEAD `77fd6e1`, only its pre-existing ` M docs/AUDIT_CYCLE.md` |

**Baseline matches Phase 2 close-out exactly. No discrepancy; no stop
condition.** Phase 3 workstreams may proceed.
