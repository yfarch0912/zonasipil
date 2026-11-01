#!/usr/bin/env python3
"""Generator halaman artikel ZonaSipil.
Sumber data: ARTICLES di file ini. Setiap artikel dirender menjadi
artikel/<slug>/index.html, plus artikel/index.html (daftar) dan sitemap.xml.
Jalankan: python3 artikel/build_artikel.py  (dari root repo)
Aturan konten: Bahasa Indonesia, orisinal, jujur teknis — fakta berita wajib
punya sumber (label+url), jangan mengarang angka/SNI, gambar ilustrasi diberi
keterangan jujur."""
import pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / "artikel"
BASE = "https://zonasipil.web.id"

ARTICLES = [
  {
    "slug": "bendung-peusangan-aceh-pulih-70-persen",
    "title": "Bendung Peusangan Pulih 70 Persen: Kenapa Aliran Sungai Harus 'Diarahkan' agar Irigasi Mengalir",
    "cat": "SUMBER DAYA AIR", "kind": "berita",
    "date": "2026-11-01", "date_label": "1 November 2026",
    "hero": "/assets/images/zs_work_right_2.webp",
    "hero_alt": "Rangkaian tulangan struktur yang rapat di lokasi pekerjaan",
    "hero_caption": "Ilustrasi: pekerjaan struktur di lapangan (bukan foto lokasi Bendung Peusangan).",
    "excerpt": "Pemulihan Bendung Peusangan di Bireuen, Aceh, mencapai hampir 70 persen dan jaringan irigasi untuk sekitar 6.000 hektare mulai terisi lagi. Kuncinya bukan hanya memperbaiki bendungnya — tetapi mengarahkan kembali aliran sungai yang menyebar.",
    "sources": [
      {"label": "ArgumenRakyat.com — Bendung Peusangan Aceh Pulih 70 Persen, Irigasi Mulai Terisi (1 November 2026)", "url": "https://argumenrakyat.com/bendung-peusangan-aceh-pulih-70-persen-irigasi-mulai-terisi/"},
    ],
    "body": """
<p>Di Teupin Mane, Kabupaten Bireuen, Aceh, pekerjaan pemulihan Bendung Peusangan dilaporkan mencapai hampir 70 persen. Jaringan irigasi primer yang terhubung ke bendung ini — melayani sekitar <strong>6.000 hektare</strong> lahan pertanian — mulai terisi air lagi. Targetnya, pekerjaan rampung pada Desember 2026.</p>
<p>Yang menarik dari proyek ini bukan sekadar angka progresnya. Masalah utamanya ternyata klasik dalam teknik sungai: setelah rusak, aliran Sungai Peusangan <strong>menyebar</strong> dan tidak lagi menuju ke bendung. Air ada, tetapi tidak sampai ke pintu pengambilan.</p>
<div class="fakta"><strong>Data proyek (dari sumber berita):</strong> progres pemulihan ±70%; layanan irigasi ±6.000 ha; pekerjaan struktur penahan dan pengarah aliran sepanjang ±150 m dengan material batu besar (batu gajah), baja untuk pemancangan, dan kantong berisi pasir; pelaksana PT Adhi Karya; target selesai Desember 2026.</div>
<h2>Bendung itu bukan bendungan</h2>
<p>Keduanya sering tertukar. <strong>Bendungan</strong> (dam) menahan air untuk <em>menyimpan</em> — di belakangnya terbentuk waduk. <strong>Bendung</strong> (weir) pekerjaannya lebih sederhana dan lebih licik: ia hanya <em>meninggikan muka air</em> secukupnya agar air bisa dibelokkan masuk ke pintu pengambilan (intake) dan mengalir secara gravitasi ke saluran irigasi. Tanpa kenaikan muka air itu, saluran yang letaknya lebih tinggi dari dasar sungai tidak akan pernah terisi.</p>
<p>Jadi bendung yang berfungsi pun bisa "gagal" bila sungai berpindah jalur. Itulah yang terjadi di Peusangan: kerusakan membuat aliran menyebar, muka air di depan intake turun, dan 6.000 hektare menunggu.</p>
<h2>Mengarahkan sungai dengan bangunan pengarah</h2>
<p>Solusi yang dikerjakan di lapangan adalah membangun <strong>struktur penahan dan pengarah aliran</strong> sepanjang sekitar 150 meter dari tepi struktur eksisting. Prinsipnya fisika dasar: sungai yang penampangnya dipersempit secara terarah akan mengalir ke arah yang kita mau, dengan muka air yang naik di titik yang kita pilih — di depan bendung.</p>
<ul>
<li><strong>Batu gajah</strong> — batu berukuran besar yang beratnya cukup untuk tidak terseret arus; disusun sebagai tubuh bangunan pengarah sekaligus pelindung gerusan.</li>
<li><strong>Pancang baja</strong> — memberi "tulang" dan batas tegas pada struktur, menahan susunan batu dari pergeseran lateral.</li>
<li><strong>Kantong pasir</strong> — penguat yang fleksibel: ia mengikuti bentuk dasar sungai yang tidak rata dan mengisi celah yang tidak bisa dijangkau batu besar.</li>
</ul>
<p>Kombinasi ini khas pekerjaan sungai darurat-menuju-permanen: materialnya bisa didatangkan dan dipasang cepat di sungai yang masih aktif mengalir, tetapi susunannya tetap dihitung untuk menahan gaya seret aliran.</p>
<h2>Bekerja melawan debit yang berubah-ubah</h2>
<p>Kendala yang dilaporkan pengawas lapangan adalah perubahan debit Sungai Peusangan: hujan di hulu menaikkan aliran di lokasi pekerjaan meski cuaca di titik bendung sendiri tidak hujan. Ini pengingat bahwa dalam pekerjaan sungai, "lokasi proyek" sesungguhnya adalah seluruh daerah aliran di hulunya — jadwal dan metode kerja harus selalu menyediakan ruang untuk air yang datang tanpa undangan.</p>
<p>Ketika pekerjaan ini selesai, yang dipulihkan bukan hanya sebuah struktur beton, melainkan rantai lengkapnya: sungai yang terarah → muka air yang naik di bendung → pintu intake yang membuka → saluran primer yang terisi → petak-petak sawah di hilir. Dalam teknik irigasi, bendung hanyalah satu mata rantai — dan rantai itu hanya sekuat arah aliran sungainya.</p>
""",
  },
  {
    "slug": "jembatan-way-bungur-lampung-764-meter",
    "title": "Jembatan Way Bungur: Kenapa Trase 764 Meter Hanya Butuh Bentang Utama 80 Meter",
    "cat": "PROYEK", "kind": "berita",
    "date": "2026-11-01", "date_label": "1 November 2026",
    "hero": "/assets/images/zs_work_right_1.webp",
    "hero_alt": "Jembatan gelagar boks baja dengan pilon beton",
    "hero_caption": "Ilustrasi: jembatan baja (bukan foto lokasi Jembatan Way Bungur).",
    "excerpt": "Jembatan Way Bungur di Lampung Timur dirancang dengan trase 764 meter, tetapi bentang utamanya 'hanya' rangka baja 80 meter. Sisanya adalah pile slab, dinding MSE, dan girder pracetak — dan justru di situlah pelajaran tekniknya.",
    "sources": [
      {"label": "Biro Adpim Pemprov Lampung — Wapres Gibran dan Wagub Jihan Pantau Pembangunan Jembatan Way Bungur (15 Juli 2026)", "url": "https://biroadpim.lampungprov.go.id/detail-post/wapres-gibran-dan-wagub-jihan-pantau-pembangunan-jembatan-way-bungur-percepat-konektivitas-antarwilayah"},
    ],
    "body": """
<p>Pemerintah Provinsi Lampung memaparkan rencana pembangunan Jembatan Way Bungur di Kecamatan Way Bungur, Kabupaten Lampung Timur — penghubung Desa Tanjung Tirto dan Desa Kali Pasir di kawasan pesisir. Angka-angkanya sekilas membingungkan: <strong>panjang trase sekitar 764 meter</strong>, tetapi <strong>bentang utama hanya 80 meter</strong>. Ke mana perginya 684 meter sisanya?</p>
<div class="fakta"><strong>Data proyek (paparan teknis Pemprov Lampung):</strong> investasi Rp96,8 miliar; durasi rencana 18 bulan; komposisi struktur — bentang utama rangka baja 80 m, pile slab 550 m, MSE Wall 114 m, PC-I Girder 20 m, dan RBI 80 m. Jembatan lama bermasalah pada timbunan oprit yang rusak, struktur yang tidak lagi simetris, dan kapasitas terbatas. Saat berita ini ditulis proyek berada pada tahap administrasi: pembebasan lahan dan perizinan lingkungan.</div>
<h2>Sungainya 80 meter, lahannya 764 meter</h2>
<p>Trase jembatan tidak hanya menyeberangi air. Di kawasan pesisir, di kedua sisi sungai membentang dataran rendah yang lunak dan tergenang berkala. Jalan penghubung harus melintasi seluruh zona itu — dan menimbun tanah setinggi beberapa meter di atas tanah lunak adalah resep penurunan tak merata: jalan bergelombang, oprit amblas, persis penyakit jembatan lamanya.</p>
<p>Maka trase dibagi menurut karakter lahannya, dan setiap segmen memakai sistem struktur yang berbeda:</p>
<h2>Pile slab 550 meter: jalan yang berdiri di atas tiang</h2>
<p>Bagian terpanjang justru bukan "jembatan" dalam bayangan umum, melainkan <strong>pile slab</strong>: pelat beton menerus yang ditopang barisan tiang pancang. Beban kendaraan diteruskan pelat ke tiang, lalu ke lapisan tanah keras jauh di bawah tanah lunak. Karena jalannya "digantung" pada tiang, tidak ada timbunan tinggi yang membebani tanah lunak — tidak ada konsolidasi bertahun-tahun, tidak ada oprit yang turun sebelah. Di tanah pesisir yang lunak, 550 meter pile slab adalah pilihan yang membosankan sekaligus paling waras.</p>
<h2>MSE Wall 114 meter: tanah yang menahan dirinya sendiri</h2>
<p>Di bagian yang memerlukan timbunan, dipakai <strong>MSE Wall</strong> (Mechanically Stabilized Earth): dinding berlapis tanah yang diperkuat lembaran/bilah perkuatan di dalamnya, dengan panel muka sebagai wajah. Tanah dan perkuatannya bekerja sebagai satu massa komposit yang menahan dirinya sendiri — jauh lebih toleran terhadap penurunan kecil dibanding dinding penahan beton kaku, dan lebih cepat dibangun.</p>
<h2>Rangka baja 80 meter dan PC-I Girder 20 meter</h2>
<p>Bentang utama di atas sungai memakai <strong>rangka baja 80 meter</strong>: batang-batang baja yang disusun menjadi rangka segitiga, bekerja hanya tarik dan tekan, menyeberang tanpa pilar di tengah aliran — penting untuk sungai yang membawa debit dan material hanyut. Sementara bentang pendek 20 meter diisi <strong>PC-I Girder</strong>, balok beton prategang pracetak profil I yang menjadi standar bentang pendek-menengah di Indonesia: diproduksi terkontrol di pabrik, dipasang cepat dengan crane.</p>
<p>Pelajaran dari Way Bungur: membaca proyek jembatan dari "bentang utamanya" saja menyesatkan. Sebagian besar uang dan kecerdasan teknik justru ada di ratusan meter struktur pendukung yang menyesuaikan diri dengan tanah — karena jembatan jarang gagal di tengah sungai; ia lebih sering bermasalah di tempat rodanya pertama kali naik dan turun: oprit dan tanah di bawahnya.</p>
""",
  },
  {
    "slug": "105-jembatan-gantung-kementerian-pu-2026",
    "title": "105 Jembatan Gantung Dibangun Tahun Ini: Cara Kerja Struktur yang Digantung, Bukan Ditopang",
    "cat": "PROYEK", "kind": "berita",
    "date": "2026-11-01", "date_label": "1 November 2026",
    "hero": "/assets/images/zs_work_right_5.webp",
    "hero_alt": "Struktur tarik baja dan rusuk beton pracetak parametrik",
    "hero_caption": "Ilustrasi: struktur tarik baja (bukan foto salah satu lokasi jembatan gantung).",
    "excerpt": "Kementerian PU memastikan 105 jembatan gantung dibangun di 25 provinsi pada TA 2026, dengan bentang 40–120 meter dan lebar hanya sekitar 1,8 meter. Kenapa format 'digantung' ini yang dipilih untuk desa-desa terisolasi?",
    "sources": [
      {"label": "Industry.co.id — Kementerian PU Genjot Konektivitas Desa, 105 Jembatan Gantung Dibangun Tahun Ini (24 April 2026)", "url": "https://www.industry.co.id/read/149319/kementerian-pu-genjot-konektivitas-desa-105-jembatan-gantung-dibangun-tahun-ini"},
    ],
    "body": """
<p>Kementerian Pekerjaan Umum memastikan pembangunan <strong>105 unit jembatan gantung</strong> yang tersebar di <strong>25 provinsi</strong> pada Tahun Anggaran 2026, dikelola Direktorat Jenderal Bina Marga melalui Program Infrastruktur Berbasis Masyarakat (IBM). Jawa Tengah mendapat alokasi terbesar yang disebutkan: 16 unit.</p>
<div class="fakta"><strong>Data program (Kementerian PU via sumber berita):</strong> 105 unit di 25 provinsi (TA 2026); bentang rata-rata 40–120 m; lebar jalur sekitar 1,8 m; penentuan lokasi melalui evaluasi teknis dan survei lapangan — tingkat kebutuhan, keterisolasian, dan potensi manfaat ekonomi.</div>
<h2>Anatomi jembatan yang digantung</h2>
<p>Hampir semua jembatan "ditopang dari bawah": beban turun ke balok, balok ke pilar, pilar ke fondasi. Jembatan gantung membalik logikanya — lantainya <strong>digantung dari atas</strong>:</p>
<ol>
<li><strong>Dek/lantai</strong> menerima beban pejalan kaki dan kendaraan ringan.</li>
<li><strong>Hanger</strong> (kabel/batang vertikal) mengangkat dek dan menyerahkan bebannya ke kabel utama.</li>
<li><strong>Kabel utama</strong> membentang dari satu tebing ke tebing lain dalam lengkung parabola, memikul semuanya murni dengan gaya <em>tarik</em> — gaya yang paling efisien dipikul baja.</li>
<li><strong>Menara/pilon</strong> di kedua ujung menekan ke bawah (gaya tekan diteruskan ke fondasi), sementara ujung kabel ditarik dan dikunci ke <strong>blok angkur</strong> — massa beton besar (atau angkur ke batuan) yang menahan tarikan kabel agar tidak tercabut.</li>
</ol>
<h2>Kenapa format ini menang di pelosok</h2>
<p>Untuk sungai selebar 40–120 meter di daerah terpencil, alternatifnya — jembatan gelagar dengan pilar di tengah sungai — berarti fondasi di dalam air, alat berat menyeberang lebih dulu, dan waktu bangun yang panjang. Jembatan gantung menghindari semuanya:</p>
<ul>
<li>Komponen baja dapat diangkut <strong>per bagian</strong> lewat jalan desa yang sempit, lalu dirangkai di lokasi.</li>
<li>Fondasi hanya diperlukan di <strong>dua tebing</strong> — tidak ada pekerjaan di tengah aliran.</li>
<li>Lebar 1,8 meter adalah keputusan sadar: cukup untuk pejalan kaki dan sepeda motor (kendaraan logistik desa yang sesungguhnya), dan menjaga beban rencana tetap kecil sehingga seluruh struktur tetap ringan dan terawat secara swadaya.</li>
</ul>
<h2>Harga yang dibayar: fleksibilitas</h2>
<p>Struktur yang digantung kabel pada dasarnya fleksibel — ia akan bergoyang kecil saat dilintasi dan saat angin bertiup. Itu bukan cacat; itu sifat sistemnya, dan desainnya memang memperhitungkan lendutan serta gerakan tersebut dalam batas yang aman dan terasa wajar oleh pengguna. Yang tidak boleh ditawar adalah perawatannya: kabel, sambungan, dan angkur harus diperiksa berkala karena seluruh jembatan, secara harfiah, bergantung padanya.</p>
<p>Seratus lima jembatan seperti ini tidak akan masuk daftar jembatan terpanjang mana pun. Tetapi bagi desa yang sebelumnya menyeberang dengan rakit atau memutar berjam-jam, bentang 60 meter selebar 1,8 meter adalah perbedaan antara terisolasi dan terhubung.</p>
""",
  },
  {
    "slug": "kenapa-sengkang-dirapatkan-di-dekat-tumpuan",
    "title": "Kenapa Sengkang Dirapatkan di Dekat Tumpuan?",
    "cat": "STRUKTUR", "kind": "kajian",
    "date": "2026-10-29", "date_label": "29 Oktober 2026",
    "hero": "/assets/images/zs_insight_2.webp",
    "hero_alt": "Diagram momen lentur dan gaya geser gelagar menerus",
    "hero_caption": "Diagram momen dan gaya geser pada gelagar menerus — gaya geser mencapai puncak di dekat tumpuan.",
    "excerpt": "Di gambar kerja, sengkang balok hampir selalu rapat di dekat tumpuan dan renggang di tengah bentang. Itu bukan kebiasaan tukang gambar — itu peta gaya geser yang diterjemahkan menjadi jarak baja.",
    "sources": [],
    "body": """
<p>Buka gambar penulangan balok mana pun dan pola yang sama muncul: sengkang (begel) tersusun rapat di kedua ujung balok, lalu merenggang di tengah bentang. Polanya terlalu konsisten untuk disebut kebiasaan. Ia adalah gambar gaya yang sedang bekerja.</p>
<h2>Alasan pertama: geser terbesar ada di ujung</h2>
<p>Balok yang memikul beban merata mempunyai diagram gaya geser berbentuk segitiga: <strong>nol di tengah bentang dan maksimum tepat di dekat tumpuan</strong>. Gaya geser adalah gaya yang berusaha "menggeser" satu bagian balok terhadap bagian di sebelahnya — dan beton polos buruk sekali menahannya.</p>
<p>Wujud kegagalannya khas: <strong>retak miring</strong> yang merambat sekitar 45° dari sisi bawah balok menuju tumpuan. Retak ini bukan retak lentur yang vertikal; ia adalah retak tarik diagonal, muncul karena pada daerah geser tinggi, tegangan tarik utama di dalam beton berarah miring. Sekali retak miring terbentuk tanpa penahan, balok bisa gagal mendadak — jauh lebih berbahaya daripada kegagalan lentur yang memberi peringatan berupa lendutan dan retak halus lebih dulu.</p>
<h2>Sengkang adalah jahitan yang memotong retak</h2>
<p>Sengkang vertikal bekerja sederhana: setiap retak miring yang terbentuk akan <strong>dipotong</strong> oleh beberapa batang sengkang. Baja itu menjahit kedua sisi retak, memikul gaya tarik yang tidak sanggup dipikul beton, dan menyerahkan sisanya ke mekanisme rangka di dalam balok. Semakin besar gaya geser di suatu penampang, semakin banyak "jahitan" yang dibutuhkan per satuan panjang — artinya jarak sengkang semakin rapat.</p>
<p>Di tengah bentang gaya geser kecil, sehingga sengkang renggang pun cukup; tetapi jaraknya tetap dibatasi maksimum, karena retak miring tidak pernah benar-benar nol risikonya dan sengkang juga bertugas memegang tulangan longitudinal tetap pada tempatnya selama pengecoran.</p>
<h2>Alasan kedua: ujung balok adalah daerah kritis gempa</h2>
<p>Pada struktur tahan gempa, ujung-ujung balok adalah tempat <strong>sendi plastis</strong> direncanakan terjadi: daerah yang "mengalah" secara terkendali, meleleh dan berputar berulang kali untuk menyerap energi gempa tanpa runtuh. Daerah seperti itu menuntut sengkang yang bukan hanya kuat geser, tetapi juga <strong>rapat sebagai pengekang (confinement)</strong>:</p>
<ul>
<li>mengekang inti beton agar tidak hancur meski selimutnya terkelupas,</li>
<li>menahan tulangan longitudinal agar tidak menekuk keluar saat tertekan bolak-balik,</li>
<li>menjaga penampang tetap utuh selama siklus gempa berlangsung.</li>
</ul>
<p>Jadi kerapatan sengkang di dekat tumpuan melayani dua tuan sekaligus: gaya geser yang memang maksimum di sana, dan daktilitas yang memang dituntut di sana. Ketika kamu melihat gambar kerja dengan sengkang rapat di ujung dan renggang di tengah, kamu sedang melihat diagram geser dan peta sendi plastis yang digambar ulang dalam satuan milimeter jarak baja.</p>
""",
  },
  {
    "slug": "asal-usul-angka-0006165-pada-berat-besi",
    "title": "Asal-Usul Angka 0,006165 pada Berat Besi",
    "cat": "ESTIMASI", "kind": "kajian",
    "date": "2026-10-15", "date_label": "15 Oktober 2026",
    "hero": "/assets/images/zs_artikel_besi.webp",
    "hero_alt": "Tumpukan batang tulangan baja ulir — penampang lingkaran tempat diameter diukur",
    "hero_caption": "Diameter nominal batang adalah satu-satunya masukan rumus berat besi.",
    "excerpt": "Angka 0,006165 muncul di setiap tabel berat tulangan seolah jatuh dari langit. Sebenarnya ia hanya geometri lingkaran dikalikan massa jenis baja — dan bisa kamu turunkan sendiri dalam empat baris.",
    "sources": [],
    "body": """
<p>Setiap estimator hafal rumusnya: berat tulangan per meter adalah 0,006165 × d². Tetapi konstanta yang dihafal tanpa asal-usul akan selalu terasa seperti sulap. Mari kita bedah — isinya hanya dua hal: <strong>luas lingkaran</strong> dan <strong>massa jenis baja</strong>.</p>
<h2>Langkah 1 — luas penampang</h2>
<p>Batang tulangan dianggap berpenampang lingkaran berdiameter d (mm). Luasnya:</p>
<div class="rumus">A = π/4 × d² = 0,7854 × d² &nbsp;mm²</div>
<h2>Langkah 2 — volume satu meter batang</h2>
<p>Kalikan luas dengan panjang 1 meter (1.000 mm):</p>
<div class="rumus">V = 0,7854 × d² × 1.000 = 785,4 × d² &nbsp;mm³ = 7,854 × 10⁻⁷ × d² &nbsp;m³</div>
<h2>Langkah 3 — kalikan massa jenis baja</h2>
<p>Massa jenis baja adalah 7.850 kg/m³. Maka berat satu meter batang:</p>
<div class="rumus">w = 7,854 × 10⁻⁷ × 7.850 × d² = 0,006165 × d² &nbsp;kg/m</div>
<p>Selesai. Angka 0,006165 tidak lain adalah π/4 × 7.850 yang sudah dilipat rapi bersama konversi satuannya. Ia bukan konstanta empiris hasil pengujian — ia identitas geometri.</p>
<h2>Periksa dengan contoh</h2>
<ul>
<li><strong>D13:</strong> 0,006165 × 13² = 0,006165 × 169 = <strong>1,042 kg/m</strong></li>
<li><strong>D16:</strong> 0,006165 × 16² = 0,006165 × 256 = <strong>1,578 kg/m</strong></li>
<li><strong>D10:</strong> 0,006165 × 10² = <strong>0,617 kg/m</strong></li>
</ul>
<p>Nilai-nilai ini persis yang dipakai kalkulator berat tulangan di ZonaSipil — ubah diameternya dan lihat sendiri.</p>
<h2>Batas kejujuran rumus ini</h2>
<p>Rumus ini memberi <strong>berat nominal</strong>. Di lapangan, batang nyata bisa menyimpang beberapa persen karena toleransi diameter dari pabrik — tulangan ulir pun diukur dari diameter nominalnya, bukan dari puncak siripnya. Untuk estimasi kebutuhan dan pemesanan, berat nominal adalah dasar yang benar; untuk menerima material dalam jumlah besar, penimbangan aktual tetap menjadi kata akhir. Konstanta yang baik tahu persis apa yang ia wakili — dan 0,006165 mewakili lingkaran sempurna berisi baja 7.850 kg/m³.</p>
""",
  },
  {
    "slug": "dari-gambar-ke-kubikasi-urutan-yang-tidak-menipu",
    "title": "Dari Gambar ke Kubikasi: Urutan yang Tidak Menipu",
    "cat": "KUBIKASI", "kind": "kajian",
    "date": "2026-10-01", "date_label": "1 Oktober 2026",
    "hero": "/assets/images/zs_work_left_5.webp",
    "hero_alt": "Gambar detail penampang kolom beton bertulang dan penulangannya",
    "hero_caption": "Kubikasi yang benar selalu berangkat dari gambar detail, bukan dari ingatan lapangan.",
    "excerpt": "Kubikasi beton yang meleset jarang salah di perkalian — ia salah di urutan kerja. Berikut urutan yang membuat setiap meter kubik bisa ditelusur kembali ke gambarnya.",
    "sources": [],
    "body": """
<p>Hampir semua sengketa volume berawal dari kalimat yang sama: "perhitungannya sih benar." Memang — perkaliannya benar. Yang keliru biasanya <strong>urutan kerjanya</strong>: menghitung sebelum membaca gambar secara lengkap. Kubikasi yang tidak menipu mengikuti urutan berikut.</p>
<h2>1. Baca gambarnya dulu, seluruhnya</h2>
<p>Denah struktur memberi tahu <em>di mana</em> elemen berada; potongan dan detail memberi tahu <em>berapa ukurannya</em>; tabel elemen (jadwal kolom/balok) memberi tahu <em>berapa jumlahnya</em>. Menghitung hanya dari denah adalah cara paling umum kehilangan setengah meter kubik: tinggi balok dibaca dari denah padahal yang benar ada di potongan.</p>
<h2>2. Susun daftar elemen sebelum menyentuh kalkulator</h2>
<p>Tuliskan dulu inventarisnya: kolom tipe K1 sekian buah setinggi sekian, balok B1 sekian bentang, pelat setebal sekian seluas sekian. Daftar ini adalah kontrak kerja perhitungan — elemen yang tidak ada di daftar tidak akan terhitung, dan elemen yang tertulis dua kali akan terbayar dua kali.</p>
<h2>3. Ambil dimensi dari gambar, bukan dari kebiasaan</h2>
<p>Setiap angka harus bisa ditunjuk sumbernya di gambar: panjang dari as ke as atau dari muka ke muka (putuskan metodenya dan konsisten), lebar dan tinggi dari notasi penampang, tebal pelat dari potongan. Asumsi seperti "sloof biasanya 15×20" adalah tempat kebocoran volume bersembunyi.</p>
<h2>4. Hitung per elemen, dengan rumus yang terbuka</h2>
<div class="rumus">V = p × l × t × n</div>
<p>panjang × lebar × tinggi × jumlah elemen sejenis. Sederhana — dan memang harus sederhana, supaya siapa pun bisa memeriksa ulang baris per baris. Untuk pelat, volume adalah luas × tebal; untuk elemen yang bentuknya tidak beraturan, pecah menjadi prisma-prisma sederhana lalu jumlahkan.</p>
<h2>5. Waspadai tiga titik bocor klasik</h2>
<ul>
<li><strong>Pertemuan balok–kolom terhitung dua kali</strong> — volume sambungan masuk ke kolom dan ke balok sekaligus. Putuskan milik siapa (lazimnya kolom dihitung menerus, balok dihitung bersih antar muka kolom) dan terapkan konsisten.</li>
<li><strong>Bagian tertimbun terlupakan</strong> — sloof dan fondasi tidak terlihat di denah lantai, tetapi betonnya nyata dan harus dipesan.</li>
<li><strong>Pengurang yang terlewat</strong> — void tangga, lubang shaft, dan bukaan besar mengurangi volume pelat; mengabaikannya membuat pesanan berlebih.</li>
</ul>
<h2>6. Pisahkan volume bersih dari faktor cadangan</h2>
<p>Volume dari gambar adalah <strong>volume bersih terpasang</strong>. Tumpahan, sisa di pompa, dan pemadatan ditangani oleh faktor cadangan yang dinyatakan <em>terpisah dan eksplisit</em> sebagai asumsi — bukan dengan menggelembungkan dimensi elemen. Dengan begitu, ketika realisasi berbeda, kamu tahu persis selisihnya datang dari asumsi cadangan atau dari gambar yang berubah.</p>
<p>Urutan ini membosankan, dan memang itu gunanya. Kubikasi bukan tempat kreativitas; ia adalah rantai telusur dari gambar ke angka, yang setiap mata rantainya bisa ditunjuk. Kalau satu angka tidak bisa ditelusur kembali ke gambarnya, angka itu belum selesai dihitung.</p>
""",
  },
]

HEAD_TOP = """<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
"""
HEAD_FONTS = """  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="stylesheet" href="/artikel/artikel.css" />
</head>
"""

HEADER = """<body class="bg-[#F4F3EF] text-[#121417] selection:bg-[#121417] selection:text-[#F4F3EF]">
  <header class="w-full pt-7 pb-5 px-6 md:px-14 lg:px-24 flex items-center justify-between bg-[#F4F3EF] z-40 relative">
    <a href="/" class="text-[27px] font-bold tracking-[-0.045em] text-black leading-none select-none">zonasipil</a>
    <nav class="hidden md:flex items-center gap-9 lg:gap-11 text-[16px] font-normal text-black">
      <a href="/#services" class="cb-nav-link"><span data-text="Bidang">Bidang</span></a>
      <a href="/#projects" class="cb-nav-link"><span data-text="Kajian">Kajian</span></a>
      <a href="/#about" class="cb-nav-link"><span data-text="Tentang">Tentang</span></a>
      <a href="/artikel/" class="cb-nav-link"><span data-text="Artikel">Artikel</span></a>
      <a href="/#kalkulator" class="cb-btn bg-[#121417] text-[#F4F3EF] px-7 py-3 text-[16px] font-medium" style="--hover-text: #ffffff;">
        <span class="cb-btn-fill bg-[#3B4D61]"></span>
        <span class="cb-btn-text-wrap"><span class="cb-btn-text-inner" data-text="Hitung Cepat">Hitung Cepat</span></span>
      </a>
    </nav>
    <a href="/artikel/" class="md:hidden text-[15px] font-medium">Artikel</a>
  </header>
"""

FOOTER = """  <footer class="bg-[#121417] text-[#F4F3EF] mt-24">
    <div class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-24 py-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div>
        <div class="text-[24px] font-bold tracking-[-0.045em] leading-none mb-3">zonasipil</div>
        <p class="text-white/55 text-[15px] max-w-[420px] leading-relaxed">Pengetahuan dan alat teknik sipil berbahasa Indonesia — dijelaskan dari gambar dan rumus yang terbuka.</p>
      </div>
      <nav class="flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-white/75">
        <a href="/#services" class="hover:text-white">Bidang</a>
        <a href="/#projects" class="hover:text-white">Kajian</a>
        <a href="/artikel/" class="hover:text-white">Artikel</a>
        <a href="/#kalkulator" class="hover:text-white">Kalkulator</a>
        <a href="https://github.com/yfarch0912/zonasipil" target="_blank" rel="noopener" class="hover:text-white">GitHub</a>
      </nav>
    </div>
    <div class="border-t border-white/10">
      <div class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-24 py-5 text-[13px] text-white/40">© 2026 ZonaSipil · zonasipil.web.id</div>
    </div>
  </footer>
</body>
</html>
"""

def esc(s): return html.escape(s, quote=True)

def kind_badge(a):
    return "BERITA PROYEK" if a["kind"] == "berita" else "KAJIAN"

def article_page(a, others):
    t = esc(a["title"]); ex = esc(a["excerpt"]); url = f"{BASE}/artikel/{a['slug']}/"
    src_html = ""
    if a["sources"]:
        items = "\n".join(f'          <li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["label"])}</a></li>' for s in a["sources"])
        src_html = f"""      <aside class="mt-14 border border-black/10 rounded-[20px] p-7 bg-white/60">
        <h2 class="text-[19px] font-semibold tracking-[-0.01em] mb-3">Sumber</h2>
        <p class="text-[14.5px] text-black/55 leading-relaxed mb-3">Fakta proyek pada artikel ini berasal dari sumber berikut. Penjelasan tekniknya adalah uraian konseptual ZonaSipil.</p>
        <ul class="list-disc pl-5 space-y-2 text-[15px] leading-relaxed">
{items}
        </ul>
      </aside>
"""
    cards = "\n".join(f"""        <a href="/artikel/{o['slug']}/" class="block group">
          <div class="rounded-[20px] overflow-hidden aspect-[4/3] bg-neutral-200 mb-4">
            <img src="{o['hero']}" alt="{esc(o['hero_alt'])}" class="art-card-img w-full h-full object-cover" loading="lazy" />
          </div>
          <div class="text-[12px] font-medium uppercase tracking-[0.03em] text-[#168B83] mb-1.5">{o['cat']} · {o['date_label']}</div>
          <h3 class="text-[19px] leading-[1.35] font-medium tracking-[-0.015em] group-hover:text-black/70 transition-colors">{esc(o['title'])}</h3>
        </a>""" for o in others[:3])
    return f"""{HEAD_TOP}  <title>{t} — ZonaSipil</title>
  <meta name="description" content="{ex}" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ZonaSipil" />
  <meta property="og:title" content="{t}" />
  <meta property="og:description" content="{ex}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{BASE}{a['hero']}" />
  <meta property="og:locale" content="id_ID" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{t}" />
  <meta name="twitter:description" content="{ex}" />
  <meta name="twitter:image" content="{BASE}{a['hero']}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="/assets/brand/logo.svg" />
{HEAD_FONTS}{HEADER}
  <main class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-0">
    <div class="max-w-[820px] mx-auto pt-10 md:pt-16">
      <a href="/artikel/" class="text-[14px] font-medium text-[#168B83]">← Semua artikel</a>
      <div class="flex flex-wrap items-center gap-3 mt-7 mb-5">
        <span class="text-[12.5px] font-semibold uppercase tracking-[0.06em] bg-[#168B83] text-white rounded-full px-3.5 py-1.5">{a['cat']}</span>
        <span class="text-[13px] font-medium uppercase tracking-[0.05em] text-black/45">{kind_badge(a)}</span>
        <span class="text-[14px] text-black/45">{a['date_label']}</span>
      </div>
      <h1 class="text-[36px] sm:text-[46px] lg:text-[54px] font-medium tracking-[-0.03em] leading-[1.08] mb-6">{t}</h1>
      <p class="text-[19px] md:text-[21px] leading-[1.55] text-black/65 mb-10">{ex}</p>
      <figure class="mb-12">
        <div class="rounded-[24px] overflow-hidden bg-neutral-200">
          <img src="{a['hero']}" alt="{esc(a['hero_alt'])}" class="w-full aspect-[16/9] object-cover" />
        </div>
        <figcaption class="text-[13.5px] text-black/45 mt-3 leading-relaxed">{esc(a['hero_caption'])}</figcaption>
      </figure>
      <div class="prose-zs">
{a['body'].strip()}
      </div>
{src_html}    </div>
    <div class="max-w-[1100px] mx-auto mt-20">
      <h2 class="text-[28px] md:text-[34px] font-medium tracking-[-0.025em] mb-8">Artikel lainnya</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
{cards}
      </div>
    </div>
  </main>
{FOOTER}"""

def index_page(arts):
    cards = "\n".join(f"""      <a href="/artikel/{a['slug']}/" class="block group">
        <div class="rounded-[24px] overflow-hidden aspect-[4/3] bg-neutral-200 mb-5">
          <img src="{a['hero']}" alt="{esc(a['hero_alt'])}" class="art-card-img w-full h-full object-cover" loading="lazy" />
        </div>
        <div class="flex items-center gap-2.5 mb-2">
          <span class="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[#168B83]">{a['cat']}</span>
          <span class="text-[12px] uppercase tracking-[0.05em] text-black/40">{kind_badge(a)}</span>
        </div>
        <h2 class="text-[22px] leading-[1.32] font-medium tracking-[-0.015em] mb-2 group-hover:text-black/70 transition-colors">{esc(a['title'])}</h2>
        <p class="text-[15px] leading-relaxed text-black/55 mb-2.5">{esc(a['excerpt'])}</p>
        <div class="text-[13.5px] text-black/40">{a['date_label']}</div>
      </a>""" for a in arts)
    return f"""{HEAD_TOP}  <title>Artikel — ZonaSipil</title>
  <meta name="description" content="Artikel ZonaSipil: bedah teknik proyek infrastruktur Indonesia dari berita terbaru, plus kajian rumus dan gambar kerja — selalu dengan sumber yang bisa ditelusur." />
  <link rel="canonical" href="{BASE}/artikel/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ZonaSipil" />
  <meta property="og:title" content="Artikel — ZonaSipil" />
  <meta property="og:description" content="Bedah teknik proyek infrastruktur dan kajian teknik sipil berbahasa Indonesia, dengan sumber terbuka." />
  <meta property="og:url" content="{BASE}/artikel/" />
  <meta property="og:image" content="{BASE}/assets/images/zs_showreel_1.webp" />
  <meta property="og:locale" content="id_ID" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="/assets/brand/logo.svg" />
{HEAD_FONTS}{HEADER}
  <main class="max-w-[1326px] mx-auto px-6 md:px-14 lg:px-0">
    <div class="pt-10 md:pt-16 pb-14 max-w-[860px]">
      <h1 class="text-[48px] sm:text-[64px] md:text-[76px] font-medium tracking-[-0.035em] leading-none mb-6">Artikel</h1>
      <p class="text-[19px] md:text-[21px] leading-[1.55] text-black/65">Dua jenis tulisan: <strong class="text-black">berita proyek</strong> — kabar pembangunan terbaru yang dibedah dari sisi tekniknya (terbuat dari apa, strukturnya bekerja bagaimana, hitungannya seperti apa), selalu dengan sumber; dan <strong class="text-black">kajian</strong> — penjelasan rumus dan gambar kerja langkah demi langkah.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
{cards}
    </div>
  </main>
{FOOTER}"""

def main():
    arts = sorted(ARTICLES, key=lambda a: a["date"], reverse=True)
    (ART / "index.html").write_text(index_page(arts), encoding="utf-8")
    for i, a in enumerate(arts):
        others = [o for o in arts if o["slug"] != a["slug"]]
        d = ART / a["slug"]; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(article_page(a, others), encoding="utf-8")
    urls = [("/", "1.0"), ("/artikel/", "0.9")] + [(f"/artikel/{a['slug']}/", "0.8") for a in arts]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, pr in urls:
        sm += ["  <url>", f"    <loc>{BASE}{loc}</loc>", "    <lastmod>2026-11-01</lastmod>", "    <changefreq>weekly</changefreq>", f"    <priority>{pr}</priority>", "  </url>"]
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
    print(f"OK: indeks + {len(arts)} artikel + sitemap ({len(urls)} URL)")

if __name__ == "__main__":
    main()
