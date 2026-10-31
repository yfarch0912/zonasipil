# MOTION DESIGN — ZonaSipil

Motion exists to explain engineering, guide navigation, or give feedback.
Nothing moves for decoration alone.

## Allowed patterns

- **Structural assembly reveal** — hero frame draws itself in build order
  (footings → columns → beams → load arrows). Purpose: storytelling +
  brand. Implemented with stroke-dash animation on the inline hero SVG,
  triggered once when the hero enters.
- **Scroll reveals** — sections fade/translate 12px up, staggered by at most
  60ms between siblings, via IntersectionObserver adding `.in`. Purpose:
  navigation rhythm. Content is fully visible if JS fails.
- **Calculator feedback** — result numbers update on input; a short
  160ms highlight on the result panel signals recalculation. Purpose:
  meaningful feedback.
- **Hover** — links and rows shift colour/underline only; no scale games,
  no bouncing.

## Timing & easing

- Micro feedback: 140–180ms. Reveals: 480–640ms.
- Easing: `cubic-bezier(0.22, 0.61, 0.21, 1)` (easeOutQuint-like) for
  reveals; linear is reserved for drawing strokes where constant speed
  reads as "construction".
- Nothing loops forever. The hero assembly plays once.

## Forbidden

Floating blobs, parallax stacks, cursor followers, infinite bobbing,
auto-playing carousels, transitions slower than 700ms on interactive
elements, animation that delays reading content.

## Reduced motion

`@media (prefers-reduced-motion: reduce)` disables all reveals and the
assembly animation (final drawn state shown statically), and the JS reveal
observer is skipped. This is a hard requirement, not an enhancement.
