import { parseField, type OpsiParse } from "./parse.ts";
import { formatHasil } from "./format.ts";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export interface FieldSpec {
  id: string;
  label: string;
  def: string;
  parse: Omit<OpsiParse, "label">;
  /** Bila diisi, field dirender sebagai <select> dengan pilihan ini (bukan input angka). */
  pilihan?: string[];
}

interface FieldRefs {
  spec: FieldSpec;
  input: HTMLInputElement | HTMLSelectElement;
  error: HTMLParagraphElement;
}

export interface Formulir {
  element: HTMLElement;
  hasil: HTMLElement;
  /** Baca semua field; bila ada yang tidak valid, tampilkan error per field dan kembalikan null. */
  baca(): Record<string, number> | null;
  /** Nilai field <select> (field dengan `pilihan`) berdasarkan id. */
  bacaPilihan(id: string): string;
  tampilkanHasil(baris: Array<[string, string]>): void;
  tampilkanError(pesan: string): void;
}

/**
 * Bangun satu formulir hitung: field teks (koma desimal didukung),
 * tombol hitung, area hasil, dan area error tingkat formulir.
 * `onHitung` menerima nilai angka tervalidasi dan mengembalikan
 * baris [label, nilai-teks] untuk ditampilkan. Error yang dilempar
 * (mis. dari validasi paket logika) ditangkap dan ditampilkan.
 */
export function buatFormulir(
  judul: string,
  specs: FieldSpec[],
  onHitung: (nilai: Record<string, number>) => Array<[string, string]>,
  ekstra?: (refs: { form: HTMLFormElement }) => HTMLElement | null,
): Formulir {
  const section = el("section", "card");
  section.append(el("h3", "", judul));
  const form = el("form", "form-grid");
  form.noValidate = true;
  const refs: FieldRefs[] = [];

  for (const spec of specs) {
    const wrap = el("div", "field");
    const label = el("label", "", spec.label);
    label.htmlFor = spec.id;
    let input: HTMLInputElement | HTMLSelectElement;
    if (spec.pilihan) {
      const select = document.createElement("select");
      select.id = spec.id;
      for (const pilihan of spec.pilihan) {
        const opt = document.createElement("option");
        opt.value = pilihan;
        opt.textContent = pilihan;
        select.append(opt);
      }
      select.value = spec.def;
      input = select;
    } else {
      const teks = document.createElement("input");
      teks.id = spec.id;
      teks.type = "text";
      teks.inputMode = "decimal";
      teks.value = spec.def;
      teks.autocomplete = "off";
      input = teks;
    }
    const error = el("p", "field-error");
    error.id = `${spec.id}-error`;
    error.setAttribute("role", "alert");
    error.hidden = true;
    input.setAttribute("aria-describedby", error.id);
    wrap.append(label, input, error);
    form.append(wrap);
    refs.push({ spec, input, error });
  }

  const formError = el("p", "form-error");
  formError.setAttribute("role", "alert");
  formError.hidden = true;

  const hasil = el("div", "hasil");
  hasil.hidden = true;

  const tombol = el("button", "btn-primary", "Hitung");
  tombol.type = "submit";
  form.append(tombol);
  section.append(form);
  if (ekstra) {
    const tambahan = ekstra({ form });
    if (tambahan) section.append(tambahan);
  }
  section.append(formError, hasil);

  function baca(): Record<string, number> | null {
    const nilai: Record<string, number> = {};
    let valid = true;
    for (const ref of refs) {
      if (ref.spec.pilihan) continue;
      const hasilParse = parseField(ref.input.value, { label: ref.spec.label, ...ref.spec.parse });
      if (!hasilParse.ok) {
        ref.error.textContent = hasilParse.error;
        ref.error.hidden = false;
        ref.input.setAttribute("aria-invalid", "true");
        valid = false;
      } else {
        ref.error.hidden = true;
        ref.input.removeAttribute("aria-invalid");
        nilai[ref.spec.id] = hasilParse.value;
      }
    }
    return valid ? nilai : null;
  }

  function tampilkanHasil(baris: Array<[string, string]>): void {
    hasil.replaceChildren();
    const dl = el("dl", "hasil-list");
    for (const [label, nilaiTeks] of baris) {
      dl.append(el("dt", "", label), el("dd", "", nilaiTeks));
    }
    hasil.append(dl);
    hasil.hidden = false;
    formError.hidden = true;
  }

  function tampilkanError(pesan: string): void {
    formError.textContent = pesan;
    formError.hidden = false;
    hasil.hidden = true;
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nilai = baca();
    if (!nilai) {
      hasil.hidden = true;
      formError.hidden = true;
      return;
    }
    try {
      tampilkanHasil(onHitung(nilai));
    } catch (err) {
      tampilkanError(err instanceof Error ? err.message : "Terjadi kesalahan perhitungan.");
    }
  });

  function bacaPilihan(id: string): string {
    const ref = refs.find((r) => r.spec.id === id);
    return ref ? ref.input.value : "";
  }

  return { element: section, hasil, baca, bacaPilihan, tampilkanHasil, tampilkanError };
}

/** Baris hasil angka terformat aman (tidak pernah NaN/undefined). */
export function barisHasil(label: string, value: number, satuan = "", decimals = 3): [string, string] {
  return [label, `${formatHasil(value, decimals)}${satuan ? ` ${satuan}` : ""}`];
}

/** Bagian "Metode & batas" — ringkasan metode + daftar UNSUPPORTED dari README modul logika. */
export function buatMetode(metode: string[], unsupported: string[]): HTMLElement {
  const section = el("section", "card metode");
  section.append(el("h3", "", "Metode & batas"));
  for (const paragraf of metode) section.append(el("p", "", paragraf));
  section.append(el("h4", "", "Tidak didukung (UNSUPPORTED)"));
  const ul = el("ul", "");
  for (const item of unsupported) ul.append(el("li", "", item));
  section.append(ul);
  section.append(
    el(
      "p",
      "catatan-kejujuran",
      "Hasil di halaman ini adalah hitungan metode textbook/geometris dari paket logika monorepo — bukan klaim kepatuhan terhadap SNI atau standar apa pun, dan bukan dokumen desain.",
    ),
  );
  return section;
}

export function buatJudulHalaman(judul: string, deskripsi: string): HTMLElement {
  const wrap = el("div", "page-head");
  wrap.append(el("h2", "", judul), el("p", "", deskripsi));
  return wrap;
}
