# ZonaSipil

**Premium Civil Engineering Knowledge & Tools Platform** — zonasipil.web.id

Platform pengetahuan dan alat teknik sipil berbahasa Indonesia: jalur beban,
potongan balok beton bertulang, kalkulator kubikasi beton dan berat tulangan
dengan rumus yang terbuka. Semua gambar dan ikon adalah SVG orisinal yang
digambar khusus untuk proyek ini.

## Aturan proyek (wajib)

Seluruh pekerjaan desain/kode di repo ini mengikuti protokol
**Anti-Slop Design & Original Asset Engineering v1.0**:

- `AGENTS.md` — instruksi proyek
- `docs/skills/ANTI-SLOP.md` — protokol lengkap
- `docs/skills/ORIGINAL-ASSET-GUIDELINES.md` — pembuatan & log asal aset
- `docs/skills/MOTION-DESIGN.md` — aturan gerak
- `docs/skills/VISUAL-QA.md` — checklist penerimaan sebelum rilis

## Struktur

```
index.html                  halaman utama (statis, tanpa build step)
assets/brand/logo.svg       logo orisinal
assets/icons/icons.svg      sistem ikon SVG orisinal (sprite)
assets/engineering/         ilustrasi & diagram struktur orisinal
assets/css/site.css         Premium Soft UI (palet brand ZonaSipil)
assets/js/site.js           navigasi, reveal, kalkulator (vanilla JS)
```

## Menjalankan lokal

Buka `index.html` lewat server statis apa pun, misalnya:

```
python3 -m http.server 8000
```

## Hosting

**Vercel** (keputusan user 2026-11-01, menggantikan rencana GitHub Pages):
project `zonasipil` (`prj_XIHUk3Zcrnt3IQlL7KuhWYF1uKiN`), production di
https://zonasipil.vercel.app. Domain kustom `zonasipil.web.id` dan
`www.zonasipil.web.id` sudah terpasang di project; DNS di registrar
(indo.domains) diarahkan ke Vercel: A `@` → `76.76.21.21`, CNAME `www` →
`cname.vercel-dns.com`. Repo GitHub ini adalah sumber kode; deploy saat ini
dilakukan dari file situs (index.html + assets/) ke project Vercel.
Konten bersifat edukasi konseptual, bukan dokumen desain struktur.
