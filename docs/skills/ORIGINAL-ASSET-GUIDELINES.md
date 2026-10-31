# ORIGINAL ASSET GUIDELINES — ZonaSipil

How original visual assets are created and kept in this repository.

## Where assets live

- `assets/brand/` — logo mark and wordmark source SVG.
- `assets/icons/icons.svg` — one SVG sprite; every interface icon is a
  hand-authored `<symbol>` in this file. No other icon source is allowed.
- `assets/engineering/` — structural illustrations and technical diagrams,
  each a standalone editable SVG file.

## Icon system (ZonaSipil's own)

- Canvas 24×24, geometry built from filled shapes plus a single consistent
  stroke weight (1.8) with round caps/joins where a stroke is used.
- Motifs come from civil engineering itself: beam spans, column grids,
  footings, rebar dots, dimension ticks, quantity blocks — never generic
  SaaS glyphs (no rockets, shields, lightbulbs, chat bubbles).
- Each symbol gets a semantic id: `i-beam`, `i-footing`, `i-quantity`,
  `i-detail`, `i-calc`, `i-article`, `i-arrow`, `i-check`, `i-menu`,
  `i-close`.
- An icon must stay recognizable at 18px. Test at 18/24/32px before merging.

## Illustration rules

- Every illustration communicates one technical concept (load path, rebar
  arrangement, quantity composition). Decoration-only artwork is rejected.
- Reinforcement layouts must be plausible: longitudinal bars inside stirrups,
  concrete cover respected, supports under load paths. If a drawing is
  simplified for communication, the caption must say *konseptual*.
- Dimension lines, ticks and labels are part of the drawing language —
  they are the brand signature, not decoration.

## Prohibited

- Icon/illustration libraries or packs of any kind, external asset URLs,
  stock imagery, assets recycled from other projects (UndangYa!, STRUKTURA,
  FaceForge, AAP), watermarked or cropped source material.
- Claiming an asset was AI-generated when it was hand-authored, or the
  reverse.

## Provenance log

Record each new asset here when it is added: file, author method
(hand-authored SVG / programmatic SVG / CSS / canvas / project-specific AI
raster), date, and the concept it communicates.

| Date | Asset | Method | Concept |
|---|---|---|---|
| 2026-11-01 | `assets/brand/logo.svg` | Hand-authored SVG | Portal frame forming the ZonaSipil mark; amber load point on the beam |
| 2026-11-01 | `assets/icons/icons.svg` | Hand-authored SVG | Project icon system (10 symbols) |
| 2026-11-01 | `assets/engineering/frame-load.svg` | Hand-authored SVG | Two-storey portal frame: load arrows → beams → columns → footings → soil strata |
| 2026-11-01 | `assets/engineering/beam-section.svg` | Hand-authored SVG | RC beam cross-section: cover, stirrup, tension/compression bars (konseptual) |
