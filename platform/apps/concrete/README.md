# ZonaSipil App — Concrete (Beton)

Inti logika TypeScript murni untuk perhitungan beton bertulang dasar dan
estimasi material beton: tanpa DOM, tanpa jaringan, dapat diuji penuh dengan
Vitest. Bahasa pesan kesalahan: Bahasa Indonesia. Semua input yang tidak
fisik (bukan angka terhingga, nol, atau negatif pada besaran yang wajib
positif) ditolak dengan `throw Error` berbahasa Indonesia.

## API

| Fungsi | Kegunaan |
| --- | --- |
| `beta1(fc)` | Faktor β1 blok tegangan persegi Whitney untuk kuat tekan beton `fc` (MPa). |
| `kapasitasLenturBalok({ b, d, As, fy, fc })` | Kapasitas lentur balok tulangan tunggal: `{ a, c, epsilonT, Mn_kNm, phi, phiMn_kNm, tensionControlled, peringatan }`. Satuan: mm, mm², MPa, kN·m. |
| `tulanganMinimumBalok({ b, d, fy, fc })` | Tulangan tarik minimum balok: `{ rhoMin, AsMin }`. |
| `estimasiMaterialBeton(volumeM3, { semen = 1, pasir = 2, kerikil = 3 })` | Estimasi material metode volume kering: `{ semenKg, semenZak, pasirM3, kerikilM3 }`. |

Konstanta yang diekspor: `ES_BAJA_TEXTBOOK` (200.000 MPa),
`EPSILON_CU` (0,003), `EPSILON_T_TENSION_CONTROLLED` (0,005),
`PHI_LENTUR_MAKS` (0,9), `PHI_SENGKANG_BIASA_MIN` (0,75),
`FAKTOR_VOLUME_KERING` (1,54), `MASSA_JENIS_SEMEN` (1.440 kg/m³),
`BERAT_ZAK_SEMEN_KG` (50 kg).

## Metode tertulis

### β1 — blok tegangan persegi Whitney

- `fc ≤ 28 MPa` → β1 = 0,85.
- `fc > 28 MPa` → β1 turun 0,05 untuk setiap kenaikan 7 MPa di atas 28 MPa.
- β1 tidak pernah kurang dari 0,65.

### Kapasitas lentur balok (Whitney, tulangan tunggal)

Penampang persegi dengan tulangan tarik saja, baja diasumsikan leleh, dan
distribusi tegangan tekan beton diganti blok persegi ekivalen Whitney:

- `a = As·fy / (0,85·fc·b)`
- `c = a / β1(fc)`
- `εt = 0,003 · (d − c) / c` (regangan tarik neto saat regangan tekan beton
  mencapai 0,003)
- `Mn = As·fy · (d − a/2)` (N·mm, dikonversi ke kN·m)

Faktor reduksi φ — **satu pendekatan yang dipilih dan dinyatakan eksplisit**:
penampang bertulangan **sengkang biasa (tied)**.

- `εt ≥ 0,005` (tension-controlled) → φ = 0,90.
- Zona transisi `εy < εt < 0,005`, dengan `εy = fy/200.000` → interpolasi
  linier dari batas bawah φ = 0,75 pada `εt = εy` menuju φ = 0,90 pada
  `εt = 0,005`.
- `εt ≤ εy` → φ = 0,75.

Setiap penampang yang tidak tension-controlled mengembalikan field
`peringatan` (string Bahasa Indonesia; `null` bila tension-controlled). Bila
`εt < εy` peringatan menjadi peringatan keras: asumsi baja leleh tidak
terpenuhi sehingga Mn rumus Whitney tidak layak dipakai sebagai kapasitas.
Bila `c ≥ d` fungsi menolak menghitung (`throw`) karena penampang berada di
luar cakupan model tulangan tunggal.

Nilai referensi yang diverifikasi test (`b=250, d=450, As=1472,6, fy=400,
fc=25`): `a ≈ 110,9 mm`, `c ≈ 130,4 mm`, `εt ≈ 0,00735`,
`Mn ≈ 232,4 kN·m`, `φMn ≈ 209,2 kN·m`, `tensionControlled = true`
(toleransi test 0,5%).

### Tulangan minimum balok

- `ρmin = maks(0,25·√fc/fy ; 1,4/fy)` (fc, fy dalam MPa)
- `AsMin = ρmin · b · d`

Referensi test: `fc=25, fy=400` → `ρmin = 0,0035`; untuk `b=250, d=450` →
`AsMin = 393,75 mm²`.

### Estimasi material beton — metode volume kering

- Volume bahan kering = **1,54** × volume beton basah.
- Semen (kg) = volume kering × (bagian semen / total bagian) × **1.440 kg/m³**.
- Semen (zak) = `ceil(semen kg / 50)`.
- Pasir (m³) dan kerikil (m³) = volume kering × bagian masing-masing /
  total bagian.

Referensi test: 1 m³ campuran 1:2:3 → semen **369,6 kg = 8 zak**,
pasir **0,5133 m³**, kerikil **0,77 m³**.

## Batas dukungan

**Pernyataan kejujuran metode.** Semua metode di app ini adalah **metode
textbook umum** sebagaimana diajarkan di buku teks beton bertulang — misalnya
formulasi blok tegangan persegi Whitney, interpolasi faktor reduksi pada zona
transisi, dan metode volume kering untuk estimasi material. App ini **BUKAN
klaim kepatuhan terhadap SNI 2847, ACI 318, atau standar lain mana pun**,
tidak mengutip pasal standar, dan hasilnya **bukan dokumen desain** serta
tidak menggantikan perhitungan oleh insinyur berlisensi.

Yang **didukung**:

- β1 Whitney sebagai fungsi fc.
- Kapasitas lentur nominal balok **persegi, tulangan tunggal (tarik saja)**,
  dengan pemeriksaan regangan dan peringatan zona transisi/compression-controlled.
- Tulangan tarik minimum balok dengan formulasi di atas.
- Estimasi **kasar** material beton (semen/pasir/kerikil) untuk perencanaan
  awal dan logistik.

Yang **TIDAK didukung (UNSUPPORTED)**:

- Balok T/L, penampang tidak persegi, tulangan rangkap (tekan + tarik),
  kolom, pelat dua arah, geser, torsi, lentur biaksial, dan interaksi P–M.
- Pemeriksaan lendutan, lebar retak, dan keadaan batas layan lainnya.
- Detail penulangan (panjang penyaluran, sambungan lewatan, kait, sengkang
  minimum, tulangan susut/suhu dan kulit) menurut standar mana pun.
- Desain campuran beton (job mix design), kebutuhan air campuran, pengaruh
  kadar air agregat/admixture/faktor kehilangan, dan analisa harga satuan
  resmi — estimasi volume kering di sini bukan pengganti semuanya.
- Mutu beton/baja di luar rentang yang lazim diajarkan di buku teks tidak
  divalidasi secara khusus selain penolakan nilai tidak fisik; pemakai wajib
  menilai kewajaran input dan output.
