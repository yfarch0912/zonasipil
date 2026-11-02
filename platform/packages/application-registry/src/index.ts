/**
 * Registry aplikasi ZonaSipil.
 *
 * Sumber data: ~/workspace/zonasipil/apps/build_apps.py (APPS + CATS),
 * dibaca 2026-11-02. Status di situs live memakai label sumber:
 *   available -> 'available', beta -> 'beta',
 *   development -> 'in-development', soon -> 'coming-soon'.
 * Deskripsi diambil verbatim dari field `short` pada sumber.
 */

export type AppStatus = "available" | "beta" | "in-development" | "coming-soon";

export type AppCategory =
  | "structural"
  | "construction"
  | "utilities"
  | "architecture"
  | "learning"
  | "documents";

/**
 * Keadaan implementasi sebuah aplikasi DI MONOREPO zonasipil-platform.
 *
 * Field ini SENGAJA terpisah dari `status`:
 * - `status` adalah status publik di situs live zonasipil.web.id
 *   (diambil dari sumber situs live; jangan diubah dari monorepo ini).
 * - `implementation` adalah keadaan nyata kode di monorepo ini:
 *   - `logic`    — inti logika (fungsi hitung teruji) tersedia di monorepo.
 *   - `ui`       — antarmuka pengguna tersedia (untuk enam app hitung:
 *                  lewat shell web `apps/web`; untuk `structure`: aplikasi
 *                  mandiri penuh di `apps/structure`, BUKAN bagian shell web).
 *   - `deployed` — implementasi MONOREPO INI yang berjalan di situs live.
 *                  Saat ini `false` untuk SEMUA entri: situs live masih
 *                  menjalankan kode statis lama, bukan kode monorepo ini.
 */
export interface AppImplementation {
  logic: boolean;
  ui: boolean;
  deployed: boolean;
}

export interface AppEntry {
  slug: string;
  name: string;
  category: AppCategory;
  status: AppStatus;
  route: string;
  description: string;
  /** True hanya bila slug punya inti logika di monorepo zonasipil-platform. */
  logicCore: boolean;
  /** Keadaan implementasi di monorepo ini — lihat AppImplementation. */
  implementation: AppImplementation;
}

const LOGIC_CORE_SLUGS = new Set([
  "structure",
  "calculator",
  "concrete",
  "steel",
  "foundation",
  "quantity",
  "rab",
]);

/**
 * Slug yang punya UI: enam app hitung lewat shell web `apps/web`, plus
 * `structure` lewat aplikasi mandirinya di `apps/structure`.
 * `deployed` selalu false — lihat komentar AppImplementation.
 */
const UI_SLUGS = new Set(LOGIC_CORE_SLUGS);

type RawApp = {
  slug: string;
  name: string;
  category: AppCategory;
  status: AppStatus;
  description: string;
};

const RAW_APPS: RawApp[] = [
  {
    slug: "structure",
    name: "Zona Structure",
    category: "structural",
    status: "beta",
    description:
      "Analisis struktur rangka 2D: simpul–batang, tumpuan, beban titik & merata, reaksi, gaya N/V/M, dan deformasi.",
  },
  {
    slug: "concrete",
    name: "Zona Concrete",
    category: "structural",
    status: "in-development",
    description:
      "Perancangan elemen beton bertulang — balok, kolom, pelat — dengan alur hitung yang terbuka langkah demi langkah.",
  },
  {
    slug: "steel",
    name: "Zona Steel",
    category: "structural",
    status: "coming-soon",
    description:
      "Perancangan elemen baja: profil, tekuk, dan sambungan — pendamping Zona Structure di keluarga struktur.",
  },
  {
    slug: "foundation",
    name: "Zona Foundation",
    category: "structural",
    status: "coming-soon",
    description:
      "Daya dukung tanah, fondasi dangkal & dalam, dan penurunan — dari parameter tanah ke dimensi pondasi.",
  },
  {
    slug: "rab",
    name: "Zona RAB",
    category: "construction",
    status: "coming-soon",
    description:
      "Rencana Anggaran Biaya: volume, analisa harga satuan, dan rekap yang tertelusur kembali ke gambar.",
  },
  {
    slug: "quantity",
    name: "Zona Quantity",
    category: "construction",
    status: "coming-soon",
    description:
      "Take-off kuantitas dari gambar kerja: beton, bekisting, tulangan, dan tanah dalam satu daftar rapi.",
  },
  {
    slug: "project",
    name: "Zona Project",
    category: "construction",
    status: "coming-soon",
    description:
      "Penjadwalan proyek dan kurva S: urutan pekerjaan, bobot, dan kemajuan terhadap rencana.",
  },
  {
    slug: "calculator",
    name: "Zona Calculator",
    category: "utilities",
    status: "available",
    description:
      "Kalkulator teknik cepat yang sudah berjalan: volume beton (dengan waste) dan berat tulangan dari rumus terbuka.",
  },
  {
    slug: "survey",
    name: "Zona Survey",
    category: "utilities",
    status: "coming-soon",
    description:
      "Hitung ukur tanah: poligon, beda tinggi, dan volume galian–timbunan dari data lapangan.",
  },
  {
    slug: "road",
    name: "Zona Road",
    category: "utilities",
    status: "coming-soon",
    description:
      "Geometrik jalan: alinemen horizontal, lengkung, dan superelevasi untuk perencanaan awal.",
  },
  {
    slug: "bridge",
    name: "Zona Bridge",
    category: "utilities",
    status: "coming-soon",
    description:
      "Perencanaan awal jembatan bentang pendek–menengah: gelagar, beban, dan abutment.",
  },
  {
    slug: "plan",
    name: "Zona Plan",
    category: "architecture",
    status: "coming-soon",
    description:
      "Gambar denah dan potongan 2D yang rapi untuk konsep dan presentasi teknis.",
  },
  {
    slug: "bim",
    name: "Zona BIM",
    category: "architecture",
    status: "coming-soon",
    description:
      "Pemodelan 3D dan koordinasi model: menjembatani gambar, volume, dan struktur.",
  },
  {
    slug: "academy",
    name: "Zona Academy",
    category: "learning",
    status: "coming-soon",
    description:
      "Materi belajar teknik sipil terstruktur: dari statika dasar sampai membaca gambar kerja.",
  },
  {
    slug: "simulator",
    name: "Zona Simulator",
    category: "learning",
    status: "coming-soon",
    description:
      "Simulasi interaktif perilaku struktur: lihat beban berjalan dan struktur merespons.",
  },
  {
    slug: "report",
    name: "Zona Report",
    category: "documents",
    status: "coming-soon",
    description:
      "Susun laporan perhitungan yang rapi: asumsi, rumus, hasil, dan kesimpulan siap kirim.",
  },
  {
    slug: "library",
    name: "Zona Library",
    category: "documents",
    status: "coming-soon",
    description:
      "Perpustakaan dokumen teknik pribadi: gambar, laporan, dan referensi tertata per proyek.",
  },
];

export const APPS: readonly AppEntry[] = RAW_APPS.map((app) => ({
  ...app,
  route: `/apps/${app.slug}`,
  logicCore: LOGIC_CORE_SLUGS.has(app.slug),
  implementation: {
    logic: LOGIC_CORE_SLUGS.has(app.slug),
    ui: UI_SLUGS.has(app.slug),
    deployed: false,
  },
}));

export function listApps(): AppEntry[] {
  return [...APPS];
}

export function getApp(slug: string): AppEntry | undefined {
  return APPS.find((app) => app.slug === slug);
}

export function appsByStatus(status: AppStatus): AppEntry[] {
  return APPS.filter((app) => app.status === status);
}
