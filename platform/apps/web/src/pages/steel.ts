import { bebanKritisKolom, propertiProfilI } from "@zonasipil/app-steel";
import { barisHasil, buatFormulir, buatJudulHalaman, buatMetode } from "../lib/ui.ts";
import { formatHasil } from "../lib/format.ts";

export function renderSteel(root: HTMLElement): void {
  root.append(buatJudulHalaman("Zona Steel", "Properti penampang I simetris dan beban kritis teoritis kolom ideal (Euler/Johnson)."));

  root.append(
    buatFormulir(
      "Properti penampang I simetris",
      [
        { id: "s-h", label: "Tinggi penampang h (mm)", def: "300", parse: { positif: true } },
        { id: "s-b", label: "Lebar sayap b (mm)", def: "150", parse: { positif: true } },
        { id: "s-tw", label: "Tebal badan tw (mm)", def: "6,5", parse: { positif: true } },
        { id: "s-tf", label: "Tebal sayap tf (mm)", def: "9", parse: { positif: true } },
      ],
      (n) => {
        const hasil = propertiProfilI({ h: n["s-h"], b: n["s-b"], tw: n["s-tw"], tf: n["s-tf"] });
        return [
          barisHasil("Luas penampang A", hasil.A, "mm²", 1),
          ["Momen inersia Ix", `${formatHasil(hasil.Ix, 0)} mm⁴`],
          ["Momen inersia Iy", `${formatHasil(hasil.Iy, 0)} mm⁴`],
          ["Modulus penampang Sx", `${formatHasil(hasil.Sx, 0)} mm³`],
          ["Modulus penampang Sy", `${formatHasil(hasil.Sy, 0)} mm³`],
          barisHasil("Jari-jari girasi rx", hasil.rx, "mm"),
          barisHasil("Jari-jari girasi ry", hasil.ry, "mm"),
          barisHasil("Berat per meter", hasil.beratPerMeter, "kg/m"),
        ];
      },
    ).element,
  );

  root.append(
    buatFormulir(
      "Beban kritis kolom ideal — Euler / Johnson",
      [
        { id: "s-e", label: "Modulus elastisitas E (MPa)", def: "200000", parse: { positif: true } },
        { id: "s-fy", label: "Tegangan leleh baja fy (MPa)", def: "250", parse: { positif: true } },
        { id: "s-a", label: "Luas penampang A (mm²)", def: "4533", parse: { positif: true } },
        { id: "s-r", label: "Jari-jari girasi r pada sumbu tekuk (mm)", def: "33,44", parse: { positif: true } },
        { id: "s-kl", label: "Panjang efektif KL (mm)", def: "5000", parse: { positif: true } },
      ],
      (n) => {
        const hasil = bebanKritisKolom({ E: n["s-e"], fy: n["s-fy"], A: n["s-a"], r: n["s-r"], KL: n["s-kl"] });
        return [
          barisHasil("Rasio kelangsingan λ = KL/r", hasil.lambda, "", 2),
          barisHasil("Kelangsingan pemisah Cc", hasil.Cc, "", 2),
          ["Rumus terpakai", hasil.metode === "euler" ? "Euler (λ > Cc)" : "Johnson (λ ≤ Cc)"],
          barisHasil("Tegangan kritis teoritis σcr", hasil.sigmaKritisMPa, "MPa"),
          barisHasil("Beban kritis teoritis Pcr", hasil.bebanKritisKn, "kN"),
        ];
      },
    ).element,
  );

  root.append(
    buatMetode(
      [
        "Penampang I dimodelkan sebagai tiga persegi panjang (sayap atas + badan + sayap bawah) tanpa fillet: A = 2·b·tf + (h − 2·tf)·tw; Ix/Iy dari rumus persegi gabungan; Sx = Ix/(h/2); Sy = Iy/(b/2); rx = √(Ix/A); ry = √(Iy/A); berat memakai massa jenis baja 7850 kg/m³ dari engineering-core.",
        "Kolom ideal: λ = KL/r; Cc = √(2π²E/fy); λ ≤ Cc memakai Johnson, λ > Cc memakai Euler; Pcr = σcr·A. Pemanggil bertanggung jawab menggabungkan K dan L serta memilih r yang sesuai.",
      ],
      [
        "Cek desain baja menurut kode dinyatakan UNSUPPORTED: tidak ada faktor keamanan/reduksi, kurva kekuatan kolom kode, maupun pemeriksaan kombinasi beban.",
        "Tekuk lokal elemen langsing, tekuk lentur-torsi/lateral-torsional, dan klasifikasi kekompakan penampang.",
        "Properti plastis (Zx, Zy), konstanta torsi/warping, dan penampang selain I simetris.",
        "Fillet profil canai nyata — hasil sedikit lebih kecil dari tabel profil pabrikan, dan tabel pabrikan selalu didahulukan.",
        "Sambungan, pelat dasar, kelelahan, desain seismik, serta kolom tidak ideal (eksentrisitas, imperfeksi, tegangan sisa).",
      ],
    ),
  );
}
