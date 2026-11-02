# Phase 6 — Font Self-Hosting

Date: **2026-11-01** · Status: **PASS — the Google Fonts runtime
dependency is eliminated.**

## What the app requested before

`index.html` loaded, at runtime: `fonts.googleapis.com` CSS +
`fonts.gstatic.com` font files for **Inter (variable, wght 100..900)**
and **JetBrains Mono (variable, wght 100..800)**, plus two preconnect
hints. A source-wide scan confirmed this was the application's only
external runtime dependency.

## What was done

- **Source (authoritative):** the google/fonts GitHub repository —
  `ofl/inter/Inter[opsz,wght].ttf` and
  `ofl/jetbrainsmono/JetBrainsMono[wght].ttf`. Axes verified from the
  files themselves: Inter wght 100–900 (+ opsz 14–32), JetBrains Mono
  wght 100–800 — exactly the ranges the Google Fonts URL requested.
- **Licence:** both fonts are SIL Open Font License 1.1; the licence
  texts are stored next to the assets
  (`public/fonts/OFL-Inter.txt`, `public/fonts/OFL-JetBrainsMono.txt`),
  which the OFL permits/requires for redistribution.
- **Format:** converted locally to WOFF2 (fontTools): Inter 876 KB TTF
  → **351 KB**, JetBrains Mono 187 KB → **72 KB**. Stored in
  `public/fonts/` (served at `/fonts/…`, copied to `dist/` by the
  build — verified present in build output).
- **Wiring:** `@font-face` declarations at the top of
  `src/globals.css` (family names unchanged — Tailwind's
  `--font-sans: 'Inter', system-ui, sans-serif` and
  `--font-mono: 'JetBrains Mono', monospace` tokens and the canvas's
  `'JetBrains Mono'` label font resolve as before), `font-weight`
  ranges declared, `font-display: swap`, system fallbacks retained.
  The three Google Fonts lines were removed from `index.html`.
- **Typography appearance:** same families, same weight ranges; the
  only nuance is that the self-hosted Inter is the variable file with
  an optical-size axis (browsers apply the default instance), visually
  equivalent to what Google Fonts served for this usage.

## Verification (executed)

- E2E `workflows.spec.ts` › "no external runtime requests": a request
  listener over dashboard + editor + analysis records **zero** requests
  to non-local origins, and `document.fonts.check` confirms Inter and
  JetBrains Mono are actually loaded (not silently fallen back).
- The smoke test's failed-request assertion no longer needs its
  Google Fonts exception (removed; assertion stricter).
- Full gates after the change: suite 222/222, build PASS, E2E 14/14.
