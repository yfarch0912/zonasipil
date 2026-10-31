# AGENTS.md — ZonaSipil Project Instructions

Project: **ZONASIPIL** — Premium Civil Engineering Knowledge & Tools Platform
Domain: zonasipil.web.id

## Mandatory protocol

Every design, frontend, visual asset, component, illustration, animation, and
interface change in this repository MUST follow the Anti-Slop Design &
Original Asset Engineering protocol registered in:

- `docs/skills/ANTI-SLOP.md` — the full protocol (v1.0)
- `docs/skills/ORIGINAL-ASSET-GUIDELINES.md` — how original assets are made
- `docs/skills/MOTION-DESIGN.md` — motion rules
- `docs/skills/VISUAL-QA.md` — acceptance checklist (run before any release)

Short version of the non-negotiables:

1. No generic icon libraries (Lucide, Heroicons, Font Awesome, Material,
   Feather, Iconify, emoji-as-icons, downloaded packs). All icons are
   hand-authored SVG in `assets/icons/icons.svg`.
2. No stock illustrations, no random external images, no recycled assets
   from other projects. Illustrations are created for ZonaSipil and stored
   locally under `assets/`.
3. No external visual assets at runtime. No purple AI gradients, floating
   blobs, glassmorphism decoration, identical card grids, fake statistics,
   fake testimonials, or fake logos.
4. Brand palette only: Deep Engineering Navy `#142D36`, Technical Teal
   `#168B83`, Construction Amber `#E9A64B`, Warm White `#F4F3EE`, White
   `#FFFFFF`, Graphite `#252C30`, Muted Gray `#899398`.
5. Soft UI: radii 10–14px (small), 16–20px (standard), 22–28px (large),
   28–36px (large visual containers); tonal contrast over borders; soft
   diffuse shadows only.
6. Engineering illustrations must be technically plausible. When accuracy
   is uncertain, label the artwork *konseptual* — never present it as
   engineering documentation. Never invent SNI references.
7. Animation must answer a purpose question (explain, navigate, feedback,
   brand, story) or be removed. Respect `prefers-reduced-motion`.
8. Content must be specific and technically honest: real formulas, defined
   variables, stated assumptions, no unsupported claims.
9. Run the iteration loop: research → art direction → asset inventory →
   original creation → implementation → visual inspection → critical
   review → refinement → functional QA → acceptance.
10. Final rule: if it looks like a template, redesign it. If an asset is
    generic, create an original one. Originality is a requirement.

## Stack

Dependency-free static site (HTML + CSS + vanilla JS), hosted on Vercel
(project `zonasipil`) at the custom domain zonasipil.web.id with no build
step (user decision 2026-11-01; GitHub repo remains the source of code).
Do not add a framework or runtime dependency without a recorded reason in
this file.
