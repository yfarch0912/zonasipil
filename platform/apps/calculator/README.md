# Zona Calculator (`@zonasipil/app-calculator`)

Inti logika kalkulator teknik sipil ZonaSipil dalam TypeScript murni —
tanpa UI, tanpa dependensi selain `@zonasipil/engineering-core`.
Konsisten dengan kalkulator yang sudah live di zonasipil.web.id
(#kalkulator).

## API

### `volumeBeton(panjangM, lebarM, tebalM, jumlahElemen, wastePersen = 5)`

Mengembalikan `{ bersih, denganWaste }` dalam m³.

### `beratTulangan(diameterMm, panjangTotalM)`

Mengembalikan `{ perMeter, total }` — berat per meter (kg/m) dan berat
total (kg).

### Konversi satuan

Fungsi `convert`, `convertLength`, `convertArea`, `convertVolume`,
`convertMass`, `convertForce`, `convertMoment`, dan `convertPressure`
diekspor ulang **apa adanya** dari `@zonasipil/engineering-core`
(termasuk tipe satuannya: `LengthUnit`, `AreaUnit`, dst.). Definisi dan
faktor konversinya didokumentasikan di paket core tersebut, bukan di
sini.

### Helper validasi

`pastikanPositif`, `pastikanBulatMinimal`, dan `pastikanPersen` juga
diekspor untuk dipakai pemanggil yang ingin memvalidasi lebih awal.

## Metode / rumus

**Volume beton** — elemen diasumsikan berbentuk prisma persegi
panjang:

```
bersih      = panjang × lebar × tebal × jumlah elemen     (m³)
denganWaste = bersih × (1 + wastePersen / 100)            (m³)
```

Contoh terverifikasi (juga kasus uji): `volumeBeton(3, 2, 0.5, 1, 5)`
→ bersih 3,00 m³, denganWaste 3,15 m³.

**Berat tulangan** — memakai `beratBesiPerMeter` dari engineering-core:

```
perMeter = 0,006165 × d²        (kg/m, d dalam mm)
total    = perMeter × panjang   (kg)
```

Faktor 0,006165 adalah turunan massa jenis baja 7850 kg/m³:
(π/4) × 7850 × 10⁻⁶ ≈ 0,006165. Contoh terverifikasi: D13 →
perMeter ≈ 1,042 kg/m (eksak 1,041885); untuk panjang total 120 m →
total ≈ 125,0 kg (eksak 125,0262).

## Validasi input

- Panjang/lebar/tebal, diameter, dan panjang tulangan harus angka
  berhingga **> 0** (nol, negatif, `NaN`, `Infinity` → `Error`).
- Jumlah elemen harus **bilangan bulat ≥ 1**.
- `wastePersen` harus dalam rentang **0–100**.
- Pesan error berbahasa Indonesia dan menyebut nama besaran serta
  nilai yang diterima.
- Hasil **tidak dibulatkan** oleh fungsi; pembulatan tampilan adalah
  urusan pemanggil (tersedia `formatAngkaID` di engineering-core).

## Batas dukungan

Yang **tidak** didukung app ini — jangan diasumsikan sebaliknya:

- **Bentuk elemen**: hanya prisma persegi panjang. Volume silinder
  (kolom bundar), trapesium (saluran), piramida, pondasi batu kali,
  atau bentuk tak beraturan **tidak** dihitung.
- **Tulangan**: hanya berat dari diameter nominal × panjang lurus
  total. Bengkokan, kait, sengkang sebagai komponen terpisah, dan
  sambungan lewatan (overlap) **tidak** ditambahkan otomatis — pemanggil
  harus memasukkan panjang total yang sudah termasuk bagian tersebut.
  Tidak ada waste/potongan tulangan otomatis.
- **Waste beton**: hanya persentase sederhana terhadap volume bersih.
  Bukan perhitungan susut, faktor pemadatan, kehilangan saat pengecoran,
  atau sisa mixer.
- **Konversi satuan**: hanya jenis yang disediakan engineering-core
  (panjang, luas, volume, massa, gaya, momen, tekanan/tegangan). Suhu,
  waktu, sudut, kecepatan, dan satuan lain tidak tersedia.
- **Bukan perhitungan struktur**: app ini tidak memeriksa kekuatan,
  lendutan, penulangan minimum/maksimum, mutu beton/baja, dan **tidak
  mengklaim kepatuhan terhadap SNI atau standar apa pun**. Hasilnya
  adalah hitungan geometri dan berat semata.
