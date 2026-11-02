/**
 * ZonaSipil — App "steel" (properti penampang I dan tekuk kolom ideal).
 *
 * Inti logika TypeScript murni: tanpa DOM, tanpa jaringan, tanpa dependensi
 * selain @zonasipil/engineering-core (konstanta massa jenis baja RHO_BAJA).
 *
 * KEJUJURAN METODE — baca sebelum memakai:
 * Properti penampang di sini adalah geometri penampang I simetris ideal dari
 * tiga persegi panjang (dua sayap + satu badan), dan beban kritis kolom
 * adalah TEORI TEKUK ELASTIS/INELASTIS KLASIK kolom ideal (Euler & Johnson)
 * sebagaimana diajarkan di buku teks mekanika bahan. Keduanya BUKAN cek
 * desain menurut kode/standar apa pun, dan BUKAN klaim kepatuhan terhadap
 * SNI, AISC, atau standar lainnya. Cek desain baja menurut kode dinyatakan
 * UNSUPPORTED oleh app ini — lihat README.md, bagian "Batas dukungan".
 */

import { RHO_BAJA } from "@zonasipil/engineering-core";

export const APP_SLUG = "steel";

/** Modulus elastisitas baja default textbook, MPa. */
export const E_BAJA_DEFAULT = 200_000;

// ---------------------------------------------------------------------------
// Validasi bersama
// ---------------------------------------------------------------------------

function wajibPositif(nama: string, nilai: number): void {
  if (typeof nilai !== "number" || !Number.isFinite(nilai)) {
    throw new Error(`${nama} tidak valid: harus berupa angka terhingga, diterima ${nilai}.`);
  }
  if (nilai <= 0) {
    throw new Error(`${nama} tidak valid: harus lebih besar dari 0, diterima ${nilai}.`);
  }
}

// ---------------------------------------------------------------------------
// Properti penampang I simetris
// ---------------------------------------------------------------------------

export interface InputPropertiProfilI {
  /** Tinggi total penampang h, mm. */
  h: number;
  /** Lebar sayap b, mm. */
  b: number;
  /** Tebal badan (web) tw, mm. */
  tw: number;
  /** Tebal sayap (flange) tf, mm. */
  tf: number;
}

export interface HasilPropertiProfilI {
  /** Luas penampang A, mm². */
  A: number;
  /** Momen inersia sumbu kuat Ix, mm⁴. */
  Ix: number;
  /** Momen inersia sumbu lemah Iy, mm⁴. */
  Iy: number;
  /** Modulus penampang elastis sumbu kuat Sx = Ix/(h/2), mm³. */
  Sx: number;
  /** Modulus penampang elastis sumbu lemah Sy = Iy/(b/2), mm³. */
  Sy: number;
  /** Jari-jari girasi sumbu kuat rx = √(Ix/A), mm. */
  rx: number;
  /** Jari-jari girasi sumbu lemah ry = √(Iy/A), mm. */
  ry: number;
  /** Berat sendiri per meter, kg/m (memakai RHO_BAJA = 7850 kg/m³). */
  beratPerMeter: number;
}

/**
 * Properti geometris penampang I SIMETRIS yang dimodelkan sebagai tiga
 * persegi panjang (sayap atas + badan + sayap bawah), tanpa fillet las/sudut:
 *
 *   A  = 2·b·tf + (h − 2·tf)·tw
 *   Ix = ( b·h³ − (b − tw)·(h − 2·tf)³ ) / 12
 *   Iy = ( 2·tf·b³ + (h − 2·tf)·tw³ ) / 12
 *   Sx = Ix / (h/2),  Sy = Iy / (b/2)
 *   rx = √(Ix/A),     ry = √(Iy/A)
 *   berat/m = A (mm²) × 1e-6 × 7850 kg/m³
 *
 * Karena fillet diabaikan, hasil sedikit lebih kecil dari tabel profil
 * pabrikan untuk profil WF/IWF nyata — tabel pabrikan selalu didahulukan
 * untuk profil yang benar-benar diproduksi.
 *
 * @throws Error bila dimensi tidak fisik: bukan angka/≤ 0, 2·tf ≥ h
 *         (badan hilang), atau tw > b (badan lebih lebar dari sayap).
 */
export function propertiProfilI(input: InputPropertiProfilI): HasilPropertiProfilI {
  const { h, b, tw, tf } = input;
  wajibPositif("Tinggi penampang h (mm)", h);
  wajibPositif("Lebar sayap b (mm)", b);
  wajibPositif("Tebal badan tw (mm)", tw);
  wajibPositif("Tebal sayap tf (mm)", tf);
  if (2 * tf >= h) {
    throw new Error(
      `Geometri penampang I tidak fisik: 2×tf (${2 * tf} mm) harus lebih kecil dari h (${h} mm) agar badan penampang masih ada.`,
    );
  }
  if (tw > b) {
    throw new Error(
      `Geometri penampang I tidak fisik: tebal badan tw (${tw} mm) tidak boleh melebihi lebar sayap b (${b} mm).`,
    );
  }

  const tinggiBadan = h - 2 * tf;
  const A = 2 * b * tf + tinggiBadan * tw;
  const Ix = (b * h ** 3 - (b - tw) * tinggiBadan ** 3) / 12;
  const Iy = (2 * tf * b ** 3 + tinggiBadan * tw ** 3) / 12;

  return {
    A,
    Ix,
    Iy,
    Sx: Ix / (h / 2),
    Sy: Iy / (b / 2),
    rx: Math.sqrt(Ix / A),
    ry: Math.sqrt(Iy / A),
    beratPerMeter: A * 1e-6 * RHO_BAJA,
  };
}

// ---------------------------------------------------------------------------
// Beban kritis kolom ideal — Euler & Johnson (teori klasik, BUKAN cek kode)
// ---------------------------------------------------------------------------

export interface InputBebanKritisKolom {
  /** Modulus elastisitas E, MPa. Default 200000. */
  E?: number;
  /** Tegangan leleh baja fy, MPa. */
  fy: number;
  /** Luas penampang A, mm². */
  A: number;
  /** Jari-jari girasi r pada sumbu tekuk yang ditinjau, mm. */
  r: number;
  /** Panjang efektif KL, mm (K dan L sudah digabung oleh pemanggil). */
  KL: number;
}

export interface HasilBebanKritisKolom {
  /** Rasio kelangsingan λ = KL/r (tak berdimensi). */
  lambda: number;
  /** Kelangsingan pemisah Cc = √(2π²E/fy) (tak berdimensi). */
  Cc: number;
  /** Rumus yang terpakai: "johnson" (λ ≤ Cc) atau "euler" (λ > Cc). */
  metode: "johnson" | "euler";
  /** Tegangan kritis teoritis σcr, MPa. */
  sigmaKritisMPa: number;
  /** Beban kritis teoritis Pcr = σcr·A, kN. */
  bebanKritisKn: number;
}

/**
 * Beban kritis TEORITIS kolom ideal (lurus sempurna, beban sentris, tanpa
 * tegangan sisa) menurut teori tekuk klasik buku teks mekanika bahan:
 *
 *   λ  = KL / r
 *   Cc = √(2π²E / fy)               (kelangsingan pemisah)
 *   λ ≤ Cc → Johnson: σcr = fy · (1 − fy·λ² / (4π²E))
 *   λ > Cc → Euler:   σcr = π²E / λ²
 *   Pcr = σcr · A / 1000            (kN)
 *
 * PERINGATAN: ini tegangan/beban kritis TEORITIS kolom ideal — BUKAN cek
 * desain menurut kode. Faktor keamanan, faktor reduksi, tekuk lokal elemen
 * (sayap/badan langsing), tekuk lentur-torsi, dan imperfeksi TIDAK termasuk.
 * Cek desain kolom baja menurut kode dinyatakan UNSUPPORTED oleh app ini.
 *
 * @throws Error bila ada input tidak fisik (≤ 0 / bukan angka).
 */
export function bebanKritisKolom(input: InputBebanKritisKolom): HasilBebanKritisKolom {
  const E = input.E ?? E_BAJA_DEFAULT;
  const { fy, A, r, KL } = input;
  wajibPositif("Modulus elastisitas E (MPa)", E);
  wajibPositif("Tegangan leleh baja fy (MPa)", fy);
  wajibPositif("Luas penampang A (mm²)", A);
  wajibPositif("Jari-jari girasi r (mm)", r);
  wajibPositif("Panjang efektif KL (mm)", KL);

  const lambda = KL / r;
  const Cc = Math.sqrt((2 * Math.PI ** 2 * E) / fy);

  let metode: "johnson" | "euler";
  let sigmaKritisMPa: number;
  if (lambda <= Cc) {
    metode = "johnson";
    sigmaKritisMPa = fy * (1 - (fy * lambda ** 2) / (4 * Math.PI ** 2 * E));
  } else {
    metode = "euler";
    sigmaKritisMPa = (Math.PI ** 2 * E) / lambda ** 2;
  }

  return {
    lambda,
    Cc,
    metode,
    sigmaKritisMPa,
    bebanKritisKn: (sigmaKritisMPa * A) / 1000,
  };
}
