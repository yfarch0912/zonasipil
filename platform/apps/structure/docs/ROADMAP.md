# Roadmap

## v1.1 (hardening)
- Playwright end-to-end workflow tests (create → portal frame → report → reload).
- Code-splitting of the Design tab to cut the lazy editor chunk further.
- Report: include per-combination factored tables and design-check summaries
  exported from the Design tab run.
- Hourly audit-fix cycles continue (docs/AUDIT_CYCLE.md).

## v1.2 (engineering breadth)
- Applied nodal moments + temperature/settlement loads; user end releases
  and spring supports in the 2D solver, each with new analytical benchmarks.
- SNI 1727 ASD preset (Pasal 2.4) and live-load magnitude helper tables.
- Steel minor-axis flexure (F6) with benchmarks.

## v2 (platform)
- Optional self-hosted backend (FastAPI + PostgreSQL): accounts, project
  ownership, server-side analysis jobs, stored result versions. The v1 JSON
  schema (meta/model/fingerprint) is the migration contract.
- 3D numerical engine as a separate module (6 DOF/node) behind the same
  project schema — only shipped after its own benchmark suite passes.
- SNI 1726: response spectrum data + ELF procedure, gated by verification
  against published worked examples.
