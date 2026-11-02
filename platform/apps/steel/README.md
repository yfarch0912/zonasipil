# ZonaSipil App — Steel (Baja)

Inti logika TypeScript murni untuk properti geometris penampang I simetris
dan teori tekuk klasik kolom ideal: tanpa DOM, tanpa jaringan, dapat diuji
penuh dengan Vitest. Bahasa pesan kesalahan: Bahasa Indonesia. Semua input
yang tidak fisik ditolak dengan `throw Error` berbahasa Indonesia.

## API

| Fungsi | Kegunaan |
| --- | --- |
| `propertiProfilI({ h, b, tw, tf })` | Properti penampang I simetris (mm): `{ A, Ix, Iy, Sx, Sy, rx, ry, beratPerMeter }` — A mm², I mm⁴, S mm³, r mm, berat kg/m. |
| `bebanKritisKolom({ E = 200000, fy, A, r, KL })` | Beban kritis teoritis kolom ideal: `{ lambda, Cc, metode, sigmaKritisMPa, bebanKritisKn }` — E dan fy MPa, A mm², r dan KL mm, beban kN. |

Konstanta yang diekspor: `E_BAJA_DEFAULT` (200.000 MPa). Berat per meter
memakai `RHO_BAJA = 7.850 kg/m³` dari `@zonasipil/engineering-core`.

## Metode tertulis

### Properti penampang I simetris

Penampang dimodelkan sebagai tiga persegi panjang — sayap atas, badan, sayap
bawah — **tanpa fillet** pada pertemuan sayap–badan:

- `A = 2·b·tf + (h − 2·tf)·tw`
- `Ix = ( b·h³ − (b − tw)·(h − 2·tf)³ ) / 12`
- `Iy = ( 2·tf·b³ + (h − 2·tf)·tw³ ) / 12`
- `Sx = Ix / (h/2)`, `Sy = Iy / (b/2)`
- `rx = √(Ix/A)`, `ry = √(Iy/A)`
- `berat/m = A × 1e-6 × 7.850` (kg/m)

Validasi: semua dimensi harus positif; `2·tf < h` (badan harus ada);
`tw ≤ b`.

Nilai referensi yang diverifikasi test (`h=300, b=150, tw=6,5, tf=9`):
`A = 4.533 mm²`, `Ix ≈ 69,3×10⁶ mm⁴`, `Iy ≈ 5,07×10⁶ mm⁴`,
`rx ≈ 123,67 mm`, `ry ≈ 33,44 mm`, `berat ≈ 35,6 kg/m` (toleransi 0,5%).

### Beban kritis kolom — Euler & Johnson (teori klasik)

Untuk kolom **ideal**: lurus sempurna, dibebani sentris, tanpa tegangan sisa
dan tanpa imperfeksi.

- `λ = KL / r` — rasio kelangsingan pada sumbu tekuk yang ditinjau; pemanggil
  bertanggung jawab menggabungkan K dan L serta memilih `r` yang sesuai.
- `Cc = √(2π²E/fy)` — kelangsingan pemisah.
- `λ ≤ Cc` → rumus parabolik **Johnson**:
  `σcr = fy · (1 − fy·λ² / (4π²E))`, `metode = "johnson"`.
- `λ > Cc` → rumus **Euler**: `σcr = π²E / λ²`, `metode = "euler"`.
- `Pcr = σcr · A / 1000` (kN).

Nilai referensi yang diverifikasi test (`E=200.000 MPa, fy=250 MPa`):
`Cc ≈ 125,66`; `λ=150` → Euler, `σcr ≈ 87,7 MPa`; `λ=80` → Johnson,
`σcr ≈ 199,3 MPa` (toleransi 0,5%).

## Batas dukungan

**Pernyataan kejujuran metode.** Rumus-rumus di app ini adalah **teori
textbook umum** — geometri penampang dari mekanika bahan dasar dan teori
tekuk elastis/inelastis klasik Euler & Johnson untuk kolom ideal. App ini
**BUKAN klaim kepatuhan terhadap SNI 1729, AISC 360, atau standar lain mana
pun**, tidak mengutip pasal standar, dan hasilnya **bukan dokumen desain**.

Yang **didukung**:

- Properti geometris elastis penampang I **simetris** ideal (tiga persegi
  panjang): A, Ix, Iy, Sx, Sy, rx, ry, dan berat per meter.
- Tegangan dan beban kritis **teoritis** kolom ideal menurut Euler/Johnson,
  sebagai bahan belajar dan estimasi awal perilaku tekuk global.

Yang **TIDAK didukung (UNSUPPORTED)**:

- **Cek desain baja menurut kode dinyatakan UNSUPPORTED**: tidak ada faktor
  keamanan/faktor reduksi kekuatan, tidak ada kurva kekuatan kolom kode,
  tidak ada pemeriksaan kombinasi beban.
- Tekuk **lokal** elemen langsing (sayap/badan), tekuk **lentur-torsi** dan
  tekuk lateral-torsional balok, serta klasifikasi kekompakan penampang.
- Properti **plastis** (Zx, Zy, modulus plastis), konstanta torsi/warping,
  dan properti penampang selain I simetris (kanal, siku, pipa, penampang
  tersusun/built-up berlubang, dsb.).
- Fillet sayap–badan pada profil canai nyata — properti hasil hitung sedikit
  lebih kecil dari **tabel profil pabrikan**, dan tabel pabrikan selalu
  didahulukan untuk profil yang benar-benar diproduksi.
- Sambungan (baut, las), pelat dasar, kelelahan, dan desain seismik.
- Kolom tidak ideal: eksentrisitas beban, momen ujung, imperfeksi awal, dan
  tegangan sisa — semuanya sengaja diabaikan oleh teori kolom ideal di sini.
