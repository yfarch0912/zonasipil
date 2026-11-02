# Zona RAB — Rencana Anggaran Biaya Sederhana

Inti logika TypeScript murni untuk menyusun RAB: jumlah per item
pekerjaan, subtotal per seksi, pajak persentase, dan ekspor
CSV/JSON.

> **Kejujuran metode:** modul ini hanya melakukan aritmetika daftar
> harga (`volume × harga satuan`). Ia **tidak** menyediakan
> koefisien analisis harga satuan (AHSP), harga satuan resmi, atau
> tarif pajak resmi mana pun. Harga satuan selalu diisi pengguna
> dari sumbernya sendiri.

## Metode tertulis

### Item pekerjaan — `hitungItem(item)`

Tipe masukan:

```ts
interface ItemPekerjaan {
  uraian: string;        // tidak boleh kosong
  volume: number;        // ≥ 0
  satuan: string;        // tidak boleh kosong, mis. "m3", "kg", "ls"
  hargaSatuan: number;   // ≥ 0, rupiah
  seksi?: string;        // opsional
}
```

`hitungItem` mengembalikan salinan item ditambah seksi efektif dan
`jumlah = volume × hargaSatuan`. Item tanpa seksi masuk seksi
`"Umum"`.

### Seluruh RAB — `hitungRAB(items, { ppnPersen = 11 } = {})`

Mengembalikan:

```ts
{
  perItem: [...item, jumlah],
  perSeksi: [{ seksi, subtotal }],   // urutan = kemunculan pertama
  totalSebelumPajak,
  ppnPersen,
  ppn,          // nominal pajak = totalSebelumPajak × ppnPersen / 100
  grandTotal,   // totalSebelumPajak + ppn
}
```

### Pajak adalah parameter, bukan klaim tarif

`ppnPersen` adalah **parameter masukan** dengan nilai awal 11 agar
contoh mudah jalan. Nilai awal itu **bukan** klaim tarif resmi yang
berlaku. Tarif pajak mengikuti ketentuan perpajakan yang berlaku
pada saat dokumen dipakai, dan **pengguna wajib memeriksa nilai
terkini** (termasuk kemungkinan tarif efektif / pengecualian per
jenis transaksi) sebelum memakai hasil perhitungan ini untuk
keperluan resmi.

### Pembulatan

Perhitungan dilakukan dengan presisi penuh tanpa pembulatan di
tengah. Untuk penyajian, tersedia `bulatRupiah(x) = Math.round(x)`
yang membulatkan ke rupiah bulat terdekat.

Contoh terverifikasi test (eksak): item 2,5 m³ × Rp1.200.000 =
Rp3.000.000 dan item 10 × Rp150.000 = Rp1.500.000 →
total Rp4.500.000; pajak 11% = Rp495.000; grand total Rp4.995.000.

### Ekspor

- `eksporCSV(hasil)` — string CSV dengan pemisah `;` (agar langsung
  terbaca benar oleh Excel berbahasa Indonesia) dan header
  `Seksi;Uraian;Volume;Satuan;Harga Satuan;Jumlah`, diikuti baris
  item, baris subtotal per seksi, lalu baris Total Sebelum Pajak,
  Pajak, dan Grand Total. Sel yang mengandung `;`, tanda kutip,
  atau baris baru dibungkus tanda kutip sesuai kaidah CSV. Angka
  ditulis tanpa pemisah ribuan agar tetap terolah sebagai angka.
- `eksporJSON(hasil)` — `JSON.stringify` terformat rapi
  (indentasi 2 spasi).

### Validasi

`volume ≥ 0`, `hargaSatuan ≥ 0`, `ppnPersen ≥ 0`, `uraian` dan
`satuan` tidak kosong (termasuk hanya spasi), dan semua angka
harus hingga. Pelanggaran melempar `Error` berbahasa Indonesia,
dan satu item tidak valid menggagalkan seluruh `hitungRAB`.

## Batas dukungan

Yang **didukung**: daftar item datar dengan satu tingkat pajak
persentase, pengelompokan satu tingkat per seksi, ekspor CSV/JSON.

Yang **UNSUPPORTED** (belum / tidak dihitung, jangan diasumsikan
tercakup):

- Koefisien AHSP / analisis harga satuan dari komponen upah,
  bahan, dan alat — harga satuan diisi langsung oleh pengguna.
- Harga satuan resmi daerah, indeks harga, dan eskalasi/inflasi.
- Pajak bertingkat, jenis pajak selain satu persentase tunggal
  (mis. PPh, retribusi), diskon, dan biaya tak terduga (contingency)
  otomatis.
- Volume yang dihitung otomatis dari gambar/kuantitas — volume
  diisi pengguna (lihat app quantity untuk perhitungan volume).
- Mata uang selain rupiah dan kurs konversi.
- Tanda tangan, pengesahan, dan format dokumen resmi instansi.

## API ringkas

```ts
hitungItem(item): { ...item, seksi, jumlah }
hitungRAB(items, { ppnPersen = 11 }): { perItem, perSeksi, totalSebelumPajak, ppnPersen, ppn, grandTotal }
bulatRupiah(x): number
eksporCSV(hasil): string
eksporJSON(hasil): string
```
