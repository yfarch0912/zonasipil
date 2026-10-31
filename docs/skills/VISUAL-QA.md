# VISUAL QA — ZonaSipil acceptance checklist

Run before any release/deploy. Every box must pass or be an explicitly
recorded exception.

## Visual quality
- [ ] Nothing looks like a generic AI template or SaaS landing page.
- [ ] No identical card grid repeated across sections; each section has its
      own composition.
- [ ] No purple gradients, blobs, or glassmorphism decoration.
- [ ] Radii follow the system (10–14 / 16–20 / 22–28 / 28–36px).
- [ ] Shadows are soft and diffuse; no heavy dark drop shadows.
- [ ] Borders are minimal; hierarchy comes from tone and spacing.

## Brand
- [ ] Only the seven brand colours are used.
- [ ] Logo and icon set are the project's own SVGs (sprite + brand files).
- [ ] Dimension-line / blueprint drafting language appears as the signature
      motif, used with intent.

## Assets
- [ ] Zero external asset requests at runtime (check network tab / source).
- [ ] Every illustration is stored locally and listed in
      ORIGINAL-ASSET-GUIDELINES.md provenance log.
- [ ] Engineering drawings are plausible; simplified ones are captioned
      *konseptual*.

## Content
- [ ] No fake statistics, testimonials, logos, or authority claims.
- [ ] Formulas are real, variables defined, assumptions stated.
- [ ] No invented SNI (or other standard) references.
- [ ] Calculators carry the "bukan pengganti perhitungan desain oleh
      insinyur" disclaimer.

## Motion
- [ ] Every animation maps to a purpose in MOTION-DESIGN.md.
- [ ] `prefers-reduced-motion` verified: page is static and complete.

## Functional
- [ ] Calculators verified against hand calculations (record the cases).
- [ ] Keyboard navigation reaches all interactive elements; focus visible.
- [ ] Mobile 390px: no horizontal overflow; illustrations recomposed, not
      squeezed; touch targets ≥ 44px.
- [ ] Page works with JS disabled except calculators (content readable).
- [ ] HTML validated; total page weight (HTML+CSS+JS+SVG) recorded.
