# Zona Quantity (`@zonasipil/app-quantity`)

Inti logika take-off (hitung kebutuhan material) ZonaSipil dalam
TypeScript murni — tanpa UI, tanpa dependensi selain
`@zonasipil/engineering-core`. Semua rumus bersifat geometris/teoritis
dan tertulis eksplisit di bawah; tidak ada koefisien campuran
tersembunyi.

## API

| Fungsi | Hasil |
| --- | --- |
| `volumeBetonElemen(panjangM, lebarM, tebalM, jumlah)` | volume beton (m³) |
| `beratTulanganElemen({ diameterMm, jumlahBatang, panjangPerBatangM })` | `{ perMeter, totalKg }` |
| `kebutuhanBataPerM2(panjangBataM, tinggiBataM, tebalSiarM = 0.01)` | bata per m² (boleh pecahan) |
| `kebutuhanBata(luasM2, panjangBataM, tinggiBataM, tebalSiarM = 0.01, persenWaste = 0)` | total bata utuh (dibulatkan ke atas) |
| `volumeMortarPlester(luasM2, tebalM = 0.015)` | volume plesteran (m³) |
| `luasAcian(luasM2)` | luas acian (m²) |
| `rekapMaterial(daftarElemen)` | `{ totalVolumeBetonM3, totalBeratTulanganKg, rincian[] }` |

### Tipe input rekap

```ts
interface ElemenRekap {
  nama?: string;                       // bawaan: "Elemen ke-<n>"
  beton?: {
    panjangM: number; lebarM: number; tebalM: number; jumlah: number;
  };
  tulangan?: Array<{
    diameterMm: number; jumlahBatang: number; panjangPerBatangM: number;
  }>;                                  // satu entri per diameter
}
```

Setiap elemen wajib memiliki `beton` dan/atau `tulangan` (boleh salah
satu); `rincian` pada hasil memberi volume beton dan berat tulangan per
elemen sesuai urutan masukan (sisi yang kosong bernilai 0).

## Metode / rumus

**Beton elemen** — prisma persegi panjang:

```
volume = panjang × lebar × tebal × jumlah        (m³)
```

**Tulangan elemen** — memakai `beratBesiPerMeter` dari engineering-core
(faktor 0,006165 = turunan massa jenis baja 7850 kg/m³):

```
perMeter = 0,006165 × d²                                  (kg/m)
totalKg  = perMeter × jumlahBatang × panjangPerBatangM    (kg)
```

**Bata dinding setengah bata** — satu bata plus siar (nat) di
sekelilingnya menempati bidang `(panjangBata + siar) × (tinggiBata + siar)`,
sehingga:

```
kebutuhan per m² = 1 / ((panjangBata + siar) × (tinggiBata + siar))
total            = ceil(kebutuhan per m² × luas × (1 + persenWaste/100))
```

Contoh terverifikasi (juga kasus uji): bata 0,20 × 0,05 m, siar 0,01 m
→ 1 / (0,21 × 0,06) = **79,365… bata/m²**; untuk 10 m² tanpa waste →
**794 bata** (dari 793,65…, dibulatkan ke atas).

**Mortar plester** — volume plester jadi di dinding:

```
volume = luas × tebal        (m³, tebal bawaan 0,015 m)
```

**Acian** — dihitung per m² luas permukaan, jadi luas acian sama dengan
luas masukan. Tidak ada rumus tebal/berat tersembunyi di baliknya.

**Rekap material** — penjumlahan murni hasil rumus di atas per elemen:

```
totalVolumeBetonM3   = Σ volume beton tiap elemen
totalBeratTulanganKg = Σ totalKg tiap kelompok tulangan tiap elemen
```

## Validasi input

- Dimensi, luas, diameter, dan panjang harus angka berhingga **> 0**
  (nol, negatif, `NaN`, `Infinity` → `Error`).
- Jumlah elemen dan jumlah batang harus **bilangan bulat ≥ 1**.
- Tebal siar boleh 0, tetapi tidak boleh negatif.
- `persenWaste` harus dalam rentang **0–100**.
- `rekapMaterial` menolak daftar kosong dan elemen tanpa beton maupun
  tulangan.
- Pesan error berbahasa Indonesia dan menyebut nama besaran serta
  nilai yang diterima.

## Batas dukungan

Yang **tidak** didukung app ini — jangan diasumsikan sebaliknya:

- **Bata**: hanya dinding **setengah bata** satu lapis dengan siar
  seragam. Dinding satu bata, pasangan miring/rollag, dan pola khusus
  tidak dihitung. Luas masukan harus sudah **bersih** — bukaan pintu,
  jendela, dan ventilasi harus dikurangi sendiri oleh pemanggil. Jenis
  bata (merah, hebel, batako, dst.) hanya dibedakan lewat ukuran yang
  dimasukkan; tidak ada data ukuran baku bawaan.
- **Plester & acian**: hanya volume/luas teoritis. **Tidak** ada
  konversi ke kebutuhan bahan kering — sak semen, m³ pasir, kg acian,
  atau komposisi campuran (mis. 1:4) tidak dihitung di sini.
- **Beton**: hanya prisma persegi panjang; bekisting tidak dihitung;
  volume beton **tidak** dikurangi volume tulangan di dalamnya; tidak
  ada waste/susut kecuali bila pemanggil menambahkannya di luar.
- **Tulangan**: panjang per batang adalah panjang lurus masukan.
  Bengkokan, kait, sengkang sebagai komponen terpisah, sambungan
  lewatan, dan waste potongan **tidak** ditambahkan otomatis. Tidak ada
  konversi ke batang standar 12 m atau satuan pembelian lain.
- **Rekap**: hanya penjumlahan — bukan RAB. Tidak ada harga satuan,
  tidak ada konversi satuan pembelian (truk mixer, sak, batang, dus),
  dan tidak ada pembulatan selain pada `kebutuhanBata`.
- App ini **tidak mengklaim kepatuhan terhadap SNI, analisa harga
  satuan (AHSP), atau standar apa pun**; seluruh angka adalah hitungan
  geometris teoritis dari rumus di atas.
