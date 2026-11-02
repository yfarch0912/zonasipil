# Licensing Audit

## Foundation code
| Item | Detail |
|---|---|
| Name | OpenAnstruk-2D (fork: ziyad-cpu/OpenANSTRUK-2Dtest @ 31cc234; upstream: adrianulza/OpenANSTRUK-2D @ 819cad9) |
| License | **MIT** — full text in `LICENSE` at repository root, Copyright (c) 2026 OpenAnstruk Contributors |
| Obligations | Include copyright + license notice in copies/substantial portions — satisfied by the retained `LICENSE` file and `NOTICE` attribution |
| Commercial use | Permitted by MIT |
| Copyleft / network-use | None (not GPL/AGPL) |

STRUKTURA's own additions (src/struktura/, tests/, benchmarks/, docs/) are
released under the same MIT license for simplicity and compatibility.

## Runtime/dev dependencies (from package.json, all permissive)
React, React DOM (MIT) · @radix-ui/* primitives (MIT) · lucide-react (ISC) ·
clsx (MIT) · tailwind-merge, class-variance-authority (MIT) · Vite,
@vitejs/plugin-react (MIT) · Tailwind CSS 4 + @tailwindcss/postcss (MIT) ·
postcss/autoprefixer (MIT) · TypeScript (Apache-2.0) · Vitest (MIT) ·
tw-animate-css (MIT) · Prettier/ESLint toolchain (MIT/Apache-2.0).
No GPL/AGPL dependencies are used. `next-themes` was removed in Cycle 1
(unused). Exact versions: see package-lock.json.

## Standards documents
SNI standards are copyrighted BSN publications. STRUKTURA contains **no
reproduced standard text** — only formula implementations with clause-number
references, written from the code provisions (the same way commercial software
implements them). Users must hold their own legitimate copies of the standards.

## Assets
Upstream demo screenshots (public/demo/*.png) were **removed** (binary weight;
not needed). Remaining public assets are text SVG logos; STRUKTURA's own mark
is public/struktura.svg (original, simple geometry).
