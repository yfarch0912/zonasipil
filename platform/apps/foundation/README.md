# Zona Foundation — Daya Dukung Fondasi Dangkal

Inti logika TypeScript murni untuk perhitungan daya dukung tanah
fondasi dangkal (telapak) dengan metode buku teks klasik.

> **Kejujuran metode:** perhitungan di sini adalah metode textbook
> klasik untuk pembelajaran dan estimasi awal. Hasilnya **bukan**
> klaim kesesuaian terhadap SNI atau kode/standar mana pun, dan
> **bukan** pengganti penyelidikan tanah (sondir/boring, uji
> laboratorium) maupun penilaian insinyur geoteknik berlisensi
> untuk desain nyata.

## Metode tertulis

### Faktor daya dukung — `faktorDayaDukung(phiDerajat)`

Sudut geser dalam tanah φ dimasukkan dalam derajat dan dikonversi
ke radian secara internal.

- `Nq = e^(π · tan φ) × tan²(45° + φ/2)` — Prandtl–Reissner
- `Nc = (Nq − 1) / tan φ` — Prandtl–Reissner
- `Nγ = 2 × (Nq + 1) × tan φ` — Vesic

Catatan Nγ: bentuk Vesic yang diterbitkan memakai `(Nq + 1)`.
Bentuk `2 × (Nq − 1) × tan φ` yang kadang beredar di ringkasan
sekunder memberi Nγ ≈ 20,09 pada φ = 30°, tidak cocok dengan tabel
Vesic baku (≈ 22,40). Modul ini memakai bentuk `(Nq + 1)`.

Kasus khusus φ = 0 (lempung jenuh tak terdrainase): rumus Nc
menjadi 0/0, sehingga dipakai nilai Terzaghi `Nc = 5,7`, `Nq = 1`,
`Nγ = 0`.

Nilai acuan terverifikasi oleh test (toleransi ±1,5%):

| φ | Nc | Nq | Nγ |
|---|----|----|----|
| 0° | 5,70 (Terzaghi) | 1,00 | 0,00 |
| 30° | 30,14 | 18,40 | 22,40 |

### Daya dukung ultimit — `dayaDukungUltimit({ c, phi, gamma, B, Df, bentuk })`

Dengan tegangan overburden pada dasar fondasi `q = gamma × Df`:

- lajur: `qult = c·Nc + q·Nq + 0,5 · gamma · B · Nγ`
- persegi: `qult = 1,3·c·Nc + q·Nq + 0,4 · gamma · B · Nγ`
  (koefisien bentuk 1,3 dan 0,4 adalah koreksi Terzaghi klasik)

Satuan konsisten: bila `c` dalam kPa, `gamma` dalam kN/m³, dan
`B`/`Df` dalam m, maka `qult` (dan alias `qultKpa`) dalam kPa.

Contoh terverifikasi test: `c = 10 kPa, φ = 30°, gamma = 18 kN/m³,
B = 1,5 m, Df = 1 m`, lajur →
`10×30,14 + 18×18,40 + 0,5×18×1,5×22,40 ≈ 935,0 kPa`.

### Daya dukung izin — `dayaDukungIzin(qult, faktorKeamanan = 3)`

`qall = qult / FS`. Nilai FS baku 3 adalah kebiasaan estimasi awal;
nilai yang dipakai tetap tanggung jawab perencana.

### Ukuran telapak persegi — `ukuranTelapakPersegi({ bebanKn, c, phi, gamma, Df, faktorKeamanan = 3 })`

Iterasi lebar `B` mulai 0,5 m dengan langkah 0,05 m sampai
`bebanKn / B² ≤ qall(B)` untuk bentuk persegi; batas atas 10 m.
Melempar `Error` bila tidak konvergen. Mengembalikan
`{ B, qall, tekananAktual }`. Berat sendiri fondasi dan tanah di
atasnya **tidak** ditambahkan otomatis — `bebanKn` harus sudah
mencakupnya bila ingin diperhitungkan.

### Validasi

Semua masukan divalidasi ketat: nilai harus bilangan hingga,
`c ≥ 0`, `gamma > 0`, `B > 0`, `Df ≥ 0`, `0° ≤ φ < 90°`,
`faktorKeamanan > 0`, dan `bentuk` hanya `"lajur"` atau
`"persegi"`. Pelanggaran melempar `Error` berbahasa Indonesia.

## Batas dukungan

Yang **didukung**: daya dukung ultimit keruntuhan geser umum untuk
telapak lajur dan persegi pada tanah homogen satu lapis, tanpa
pengaruh muka air tanah.

Yang **UNSUPPORTED** (belum / tidak dihitung, jangan diasumsikan
tercakup):

- Penurunan (settlement) — konsolidasi maupun elastis.
- Daya dukung kelompok tiang dan fondasi dalam (tiang pancang/bor).
- Tanah berlapis (parameter berbeda per kedalaman).
- Muka air tanah dan koreksi berat volume efektif/terendam.
- Keruntuhan geser lokal / punching, faktor koreksi kedalaman,
  bentuk (di luar koefisien Terzaghi di atas), dan kemiringan
  beban / beban eksentris / beban miring.
- Fondasi lingkaran, interaksi struktur–tanah, dan pengaruh gempa.

## API ringkas

```ts
faktorDayaDukung(phiDerajat): { Nc, Nq, Ngamma }
dayaDukungUltimit({ c, phi, gamma, B, Df, bentuk }): { qult, qultKpa, Nc, Nq, Ngamma, q }
dayaDukungIzin(qult, faktorKeamanan = 3): number
ukuranTelapakPersegi({ bebanKn, c, phi, gamma, Df, faktorKeamanan }): { B, qall, tekananAktual }
```
