/**
 * App "foundation" — daya dukung tanah untuk fondasi dangkal (telapak).
 *
 * Metode: persamaan daya dukung ultimit klasik buku teks (textbook)
 * dengan faktor daya dukung Prandtl–Reissner untuk Nc dan Nq, faktor
 * Nγ menurut Vesic, dan koreksi bentuk sederhana ala Terzaghi untuk
 * telapak persegi.
 *
 * KEJUJURAN METODE: ini metode buku teks klasik untuk pembelajaran
 * dan estimasi awal. Hasilnya BUKAN klaim kesesuaian terhadap SNI
 * atau kode/standar mana pun, dan BUKAN pengganti penyelidikan tanah
 * (sondir/boring, uji laboratorium) maupun penilaian insinyur
 * geoteknik berlisensi untuk desain nyata.
 *
 * Satuan yang dipakai di seluruh modul (konsisten):
 * - kohesi c dalam kPa (kN/m²)
 * - berat volume tanah gamma dalam kN/m³
 * - lebar fondasi B dan kedalaman fondasi Df dalam m
 * - beban dalam kN, tekanan/daya dukung dalam kPa
 * - sudut geser dalam tanah phi dalam derajat
 */

export const APP_SLUG = "foundation";

// ---------------------------------------------------------------------------
// Validasi
// ---------------------------------------------------------------------------

function pastikanBilanganHingga(nama: string, nilai: number): void {
  if (typeof nilai !== "number" || !Number.isFinite(nilai)) {
    throw new Error(`${nama} harus berupa bilangan hingga, diterima: ${nilai}`);
  }
}

function pastikanNonNegatif(nama: string, nilai: number): void {
  pastikanBilanganHingga(nama, nilai);
  if (nilai < 0) {
    throw new Error(`${nama} tidak boleh negatif, diterima: ${nilai}`);
  }
}

function pastikanPositif(nama: string, nilai: number): void {
  pastikanBilanganHingga(nama, nilai);
  if (nilai <= 0) {
    throw new Error(`${nama} harus lebih besar dari nol, diterima: ${nilai}`);
  }
}

function pastikanPhi(phiDerajat: number): void {
  pastikanBilanganHingga("Sudut geser dalam tanah phi", phiDerajat);
  if (phiDerajat < 0 || phiDerajat >= 90) {
    throw new Error(
      `Sudut geser dalam tanah phi harus dalam rentang 0° sampai < 90°, diterima: ${phiDerajat}°`,
    );
  }
}

// ---------------------------------------------------------------------------
// Faktor daya dukung
// ---------------------------------------------------------------------------

export interface FaktorDayaDukung {
  /** Faktor kohesi Nc. */
  Nc: number;
  /** Faktor beban terbagi / overburden Nq. */
  Nq: number;
  /** Faktor berat tanah Nγ (Vesic). */
  Ngamma: number;
}

/**
 * Faktor daya dukung untuk sudut geser dalam tanah `phiDerajat` (derajat).
 *
 * Rumus buku teks klasik:
 * - Nq = e^(π · tan φ) × tan²(45° + φ/2)   (Prandtl–Reissner)
 * - Nc = (Nq − 1) / tan φ                  (Prandtl–Reissner)
 * - Nγ = 2 × (Nq + 1) × tan φ              (Vesic)
 *
 * Catatan koreksi rumus Nγ: bentuk Vesic yang diterbitkan memang
 * memakai (Nq + 1). Bentuk 2 × (Nq − 1) × tan φ kadang tertulis di
 * ringkasan sekunder, tetapi menghasilkan Nγ ≈ 20,09 pada φ = 30° —
 * tidak cocok dengan nilai tabel Vesic yang baku (Nγ ≈ 22,40 pada
 * φ = 30°). Modul ini memakai bentuk (Nq + 1) agar cocok dengan
 * tabel Vesic.
 *
 * Kasus khusus φ = 0 (tanah lempung jenuh, kondisi tak terdrainase):
 * rumus Nc di atas menuju 0/0, sehingga dipakai nilai Terzaghi
 * Nc = 5,7; Nq = 1; Nγ = 0.
 *
 * Nilai acuan (φ = 30°): Nq ≈ 18,40; Nc ≈ 30,14; Nγ ≈ 22,40.
 */
export function faktorDayaDukung(phiDerajat: number): FaktorDayaDukung {
  pastikanPhi(phiDerajat);

  if (phiDerajat === 0) {
    // Nilai Terzaghi untuk φ = 0 — lihat catatan pada dokumentasi fungsi.
    return { Nc: 5.7, Nq: 1, Ngamma: 0 };
  }

  const phiRad = (phiDerajat * Math.PI) / 180;
  const tanPhi = Math.tan(phiRad);
  const Nq =
    Math.exp(Math.PI * tanPhi) *
    Math.tan(Math.PI / 4 + phiRad / 2) ** 2;
  const Nc = (Nq - 1) / tanPhi;
  const Ngamma = 2 * (Nq + 1) * tanPhi;
  return { Nc, Nq, Ngamma };
}

// ---------------------------------------------------------------------------
// Daya dukung ultimit & izin
// ---------------------------------------------------------------------------

export type BentukTelapak = "lajur" | "persegi";

export interface InputDayaDukungUltimit {
  /** Kohesi tanah c, kPa. Harus ≥ 0. */
  c: number;
  /** Sudut geser dalam tanah phi, derajat. Rentang 0° sampai < 90°. */
  phi: number;
  /** Berat volume tanah gamma, kN/m³. Harus > 0. */
  gamma: number;
  /** Lebar fondasi B, m. Harus > 0. */
  B: number;
  /** Kedalaman dasar fondasi Df, m. Harus ≥ 0. */
  Df: number;
  /** Bentuk telapak: "lajur" (memanjang) atau "persegi". */
  bentuk: BentukTelapak;
}

export interface HasilDayaDukungUltimit extends FaktorDayaDukung {
  /** Daya dukung ultimit, kPa. */
  qult: number;
  /** Alias eksplisit `qult` dalam kPa (satuan hasil memang kPa). */
  qultKpa: number;
  /** Tegangan overburden pada dasar fondasi q = gamma × Df, kPa. */
  q: number;
}

/**
 * Daya dukung ultimit fondasi dangkal (keruntuhan geser umum).
 *
 * Dengan q = gamma × Df (tegangan overburden pada dasar fondasi):
 * - lajur:   qult = c·Nc + q·Nq + 0,5 · gamma · B · Nγ
 * - persegi: qult = 1,3·c·Nc + q·Nq + 0,4 · gamma · B · Nγ
 *   (koefisien bentuk 1,3 dan 0,4 adalah koreksi Terzaghi klasik)
 *
 * Contoh acuan: c = 10 kPa, φ = 30°, gamma = 18 kN/m³, B = 1,5 m,
 * Df = 1 m, bentuk lajur → qult ≈ 935,0 kPa.
 */
export function dayaDukungUltimit(
  input: InputDayaDukungUltimit,
): HasilDayaDukungUltimit {
  if (input === null || typeof input !== "object") {
    throw new Error("Masukan daya dukung ultimit harus berupa objek");
  }
  const { c, phi, gamma, B, Df, bentuk } = input;
  pastikanNonNegatif("Kohesi c", c);
  pastikanPhi(phi);
  pastikanPositif("Berat volume tanah gamma", gamma);
  pastikanPositif("Lebar fondasi B", B);
  pastikanNonNegatif("Kedalaman fondasi Df", Df);
  if (bentuk !== "lajur" && bentuk !== "persegi") {
    throw new Error(
      `Bentuk telapak harus "lajur" atau "persegi", diterima: ${String(bentuk)}`,
    );
  }

  const { Nc, Nq, Ngamma } = faktorDayaDukung(phi);
  const q = gamma * Df;
  const qult =
    bentuk === "lajur"
      ? c * Nc + q * Nq + 0.5 * gamma * B * Ngamma
      : 1.3 * c * Nc + q * Nq + 0.4 * gamma * B * Ngamma;

  return { qult, qultKpa: qult, Nc, Nq, Ngamma, q };
}

/**
 * Daya dukung izin: qall = qult / faktor keamanan.
 * Faktor keamanan baku yang lazim dipakai untuk estimasi awal adalah
 * 3, tetapi nilai yang dipakai tetap tanggung jawab perencana.
 */
export function dayaDukungIzin(qult: number, faktorKeamanan = 3): number {
  pastikanNonNegatif("Daya dukung ultimit qult", qult);
  pastikanPositif("Faktor keamanan", faktorKeamanan);
  return qult / faktorKeamanan;
}

// ---------------------------------------------------------------------------
// Ukuran telapak persegi
// ---------------------------------------------------------------------------

export interface InputUkuranTelapakPersegi {
  /** Beban vertikal total pada fondasi, kN. Harus > 0. */
  bebanKn: number;
  /** Kohesi tanah c, kPa. Harus ≥ 0. */
  c: number;
  /** Sudut geser dalam tanah phi, derajat. Rentang 0° sampai < 90°. */
  phi: number;
  /** Berat volume tanah gamma, kN/m³. Harus > 0. */
  gamma: number;
  /** Kedalaman dasar fondasi Df, m. Harus ≥ 0. */
  Df: number;
  /** Faktor keamanan (baku: 3). Harus > 0. */
  faktorKeamanan?: number;
}

export interface HasilUkuranTelapakPersegi {
  /** Sisi telapak persegi terpilih, m (kelipatan 0,05 m). */
  B: number;
  /** Daya dukung izin pada lebar B terpilih, kPa. */
  qall: number;
  /** Tekanan aktual bebanKn / B², kPa. Selalu ≤ qall pada hasil. */
  tekananAktual: number;
}

/**
 * Mencari sisi telapak persegi terkecil (mulai 0,5 m, naik 0,05 m,
 * batas 10 m) yang memenuhi tekanan aktual ≤ daya dukung izin untuk
 * bentuk persegi. Melempar Error bila tidak ada lebar sampai 10 m
 * yang memenuhi.
 *
 * Catatan: berat sendiri fondasi dan tanah di atasnya tidak
 * ditambahkan ke beban — `bebanKn` adalah beban total yang harus
 * sudah mencakup semuanya bila ingin diperhitungkan.
 */
export function ukuranTelapakPersegi(
  input: InputUkuranTelapakPersegi,
): HasilUkuranTelapakPersegi {
  if (input === null || typeof input !== "object") {
    throw new Error("Masukan ukuran telapak harus berupa objek");
  }
  const { bebanKn, c, phi, gamma, Df } = input;
  const faktorKeamanan = input.faktorKeamanan ?? 3;
  pastikanPositif("Beban bebanKn", bebanKn);
  pastikanNonNegatif("Kohesi c", c);
  pastikanPhi(phi);
  pastikanPositif("Berat volume tanah gamma", gamma);
  pastikanNonNegatif("Kedalaman fondasi Df", Df);
  pastikanPositif("Faktor keamanan", faktorKeamanan);

  const B_MAKS = 10;
  // Iterasi berbasis bilangan bulat agar B selalu kelipatan tepat 0,05 m.
  for (let langkah = 0; ; langkah++) {
    const B = Math.round((0.5 + langkah * 0.05) * 100) / 100;
    if (B > B_MAKS) break;
    const { qult } = dayaDukungUltimit({
      c,
      phi,
      gamma,
      B,
      Df,
      bentuk: "persegi",
    });
    const qall = dayaDukungIzin(qult, faktorKeamanan);
    const tekananAktual = bebanKn / (B * B);
    if (tekananAktual <= qall) {
      return { B, qall, tekananAktual };
    }
  }
  throw new Error(
    `Tidak ditemukan ukuran telapak persegi sampai batas ${B_MAKS} m ` +
      `yang memenuhi daya dukung izin untuk beban ${bebanKn} kN`,
  );
}
