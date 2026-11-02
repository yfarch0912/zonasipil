# AGENTS.md — ZonaSipil Structure

Product: **ZonaSipil Structure** (`zonasipil-structure`, product code
`ZS-STRUCTURE`, route `zonasipil.web.id/apps/structure`)
Origin: migrated from STRUKTURA 1.0.0 on 2026-11-01 — see
`docs/MIGRATION-RECORD.md`. The STRUKTURA engineering docs under `docs/`
remain the engine's record and stay in force.

## Mandatory rules

1. **Engineering honesty.** Follow the ZonaSipil Engineering Validation
   Policy (in the zonasipil-web repo, `docs/ENGINEERING-VALIDATION-POLICY.md`):
   statuses PASS/FAIL/INCOMPLETE/UNVERIFIED/UNSUPPORTED/NOT_EVALUATED only;
   no green PASS for unperformed checks; never invent SNI references;
   never claim full SNI compliance. `docs/SNI_IMPLEMENTATION_MATRIX.md` and
   `docs/STATUS-MATRIX.md` are updated in the same change as any
   calculation change.
2. **Benchmarks before claims.** Any solver/design change runs
   `npm test` (analytical benchmarks + regressions) and `npm run build`.
   Audit cycle: build → audit → fix → re-audit (`docs/AUDIT_CYCLE.md`).
3. **Anti-Slop design protocol** (ZonaSipil-wide): original assets only,
   brand palette navy `#142D36` / teal `#168B83` / amber `#E9A64B` / warm
   white `#F4F3EE`, Bahasa Indonesia default UI, respect
   `prefers-reduced-motion`. **Known debt:** this codebase still uses
   `lucide-react`, which the protocol prohibits — do not add new lucide
   icons; replacement with the hand-authored ZonaSipil SVG sprite is
   tracked follow-up work.
4. **Compatibility:** localStorage keys and the `struktura-project` export
   schema must not be renamed without a data-migration tool and tests.
5. **Platform contract:** metadata lives in `zonasipil.app.json` +
   `src/platform/metadata.ts` (kept in sync by tests). Licence fixtures in
   `fixtures/licenses/` are development-only; never treat a client-side
   licence flag as authorisation for a protected server operation.
6. **Git/release safety:** no push, no deploy, no repo rename without the
   user's explicit approval for that action. Verify before claiming.
