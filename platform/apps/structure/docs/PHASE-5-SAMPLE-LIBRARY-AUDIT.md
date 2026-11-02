# Phase 5 — Sample Library Audit

Date: **2026-11-01** · Method: every dashboard sample built and solved
live (`investigation/samples-audit.probe.ts`,
`investigation/samples-verify.probe.ts`); equilibrium computed from the
model's own loads; documented expectations checked numerically.
Post-Phase-4 state.

| Sample | Model | Sections | Classification | Residual | maxRot | Equilibrium | Documented expectation |
|---|---|---|---|---|---|---|---|
| 01 · Balok Tumpuan Sederhana | 3 nodes, 2 members, pin+roller, P=10 kN @2 m | `section` (corrected 300×500) | VALID | 2.6e-18 | 2.18e-4 | exact (≤7e-15) | Ry 6/4 kN — **verified** (Phase 4 suite) |
| 02 · Balok Kantilever | 2 nodes, 1 member, fixed, UDL 10 kN/m | `section` (corrected) | VALID | 9.4e-19 | 2.84e-3 | exact | Ry=50 kN, Mz=125 kN·m — **verified** (Phase 4 suite) |
| 03 · Balok Menerus Dua Bentang | 3 nodes, 2×5 m spans, UDL 10 kN/m | iwf200 (parametric) | VALID | 1.5e-18 | 7.39e-3 | exact | R=18.75 / **62.5** / 18.75 kN — **verified live this audit** (= 0.375wL / 1.25wL) |
| 04 · Rangka Batang Pratt 2D | 8 nodes, 13 members, 3 point loads 15 kN (live) | iwf150 (parametric) | VALID | 2.4e-17 | 3.65e-4 | ≤6e-14 | ΣRy=45 kN, symmetric 22.5/22.5 — **verified live** |
| 05 · Portal Satu Lantai | template3 portal, 5 nodes, 4 members | rc500x500 + rc300x500 (parametric) | VALID | 2.9e-18 | 2.49e-4 | ≤4e-15 | "solves; symmetric invariants" — consistent |
| 06 · Portal Dua Lantai | 6 nodes, 6 members, 2 beam UDLs 12 kN/m × 6 m | rc300x500 | VALID | 1.5e-17 | 2.60e-4 | ≤6e-14 | ΣRy=144 kN — **verified live** (72+72) |
| 07 · Portal Tiga Lantai | 12 nodes, 15 members, 6 loads | rc300x500 | VALID | 5.4e-17 | 2.04e-4 | ≤3e-13 | ΣRy=360 kN — **verified live** (86.883+186.234+86.883) |

## Findings

- **No defective sample remains after the Phase 4 correction.** All
  seven classify VALID with healthy residuals and plausible rotations;
  every documented numeric expectation that could be checked was
  checked and holds exactly.
- The two samples that used the corrected `SECTION_DEFAULT` (01, 02)
  are covered by permanent analytical regression tests (Phase 4). The
  other five rely on parametric sections (computed properties) — the
  transcription-error class that bit 01/02 cannot occur there; their
  expectations are covered by the benchmark suite (03 ≡ Benchmark 3)
  and this audit's live verification.
- `SECTION_C30` (template 5, asymmetric rafter — an editor template,
  not a dashboard sample) remains as recorded in Phase 4: dimensions
  undeclared, finite/positive only, **not changed** — per instruction,
  no geometry is invented for it.
- Observation (not a defect): samples 05–07 document expectations
  narratively ("terverifikasi oleh rangkaian uji contoh") rather than
  with the explicit numbers 01–04 carry. The numbers verified in this
  audit (144 kN, 360 kN, symmetry for 05) could be written into their
  `expected` fields in a future documentation pass — content editing,
  not engineering change, and not done silently here.
