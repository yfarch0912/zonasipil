# SNI Implementation Matrix — STRUKTURA 1.0.0

Status key: **IMPLEMENTED** (code + tests), **PARTIAL** (subset implemented,
rest UNSUPPORTED), **UNSUPPORTED** (not implemented — the app says so).

> STRUKTURA does NOT claim full compliance with any standard. This matrix is
> the authoritative list of what is actually computed.

## SNI 1727:2020 — Beban Desain Minimum
| Provision | Status | Notes |
|---|---|---|
| Pasal 2.3.2 LRFD load combinations | IMPLEMENTED | Preset `SNI 1727:2020` in combinations-presets.ts; snow (S) omitted (not applicable in Indonesia), 0.2S term vanishes; every generated combination stores `presetCode` as its standard reference. Regression-tested. |
| Pasal 2.4 ASD combinations | UNSUPPORTED | Not generated; user may define manually as custom combinations. |
| Dead/live load magnitude tables (Bab 3–4) | UNSUPPORTED | Load magnitudes are user-entered; no occupancy table lookup. |
| Wind (Bab 26–31), flood, rain procedures | UNSUPPORTED | Wind/Seismic exist only as load *cases* whose loads the user computes externally. |

## SNI 1726:2019 — Gempa
| Provision | Status | Notes |
|---|---|---|
| Load combinations referencing E | IMPLEMENTED | Via the SNI 1727:2020 / SNI 1726:2019 presets (E as a case kind). |
| Response spectrum, Ss/S1 maps, site class, ELF procedure, drift, irregularities | UNSUPPORTED | No seismic hazard or lateral-force generation in v1. Seismic loads are user-computed and entered as a case. |

## SNI 2847:2019 — Beton Struktural (≡ ACI 318-14)
Implemented module: `src/lib/design/rc/codes/sni2847-19/` (+ upstream DESIGN_RC.md).
| Check | Status | Key provisions |
|---|---|---|
| Beam flexure — required As (singly/doubly reinforced) | IMPLEMENTED | Whitney stress block; εcu = 0.003; tension-controlled limit εt ≥ 0.005; Pers. numbering in source |
| Beam flexure — φMn of provided bars (strain compatibility) | IMPLEMENTED | φ ramp 21.2.2; hand-verified (tests: Mn 232.0 kN·m case within 0.5%) |
| β1 (22.2.2.4.3), As,min (0.25√f′c/fy vs 1.4/fy) | IMPLEMENTED | Unit-tested against hand values |
| Beam shear — Vc = 0.17λ√f′c·bw·d (22.5.5.1), Vs, Av/s req., spacing limits, Vc+0.66√f′c ceiling (22.5.1.2) | IMPLEMENTED | Vc unit-tested (112.2 kN case, exact) |
| Detailing: bar spacing, cover, crack-control spacing, min stirrups (9.6.3.4) | IMPLEMENTED | In design report per member |
| Column axial + P-M interaction | PARTIAL | Implemented in sni2847-19/column.ts with interaction sampling; biaxial bending UNSUPPORTED |
| Moment magnification / slenderness (Bab 6) | PARTIAL | See DESIGN_RC.md for the exact subset; anything outside returns UNSUPPORTED |
| Development length, splices (Bab 25) | PARTIAL | Reported where computed by the module; not a standalone anchorage designer |
| Two-way slab, walls, footings, strut-and-tie, torsion design | UNSUPPORTED | No modules exist; verdicts report UNSUPPORTED |
| Seismic detailing Bab 18 (SMF/IMF provisions beyond frame-type criteria flags) | PARTIAL | Frame-type criteria exist (OMF/IMF/SMF); full Bab 18 detailing checks are not complete — treat as UNSUPPORTED unless the per-member report shows the check with its clause |

## SNI 1729:2020 — Baja Struktural (basis AISC 360)
Implemented module: `src/lib/design/steel/` (+ upstream DESIGN_STEEL.md).
| Check | Status | Key provisions |
|---|---|---|
| Section classification / local buckling (Bab B4) | IMPLEMENTED | λ, λp, λr per element |
| Tension strength (Bab D) | IMPLEMENTED | Yield + rupture with φt |
| Compression strength (Bab E, incl. E4 torsional/flexural-torsional where properties exist) | IMPLEMENTED | Fe from KL/r; E4 skipped (UNSUPPORTED verdict) when Cw/rts data absent |
| Flexure (Bab F): F2 LTB with Cb, F3, F5, F6 minor-axis absence noted | PARTIAL | Major-axis implemented incl. LTB; **minor-axis flexure (F6) deliberately absent** in the foundation and reported as such; lateral-torsional checks need section Cw/rts/ho — absent data ⇒ that limit state is skipped, never approximated |
| Shear (Bab G) | IMPLEMENTED | Incl. web slenderness paths in module |
| Combined axial + bending (Bab H1/H2) | IMPLEMENTED | H2 used for single angles (principal axes) |
| Seismic (SNI 1729 seismic / AISC 341-style in foundation seismic.ts) | PARTIAL | See DESIGN_STEEL.md; not a complete SNI seismic-provisions implementation |
| Connections (Bab J), fatigue, ponding, composite members | UNSUPPORTED | No connection designer in v1 |

## SNI 8460:2017 — Geoteknik
| All | UNSUPPORTED | No geotechnical module in v1 (roadmap). |
