# Validasi Numerik — Nilai Referensi & Toleransi

Semua nilai di bawah adalah nilai hitung-tangan / hitung independen
(Python) yang ditulis SEBELUM atau BERSAMAAN dengan implementasi, lalu
dijadikan asersi tes vitest. Tidak ada nilai yang diambil dari keluaran
kode yang sedang diuji (bukan tes yang membenarkan dirinya sendiri).

## Konsistensi dengan situs live (wajib, bukan pilihan)

| Besaran | Referensi | Hasil | Toleransi | Sumber referensi |
|---|---|---|---|---|
| Volume beton bersih 3×2×0,5 m, 1 elemen | 3,00 m³ | 3,00 m³ | eksak | Rumus live `js/main.js` situs statis |
| Volume beton + waste 5% | 3,15 m³ | 3,15 m³ | eksak | Idem |
| Berat besi D13 per meter | 1,042 kg/m | 1,041885 kg/m | 0,001 | 0,006165 × 13² |
| Berat besi D13, 120 m | 125,0 kg | 125,0262 kg | 0,1 | Idem |

## engineering-core

| Kasus | Referensi | Toleransi |
|---|---|---|
| 1 inch → mm | 25,4 | eksak (definisi) |
| 1 tf → N | 9806,65 | eksak (definisi) |
| 1 kgf/cm² → Pa | 98066,5 | eksak (definisi) |
| FAKTOR_BERAT_BESI × 13² | 1,041885 | 1e-9 relatif |
| formatAngkaID(1234567.891, 2) | "1.234.567,89" | string eksak |

## concrete (blok tegangan persegi Whitney, textbook)

Kasus: b=250 mm, d=450 mm, As=1472,6 mm² (3D25), fy=400 MPa, f'c=25 MPa.

| Besaran | Referensi | Hasil | Toleransi |
|---|---|---|---|
| β1 (fc 25 / 35 / 56) | 0,85 / 0,80 / 0,65 | sama | 1e-9 |
| a | 110,88 mm | 110,878 mm | 0,5% |
| Mn | 232,4 kN·m | 232,41 kN·m | 0,5% |
| φMn (tension-controlled, φ=0,9) | 209,2 kN·m | 209,17 kN·m | 0,5% |
| εt | — | 0,007349 (≥0,005 ✓) | — |
| ρmin (fc 25, fy 400) | 0,0035 | 0,0035 | 1e-12 |
| AsMin (250×450) | 393,75 mm² | 393,75 mm² | 1e-9 |
| Material 1 m³ campuran 1:2:3 | semen 369,6 kg → 8 zak; pasir 0,5133 m³; kerikil 0,77 m³ | sama | pembulatan terdokumentasi |

Catatan: φ zona transisi (0,75→0,90 untuk penampang sengkang biasa)
adalah pendekatan modul yang terdokumentasi, bukan kutipan pasal.

## steel (properti penampang dari dimensi; fillet diabaikan)

Kasus: profil I h=300, b=150, tw=6,5, tf=9 mm.

| Besaran | Referensi | Hasil | Toleransi |
|---|---|---|---|
| A | 4533 mm² | 4533 mm² | 0,5% |
| Ix | ≈69,3×10⁶ mm⁴ | 69.325.191 mm⁴ | 0,5% |
| Iy | — | 5.068.954 mm⁴ | — |
| Berat sendiri | ≈35,6 kg/m | 35,584 kg/m | 0,5% |
| Cc (E=200.000, fy=250) | 125,66 | 125,664 | 0,5% |
| Euler λ=150 → σcr | 87,7 MPa | 87,730 MPa | 0,5% |
| Johnson λ=80 → σcr | 199,3 MPa | 199,339 MPa | 0,5% |

## foundation (Terzaghi klasik; Nγ menurut Vesic)

| Kasus | Referensi | Hasil | Toleransi |
|---|---|---|---|
| φ=30° → Nq | 18,40 | 18,4011 | 1,5% |
| φ=30° → Nc | 30,14 | 30,1396 | 1,5% |
| φ=30° → Nγ | 22,40 | 22,4025 | 1,5% |
| φ=0 → Nc/Nq/Nγ | 5,7 / 1 / 0 | eksak | khusus Terzaghi |
| qult lajur (c=10 kPa, φ=30°, γ=18, B=1,5 m, Df=1 m) | 935,0 kPa | 935,05 kPa | 1,5% |

**Koreksi terdokumentasi:** brief awal menulis Nγ = 2(Nq−1)tanφ, yang
memberi 20,09 pada φ=30° dan bertentangan dengan referensinya sendiri.
Rumus Vesic yang diterbitkan adalah Nγ = 2(Nq+1)tanφ — bentuk inilah
yang diimplementasikan dan didokumentasikan di README foundation.

## quantity & rab

| Kasus | Referensi | Hasil |
|---|---|---|
| Bata 0,20×0,05 m, siar 0,01 → per m² | 1/(0,21×0,06) = 79,365 | 79,365079 (tol 0,01) |
| RAB: total 2 item | 4.500.000 | eksak |
| RAB: PPN 11% (parameter) | 495.000 | eksak |
| RAB: grand total | 4.995.000 | eksak |

## structure

Validasi solver memakai rangkaian benchmark analitik + regresi milik
proyek asalnya: 237/237 unit test lulus di monorepo (28 file). Rincian
benchmark adalah dokumen proyek asal (`apps/structure/docs/`). E2E
Playwright (39 test, tercatat PASS di proyek asal) tidak dijalankan
ulang di sini — statusnya "tercatat, tidak diverifikasi ulang".
