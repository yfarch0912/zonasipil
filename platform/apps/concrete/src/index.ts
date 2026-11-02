/**
 * ZonaSipil — App "concrete" (beton bertulang & estimasi material beton).
 *
 * Inti logika TypeScript murni: tanpa DOM, tanpa jaringan, tanpa dependensi
 * selain @zonasipil/engineering-core (konversi satuan momen).
 *
 * KEJUJURAN METODE — baca sebelum memakai:
 * Semua fungsi di sini adalah metode TEXTBOOK UMUM sebagaimana diajarkan di
 * buku teks beton bertulang (blok tegangan persegi Whitney, faktor reduksi
 * transisi gaya, tulangan minimum, dan metode volume kering untuk estimasi
 * material). File ini BUKAN klaim kepatuhan terhadap SNI, ACI, atau standar
 * apa pun, dan hasilnya BUKAN dokumen desain. Untuk batas dukungan lengkap
 * lihat README.md app ini, bagian "Batas dukungan".
 */

import { convertMoment } from "@zonasipil/engineering-core";

export const APP_SLUG = "concrete";

/** Modulus elastisitas baja tulangan textbook, MPa. */
export const ES_BAJA_TEXTBOOK = 200_000;

/** Regangan ultimit beton yang diasumsikan pada analisis Whitney, mm/mm. */
export const EPSILON_CU = 0.003;

/** Batas regangan tarik untuk penampang tension-controlled, mm/mm. */
export const EPSILON_T_TENSION_CONTROLLED = 0.005;

/**
 * Faktor reduksi kekuatan lentur maksimum (tension-controlled) dan batas
 * bawah untuk penampang sengkang biasa (tied) yang dipakai modul ini pada
 * zona transisi. Lihat catatan pada kapasitasLenturBalok.
 */
export const PHI_LENTUR_MAKS = 0.9;
export const PHI_SENGKANG_BIASA_MIN = 0.75;

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

function wajibRasioCampuran(nama: string, nilai: number): void {
  if (typeof nilai !== "number" || !Number.isFinite(nilai)) {
    throw new Error(`Perbandingan campuran ${nama} tidak valid: harus berupa angka terhingga, diterima ${nilai}.`);
  }
  if (nilai < 0) {
    throw new Error(`Perbandingan campuran ${nama} tidak valid: tidak boleh negatif, diterima ${nilai}.`);
  }
}

// ---------------------------------------------------------------------------
// beta1 — faktor blok tegangan persegi Whitney
// ---------------------------------------------------------------------------

/**
 * Faktor β1 blok tegangan persegi ekivalen Whitney untuk kuat tekan beton fc
 * (MPa), mengikuti formulasi yang diajarkan di buku teks beton bertulang:
 *
 * - fc ≤ 28 MPa            → β1 = 0,85
 * - fc > 28 MPa            → β1 turun 0,05 untuk setiap kenaikan 7 MPa
 * - β1 tidak pernah di bawah 0,65
 *
 * @throws Error (Bahasa Indonesia) bila fc bukan angka terhingga atau ≤ 0.
 */
export function beta1(fc: number): number {
  wajibPositif("Kuat tekan beton fc (MPa)", fc);
  if (fc <= 28) return 0.85;
  const turun = 0.05 * ((fc - 28) / 7);
  return Math.max(0.65, 0.85 - turun);
}

// ---------------------------------------------------------------------------
// Kapasitas lentur balok (blok tegangan Whitney, tulangan tunggal)
// ---------------------------------------------------------------------------

export interface InputKapasitasLenturBalok {
  /** Lebar penampang b, mm. */
  b: number;
  /** Tinggi efektif d (permukaan tekan ke pusat tulangan tarik), mm. */
  d: number;
  /** Luas tulangan tarik As, mm². */
  As: number;
  /** Tegangan leleh baja fy, MPa. */
  fy: number;
  /** Kuat tekan beton fc, MPa. */
  fc: number;
}

export interface HasilKapasitasLenturBalok {
  /** Kedalaman blok tegangan persegi a, mm. */
  a: number;
  /** Kedalaman sumbu netral c, mm. */
  c: number;
  /** Regangan tarik neto tulangan terluar saat beton mencapai 0,003, mm/mm. */
  epsilonT: number;
  /** Momen nominal Mn, kN·m. */
  Mn_kNm: number;
  /** Faktor reduksi kekuatan φ menurut pendekatan terdokumentasi modul ini. */
  phi: number;
  /** Momen tereduksi φMn, kN·m. */
  phiMn_kNm: number;
  /** true bila epsilonT ≥ 0,005 (tension-controlled). */
  tensionControlled: boolean;
  /**
   * Peringatan teks (Bahasa Indonesia) bila penampang TIDAK tension-controlled
   * atau regangan tarik berada di bawah regangan leleh; null bila tidak ada.
   */
  peringatan: string | null;
}

/**
 * Kapasitas lentur nominal balok beton bertulang TULANGAN TUNGGAL (hanya
 * tulangan tarik) dengan blok tegangan persegi Whitney:
 *
 *   a  = As·fy / (0,85·fc·b)
 *   c  = a / β1(fc)
 *   εt = 0,003 · (d − c) / c        (kompatibilitas regangan, beton = 0,003)
 *   Mn = As·fy · (d − a/2)          (N·mm, dikonversi ke kN·m)
 *
 * Asumsi: baja tarik SUDAH leleh. Asumsi ini diperiksa — bila εt < εy
 * (= fy/200000) fungsi memberi peringatan keras karena Mn dari rumus di atas
 * menjadi pendekatan yang tidak konservatif untuk kondisi tersebut.
 *
 * Faktor reduksi φ — pendekatan terdokumentasi modul ini (SATU pilihan,
 * dinyatakan eksplisit): penampang dengan tulangan sengkang biasa (tied).
 * - εt ≥ 0,005 (tension-controlled) → φ = 0,90.
 * - Zona transisi εy < εt < 0,005 → interpolasi linier dari batas bawah
 *   φ = 0,75 pada εt = εy menuju φ = 0,90 pada εt = 0,005:
 *     φ = 0,75 + (0,90 − 0,75) · (εt − εy) / (0,005 − εy)
 * - εt ≤ εy (compression-controlled menurut pendekatan ini) → φ = 0,75.
 * Setiap penampang yang tidak tension-controlled disertai flag peringatan
 * pada field `peringatan`.
 *
 * @throws Error bila ada input tidak fisik (≤ 0 / bukan angka), atau bila
 *         sumbu netral c ≥ d (tulangan "tarik" berada di zona tekan — di luar
 *         cakupan balok tulangan tunggal model ini).
 */
export function kapasitasLenturBalok(
  input: InputKapasitasLenturBalok,
): HasilKapasitasLenturBalok {
  const { b, d, As, fy, fc } = input;
  wajibPositif("Lebar penampang b (mm)", b);
  wajibPositif("Tinggi efektif d (mm)", d);
  wajibPositif("Luas tulangan tarik As (mm²)", As);
  wajibPositif("Tegangan leleh baja fy (MPa)", fy);
  wajibPositif("Kuat tekan beton fc (MPa)", fc);
  if (As >= b * d) {
    throw new Error(
      `Luas tulangan As (${As} mm²) tidak fisik: harus lebih kecil dari luas penampang efektif b×d (${b * d} mm²).`,
    );
  }

  const b1 = beta1(fc);
  const a = (As * fy) / (0.85 * fc * b);
  const c = a / b1;
  if (c >= d) {
    throw new Error(
      `Sumbu netral c (${c.toFixed(2)} mm) mencapai/melebihi tinggi efektif d (${d} mm): ` +
        "penampang terlalu bertulangan (over-reinforced ekstrem) dan berada di luar cakupan model balok tulangan tunggal ini.",
    );
  }

  const epsilonT = (EPSILON_CU * (d - c)) / c;
  const Mn_Nmm = As * fy * (d - a / 2);
  // N·mm → N·m → kN·m memakai konversi satuan engineering-core.
  const Mn_kNm = convertMoment(Mn_Nmm / 1000, "Nm", "kNm");

  const epsilonY = fy / ES_BAJA_TEXTBOOK;
  const tensionControlled = epsilonT >= EPSILON_T_TENSION_CONTROLLED;

  let phi: number;
  if (tensionControlled) {
    phi = PHI_LENTUR_MAKS;
  } else if (epsilonT <= epsilonY) {
    phi = PHI_SENGKANG_BIASA_MIN;
  } else {
    phi =
      PHI_SENGKANG_BIASA_MIN +
      (PHI_LENTUR_MAKS - PHI_SENGKANG_BIASA_MIN) *
        ((epsilonT - epsilonY) / (EPSILON_T_TENSION_CONTROLLED - epsilonY));
  }
  phi = Math.min(PHI_LENTUR_MAKS, Math.max(PHI_SENGKANG_BIASA_MIN, phi));

  let peringatan: string | null = null;
  if (!tensionControlled) {
    peringatan =
      `Penampang TIDAK tension-controlled (εt = ${epsilonT.toFixed(5)} < 0,005): ` +
      `φ diturunkan ke ${phi.toFixed(3)} dengan interpolasi zona transisi untuk sengkang biasa (batas bawah 0,75). ` +
      "Perilaku penampang lebih getas; pertimbangkan menambah kapasitas lewat penampang yang lebih besar atau tulangan yang lebih sedikit.";
    if (epsilonT < epsilonY) {
      peringatan +=
        ` PERINGATAN KERAS: εt (${epsilonT.toFixed(5)}) berada di bawah regangan leleh εy (${epsilonY.toFixed(5)}), ` +
        "sehingga asumsi baja tarik leleh pada rumus Mn Whitney tidak terpenuhi — nilai Mn di sini tidak boleh dipakai sebagai kapasitas desain.";
    }
  }

  return {
    a,
    c,
    epsilonT,
    Mn_kNm,
    phi,
    phiMn_kNm: phi * Mn_kNm,
    tensionControlled,
    peringatan,
  };
}

// ---------------------------------------------------------------------------
// Tulangan minimum balok
// ---------------------------------------------------------------------------

export interface InputTulanganMinimumBalok {
  /** Lebar penampang b, mm. */
  b: number;
  /** Tinggi efektif d, mm. */
  d: number;
  /** Tegangan leleh baja fy, MPa. */
  fy: number;
  /** Kuat tekan beton fc, MPa. */
  fc: number;
}

export interface HasilTulanganMinimumBalok {
  /** Rasio tulangan minimum ρmin (tak berdimensi). */
  rhoMin: number;
  /** Luas tulangan minimum AsMin, mm². */
  AsMin: number;
}

/**
 * Tulangan tarik minimum balok mengikuti formulasi textbook:
 *
 *   ρmin = maks( 0,25·√fc / fy , 1,4 / fy )
 *   AsMin = ρmin · b · d
 *
 * (fc dan fy dalam MPa.) Rumus ini dimaksudkan agar momen retak tidak
 * melampaui kapasitas penampang bertulang minimum; ia BUKAN satu-satunya
 * syarat tulangan minimum pada standar mana pun (susut/suhu, geser, dan
 * tulangan kulit tidak dicakup di sini).
 *
 * @throws Error bila ada input tidak fisik (≤ 0 / bukan angka).
 */
export function tulanganMinimumBalok(
  input: InputTulanganMinimumBalok,
): HasilTulanganMinimumBalok {
  const { b, d, fy, fc } = input;
  wajibPositif("Lebar penampang b (mm)", b);
  wajibPositif("Tinggi efektif d (mm)", d);
  wajibPositif("Tegangan leleh baja fy (MPa)", fy);
  wajibPositif("Kuat tekan beton fc (MPa)", fc);

  const rhoMin = Math.max((0.25 * Math.sqrt(fc)) / fy, 1.4 / fy);
  return { rhoMin, AsMin: rhoMin * b * d };
}

// ---------------------------------------------------------------------------
// Estimasi material beton — metode volume kering textbook
// ---------------------------------------------------------------------------

export interface PerbandinganCampuran {
  /** Bagian semen (default 1). */
  semen?: number;
  /** Bagian pasir (default 2). */
  pasir?: number;
  /** Bagian kerikil (default 3). */
  kerikil?: number;
}

export interface HasilEstimasiMaterialBeton {
  /** Kebutuhan semen, kg. */
  semenKg: number;
  /** Kebutuhan semen dalam zak 50 kg, dibulatkan KE ATAS (ceil). */
  semenZak: number;
  /** Kebutuhan pasir, m³. */
  pasirM3: number;
  /** Kebutuhan kerikil, m³. */
  kerikilM3: number;
}

/** Faktor volume kering textbook (volume bahan kering / volume beton basah). */
export const FAKTOR_VOLUME_KERING = 1.54;
/** Massa jenis semen textbook, kg/m³. */
export const MASSA_JENIS_SEMEN = 1440;
/** Berat satu zak semen yang dipakai modul ini, kg. */
export const BERAT_ZAK_SEMEN_KG = 50;

/**
 * Estimasi kasar kebutuhan material beton dengan METODE VOLUME KERING
 * textbook:
 *
 *   volume kering = 1,54 × volume beton basah
 *   semen (kg)    = volume kering × (bagian semen / total bagian) × 1440
 *   semen (zak)   = ceil( semen kg / 50 )
 *   pasir (m³)    = volume kering × (bagian pasir / total bagian)
 *   kerikil (m³)  = volume kering × (bagian kerikil / total bagian)
 *
 * Ini ESTIMASI KASAR untuk perencanaan awal/logistik — BUKAN analisa harga
 * satuan resmi, BUKAN job-mix design, dan tidak memperhitungkan kadar air
 * agregat, faktor kehilangan (waste), pemadatan di lapangan, atau admixture.
 * Air campuran tidak dihitung oleh fungsi ini.
 *
 * @throws Error bila volume ≤ 0 / bukan angka, ada bagian campuran negatif,
 *         atau total bagian campuran = 0.
 */
export function estimasiMaterialBeton(
  volumeM3: number,
  campuran: PerbandinganCampuran = {},
): HasilEstimasiMaterialBeton {
  wajibPositif("Volume beton (m³)", volumeM3);
  const semen = campuran.semen ?? 1;
  const pasir = campuran.pasir ?? 2;
  const kerikil = campuran.kerikil ?? 3;
  wajibRasioCampuran("semen", semen);
  wajibRasioCampuran("pasir", pasir);
  wajibRasioCampuran("kerikil", kerikil);
  const totalBagian = semen + pasir + kerikil;
  if (totalBagian <= 0) {
    throw new Error(
      "Perbandingan campuran tidak valid: total bagian (semen + pasir + kerikil) harus lebih besar dari 0.",
    );
  }

  const volumeKering = FAKTOR_VOLUME_KERING * volumeM3;
  const semenKg = volumeKering * (semen / totalBagian) * MASSA_JENIS_SEMEN;
  return {
    semenKg,
    semenZak: Math.ceil(semenKg / BERAT_ZAK_SEMEN_KG),
    pasirM3: volumeKering * (pasir / totalBagian),
    kerikilM3: volumeKering * (kerikil / totalBagian),
  };
}
