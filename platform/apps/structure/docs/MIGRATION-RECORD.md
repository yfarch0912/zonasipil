# Migration Record — STRUKTURA → ZonaSipil Structure

Date: **2026-11-01** · Decision: user, 2026-11-01 ("Setujui Phase 0 —
STRUKTURA dimigrasi jadi zonasipil-structure", ZonaSipil ecosystem Phase 0,
decision §8.1 in `~/workspace/zonasipil/docs/ZONASIPIL-PRODUCT-ARCHITECTURE.md`).

## Source

- Project: STRUKTURA 1.0.0 (MIT), local `~/workspace/struktura/`,
  repo `yfarch0912/software-perhitungan-struktur`.
- Snapshot taken from: git HEAD `77fd6e1bf537c18fff0e0e253deda63973e80102`
  (branch `feature/struktura-engineering-platform`) **plus** its working
  tree, which contained one uncommitted change (`docs/AUDIT_CYCLE.md`,
  Cycle 28 audit entry). 219 files, 2.8 MB, excluding `.git`,
  `node_modules`, and `dist`.
- The original STRUKTURA folder/repo was **not modified** by the migration
  (verified: its git status after the copy is identical to before).

## What changed in the copy

1. **Identity:** package name `zonasipil-structure`; page title/meta;
   dashboard and editor wordmarks; report header and version string
   (`ZonaSipil Structure 1.0.0 · engine STRUKTURA 1.0.0` — provenance kept
   deliberately; a regression test asserts the report still contains the
   engine version text).
2. **Hosting shape:** Vite `base` changed from
   `/software-perhitungan-struktur/` to `/` (independently deployed app;
   platform routing is a platform-layer concern). The GitHub Pages
   workflow (`.github/workflows/pages.yml`, "Deploy STRUKTURA to GitHub
   Pages") was **removed** — it targeted the original project's Pages site.
3. **Platform integration (Phase 1 surface):** `zonasipil.app.json`,
   `src/platform/metadata.ts`, development licence fixtures in
   `fixtures/licenses/` (demo/full/expired/none — fixtures only, no real
   entitlement), contract tests `tests/platform-metadata.test.ts`,
   `docs/STATUS-MATRIX.md`, repo `AGENTS.md`.
4. **Docs:** README and CHANGELOG lead with the ZonaSipil Structure entry;
   all STRUKTURA engineering documentation is retained unchanged as the
   engine's record.

## What deliberately did NOT change

- **No engineering code or numerics.** Solver, design checks, samples,
  benchmarks and tests are byte-identical to the source snapshot except
  the visible strings listed above.
- **Compatibility identifiers:** localStorage keys (`struktura:projects:v1`
  etc.) and the `struktura-project` export schema stay as-is, so existing
  STRUKTURA project files and saved browser data remain valid. Renaming
  them would silently orphan user data and is forbidden without a
  migration tool.
- **Licence & attribution:** `LICENSE` (MIT) and `NOTICE` (OpenAnstruk-2D
  upstream attribution) are carried over verbatim.

## Known debt carried over (recorded, not hidden)

- `lucide-react` icons: the ZonaSipil Anti-Slop protocol prohibits generic
  icon libraries. Replacing them with the hand-authored ZonaSipil SVG
  sprite is planned follow-up work, **not** done in this migration.
- Standalone calculator mode and 3D (master-prompt Structure scope) do not
  exist yet — see `docs/STATUS-MATRIX.md`.
- Real licence/auth integration does not exist (Phase 7); fixtures only.

## Verification

Migration acceptance = the full test suite and production build of the
migrated copy (results recorded in the delivery report of 2026-11-01 and
in `docs/STATUS-MATRIX.md`). No GitHub repository was created, nothing was
pushed, and nothing was deployed as part of this migration; those steps
require separate explicit approval.
