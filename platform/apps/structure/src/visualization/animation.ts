/**
 * Deterministic deformation-animation progress logic (pure).
 *
 * The animation interpolates between the undeformed geometry
 * (t = 0) and the solver's deformed geometry (t = 1). t is an
 * interpolation parameter, NOT physical time: this is a static
 * analysis result being revealed, not a dynamic simulation.
 */

/** Milliseconds for a full 0 → 1 sweep at speed 1×. */
export const ANIMATION_PERIOD_MS = 2400

export const ANIMATION_SPEEDS = [0.25, 0.5, 1, 2] as const

/**
 * Advance the progress by dtMs of wall-clock time. Pure and
 * deterministic: the same (t, dt, speed) always yields the same
 * next t. Clamps at 1 and reports completion so the controller can
 * stop the frame loop instead of spinning at the end state.
 */
export function advanceProgress(
  t: number,
  dtMs: number,
  speed: number,
  periodMs: number = ANIMATION_PERIOD_MS,
): { t: number; done: boolean } {
  if (dtMs <= 0 || speed <= 0 || periodMs <= 0) return { t, done: t >= 1 }
  const next = t + (dtMs * speed) / periodMs
  if (next >= 1) return { t: 1, done: true }
  return { t: next, done: false }
}

/** True when the user prefers reduced motion (false outside a browser). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Progress step used per explicit press when reduced motion is on. */
export const REDUCED_MOTION_STEP = 0.1
