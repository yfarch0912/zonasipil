import * as React from "react"
import { ANNOUNCE_EVENT, type AnnouncePriority } from "./announce"

/**
 * The live regions (Phase 7, F3): one polite (role="status") and one
 * assertive (role="alert"), visually hidden, mounted once by
 * StrukturaRoot so they exist before any status update occurs. The
 * listener clears-then-sets the text so a repeated identical message
 * is still announced.
 */
export function LiveAnnouncer() {
  const [polite, setPolite] = React.useState("")
  const [assertive, setAssertive] = React.useState("")

  React.useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text: string; priority: AnnouncePriority }
      const set = detail.priority === "assertive" ? setAssertive : setPolite
      set("")
      window.setTimeout(() => set(detail.text), 40)
    }
    window.addEventListener(ANNOUNCE_EVENT, onEvent)
    return () => window.removeEventListener(ANNOUNCE_EVENT, onEvent)
  }, [])

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" role="alert" className="sr-only">
        {assertive}
      </div>
    </>
  )
}
