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
CNAME                       domain kustom GitHub Pages: zonasipil.web.id
```

## Menjalankan lokal

Buka `index.html` lewat server statis apa pun, misalnya:

```
python3 -m http.server 8000
```

## Hosting

GitHub Pages dari branch `main` (folder root). Domain kustom
`zonasipil.web.id` diarahkan lewat DNS ke GitHub Pages — lihat catatan
rilis di riwayat proyek. Konten bersifat edukasi konseptual, bukan dokumen
desain struktur.
