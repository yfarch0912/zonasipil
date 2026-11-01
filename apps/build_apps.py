#!/usr/bin/env python3
"""Generator halaman Apps + Akun ZonaSipil (statis, jujur soal status).

Menghasilkan: apps/index.html (katalog), apps/<slug>/index.html (17 aplikasi),
login/, register/, forgot-password/, dashboard/ (UI saja — backend akun belum
ada; formulir TIDAK mengirim data dan menampilkan pemberitahuan jujur).

Jalankan dari root repo: python3 apps/build_apps.py
"""
from pathlib import Path
import html

ROOT = Path(__file__).resolve().parent.parent
APPS_DIR = ROOT / "apps"
BASE = "https://zonasipil.web.id"

CATS = [
    ("structural", "STRUCTURAL ENGINEERING"),
    ("construction", "CONSTRUCTION & ESTIMATION"),
    ("utilities", "CIVIL ENGINEERING UTILITIES"),
    ("architecture", "ARCHITECTURE & MODELING"),
    ("learning", "ENGINEERING LEARNING"),
    ("documents", "ENGINEERING DOCUMENTS"),
]

STATUS_LABEL = {"available": "AVAILABLE", "beta": "BETA", "development": "IN DEVELOPMENT", "soon": "COMING SOON"}

def ic(paths):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths}</svg>'

ICONS = {
    "structure": ic('<path d="M4 21V9l8-5 8 5v12"/><path d="M4 21h16"/><path d="M12 4v17"/><path d="M4 13h16"/>'),
    "concrete": ic('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'),
    "steel": ic('<path d="M5 4h14M5 20h14M9.5 4v16M14.5 4v16"/>'),
    "foundation": ic('<path d="M10 3h4v8h-4z"/><path d="M6 11h12l2 5H4l2-5z"/><path d="M3 20h18"/>'),
    "rab": ic('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 15.5h7M9 8.5h3"/>'),
    "quantity": ic('<path d="M4 17L17 4l3 3L7 20H4v-3z"/><path d="M14 7l3 3"/><path d="M8 15l1.5 1.5M11 12l1.5 1.5"/>'),
    "project": ic('<path d="M4 4v16h16"/><path d="M7 8h7M9 12h9M7 16h5"/>'),
    "calculator": ic('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6"/><path d="M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01"/>'),
    "survey": ic('<circle cx="12" cy="9" r="3.2"/><path d="M12 12.2V15M12 15l-3.5 6M12 15l3.5 6M8.8 9H4M20 9h-4.8"/>'),
    "road": ic('<path d="M7 21L11 3M17 21L13 3"/><path d="M12 18v-2.4M12 12.6V10M12 7.4V5"/>'),
    "bridge": ic('<path d="M3 17h18"/><path d="M4 17c2.7-6 13.3-6 16 0"/><path d="M8 13.6V17M12 11.8V17M16 13.6V17"/><path d="M4 21v-4M20 21v-4"/>'),
    "plan": ic('<rect x="4" y="4" width="16" height="16"/><path d="M4 12h7V4M11 12v8M11 16h9"/><path d="M15.5 20a3.5 3.5 0 0 1 3.5-3.5"/>'),
    "bim": ic('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>'),
    "academy": ic('<path d="M12 6c-2-1.4-4.5-2-8-2v14c3.5 0 6 .6 8 2 2-1.4 4.5-2 8-2V4c-3.5 0-6 .6-8 2z"/><path d="M12 6v14"/>'),
    "simulator": ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15c3-5 6 3 9-2s6 3 9-2"/>'),
    "report": ic('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 17v-4M12 17V9M15 17v-6"/>'),
    "library": ic('<path d="M5 4v16M9.5 4v16"/><path d="M14 5l3.5 14.5"/><path d="M3.5 20h17"/>'),
}

APPS = [
    dict(slug="structure", name="Zona Structure", cat="structural", status="beta",
         short="Analisis struktur rangka 2D: simpul–batang, tumpuan, beban titik & merata, reaksi, gaya N/V/M, dan deformasi.",
         long="Zona Structure adalah aplikasi analisis struktur rangka 2D ZonaSipil — hasil migrasi proyek solver STRUKTURA ke ekosistem ZonaSipil. Pengguna memodelkan simpul dan batang di kanvas, memasang tumpuan dan beban, lalu membaca reaksi, klasifikasi kestabilan, gaya dalam N/V/M, dan visualisasi deformasi yang diskalakan secara eksplisit.",
         features=["Pemodelan simpul & batang di kanvas, dengan pengeditan lewat tabel data", "Beban titik dan beban merata (dua mode), kasus beban yang dapat diaktifkan/dinonaktifkan", "Hasil: reaksi tumpuan, diagram N/V/M, bentuk deformasi dari perpindahan solver asli", "Model tidak stabil ditandai jujur sebagai TIDAK STABIL — tanpa hasil karangan", "Simpan & buka kembali proyek (penyimpanan lokal peramban pada tahap ini)"],
         status_note="Aplikasi tayang di rute ini sejak 2 November 2026 (rute /apps/structure/ kini menyajikan aplikasi interaktifnya langsung, bukan halaman perkenalan). Bukti uji internal: 237 tes unit/benchmark analitis dan 39 skenario E2E lulus, build & typecheck bersih. Status rilis tetap BETA, bukan AVAILABLE: audit keamanan dependensi (npm audit) dan validasi screen-reader masih terbuka."),
    dict(slug="concrete", name="Zona Concrete", cat="structural", status="development",
         short="Perancangan elemen beton bertulang — balok, kolom, pelat — dengan alur hitung yang terbuka langkah demi langkah.",
         long="Zona Concrete direncanakan sebagai aplikasi perancangan elemen beton bertulang: balok, kolom, dan pelat, dengan setiap langkah hitung diperlihatkan — bukan kotak hitam. Fondasi hitungnya sudah hidup lebih dulu di ZonaSipil: kalkulator volume beton (dengan faktor waste) yang dipakai di Zona Calculator adalah modul kubikasi pertamanya.",
         features=["Rencana: desain balok lentur & geser dengan diagram alur hitung", "Rencana: desain kolom dan pelat dua arah", "Sudah tersedia sekarang: hitung volume beton + waste lewat Zona Calculator"],
         status_note="IN DEVELOPMENT — aplikasi mandirinya sedang dibangun di atas modul hitung yang sudah berjalan. Belum ada halaman desain yang dapat dipakai dari rute ini."),
    dict(slug="steel", name="Zona Steel", cat="structural", status="soon",
         short="Perancangan elemen baja: profil, tekuk, dan sambungan — pendamping Zona Structure di keluarga struktur.",
         long="Zona Steel direncanakan untuk perancangan elemen baja: pemilihan profil, pemeriksaan tekuk, dan sambungan sederhana, dengan asumsi dan rumus yang selalu ditampilkan.",
         features=["Rencana: katalog profil baja dan pemeriksaan kapasitas", "Rencana: pemeriksaan tekuk batang tekan", "Rencana: sambungan baut sederhana"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai; halaman ini adalah perkenalan produk yang jujur."),
    dict(slug="foundation", name="Zona Foundation", cat="structural", status="soon",
         short="Daya dukung tanah, fondasi dangkal & dalam, dan penurunan — dari parameter tanah ke dimensi pondasi.",
         long="Zona Foundation direncanakan membantu alur pikir perancangan fondasi: dari parameter tanah dan beban struktur menuju pilihan fondasi dangkal atau dalam, lengkap dengan pemeriksaan daya dukung dan penurunan secara konseptual-terukur.",
         features=["Rencana: daya dukung fondasi dangkal dari parameter tanah", "Rencana: estimasi kapasitas tiang", "Rencana: pemeriksaan penurunan konsolidasi"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="rab", name="Zona RAB", cat="construction", status="soon",
         short="Rencana Anggaran Biaya: volume, analisa harga satuan, dan rekap yang tertelusur kembali ke gambar.",
         long="Zona RAB direncanakan sebagai penyusun Rencana Anggaran Biaya yang tertelusur: setiap baris biaya terhubung ke volume pekerjaan dan analisa harga satuannya, sehingga angka akhir bisa diaudit mundur sampai ke gambar.",
         features=["Rencana: daftar pekerjaan & volume tertaut Zona Quantity", "Rencana: analisa harga satuan per pekerjaan", "Rencana: rekap & kurva S biaya"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="quantity", name="Zona Quantity", cat="construction", status="soon",
         short="Take-off kuantitas dari gambar kerja: beton, bekisting, tulangan, dan tanah dalam satu daftar rapi.",
         long="Zona Quantity direncanakan untuk take-off kuantitas: mengubah dimensi pada gambar kerja menjadi daftar volume beton, bekisting, berat tulangan, dan pekerjaan tanah yang konsisten — pekerjaan yang hari ini paling sering tercecer di spreadsheet lepas.",
         features=["Rencana: take-off beton, bekisting, dan tulangan per elemen", "Rencana: rekap per lantai / per zona", "Sudah tersedia sekarang: volume beton & berat tulangan lewat Zona Calculator"],
         status_note="COMING SOON — masih tahap peta jalan produk. Dua hitungan dasarnya (volume beton, berat tulangan) sudah dapat dipakai lewat Zona Calculator."),
    dict(slug="project", name="Zona Project", cat="construction", status="soon",
         short="Penjadwalan proyek dan kurva S: urutan pekerjaan, bobot, dan kemajuan terhadap rencana.",
         long="Zona Project direncanakan untuk penjadwalan pekerjaan konstruksi: urutan aktivitas, bobot rencana, kurva S, dan pencatatan kemajuan mingguan agar deviasi terlihat sejak dini.",
         features=["Rencana: daftar aktivitas & bobot rencana", "Rencana: kurva S rencana vs realisasi", "Rencana: catatan kemajuan mingguan"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="calculator", name="Zona Calculator", cat="utilities", status="available",
         short="Kalkulator teknik cepat yang sudah berjalan: volume beton (dengan waste) dan berat tulangan dari rumus terbuka.",
         long="Zona Calculator adalah rumah bagi alat hitung cepat ZonaSipil yang sudah berjalan dan terverifikasi di situs ini. Dua alat pertamanya hidup di seksi Kalkulator beranda: Volume Beton dan Berat Tulangan — keduanya menghitung langsung di peramban, tanpa akun, dengan rumus yang ditampilkan terbuka.",
         features=["Volume Beton: V = p × l × t × n, ditambah faktor waste (%) — hasil bersih dan hasil pesan", "Berat Tulangan: w = 0,006165 × d² per meter, dikali panjang total batang", "Menghitung lokal di peramban; tidak ada data yang dikirim ke server"],
         status_note="AVAILABLE — kedua kalkulator aktif dan terverifikasi di beranda ZonaSipil (seksi #kalkulator), termasuk nilai contoh baku: 3,00 m³ bersih / 3,15 m³ dengan waste 5%, dan besi D13 = 1,042 kg/m."),
    dict(slug="survey", name="Zona Survey", cat="utilities", status="soon",
         short="Hitung ukur tanah: poligon, beda tinggi, dan volume galian–timbunan dari data lapangan.",
         long="Zona Survey direncanakan untuk hitungan ukur tanah sehari-hari: penutupan poligon, perataan beda tinggi, dan volume galian–timbunan dari data ukur lapangan.",
         features=["Rencana: hitung poligon & koreksi penutup", "Rencana: beda tinggi dan elevasi titik", "Rencana: volume galian–timbunan metode penampang"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="road", name="Zona Road", cat="utilities", status="soon",
         short="Geometrik jalan: alinemen horizontal, lengkung, dan superelevasi untuk perencanaan awal.",
         long="Zona Road direncanakan membantu perhitungan geometrik jalan pada tahap perencanaan awal: alinemen horizontal, elemen lengkung, dan superelevasi, dengan parameter yang selalu dinyatakan eksplisit.",
         features=["Rencana: elemen lengkung horizontal", "Rencana: superelevasi & pelebaran tikungan", "Rencana: jarak pandang henti konseptual"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="bridge", name="Zona Bridge", cat="utilities", status="soon",
         short="Perencanaan awal jembatan bentang pendek–menengah: gelagar, beban, dan abutment.",
         long="Zona Bridge direncanakan untuk perencanaan awal jembatan bentang pendek–menengah: pemilihan tipe gelagar, distribusi beban, dan pemeriksaan awal abutment — sebagai pendamping kajian jembatan yang diterbitkan ZonaSipil.",
         features=["Rencana: perbandingan tipe gelagar per bentang", "Rencana: distribusi beban lajur ke gelagar", "Rencana: pemeriksaan awal abutment"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="plan", name="Zona Plan", cat="architecture", status="soon",
         short="Gambar denah dan potongan 2D yang rapi untuk konsep dan presentasi teknis.",
         long="Zona Plan direncanakan sebagai alat gambar 2D ringan untuk denah dan potongan: cukup untuk konsep awal dan presentasi teknis, tanpa beban perangkat CAD penuh.",
         features=["Rencana: denah dengan grid & dimensi dasar", "Rencana: potongan dari garis potong denah", "Rencana: ekspor gambar kerja sederhana"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="bim", name="Zona BIM", cat="architecture", status="soon",
         short="Pemodelan 3D dan koordinasi model: menjembatani gambar, volume, dan struktur.",
         long="Zona BIM direncanakan sebagai jembatan pemodelan 3D ZonaSipil: model bangunan yang terhubung ke kuantitas dan ke model analisis struktur, agar gambar, volume, dan hitungan tidak lagi hidup di berkas yang berbeda-beda.",
         features=["Rencana: penampil model 3D di peramban", "Rencana: kuantitas dari elemen model", "Rencana: tautan model ke Zona Structure"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="academy", name="Zona Academy", cat="learning", status="soon",
         short="Materi belajar teknik sipil terstruktur: dari statika dasar sampai membaca gambar kerja.",
         long="Zona Academy direncanakan sebagai jalur belajar terstruktur ZonaSipil: urutan materi dari statika dan mekanika bahan dasar sampai membaca gambar kerja, dibangun di atas kajian dan artikel yang sudah diterbitkan di situs ini.",
         features=["Rencana: jalur belajar bertahap per topik", "Rencana: latihan hitung dengan pembahasan", "Sudah tersedia sekarang: kajian & artikel terbuka di /artikel/"],
         status_note="COMING SOON — jalur belajarnya belum dibuka. Materi dasarnya sudah dapat dibaca gratis di seksi Artikel."),
    dict(slug="simulator", name="Zona Simulator", cat="learning", status="soon",
         short="Simulasi interaktif perilaku struktur: lihat beban berjalan dan struktur merespons.",
         long="Zona Simulator direncanakan sebagai ruang bermain-serius perilaku struktur: beban digeser, tumpuan diganti, dan respons struktur — lendutan, reaksi, garis pengaruh — terlihat bergerak, sebelum masuk ke rumus.",
         features=["Rencana: garis pengaruh balok interaktif", "Rencana: lendutan vs posisi beban", "Rencana: mode jelajah bebas tanpa skor"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="report", name="Zona Report", cat="documents", status="soon",
         short="Susun laporan perhitungan yang rapi: asumsi, rumus, hasil, dan kesimpulan siap kirim.",
         long="Zona Report direncanakan menyusun keluaran aplikasi-aplikasi ZonaSipil menjadi laporan perhitungan yang rapi: asumsi dinyatakan, rumus ditampilkan, hasil tertelusur ke modelnya — format yang layak dilampirkan ke dokumen proyek.",
         features=["Rencana: templat laporan per aplikasi", "Rencana: lampiran asumsi & rumus otomatis", "Rencana: ekspor PDF dari hasil hitung"],
         status_note="COMING SOON — masih tahap peta jalan produk. Belum ada fungsi yang dapat dipakai dari rute ini."),
    dict(slug="library", name="Zona Library", cat="documents", status="soon",
         short="Perpustakaan dokumen teknik pribadi: gambar, laporan, dan referensi tertata per proyek.",
         long="Zona Library direncanakan sebagai rak dokumen teknik pribadi pengguna ZonaSipil: gambar kerja, laporan, dan referensi yang tertata per proyek dan tertaut ke pekerjaan yang menghasilkannya.",
         features=["Rencana: folder dokumen per proyek", "Rencana: tautan dokumen ke hasil hitung", "Rencana: pencarian judul & label dokumen"],
         status_note="COMING SOON — masih tahap peta jalan produk; akan terhubung ke akun ZonaSipil yang kini sudah aktif."),
]

def esc(s): return html.escape(s, quote=True)

def badge(status, cls=""):
    return f'<span class="zs-badge {status} {cls}"><i></i>{STATUS_LABEL[status]}</span>'

def megamenu():
    cols = []
    for cid, clabel in CATS:
        items = "".join(
            f'<a class="zs-mega-item" href="/apps/{a["slug"]}/"><span>{esc(a["name"])}</span>'
            f'<span class="zs-mega-status zs-st-{a["status"]}">{STATUS_LABEL[a["status"]]}</span></a>'
            for a in APPS if a["cat"] == cid)
        cols.append(f'<div><div class="zs-mega-cat">{clabel}</div>{items}</div>')
    return f"""<div class="zs-mega" role="menu" aria-label="Daftar aplikasi ZonaSipil">
      <div class="zs-mega-head">
        <div class="zs-mega-title">ENGINEERING TOOLS.<br/>ONE ECOSYSTEM.</div>
        <p class="zs-mega-desc">Explore digital applications designed to simplify engineering calculations, structural analysis, construction workflows, and technical learning.</p>
      </div>
      <div class="zs-mega-grid">{''.join(cols)}</div>
      <div class="zs-mega-foot"><span>Status setiap aplikasi ditampilkan apa adanya — hanya alat yang benar-benar berjalan yang berlabel AVAILABLE.</span><a href="/apps" class="font-semibold text-[#142D36]">Lihat semua aplikasi →</a></div>
    </div>"""

def header(active=""):
    apps_cls = "cb-nav-link" + (" text-[#168B83]" if active == "apps" else "")
    return f"""<header class="w-full pt-7 pb-5 px-6 md:px-14 lg:px-24 flex items-center justify-between bg-[#F4F3EF] z-40 relative">
    <a href="/" class="select-none" aria-label="ZonaSipil — beranda"><svg viewBox="0 0 620 160" style="height:40px;width:auto;display:block" role="img" aria-label="ZonaSipil"><polyline points="38,60 38,32 128,4 184,27 184,45" fill="none" stroke="#142D36" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><text x="24" y="126" font-family="'Plus Jakarta Sans',sans-serif" font-size="88" font-weight="700" letter-spacing="-1.5"><tspan fill="#142D36">Zona</tspan><tspan fill="#E9A64B">Sipil</tspan></text></svg></a>
    <nav class="hidden md:flex items-center gap-7 lg:gap-9 text-[16px] font-normal text-black">
      <a href="/#services" class="cb-nav-link"><span data-text="Bidang Kajian">Bidang Kajian</span></a>
      <a href="/#projects" class="cb-nav-link"><span data-text="Kajian">Kajian</span></a>
      <div class="zs-apps-wrap">
        <a href="/apps" class="{apps_cls}" aria-haspopup="true"><span data-text="Apps">Apps</span></a>
        {megamenu()}
      </div>
      <a href="/artikel/" class="cb-nav-link"><span data-text="Artikel">Artikel</span></a>
      <a href="/#about" class="cb-nav-link"><span data-text="Tentang">Tentang</span></a>
      <a href="/#workflow" class="cb-nav-link"><span data-text="FAQ">FAQ</span></a>
      <a href="/login" class="zs-login-pill"><i></i>Login</a>
      <a href="/apps" class="cb-btn bg-[#121417] text-[#F4F3EF] px-7 py-3 text-[16px] font-medium" style="--hover-text:#ffffff;">
        <span class="cb-btn-fill bg-[#3B4D61]"></span>
        <span class="cb-btn-text-wrap"><span class="cb-btn-text-inner" data-text="Buka Apps">Buka Apps</span></span>
      </a>
    </nav>
    <div class="md:hidden flex items-center gap-5">
      <a href="/apps" class="text-[15px] font-medium">Apps</a>
      <a href="/login" class="text-[15px] font-semibold">Login</a>
    </div>
  </header>"""

FOOTER = """  <footer class="bg-[#121417] text-[#F4F3EF] mt-24">
    <div class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-24 py-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div>
        <div class="mb-3"><svg viewBox="0 0 620 160" style="height:32px;width:auto;display:block" role="img" aria-label="ZonaSipil"><polyline points="38,60 38,32 128,4 184,27 184,45" fill="none" stroke="#F4F3EF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><text x="24" y="126" font-family="'Plus Jakarta Sans',sans-serif" font-size="88" font-weight="700" letter-spacing="-1.5"><tspan fill="#F4F3EF">Zona</tspan><tspan fill="#E9A64B">Sipil</tspan></text></svg></div>
        <p class="text-white/55 text-[15px] max-w-[420px] leading-relaxed">Pengetahuan dan alat teknik sipil berbahasa Indonesia — dijelaskan dari gambar dan rumus yang terbuka.</p>
      </div>
      <nav class="flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-white/75">
        <a href="/#services" class="hover:text-white">Bidang Kajian</a>
        <a href="/#projects" class="hover:text-white">Kajian</a>
        <a href="/apps" class="hover:text-white">Apps</a>
        <a href="/artikel/" class="hover:text-white">Artikel</a>
        <a href="/#kalkulator" class="hover:text-white">Kalkulator</a>
        <a href="/login" class="hover:text-white">Login</a>
        <a href="https://github.com/yfarch0912/zonasipil" target="_blank" rel="noopener" class="hover:text-white">GitHub</a>
      </nav>
    </div>
    <div class="border-t border-white/10">
      <div class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-24 py-5 text-[13px] text-white/40">© 2026 ZonaSipil · zonasipil.web.id</div>
    </div>
  </footer>
  <script src="/apps/apps.js" defer></script>
</body>
</html>
"""

def head(title, desc, path, extra_css=True):
    return f"""<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}" />
  <link rel="canonical" href="{BASE}{path}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(desc)}" />
  <meta property="og:url" content="{BASE}{path}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css" />
  {'<link rel="stylesheet" href="/apps/apps.css" />' if extra_css else ''}
</head>
<body class="bg-[#F4F3EF] text-[#121417] selection:bg-[#121417] selection:text-[#F4F3EF]">
"""

CAT_LABEL = dict(CATS)

def card(a):
    open_html = (f'<span class="zs-open">Buka aplikasi <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>'
                 if a["status"] == "available" else
                 f'<span class="zs-open">Lihat detail <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>')
    return f"""<a href="/apps/{a['slug']}/" class="zs-app-card zs-card" data-cat="{a['cat']}" data-status="{a['status']}" data-name="{esc(a['name'].lower())} {esc(a['short'].lower())}">
      <div class="flex items-start justify-between gap-3">
        <div class="zs-app-icon">{ICONS[a['slug']]}</div>
        {badge(a['status'])}
      </div>
      <div>
        <h3 class="text-[21px] font-semibold tracking-[-0.02em] leading-tight mb-1.5">{esc(a['name'])}</h3>
        <div class="text-[11px] font-bold tracking-[0.14em] text-[#168B83] mb-2.5">{CAT_LABEL[a['cat']]}</div>
        <p class="text-[14.5px] leading-[1.6] text-black/65">{esc(a['short'])}</p>
      </div>
      {open_html}
    </a>"""

def catalog_page():
    chips = ['<button type="button" class="zs-chip active" data-filter="all">Semua</button>'] + \
            [f'<button type="button" class="zs-chip" data-filter="{cid}">{clabel.title()}</button>' for cid, clabel in CATS] + \
            ['<button type="button" class="zs-chip" data-filter="available">Tersedia Sekarang</button>']
    cards = "\n".join(card(a) for a in APPS)
    body = f"""{head('Apps — Ekosistem Aplikasi Teknik ZonaSipil', 'Direktori aplikasi teknik ZonaSipil: analisis struktur, estimasi, utilitas sipil, pemodelan, pembelajaran, dan dokumen — dengan status ketersediaan yang jujur.', '/apps/')}
{header('apps')}
  <main class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-0 pt-14 md:pt-20 pb-4">
    <div class="text-[12px] font-bold tracking-[0.18em] text-[#168B83] mb-5">ZONASIPIL APPS</div>
    <h1 class="text-[42px] sm:text-[58px] md:text-[72px] font-medium tracking-[-0.035em] leading-[1.02] max-w-[900px]">ENGINEERING TOOLS.<br/>ONE ECOSYSTEM.</h1>
    <p class="mt-6 text-[17px] md:text-[19px] leading-[1.6] text-black/70 max-w-[640px]">Explore digital applications designed to simplify engineering calculations, structural analysis, construction workflows, and technical learning.</p>
    <p class="mt-4 text-[15px] leading-[1.6] text-black/55 max-w-[640px]">Setiap aplikasi menampilkan statusnya apa adanya. Hanya alat yang benar-benar sudah berjalan dan terverifikasi yang berlabel <strong>AVAILABLE</strong> — sisanya ditandai BETA, IN DEVELOPMENT, atau COMING SOON sampai benar-benar siap.</p>
    <div class="mt-12 flex flex-col lg:flex-row lg:items-center gap-5">
      <div class="relative flex-1 max-w-[520px]">
        <input id="zs-search" type="text" placeholder="Cari aplikasi… misalnya: fondasi, RAB, jembatan" class="w-full bg-white border border-black/12 rounded-full py-3.5 pl-6 pr-12 text-[15px] outline-none focus:border-[#168B83]" />
      </div>
      <div class="flex flex-wrap gap-2.5" id="zs-filters">{''.join(chips)}</div>
    </div>
    <div id="zs-count" class="mt-8 text-[13.5px] text-black/50"></div>
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="zs-grid">
{cards}
    </div>
    <div id="zs-noresult" class="hidden mt-10 zs-empty">Tidak ada aplikasi yang cocok dengan pencarian ini.<br/>Coba kata kunci lain, atau jelajahi kategori di atas.</div>
    <section class="mt-24 bg-[#142D36] text-[#F4F3EF] rounded-[28px] p-9 md:p-14">
      <h2 class="text-[30px] md:text-[40px] font-medium tracking-[-0.03em] leading-tight max-w-[640px]">Satu akun untuk semua aplikasi.</h2>
      <p class="mt-4 text-white/65 leading-[1.65] max-w-[620px] text-[16px]">Sistem akun ZonaSipil sudah aktif: daftar dan masuk untuk membuka workspace Anda — kata sandi ter-hash aman di server, sesi terkelola, data tiap pengguna terpisah. Alat berlabel AVAILABLE tetap dapat dipakai langsung tanpa akun.</p>
      <a href="/login" class="inline-flex mt-7 bg-[#F4F3EF] text-[#121417] font-semibold px-7 py-3.5 rounded-full text-[15px]">Masuk / Daftar</a>
    </section>
  </main>
{FOOTER}"""
    return body

def detail_page(a):
    feats = "".join(f'<li class="flex gap-3"><span class="mt-[9px] w-2 h-2 rounded-full bg-[#168B83] flex-none"></span><span>{esc(f)}</span></li>' for f in a["features"])
    if a["status"] == "available":
        entry = '<a href="/#kalkulator" class="zs-submit" style="display:block;text-align:center;text-decoration:none;">Buka Kalkulator di Beranda</a>'
    elif a["status"] == "beta":
        entry = '<div class="zs-notice">Aplikasi interaktif Zona Structure akan tayang di rute ini setelah integrasi selesai. Untuk sekarang, halaman ini adalah halaman produk resminya — belum ada aplikasi yang dapat dibuka dari sini.</div>'
    elif a["slug"] == "concrete":
        entry = '<a href="/#kalkulator" class="zs-submit" style="display:block;text-align:center;text-decoration:none;">Pakai Modul Volumenya di Zona Calculator</a>'
    else:
        entry = '<div class="zs-notice">Aplikasi ini belum dapat dibuka. Silakan jelajahi aplikasi yang sudah AVAILABLE di katalog, atau baca kajian terkait di Artikel.</div>'
    others = [o for o in APPS if o["cat"] == a["cat"] and o["slug"] != a["slug"]]
    others_html = "".join(f'<a href="/apps/{o["slug"]}/" class="underline decoration-[#168B83] decoration-2 underline-offset-4 hover:text-[#168B83]">{esc(o["name"])}</a>' for o in others)
    body = f"""{head(f'{a["name"]} — ZonaSipil Apps', a['short'], f'/apps/{a["slug"]}/')}
{header('apps')}
  <main class="max-w-[980px] mx-auto px-6 md:px-14 lg:px-0 pt-14 md:pt-20 pb-4">
    <a href="/apps" class="text-[14px] font-medium text-black/55 hover:text-black">← Semua aplikasi</a>
    <div class="mt-8 flex flex-wrap items-center gap-4">
      <div class="zs-app-icon" style="width:64px;height:64px;border-radius:18px;">{ICONS[a['slug']]}</div>
      {badge(a['status'])}
      <span class="text-[12px] font-bold tracking-[0.14em] text-[#168B83]">{CAT_LABEL[a['cat']]}</span>
    </div>
    <h1 class="mt-7 text-[40px] sm:text-[54px] md:text-[64px] font-medium tracking-[-0.035em] leading-[1.03]">{esc(a['name'])}</h1>
    <p class="mt-6 text-[18px] leading-[1.65] text-black/75 max-w-[720px]">{esc(a['long'])}</p>
    <div class="mt-12 grid md:grid-cols-[1fr_360px] gap-10 items-start">
      <section>
        <h2 class="text-[22px] font-semibold tracking-[-0.02em] mb-5">Cakupan & fitur</h2>
        <ul class="flex flex-col gap-3.5 text-[15.5px] leading-[1.6] text-black/75">{feats}</ul>
      </section>
      <aside class="bg-white rounded-[22px] p-7 shadow-[0_18px_40px_-28px_rgba(18,20,23,.25)]">
        <div class="text-[11px] font-bold tracking-[0.16em] text-black/45 mb-3">STATUS PENGEMBANGAN</div>
        <p class="text-[14.5px] leading-[1.65] text-black/70">{esc(a['status_note'])}</p>
        <div class="mt-6">{entry}</div>
      </aside>
    </div>
    {f'<p class="mt-14 text-[15px] text-black/60">Masih di kategori yang sama: {others_html}.</p>' if others_html else ''}
  </main>
{FOOTER}"""
    return body

EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>'

AUTH_NOTICE = """<div class="zs-notice zs-auth-result hidden" role="status"></div>
      <p class="mt-5 text-[12.5px] leading-relaxed text-black/45">Kata sandi disimpan sebagai hash aman (scrypt) di server ZonaSipil — tidak pernah sebagai teks biasa. Sesi masuk memakai cookie HttpOnly.</p>"""

def auth_shell(title, desc, path, inner):
    return f"""{head(title, desc, path)}
{header()}
  <main class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-0 pt-14 md:pt-20 pb-4">
    <div class="max-w-[460px] mx-auto bg-white rounded-[26px] p-8 md:p-10 shadow-[0_24px_50px_-30px_rgba(18,20,23,.3)]">
{inner}
    </div>
  </main>
  <script src="/apps/auth.js" defer></script>
{FOOTER}"""

def login_page():
    inner = f"""      <div class="text-[11px] font-bold tracking-[0.16em] text-[#168B83] mb-3">ZONASIPIL ACCOUNT</div>
      <h1 class="text-[32px] font-semibold tracking-[-0.03em] leading-tight mb-2">Masuk ke ZonaSipil</h1>
      <p class="text-[14.5px] text-black/60 leading-relaxed mb-8">Satu akun untuk semua aplikasi, proyek, dan perhitungan tersimpan Anda.</p>
      <form id="form-login" class="zs-auth-form flex flex-col gap-5" novalidate>
        <div class="zs-field"><label for="li-email">Alamat email</label><input id="li-email" type="email" autocomplete="email" placeholder="nama@email.com" /></div>
        <div class="zs-field"><label for="li-pass">Kata sandi</label>
          <div class="relative"><input id="li-pass" type="password" autocomplete="current-password" placeholder="••••••••" /><button type="button" class="zs-eye" data-eye="li-pass" aria-label="Tampilkan kata sandi">{EYE}</button></div>
        </div>
        <div class="flex items-center justify-between text-[14px]">
          <label class="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" class="w-4 h-4 accent-[#168B83]" /> Ingat sesi saya</label>
          <a href="/forgot-password" class="font-medium text-[#142D36] underline decoration-[#168B83] decoration-2 underline-offset-4">Lupa kata sandi?</a>
        </div>
        <button type="submit" class="zs-submit">Masuk</button>
        {AUTH_NOTICE}
      </form>
      <p class="mt-7 text-center text-[14.5px] text-black/60">Belum punya akun? <a href="/register" class="font-semibold text-[#142D36] underline decoration-[#168B83] decoration-2 underline-offset-4">Daftar</a></p>"""
    return auth_shell("Login — ZonaSipil", "Masuk ke akun ZonaSipil: satu akun untuk semua aplikasi, proyek, dan perhitungan tersimpan.", "/login/", inner)

def register_page():
    inner = f"""      <div class="text-[11px] font-bold tracking-[0.16em] text-[#168B83] mb-3">ZONASIPIL ACCOUNT</div>
      <h1 class="text-[32px] font-semibold tracking-[-0.03em] leading-tight mb-2">Buat akun ZonaSipil</h1>
      <p class="text-[14.5px] text-black/60 leading-relaxed mb-8">Akun ini akan menjadi kunci workspace Anda di seluruh ekosistem aplikasi ZonaSipil.</p>
      <form id="form-register" class="zs-auth-form flex flex-col gap-5" novalidate>
        <div class="zs-field"><label for="rg-name">Nama lengkap</label><input id="rg-name" type="text" autocomplete="name" placeholder="Nama Anda" style="padding-right:15px;" /></div>
        <div class="zs-field"><label for="rg-email">Alamat email</label><input id="rg-email" type="email" autocomplete="email" placeholder="nama@email.com" /></div>
        <div class="zs-field"><label for="rg-pass">Kata sandi</label>
          <div class="relative"><input id="rg-pass" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter" /><button type="button" class="zs-eye" data-eye="rg-pass" aria-label="Tampilkan kata sandi">{EYE}</button></div>
          <p class="mt-2 text-[12.5px] text-black/50">Nantinya disimpan sebagai hash aman di server — tidak pernah sebagai teks biasa.</p>
        </div>
        <button type="submit" class="zs-submit">Buat Akun</button>
        {AUTH_NOTICE}
      </form>
      <p class="mt-7 text-center text-[14.5px] text-black/60">Sudah punya akun? <a href="/login" class="font-semibold text-[#142D36] underline decoration-[#168B83] decoration-2 underline-offset-4">Masuk</a></p>"""
    return auth_shell("Daftar — ZonaSipil", "Buat akun ZonaSipil untuk workspace aplikasi, proyek, dan perhitungan tersimpan.", "/register/", inner)

def forgot_page():
    inner = f"""      <div class="text-[11px] font-bold tracking-[0.16em] text-[#168B83] mb-3">ZONASIPIL ACCOUNT</div>
      <h1 class="text-[32px] font-semibold tracking-[-0.03em] leading-tight mb-2">Lupa kata sandi</h1>
      <p class="text-[14.5px] text-black/60 leading-relaxed mb-8">Masukkan email akun Anda — saat sistem akun aktif, tautan atur ulang yang aman dan berbatas waktu akan dikirim ke sana.</p>
      <form id="form-forgot" class="zs-auth-form flex flex-col gap-5" novalidate>
        <div class="zs-field"><label for="fp-email">Alamat email</label><input id="fp-email" type="email" autocomplete="email" placeholder="nama@email.com" /></div>
        <button type="submit" class="zs-submit">Kirim Tautan Atur Ulang</button>
        {AUTH_NOTICE}
      </form>
      <p class="mt-7 text-center text-[14.5px] text-black/60">Ingat kata sandi Anda? <a href="/login" class="font-semibold text-[#142D36] underline decoration-[#168B83] decoration-2 underline-offset-4">Kembali masuk</a></p>"""
    return auth_shell("Lupa Kata Sandi — ZonaSipil", "Atur ulang kata sandi akun ZonaSipil dengan tautan aman berbatas waktu.", "/forgot-password/", inner)

def dash_icon(p):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'

def dashboard_page():
    links = [
        ("Overview", '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>', True),
        ("My Applications", '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>', False),
        ("Recent Projects", '<path d="M4 4v16h16"/><path d="M7 8h7M9 12h9M7 16h5"/>', False),
        ("Saved Calculations", '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6"/>', False),
        ("Saved Models", '<path d="M4 21V9l8-5 8 5v12"/><path d="M4 21h16"/>', False),
        ("Reports", '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/>', False),
        ("Account Settings", '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.2 3.8-4.5 7-4.5s5.8 1.3 7 4.5"/>', False),
    ]
    nav = "".join(f'<a href="#" class="zs-dash-link{" active" if act else ""}" onclick="return false">{dash_icon(p)}<span>{n}</span></a>' for n, p, act in links)
    avail = "".join(f"""<a href="/apps/{a['slug']}/" class="zs-app-card" style="padding:20px;">
        <div class="flex items-start justify-between gap-3"><div class="zs-app-icon">{ICONS[a['slug']]}</div>{badge(a['status'])}</div>
        <div><h3 class="text-[18px] font-semibold tracking-[-0.02em]">{esc(a['name'])}</h3><p class="text-[13.5px] text-black/60 leading-relaxed mt-1">{esc(a['short'])}</p></div>
      </a>""" for a in APPS if a["status"] in ("available", "beta"))
    body = f"""{head('Dashboard — ZonaSipil', 'Workspace pengguna ZonaSipil: aplikasi, proyek, perhitungan, model, dan laporan tersimpan.', '/dashboard/')}
{header()}
  <main class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-0 pt-10 md:pt-14 pb-4">
    <div class="bg-white rounded-[22px] px-7 py-6 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-[0_18px_40px_-28px_rgba(18,20,23,.25)]">
      <div>
        <div class="text-[11px] font-bold tracking-[0.16em] text-black/45 mb-1">MASUK SEBAGAI</div>
        <div class="text-[19px] font-semibold leading-tight"><span id="dash-user-name">Memuat…</span></div>
        <div class="text-[14px] text-black/55" id="dash-user-email"></div>
      </div>
      <button type="button" id="btn-logout" class="zs-login-pill">Keluar</button>
    </div>
    <div class="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
      <aside class="bg-[#142D36] rounded-[24px] p-5 lg:sticky lg:top-6">
        <div class="text-[11px] font-bold tracking-[0.16em] text-white/40 px-2 pb-3">WORKSPACE</div>
        <nav class="flex lg:flex-col gap-1 overflow-x-auto">{nav}</nav>
        <div class="hidden lg:block mt-8 px-2 text-[13px] leading-relaxed text-white/45">Proyek dan perhitungan yang Anda simpan dari aplikasi ZonaSipil akan terkumpul di workspace ini.</div>
      </aside>
      <section>
        <h1 class="text-[34px] md:text-[42px] font-medium tracking-[-0.03em] leading-tight">Halo, <span id="dash-overview-name">…</span></h1>
        <p class="mt-3 text-black/60 text-[16px] leading-relaxed max-w-[620px]">Aplikasi yang sudah dapat dipakai hari ini, dan ruang-ruang workspace yang akan aktif bersama sistem akun.</p>
        <h2 class="mt-10 mb-4 text-[15px] font-bold tracking-[0.1em] text-black/50">APLIKASI AKTIF & BETA</h2>
        <div class="grid sm:grid-cols-2 gap-5">{avail}</div>
        <div class="grid sm:grid-cols-2 gap-5 mt-5">
          <div><h2 class="mb-3 text-[15px] font-bold tracking-[0.1em] text-black/50">RECENT PROJECTS</h2><div class="zs-empty">Belum ada proyek tersimpan.<br/>Proyek dari aplikasi ZonaSipil akan muncul di sini.</div></div>
          <div><h2 class="mb-3 text-[15px] font-bold tracking-[0.1em] text-black/50">SAVED CALCULATIONS</h2><div class="zs-empty">Belum ada perhitungan tersimpan.<br/>Penyimpanan hasil kalkulator ke akun menyusul pada fase berikutnya.</div></div>
          <div><h2 class="mb-3 text-[15px] font-bold tracking-[0.1em] text-black/50">SAVED MODELS</h2><div class="zs-empty">Belum ada model tersimpan.<br/>Model Zona Structure akan tersimpan di sini setelah integrasi akun selesai.</div></div>
          <div><h2 class="mb-3 text-[15px] font-bold tracking-[0.1em] text-black/50">REPORTS</h2><div class="zs-empty">Belum ada laporan.<br/>Laporan perhitungan yang Anda susun akan terkumpul di sini.</div></div>
        </div>
      </section>
    </div>
  </main>
  <script src="/apps/auth.js" defer></script>
{FOOTER}"""
    return body

def main():
    (APPS_DIR / "index.html").write_text(catalog_page(), encoding="utf-8")
    for a in APPS:
        # /apps/structure/ is served by the Zona Structure web app
        # itself (integrated 2026-11-02): never overwrite its
        # index.html with a generated detail page. The app remains
        # listed in the catalogue above.
        if a["slug"] == "structure":
            continue
        d = APPS_DIR / a["slug"]; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(detail_page(a), encoding="utf-8")
    for name, page in [("login", login_page()), ("register", register_page()),
                       ("forgot-password", forgot_page()), ("dashboard", dashboard_page())]:
        d = ROOT / name; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page, encoding="utf-8")
    print(f"OK: katalog + {len(APPS)} detail aplikasi + 4 halaman akun")

if __name__ == "__main__":
    main()
