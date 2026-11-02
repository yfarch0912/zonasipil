/**
 * Screen-reader announcement bus (Phase 7, F3). Producers call
 * `announceStatus`; `LiveAnnouncer` (live-announcer.tsx) renders the
 * messages into visually hidden aria-live regions. Kept in a
 * non-component module so the announcer component file stays
 * fast-refresh clean.
 */
export type AnnouncePriority = "polite" | "assertive"

export const ANNOUNCE_EVENT = "zs:announce"

export function announceStatus(text: string, priority: AnnouncePriority = "polite") {
  window.dispatchEvent(new CustomEvent(ANNOUNCE_EVENT, { detail: { text, priority } }))
}
