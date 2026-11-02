import { eksporCSV, eksporJSON, hitungRAB, type HasilRAB } from "@zonasipil/app-rab";
import { buatJudulHalaman, buatMetode, el } from "../lib/ui.ts";
import { barisKosong, daftarKeItems, hapusBaris, tambahBaris, ubahBaris, type BarisRAB } from "../lib/rab-state.ts";
import { formatRupiah } from "../lib/format.ts";
import { parseField } from "../lib/parse.ts";

let baris: BarisRAB[] = [
  { id: 1, seksi: "Struktur", uraian: "Beton bertulang", volume: "2,5", satuan: "m3", hargaSatuan: "1200000" },
  { id: 2, seksi: "Arsitektur", uraian: "Pekerjaan contoh kedua", volume: "10", satuan: "ls", hargaSatuan: "150000" },
];

export function renderRAB(root: HTMLElement): void {
  root.append(buatJudulHalaman("Zona RAB", "Rencana Anggaran Biaya: item editable, subtotal per seksi, pajak persentase, ekspor CSV & JSON."));

  const section = el("section", "card");
  section.append(el("h3", "", "Tabel item pekerjaan"));

  const ppnWrap = el("div", "field");
  const ppnLabel = el("label", "", "Persentase pajak / PPN (%) — parameter pengguna, bukan klaim tarif resmi");
  ppnLabel.htmlFor = "rab-ppn";
  const ppnInput = document.createElement("input");
  ppnInput.id = "rab-ppn";
  ppnInput.type = "text";
  ppnInput.inputMode = "decimal";
  ppnInput.value = "11";
  ppnWrap.append(ppnLabel, ppnInput);
  section.append(ppnWrap);

  const tabelWrap = el("div", "tabel-wrap");
  const hasilEl = el("div", "hasil");
  const errorEl = el("p", "form-error");
  errorEl.setAttribute("role", "alert");

  let hasilTerakhir: HasilRAB | null = null;

  function sinkronDariDOM(): void {
    tabelWrap.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((tr) => {
      const id = Number(tr.dataset.id);
      const ambil = (nama: string) =>
        tr.querySelector<HTMLInputElement>(`input[data-field="${nama}"]`)?.value ?? "";
      baris = ubahBaris(baris, id, {
        seksi: ambil("seksi"),
        uraian: ambil("uraian"),
        volume: ambil("volume"),
        satuan: ambil("satuan"),
        hargaSatuan: ambil("hargaSatuan"),
      });
    });
  }

  function hitung(): void {
    const ppn = parseField(ppnInput.value, { label: "Persentase pajak", tidakNegatif: true });
    if (!ppn.ok) {
      hasilTerakhir = null;
      errorEl.textContent = ppn.error;
      errorEl.hidden = false;
      hasilEl.hidden = true;
      return;
    }
    try {
      const hasil = hitungRAB(daftarKeItems(baris), { ppnPersen: ppn.value });
      hasilTerakhir = hasil;
      errorEl.hidden = true;
      hasilEl.replaceChildren();
      const dl = el("dl", "hasil-list");
      for (const s of hasil.perSeksi) dl.append(el("dt", "", `Subtotal seksi ${s.seksi}`), el("dd", "", formatRupiah(s.subtotal)));
      const ringkasan: Array<[string, string]> = [
        ["Total sebelum pajak", formatRupiah(hasil.totalSebelumPajak)],
        [`Pajak (${hasil.ppnPersen}%)`, formatRupiah(hasil.ppn)],
        ["Grand total", formatRupiah(hasil.grandTotal)],
      ];
      for (const r of ringkasan) dl.append(el("dt", "", r[0]), el("dd", "", r[1]));
      if (hasil.perItem.length === 0) {
        dl.append(el("dt", "", "Catatan"), el("dd", "", "Belum ada item terisi — semua total 0."));
      }
      hasilEl.append(dl);
      hasilEl.hidden = false;
      segarkanJumlahBaris();
    } catch (err) {
      hasilTerakhir = null;
      errorEl.textContent = err instanceof Error ? err.message : "Perhitungan RAB gagal.";
      errorEl.hidden = false;
      hasilEl.hidden = true;
    }
  }

  function segarkanJumlahBaris(): void {
    if (!hasilTerakhir) return;
    // perItem mengikuti urutan baris non-kosong; petakan kembali per id baris.
    const jumlahPerId = new Map<number, number>();
    let idx = 0;
    for (const b of baris) {
      if (barisKosong(b)) continue;
      const item = hasilTerakhir.perItem[idx];
      if (item) jumlahPerId.set(b.id, item.jumlah);
      idx++;
    }
    tabelWrap.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((tr) => {
      const sel = tr.querySelector<HTMLElement>("[data-jumlah]");
      const jumlah = jumlahPerId.get(Number(tr.dataset.id));
      if (sel) sel.textContent = jumlah !== undefined ? formatRupiah(jumlah) : "—";
    });
  }

  function renderTabel(): void {
    tabelWrap.replaceChildren();
    const tabel = el("table", "tabel-rab");
    const thead = el("thead", "");
    const trh = el("tr", "");
    for (const judul of ["Seksi", "Uraian", "Volume", "Satuan", "Harga satuan (Rp)", "Jumlah", ""]) {
      trh.append(el("th", "", judul));
    }
    thead.append(trh);
    const tbody = el("tbody", "");
    baris.forEach((b, idx) => {
      const tr = el("tr", "");
      tr.dataset.id = String(b.id);
      const kolom: Array<[keyof BarisRAB, string]> = [
        ["seksi", `Seksi baris ${idx + 1}`],
        ["uraian", `Uraian baris ${idx + 1}`],
        ["volume", `Volume baris ${idx + 1}`],
        ["satuan", `Satuan baris ${idx + 1}`],
        ["hargaSatuan", `Harga satuan baris ${idx + 1}`],
      ];
      for (const [field, labelAkses] of kolom) {
        const td = el("td", "");
        const input = document.createElement("input");
        input.type = "text";
        if (field === "volume" || field === "hargaSatuan") input.inputMode = "decimal";
        input.value = String(b[field]);
        input.dataset.field = field;
        input.setAttribute("aria-label", labelAkses);
        input.addEventListener("input", () => {
          sinkronDariDOM();
          hitung();
        });
        td.append(input);
        tr.append(td);
      }
      const tdJumlah = el("td", "jumlah-sel", "—");
      tdJumlah.dataset.jumlah = "1";
      tr.append(tdJumlah);
      const tdAksi = el("td", "");
      const tombolHapus = el("button", "btn-hapus", "Hapus");
      tombolHapus.type = "button";
      tombolHapus.setAttribute("aria-label", `Hapus baris ${idx + 1}`);
      tombolHapus.addEventListener("click", () => {
        sinkronDariDOM();
        baris = hapusBaris(baris, b.id);
        renderTabel();
        hitung();
      });
      tdAksi.append(tombolHapus);
      tr.append(tdAksi);
      tbody.append(tr);
    });
    tabel.append(thead, tbody);
    tabelWrap.append(tabel);
  }

  const tombolTambah = el("button", "btn-secondary", "+ Tambah baris");
  tombolTambah.type = "button";
  tombolTambah.addEventListener("click", () => {
    sinkronDariDOM();
    baris = tambahBaris(baris);
    renderTabel();
    hitung();
  });

  function unduh(namaFile: string, isi: string, tipe: string): void {
    const blob = new Blob([isi], { type: tipe });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = namaFile;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tombolCSV = el("button", "btn-secondary", "Ekspor CSV");
  tombolCSV.type = "button";
  tombolCSV.addEventListener("click", () => {
    sinkronDariDOM();
    hitung();
    if (hasilTerakhir) unduh("rab.csv", eksporCSV(hasilTerakhir), "text/csv;charset=utf-8");
  });
  const tombolJSON = el("button", "btn-secondary", "Ekspor JSON");
  tombolJSON.type = "button";
  tombolJSON.addEventListener("click", () => {
    sinkronDariDOM();
    hitung();
    if (hasilTerakhir) unduh("rab.json", eksporJSON(hasilTerakhir), "application/json;charset=utf-8");
  });

  ppnInput.addEventListener("input", hitung);
  const aksi = el("div", "aksi-rab");
  aksi.append(tombolTambah, tombolCSV, tombolJSON);
  section.append(tabelWrap, aksi, errorEl, hasilEl);
  root.append(section);
  renderTabel();
  hitung();

  root.append(
    buatMetode(
      [
        "Jumlah per item = volume × harga satuan. Subtotal per seksi mengikuti urutan kemunculan pertama seksi; item tanpa seksi masuk seksi \"Umum\" (dari paket logika). Pajak = total sebelum pajak × persen pajak / 100 — persen pajak adalah parameter yang Anda isi (bawaan 11), bukan klaim tarif resmi.",
        "Ekspor CSV memakai pemisah \";\" agar terbaca benar oleh Excel berbahasa Indonesia; ekspor JSON adalah stringify terformat dari hasil hitungRAB. Keduanya dihasilkan oleh fungsi eksporCSV/eksporJSON paket @zonasipil/app-rab.",
      ],
      [
        "Koefisien AHSP / analisis harga satuan dari komponen upah, bahan, dan alat — harga satuan diisi langsung oleh pengguna.",
        "Harga satuan resmi daerah, indeks harga, dan eskalasi/inflasi.",
        "Pajak bertingkat, jenis pajak selain satu persentase tunggal, diskon, dan biaya tak terduga otomatis.",
        "Volume otomatis dari gambar/kuantitas — volume diisi pengguna (lihat Zona Quantity).",
        "Mata uang selain rupiah, tanda tangan/pengesahan, dan format dokumen resmi instansi.",
      ],
    ),
  );
}
