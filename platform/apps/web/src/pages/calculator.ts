import { beratTulangan, convert, volumeBeton, type UnitKind } from "@zonasipil/app-calculator";
import { barisHasil, buatFormulir, buatJudulHalaman, buatMetode, el } from "../lib/ui.ts";
import { parseField } from "../lib/parse.ts";
import { formatHasil } from "../lib/format.ts";
import { UNIT_KINDS, UNIT_KIND_LABELS, UNIT_OPTIONS } from "../lib/units.ts";

export function renderCalculator(root: HTMLElement): void {
  root.append(buatJudulHalaman("Zona Calculator", "Volume beton, berat tulangan, dan konversi satuan dari rumus terbuka."));

  const volume = buatFormulir(
    "Volume beton",
    [
      { id: "calc-p", label: "Panjang (m)", def: "3", parse: { positif: true } },
      { id: "calc-l", label: "Lebar (m)", def: "2", parse: { positif: true } },
      { id: "calc-t", label: "Tebal/tinggi (m)", def: "0,5", parse: { positif: true } },
      { id: "calc-n", label: "Jumlah elemen", def: "1", parse: { positif: true, bulat: true } },
      { id: "calc-waste", label: "Waste (%)", def: "5", parse: { tidakNegatif: true, maksimum: 100 } },
    ],
    (n) => {
      const hasil = volumeBeton(n["calc-p"], n["calc-l"], n["calc-t"], n["calc-n"], n["calc-waste"]);
      return [barisHasil("Volume bersih", hasil.bersih, "m³"), barisHasil("Volume dengan waste", hasil.denganWaste, "m³")];
    },
  );
  root.append(volume.element);

  const berat = buatFormulir(
    "Berat tulangan",
    [
      { id: "calc-d", label: "Diameter tulangan (mm)", def: "13", parse: { positif: true } },
      { id: "calc-panjang", label: "Panjang total (m)", def: "120", parse: { positif: true } },
    ],
    (n) => {
      const hasil = beratTulangan(n["calc-d"], n["calc-panjang"]);
      return [barisHasil("Berat per meter", hasil.perMeter, "kg/m"), barisHasil("Berat total", hasil.total, "kg")];
    },
  );
  root.append(berat.element);
  root.append(buatKonversi());
  root.append(
    buatMetode(
      [
        "Volume beton: prisma persegi panjang — bersih = panjang × lebar × tebal × jumlah elemen; dengan waste = bersih × (1 + waste%/100).",
        "Berat tulangan: per meter = 0,006165 × d² (kg/m, d dalam mm; faktor dari massa jenis baja 7850 kg/m³ di engineering-core), total = per meter × panjang total.",
        "Konversi satuan memakai convert() dari @zonasipil/engineering-core (faktor ke satuan dasar SI per kategori).",
      ],
      [
        "Bentuk selain prisma persegi panjang (silinder, trapesium, piramida, bentuk tak beraturan) tidak dihitung.",
        "Bengkokan, kait, sengkang terpisah, dan sambungan lewatan tulangan tidak ditambahkan otomatis — masukkan panjang total yang sudah termasuk bagian itu.",
        "Waste hanya persentase sederhana; bukan susut, faktor pemadatan, atau sisa mixer.",
        "Konversi hanya untuk kategori panjang, luas, volume, massa, gaya, momen, dan tekanan/tegangan.",
        "Bukan perhitungan struktur: kekuatan, lendutan, dan penulangan tidak diperiksa.",
      ],
    ),
  );
}

function buatKonversi(): HTMLElement {
  const section = el("section", "card");
  section.append(el("h3", "", "Konversi satuan"));
  const form = el("form", "form-grid");
  form.noValidate = true;

  function fieldSelect(id: string, label: string, options: string[]): { wrap: HTMLElement; select: HTMLSelectElement } {
    const wrap = el("div", "field");
    const lab = el("label", "", label);
    lab.htmlFor = id;
    const select = document.createElement("select");
    select.id = id;
    for (const o of options) {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      select.append(opt);
    }
    wrap.append(lab, select);
    return { wrap, select };
  }

  const wrapNilai = el("div", "field");
  const labNilai = el("label", "", "Nilai");
  labNilai.htmlFor = "calc-konv-nilai";
  const inputNilai = document.createElement("input");
  inputNilai.id = "calc-konv-nilai";
  inputNilai.type = "text";
  inputNilai.inputMode = "decimal";
  inputNilai.value = "1";
  const errNilai = el("p", "field-error");
  errNilai.setAttribute("role", "alert");
  errNilai.hidden = true;
  wrapNilai.append(labNilai, inputNilai, errNilai);

  const kategori = fieldSelect(
    "calc-konv-jenis",
    "Kategori satuan",
    UNIT_KINDS.map((k) => k),
  );
  // Label kategori yang terbaca manusia:
  Array.from(kategori.select.options).forEach((opt, i) => {
    opt.textContent = UNIT_KIND_LABELS[UNIT_KINDS[i]];
  });
  kategori.select.value = "length";
  const dari = fieldSelect("calc-konv-dari", "Dari satuan", [...UNIT_OPTIONS.length]);
  const ke = fieldSelect("calc-konv-ke", "Ke satuan", [...UNIT_OPTIONS.length]);
  dari.select.value = "m";
  ke.select.value = "cm";

  function segarkanSatuan(): void {
    const kind = kategori.select.value as UnitKind;
    for (const f of [dari, ke]) {
      const sebelumnya = f.select.value;
      f.select.replaceChildren();
      for (const u of UNIT_OPTIONS[kind]) {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        f.select.append(opt);
      }
      if ((UNIT_OPTIONS[kind] as readonly string[]).includes(sebelumnya)) f.select.value = sebelumnya;
    }
  }
  kategori.select.addEventListener("change", segarkanSatuan);

  const formError = el("p", "form-error");
  formError.setAttribute("role", "alert");
  formError.hidden = true;
  const hasil = el("div", "hasil");
  hasil.hidden = true;

  const tombol = el("button", "btn-primary", "Konversi");
  tombol.type = "submit";
  form.append(wrapNilai, kategori.wrap, dari.wrap, ke.wrap, tombol);
  section.append(form, formError, hasil);

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const parsed = parseField(inputNilai.value, { label: "Nilai" });
    if (!parsed.ok) {
      errNilai.textContent = parsed.error;
      errNilai.hidden = false;
      hasil.hidden = true;
      return;
    }
    errNilai.hidden = true;
    try {
      const nilai = convert(parsed.value, dari.select.value, ke.select.value, kategori.select.value as UnitKind);
      hasil.replaceChildren();
      const dl = el("dl", "hasil-list");
      dl.append(
        el("dt", "", "Hasil konversi"),
        el("dd", "", `${formatHasil(parsed.value, 4)} ${dari.select.value} = ${formatHasil(nilai, 6)} ${ke.select.value}`),
      );
      hasil.append(dl);
      hasil.hidden = false;
      formError.hidden = true;
    } catch (err) {
      formError.textContent = err instanceof Error ? err.message : "Konversi gagal.";
      formError.hidden = false;
      hasil.hidden = true;
    }
  });
  return section;
}
