# Packages

- `@zonasipil/engineering-core` (`engineering-core/`) — konversi satuan,
  format angka Indonesia, konstanta material.
- `@zonasipil/application-registry` (`application-registry/`) — registry
  17 aplikasi ZonaSipil.

## Build

Build monorepo = typecheck penuh: `npm run build` di root menjalankan
`tsc --noEmit -p tsconfig.json`. Package diekspor langsung dari
`src/index.ts` (tanpa emit `dist/`), jadi tidak ada artefak build per
package — keberhasilan build dibuktikan oleh typecheck strict yang hijau
di seluruh monorepo. Lihat `../README.md`.
