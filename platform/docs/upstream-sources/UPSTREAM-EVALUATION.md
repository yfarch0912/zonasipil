# Evaluasi Upstream Open-Source — Ekosistem Aplikasi Teknik Sipil ZonaSipil

**Tanggal riset:** Senin, 2 November 2026
**Ruang lingkup:** Solver struktur 2D/3D dan properti penampang untuk Zona Structure dan aplikasi teknik sipil ZonaSipil berikutnya, dalam konteks monorepo / aplikasi web TypeScript.
**Metode:** Membuka halaman utama GitHub dan halaman commits tiap kandidat (2 November 2026), membaca README, metadata repositori (lisensi, bintang, fork, jumlah commit, tanggal dibuat, rilis), serta memeriksa basis lokal `~/workspace/zonasipil-structure` (README, LICENSE, NOTICE, `package.json`, `docs/MIGRATION-RECORD.md`, `docs/LICENSING_AUDIT.md`). Perintah `git` tidak dijalankan. Klaim di dokumen ini hanya yang terlihat dari halaman/file tersebut; data yang tidak terlihat ditulis eksplisit sebagai **"tidak terverifikasi dari halaman"**.

> **Catatan kegagalan akses:** Halaman `sectionproperties` gagal dibuka pada percobaan pertama (kesalahan pengambilan sumber dari tool, tanpa status HTTP sumber). Percobaan itu tidak diulang, sehingga seluruh data kandidat tersebut berstatus tidak terverifikasi dalam evaluasi ini — lihat §6. Ini bukan penilaian negatif terhadap proyeknya; kandidat itu hanya belum bisa dinilai dari bukti.

---

## 1. Keputusan Ringkas

**Keputusan default TIDAK terkalahkan: engine Zona Structure milik user sendiri di `~/workspace/zonasipil-structure` tetap menjadi fondasi Zona Structure.**

Tidak ada satu kandidat pun yang secara bersamaan mengalahkan basis lokal pada keempat syarat yang ditetapkan brief: (1) lisensi lebih aman, (2) bentuk library murni, (3) aktif terawat, dan (4) cakupan setara. Yang terjadi justru kandidat-kandidat kuat masing-masing gugur pada satu syarat berbeda:

- **Stabileo** cakupannya paling luas, tetapi lisensinya **AGPL-3.0** (copyleft jaringan — paling tidak aman untuk platform komersial) dan stack-nya Rust/Svelte, bukan TypeScript/React.
- **PyNite** adalah library murni MIT yang paling matang, tetapi berbahasa **Python** — tidak bisa berjalan sebagai engine browser TypeScript tanpa lapisan server atau porting total.
- **Awatif** MIT dan TypeScript (dengan solver referensi TypeScript), tetapi bentuknya aplikasi/harness utuh 3D, dan di README-nya tidak terlihat pemeriksaan desain SNI/RC/baja yang sudah dimiliki basis lokal.
- **OpenAnstruk-2D** adalah yang paling cocok secara stack dan konteks SNI — justru karena ia **sudah menjadi fondasi** basis lokal: `NOTICE` lokal mencatat STRUKTURA (yang dimigrasikan menjadi ZonaSipil Structure) dibangun di atas fork OpenANSTRUK-2D. Mengganti engine lokal dengan upstream mentahnya berarti membuang tambahan lokal (benchmark analitik, suite test, generator laporan, preset kombinasi SNI 1727, manajemen proyek) tanpa memperoleh kemampuan baru yang terverifikasi.

| Kandidat | Lisensi | Bentuk | Keputusan |
|---|---|---|---|
| Basis lokal — ZonaSipil Structure (`zonasipil-structure`) | MIT | Aplikasi + engine TypeScript teruji lokal | **PERTAHANKAN sebagai fondasi** |
| OpenAnstruk-2D | MIT | Aplikasi web utuh | **ADAPTASI SELEKTIF** (upstream yang sudah terinkorporasi; pantau & ambil perbaikan terverifikasi saja) |
| Awatif | MIT | Aplikasi / harness utuh (komponen terstruktur) | **ADAPTASI SELEKTIF** (kandidat referensi/cross-check untuk solver 3D masa depan; bukan pengganti engine 2D sekarang) |
| Stabileo | AGPL-3.0 | Platform/aplikasi utuh besar | **TOLAK** (lisensi AGPL + stack Rust/Svelte) |
| PyNite | MIT | Library Python murni | **ADAPTASI SELEKTIF** (oracle validasi silang offline/CI, bukan engine web) |
| sectionproperties | Tidak terverifikasi dari halaman | Tidak terverifikasi dari halaman | **TOLAK untuk saat ini** (belum dapat dinilai; evaluasi ulang bila akses tersedia) |
| anaStruct | LGPL-3.0 | Library Python | **TOLAK** (Python untuk runtime web TS + LGPL; cakupan 2D-nya tumpang tindih dengan engine yang sudah dimiliki) |

---

## 2. Basis Pembanding (Default): ZonaSipil Structure Lokal

Fakta dari file lokal yang dibaca:

- **Lokasi / provenans:** `~/workspace/zonasipil-structure`. Menurut `docs/MIGRATION-RECORD.md`, proyek ini adalah migrasi STRUKTURA 1.0.0 (MIT) pada 2026-11-01; menurut `NOTICE`, fondasi pihak ketiganya adalah OpenAnstruk-2D (fork `ziyad-cpu/OpenANSTRUK-2Dtest` @ `31cc234`; upstream `adrianulza/OpenANSTRUK-2D` @ `819cad9`).
- **Lisensi persis:** MIT — file `LICENSE` lokal berbunyi "MIT License, Copyright (c) 2026 OpenAnstruk Contributors"; `package.json` mencantumkan `"license": "MIT"`. `docs/LICENSING_AUDIT.md` menegaskan kewajiban MIT (sertakan copyright + teks lisensi) sudah dipenuhi oleh `LICENSE` dan `NOTICE` yang dipertahankan, tidak ada dependensi GPL/AGPL, dan penggunaan komersial diizinkan MIT.
- **Bahasa & stack:** TypeScript, React 19, Vite 6, Tailwind CSS 4 (dari `package.json` lokal; dependensi runtime tambahan Radix UI, semuanya terlisensi permisif menurut `docs/LICENSING_AUDIT.md`).
- **Cakupan (dari `README.md` lokal):** Analisis 2D di browser — pemodelan node/member/tumpuan, kasus beban dan kombinasi kode, solver Direct Stiffness untuk frame + truss, diagram reaksi/gaya geser/momen/aksial dan lendutan, pemeriksaan desain beton bertulang subset SNI 2847:2019 dan baja subset SNI 1729:2020 dengan ketertelusuran pasal, kombinasi LRFD SNI 1727:2020 Pasal 2.3.2, generator laporan perhitungan dari hasil solver aktual, 7 proyek contoh dengan hasil harapan yang diketahui independen. Yang **belum ada** (dicatat jujur di README lokal): mode kalkulator standalone, analisis/visualisasi 3D, integrasi lisensi platform nyata.
- **Pengujian:** 237 unit test tercatat (angka dari brief penugasan evaluasi ini; suite lokal dijalankan via Vitest menurut `package.json`, dan README lokal menyebut benchmark terhadap solusi analitik bentuk-tertutup dengan gerbang ≤ 0,1%). Riset ini tidak menjalankan ulang suite tersebut.
- **Kecocokan integrasi:** Sempurna secara definisi — sudah berada di ekosistem ZonaSipil, sudah memakai skema ekspor `struktura-project` dan kontrak platform `zonasipil.app.json`.
- **Risiko:** Ketergantungan pada upstream muda (lihat §3); mode 3D dan properti penampang umum belum ada; utang ikon `lucide-react` tercatat di dokumen migrasi lokal.

**Implikasi penting:** karena fondasi lokal sudah merupakan turunan OpenAnstruk-2D yang dilegalkan MIT dan diberi lapisan pengujian + konteks SNI tambahan, pertanyaan evaluasinya bukan "OpenAnstruk atau engine lokal", melainkan "apakah ada kandidat lain yang memberi alasan cukup untuk membuang lapisan yang sudah teruji itu". Jawabannya, dari bukti di bawah, tidak.

---

## 3. OpenAnstruk-2D

- **URL:** https://github.com/adrianulza/OpenAnstruk-2D (judul halaman GitHub yang dibuka: `adrianulza/OpenANSTRUK-2D`)
- **Lisensi persis:** MIT License (MIT) — dari metadata repositori dan file `LICENSE` di root; README menutup dengan "MIT — free to use, modify, and distribute".
- **Bahasa & stack:** React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · shadcn/ui · Canvas API (bagian "Tech Stack" README). Kebutuhan dev lokal: `npm install` / `npm run dev`.
- **Bentuk:** **Aplikasi web utuh**, bukan library murni — ada landing page, `app.html`, menu File simpan/muat JSON, dan `wrangler.toml`; tidak terlihat klaim paket npm yang bisa di-embed sebagai library di halaman yang dibuka.
- **Aktivitas maintenance:** Repositori dibuat **2026-04-14**; **86 commit, 39 bintang, 57 fork, 0 rilis**. Halaman commits menunjukkan commit terakhir terlihat pada **27 September 2026**. Repositori tidak diarsipkan. Artinya: aktif dalam hitungan minggu terakhir sebelum riset, tetapi proyeknya **sangat muda** (baru ada sejak April 2026) dan belum pernah merilis versi bertag.
- **Cakupan kemampuan:** Solver 2D Direct Stiffness Method yang berjalan sepenuhnya di browser; pemodelan interaktif node, member frame + truss, tumpuan, snap-to-grid; beban titik dan beban terbagi rata (mode sumbu lokal dan global); diagram gaya geser, momen lentur, gaya aksial, dan deformasi; pemeriksaan desain RC (balok + kolom persegi/lingkaran, ACI 318-25 / SNI 2847:2019) dan baja (IWF / RHS / CHS / tee / siku tunggal, AISC 360-16 / SNI 1729:2020); parametric template builder untuk balok, frame, dan truss; undo/redo; simpan/muat model JSON; bekerja offline setelah pemuatan pertama. **Tidak terlihat** kemampuan 3D atau properti penampang umum (section properties) di README yang dibuka.
- **Kecocokan integrasi ke TypeScript ZonaSipil:** Paling tinggi dari semua kandidat — stack identik (React/TypeScript/Vite/Tailwind) dan konteks kode SNI sama. Namun kecocokan ini sudah **terealisasi**: engine lokal adalah turunannya (lihat §2), lengkap dengan `LICENSE`/`NOTICE` yang mempertahankan atribusi MIT-nya.
- **Risiko:** (1) Usia proyek sangat muda dan basis kontributornya tidak terverifikasi dari halaman; kelangsungan jangka panjang belum terbukti. (2) 0 rilis — tidak ada titik versi stabil untuk dipatok. (3) Mengadopsi upstream mentah sebagai pengganti akan mengimpor ulang kode yang secara fungsional sudah dimiliki, sambil kehilangan benchmark, test, dan laporan lokal. (4) Fork yang menjadi basis lokal adalah fork pihak ketiga (`ziyad-cpu/OpenANSTRUK-2Dtest`), jadi penyelarasan ulang ke upstream memerlukan audit diff tersendiri — tidak terverifikasi dari halaman berapa besar divergensinya.

**Keputusan: ADAPTASI SELEKTIF.** Tetap jadikan upstream ini sumber pantauan: ambil (cherry-pick) perbaikan solver/desain dari upstream hanya setelah diverifikasi terhadap benchmark dan suite test lokal, dengan atribusi MIT dipertahankan. **Bukan** pengganti engine lokal.

---

## 4. Awatif

- **URL:** https://github.com/madil4/awatif
- **Lisensi persis:** MIT License (MIT) — dari metadata repositori dan file `LICENSE` di root; README: "MIT © Mohamed Adil" dan "MIT-licensed, no install required".
- **Bahasa & stack:** TypeScript untuk aplikasi dan solver referensi, ditambah solver linear **C++ yang dikompilasi ke WASM** sebagai penggerak aplikasi (README, bagian "Status"). Struktur repo yang terlihat: `components/`, `ui/`, `main.ts`, `index.html`, `package.json`; membutuhkan Node.js 22+; pengujian dengan `npm test`. Framework UI React **tidak disebutkan** di halaman yang dibuka — bagian Contributing justru menyebut ekstensi lit-html, jadi UI-nya tidak terverifikasi sebagai React.
- **Bentuk:** **Aplikasi / harness utuh** ("The open-source harness for agentic structural engineering"), bukan library yang dipublikasikan — cara pakai di README adalah clone lalu `npm run dev`, dan `npm run build` menghasilkan bundle aplikasi. Sisi baiknya: kode intinya terstruktur sebagai `components/` yang terpisah dari `ui/` (analysis, design, mesh, loads, supports, releases, local-axes, imperfections), sehingga batas komponennya relatif jelas untuk dipelajari.
- **Aktivitas maintenance:** Repositori dibuat **2023-01-26**; **769 commit, 187 bintang, 32 fork, 6 rilis (4 tag)**. Halaman commits menunjukkan commit terakhir terlihat pada **15 Oktober 2026**. Ini kandidat TypeScript yang paling lama hidupnya di antara tiga kandidat wajib.
- **Cakupan kemampuan:** Menurut README ("Awatif 3.4 is a linear static 3D frame tool"): frame 3D linear statik dari elemen balok dua-node dengan enam DOF per node, pelepasan momen ujung (end moment releases), sumbu lokal, dan line meshing; beban titik dan terbagi rata dalam kasus beban mati, hidup, dan angin dengan kombinasi ULS; tumpuan titik jepit, sendi, dan rol; imperfeksi awal; penampang generik (E, A, Iy, Iz, G, J) dengan laporan properti penampang per member; solver C++/WASM plus solver TypeScript dengan hasil yang sama sebagai referensi yang mudah dibaca. **Tidak terlihat** di halaman yang dibuka: analisis 2D khusus, pemeriksaan desain beton/baja, apalagi rujukan SNI.
- **Kecocokan integrasi ke TypeScript ZonaSipil:** Menengah-tinggi untuk masa depan 3D — solver referensi TypeScript-nya adalah aset paling menarik karena bisa dibaca/diadaptasi dalam bahasa yang sama. Tetapi mengintegrasikannya sekarang berarti (a) mengganti model 2D teruji dengan model 3D yang berbeda ruang lingkupnya, (b) menambah rantai build C++/WASM, dan (c) tetap harus membangun sendiri lapisan desain SNI di atasnya.
- **Risiko:** (1) Posisi proyek bergeser ke "harness agentik" dan kursus berbayar (€399 disebutkan di README) — prioritas roadmap-nya tidak terverifikasi selaras dengan kebutuhan ZonaSipil. (2) Solver produksi utamanya C++/WASM; yang TypeScript dinyatakan sebagai "reference" — status kesetaraan hasil keduanya adalah klaim README, belum diverifikasi independen dalam riset ini. (3) Tanpa cakupan desain SNI yang terlihat, ia tidak bisa menggantikan engine lokal secara fungsional.

**Keputusan: ADAPTASI SELEKTIF.** Kandidat penantang terkuat untuk kebutuhan **3D di masa depan**: simpan sebagai referensi utama (dan calon cross-check) bila Zona Structure menambah solver 3D, terutama solver referensi TypeScript-nya. Bukan pengganti fondasi 2D saat ini.

---

## 5. Stabileo

- **URL:** https://github.com/lambdaclass/stabileo
- **Lisensi persis:** **GNU Affero General Public License v3.0 (AGPL-3.0)** — dari metadata repositori, file `LICENSE` di root, dan README ("published under AGPL-3.0", "License: AGPL-3.0"). Repo juga memuat `THIRD_PARTY_NOTICES.md`.
- **Bahasa & stack:** Engine **Rust dikompilasi ke WebAssembly** (Direct Stiffness Method; elemen pelat/cangkang MITC4 dan DKT; faktorisasi Cholesky sparse); antarmuka **Svelte 5 dan TypeScript**, Three.js untuk 3D, KaTeX untuk persamaan langkah-demi-langkah; backend akun opsional **Elixir/Phoenix + PostgreSQL** (folder `backend/`). Build lokal memerlukan Rust + wasm-pack dan Node.js 22.
- **Bentuk:** **Platform/aplikasi utuh yang sangat besar** — struktur root yang terlihat mencakup `engine/`, `web/`, `backend/`, `ai-backend/`, `infra/`, `functions/api`, `specs/`, `verify/`, `tools/`, plus Dockerfile, docker-compose, dan flake Nix. Bukan library yang bisa diangkat sebagian dengan ringan.
- **Aktivitas maintenance:** Repositori dibuat **2026-03-03**; **4.864 commit, 106 bintang, 20 fork, 6 rilis** — volume commit terbesar dari semua kandidat. Namun **tanggal commit terakhir tidak terverifikasi dari halaman**: halaman commits yang dibuka tidak menampilkan tanggal per commit (salah satu pesan commit teratas menyebut roadmap "as of 2026-11-01", yang menunjukkan aktivitas di sekitar tanggal itu, tetapi itu isi pesan commit, bukan tanggal commit yang terverifikasi).
- **Cakupan kemampuan:** Terluas dari semua kandidat. Mode Basic (tersedia): frame dan truss 2D **dan** 3D, diagram aksial/geser/momen, tegangan, analisis kinematik, analisis penampang (section analysis), orde dua, tekuk (buckling), analisis modal, keruntuhan plastis, garis pengaruh, dan metode kekakuan langkah-demi-langkah. Daftar kemampuan engine di README lebih jauh lagi: statik linear 2D/3D, P-Δ, respons spektrum, riwayat waktu, beban bergerak, analisis non-linear, elemen cangkang MITC4/MITC9, dan lain-lain — dengan catatan eksplisit README bahwa engine mengimplementasikan **lebih banyak daripada yang diekspos mode mana pun saat ini**. Mode PRO (elemen hingga, pelat/dinding, impor DXF, analisis dinamis/non-linear bertahap) dan mode Education serta Stabileo AI berstatus **"In development"**. Validasi diklaim terhadap solusi analitik, benchmark NAFEMS, ANSYS Verification Manual, dan Code_Aster (file `BENCHMARKS.md` dirujuk; isinya tidak dibuka dalam riset ini).
- **Kecocokan integrasi ke TypeScript ZonaSipil:** Rendah. Satu-satunya titik temu adalah TypeScript di lapisan UI — tetapi UI-nya Svelte 5 (bukan React lokal) dan engine-nya Rust/WASM, sehingga integrasi berarti mengadopsi seluruh platform asing atau tidak sama sekali.
- **Risiko:** (1) **Lisensi adalah penentu.** AGPL-3.0 adalah copyleft jaringan: penggunaan kode AGPL yang dimodifikasi untuk layanan yang diakses lewat jaringan memicu kewajiban menyediakan source code koresponden kepada pengguna jaringan. Itu bertolak belakang dengan basis MIT/permisif ZonaSipil dan berisiko menular ke bagian platform yang terhubung — risiko hukum/komersial, bukan sekadar teknis. (2) Kompleksitas monolit (Rust + Svelte + Elixir/Phoenix + PostgreSQL + Nix) jauh melampaui kebutuhan Zona Structure. (3) Sebagian kemampuan headline masih "in development" di UI.

**Keputusan: TOLAK.** Cakupan teknisnya memang unggul, tetapi AGPL-3.0 gagal pada syarat lisensi yang justru menjadi gerbang pertama, dan stack-nya tidak menyatu dengan monorepo TypeScript/React ZonaSipil. Kodenya tidak boleh diadopsi atau diadaptasi; penggunaannya sebagai pembanding konseptual fitur (tanpa menyalin kode) adalah batas maksimalnya.

---

## 6. PyNite

- **URL:** https://github.com/JWock82/PyNite (judul halaman: `JWock82/Pynite`)
- **Lisensi persis:** MIT License (MIT) — dari metadata repositori dan file `LICENSE` di root, serta badge lisensi di README.
- **Bahasa & stack:** **Python** murni — instalasi via `pip install PyniteFEA[all]`, distribusi lewat `pyproject.toml`; README versi terbaru menyebut kebutuhan NumPy ≥ 2.4 dan bahwa SciPy sudah lama menjadi dependensi wajib.
- **Bentuk:** **Library murni** — bentuk ideal secara arsitektur ("A 3D structural engineering finite element library for Python", kelas model `FEModel3D`), lengkap dengan folder `Examples`, `Testing`, dan dokumentasi Read the Docs. Dari semua kandidat, ini satu-satunya library murni yang matang.
- **Aktivitas maintenance:** Repositori dibuat **2017-11-03** — tertua di daftar ini; **2.231 commit, 774 bintang, 158 fork, 94 rilis (95 tag)**. Halaman commits menunjukkan commit terakhir terlihat pada **31 Oktober 2026**, dan README-nya memuat catatan perubahan terperinci hingga versi 3.2.1. Dari sisi kematangan dan keberlanjutan, ini kandidat terkuat secara keseluruhan.
- **Cakupan kemampuan:** Analisis statik 3D elastis; analisis P-Δ frame; analisis modal frame; analisis pushover non-linear frame baja; beban titik member, beban terbagi bervariasi linear, dan beban nodal; kasus beban dan kombinasi beban; diagram dan hasil geser/momen/defleksi per member; elemen hanya-tarik / hanya-tekan; elemen dan tumpuan pegas (termasuk satu arah); elemen pelat segiempat (formulasi DKMQ) dan pelat persegi; meshing dasar; reaksi tumpuan; rendering model dan bentuk terdeformasi; perangkat shear wall dan fondasi rakit (mat foundation); laporan PDF. **Tidak terlihat** properti penampang sebagai fokus (bukan pustaka section-properties) dan tidak ada konteks web/browser.
- **Kecocokan integrasi ke TypeScript ZonaSipil:** Rendah untuk runtime — tidak ada jalur terverifikasi dari halaman yang dibuka untuk menjalankan library Python ini di browser TypeScript; memakainya berarti menambah layanan Python di server (mengubah arsitektur "solver berjalan di browser" Zona Structure) atau mem-porting algoritmanya (yang pada praktiknya menulis ulang engine). Tinggi untuk **validasi**: README menyatakan output-nya diuji terhadap suite soal buku teks bersolusi diketahui lewat CI setiap perubahan — persis profil yang dibutuhkan sebuah oracle pembanding.
- **Risiko:** (1) Ketidakcocokan bahasa adalah risiko utama dan bersifat struktural, bukan sementara. (2) Jika kelak dipakai di server, beban operasional dan permukaan keamanan bertambah. (3) Porting Python→TypeScript akan menghasilkan kode turunan MIT (wajib atribusi) yang tetap harus divalidasi dari nol — tidak lebih murah daripada mengembangkan engine lokal yang sudah teruji.

**Keputusan: ADAPTASI SELEKTIF.** Gunakan sebagai **oracle validasi silang offline/CI**: model-model benchmark ZonaSipil Structure dapat dihitung ulang dengan PyNite untuk memeriksa hasil solver lokal secara independen, tanpa memasukkan Python ke produk web. Bukan engine runtime ZonaSipil.

---

## 7. sectionproperties

- **URL yang ditugaskan:** https://github.com/robbievanleeuwen/sectionproperties
- **Status bukti:** **Halaman tidak berhasil dibuka** dalam riset ini (percobaan pengambilan halaman gagal tanpa status HTTP sumber, dan percobaan tidak diulang). Oleh karena itu, sesuai aturan faktual dokumen ini:
  - Lisensi persis: **tidak terverifikasi dari halaman**
  - Bahasa & stack: **tidak terverifikasi dari halaman**
  - Bentuk (library/aplikasi): **tidak terverifikasi dari halaman**
  - Bintang / jumlah commit / tanggal dibuat: **tidak terverifikasi dari halaman**
  - Aktivitas maintenance terakhir: **tidak terverifikasi dari halaman**
  - Cakupan kemampuan (properti penampang): **tidak terverifikasi dari halaman** — nama repositorinya menyiratkan topik properti penampang, tetapi penyiratan nama bukan bukti cakupan.
  - Kecocokan integrasi dan risiko: **tidak dapat dinilai dari bukti** dalam riset ini.
- **Mengapa tetap dicantumkan:** Kebutuhan properti penampang adalah celah nyata basis lokal (penampang generik di Awatif pun hanya parameter E, A, Iy, Iz, G, J). Kandidat khusus properti penampang tetap relevan untuk dievaluasi — hanya saja belum ada buktinya di sini.

**Keputusan: TOLAK untuk saat ini** — semata-mata karena tidak ada satu pun klaim yang terverifikasi; ini keputusan prosedural, bukan penilaian kualitas. Rekomendasi tindak lanjut: evaluasi ulang kandidat ini pada sesi riset terpisah yang dapat membuka halamannya, sebelum kebutuhan properti penampang dipenuhi dengan membangun sendiri.

---

## 8. anaStruct

- **URL yang ditugaskan:** https://github.com/ritchie46/anastruct — halaman yang terbuka berjudul `anastruct/anaStruct` ("2D structural analysis in Python"), dibuat 2016-07-02.
- **Lisensi persis:** **GNU Lesser General Public License v3.0 (LGPL-3.0)** — dari metadata repositori; file lisensi di root bernama `LICENSE.txt`.
- **Bahasa & stack:** **Python** — instalasi `pip install anastruct` (rilis) atau dari git untuk versi pengembangan aktif; struktur repo memuat paket `anastruct/`, `tests/`, `examples/`, `docs/`, dan `pyproject.toml`.
- **Bentuk:** **Library Python** untuk analisis struktur 2D.
- **Aktivitas maintenance:** **1.195 commit, 469 bintang, 119 fork, 17 rilis (19 tag)**. Halaman commits menunjukkan commit terakhir terlihat pada **31 Oktober 2026** — aktif.
- **Cakupan kemampuan:** Frame dan truss 2D untuk struktur langsing; momen lentur, gaya geser, gaya aksial, dan perpindahan; tumpuan sendi, jepit, dan pegas; beban q searah elemen dan global-y, beban titik nodal global x/y, beban mati (dead load); elemen berengsel; pegas rotasi; node non-linear; non-linearitas geometrik; kasus beban dan kombinasi beban; penampang generik persegi dan lingkaran; basis data penampang baja EU, US, UK. **Tidak ada** cakupan 3D dan tidak ada konteks SNI di halaman yang dibuka.
- **Kecocokan integrasi ke TypeScript ZonaSipil:** Rendah ganda — bahasa Python (sama seperti PyNite, tidak berjalan di browser TypeScript) **dan** lisensi LGPL-3.0. LGPL lebih longgar daripada AGPL untuk sekadar menautkan library, tetapi mem-porting atau memodifikasi kodenya ke TypeScript akan menciptakan karya turunan berlisensi LGPL dengan kewajiban lisensi yang jauh lebih rumit daripada MIT basis lokal.
- **Risiko:** (1) Seluruh nilainya (solver 2D frame/truss) **tumpang tindih** dengan yang sudah dimiliki engine lokal dalam bahasa yang benar — tidak ada kemampuan pembeda yang terlihat (basis data penampang baja EU/US/UK bukan kebutuhan SNI). (2) Kewajiban LGPL pada kode turunan hasil porting.

**Keputusan: TOLAK.** Aktif dan terhormat sebagai library Python 2D, tetapi tidak menawarkan apa pun yang belum dimiliki ZonaSipil Structure, dalam bahasa yang salah dan lisensi yang lebih berat.

---

## 9. Perbandingan Terhadap Syarat "Mengalahkan Default"

Syarat dari brief: kandidat penantang harus **lisensi lebih aman + library murni + aktif + cakupan setara** — keempatnya sekaligus.

| Kandidat | Lisensi ≥ MIT lokal? | Library murni? | Aktif terlihat? | Cakupan ≥ lokal (2D DSM + desain SNI)? | Lolos semua? |
|---|---|---|---|---|---|
| OpenAnstruk-2D | Setara (MIT) | Tidak — aplikasi utuh | Ya (commit 27 Sep 2026) | Setara pada inti 2D/SNI — karena memang sumbernya; tanpa lapisan test/laporan lokal | Tidak |
| Awatif | Setara (MIT) | Tidak — aplikasi/harness utuh | Ya (commit 15 Okt 2026) | Tidak terlihat — 3D linear saja, tanpa desain SNI pada halaman | Tidak |
| Stabileo | **Tidak — AGPL-3.0, lebih berisiko** | Tidak — platform utuh | Volume commit besar; tanggal terakhir tidak terverifikasi | Ya, bahkan melampaui (2D/3D + lanjutan) | Tidak |
| PyNite | Setara (MIT) | **Ya** | Ya (commit 31 Okt 2026) | Cakupan 3D luas, tetapi tanpa konteks SNI dan tanpa runtime web | Tidak |
| sectionproperties | Tidak terverifikasi | Tidak terverifikasi | Tidak terverifikasi | Tidak terverifikasi | Tidak (belum dinilai) |
| anaStruct | Tidak — LGPL-3.0, lebih berat dari MIT | Ya (Python) | Ya (commit 31 Okt 2026) | Sebagian (2D saja, tanpa SNI) | Tidak |

**Kesimpulan:** Default menang bukan karena kandidat lain buruk — PyNite dan Stabileo secara teknis sangat kuat di wilayahnya masing-masing — melainkan karena tidak ada kandidat yang lolos keempat gerbang sekaligus, sementara basis lokal sudah lolos gerbang integrasi, lisensi, dan konteks SNI dengan bukti pengujian yang sudah berjalan.

---

## 10. Catatan Lisensi (Wajib untuk Setiap Adaptasi di Masa Depan)

1. **MIT (OpenAnstruk-2D, Awatif, PyNite):** Kode apa pun yang diadaptasi dari proyek MIT **wajib** menyertakan copyright notice dan teks lisensi MIT-nya dalam semua salinan atau bagian substansial. Praktik yang sudah berjalan di basis lokal — mempertahankan `LICENSE`, mencatat provenans di `NOTICE` dan `docs/LICENSING_AUDIT.md` — adalah pola yang harus diteruskan untuk setiap sumber baru.
2. **AGPL-3.0 (Stabileo):** Jangan mengadopsi, menyalin, atau mem-porting kodenya ke ZonaSipil. Kewajiban copyleft jaringannya dapat menjalar ke layanan yang mendistribusikannya lewat jaringan. Pembandingan konseptual tingkat fitur (mis. daftar jenis analisis) tanpa menyalin kode adalah batas yang aman untuk diperlakukan dalam dokumen ini.
3. **LGPL-3.0 (anaStruct):** Porting/modifikasi kodenya menghasilkan kewajiban LGPL atas karya turunan; hindari sebagai sumber kode. Penggunaannya yang tidak dimodifikasi pun tidak relevan untuk runtime browser TypeScript ZonaSipil.
4. **Atribusi harus spesifik per sumber:** Setiap berkas/modul hasil adaptasi kelak harus dapat ditelusur ke sumber, URL, commit/tag, dan teks lisensinya di catatan atribusi proyek (pola `NOTICE` lokal), dan lolos audit lisensi dependensi sebelum digabung — meniru `docs/LICENSING_AUDIT.md` yang sudah menyatakan tidak ada dependensi GPL/AGPL di basis lokal.
5. **Standar SNI:** Sebagaimana dicatat `docs/LICENSING_AUDIT.md` lokal, dokumen SNI adalah publikasi BSN berhak cipta; yang boleh diimplementasikan adalah rumus dengan rujukan nomor pasal, bukan reproduksi teks standar. Aturan ini berlaku juga saat membandingkan implementasi upstream (OpenAnstruk-2D mengklaim cakupan SNI 2847:2019 / SNI 1729:2020 — klaim itu tidak memberi hak apa pun atas teks standarnya).
6. **Status "tidak terverifikasi" sectionproperties** berarti lisensinya pun belum diketahui; kandidat itu tidak boleh diadaptasi dalam bentuk apa pun sebelum halaman LICENSE-nya benar-benar dibaca pada evaluasi ulang.

---

## 11. Rekomendasi Tindak Lanjut (di luar keputusan utama)

1. **Pantau OpenAnstruk-2D secara berkala** sebagai upstream resmi basis lokal; setiap pengambilan perbaikan harus melewati benchmark + suite test lokal (gerbang ≤ 0,1% terhadap solusi analitik yang sudah dipakai lokal) sebelum dinyatakan lolos — sesuai aturan kejujuran engineering di `AGENTS.md` proyek lokal (status hanya PASS/FAIL/INCOMPLETE/UNVERIFIED/UNSUPPORTED/NOT_EVALUATED; tidak ada klaim kepatuhan SNI penuh).
2. **Siapkan PyNite sebagai oracle CI offline** untuk verifikasi silang hasil solver lokal pada model benchmark — nilai tertinggi per usaha dari seluruh daftar ini, tanpa mengubah produk.
3. **Bila kebutuhan 3D tiba**, mulai kajian dari solver referensi TypeScript Awatif (MIT) sebagai bahan adaptasi selektif ber-atribusi, dan tetapkan sejak awal bahwa lapisan desain SNI tetap dibangun dan divalidasi sendiri.
4. **Evaluasi ulang sectionproperties pada kesempatan terpisah** khusus untuk kebutuhan properti penampang, sebelum memutuskan membangun modul penampang sendiri.
5. **Tidak ada tindakan untuk Stabileo dan anaStruct** selain pencatatan penolakan ini.

---

## Lampiran — Halaman yang Dibuka dalam Riset Ini

- https://github.com/adrianulza/OpenAnstruk-2D dan halaman commits-nya (`/commits/main/`)
- https://github.com/madil4/awatif dan halaman commits-nya (`/commits/main/`)
- https://github.com/lambdaclass/stabileo dan halaman commits-nya (`/commits/main/`)
- https://github.com/JWock82/PyNite dan halaman commits-nya (`/commits/main/`)
- https://github.com/ritchie46/anastruct (terbuka sebagai `anastruct/anaStruct`) dan halaman commits-nya (`/commits/master/`)
- https://github.com/robbievanleeuwen/sectionproperties — **gagal dibuka, tidak diulang** (lihat §7)
- File lokal: `~/workspace/zonasipil-structure/README.md`, `LICENSE`, `NOTICE`, `package.json`, `AGENTS.md`, `docs/MIGRATION-RECORD.md`, `docs/LICENSING_AUDIT.md`
