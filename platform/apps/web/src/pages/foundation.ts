import { dayaDukungIzin, dayaDukungUltimit, faktorDayaDukung, ukuranTelapakPersegi, type BentukTelapak } from "@zonasipil/app-foundation";
import { barisHasil, buatFormulir, buatJudulHalaman, buatMetode, type Formulir } from "../lib/ui.ts";

export function renderFoundation(root: HTMLElement): void {
  root.append(buatJudulHalaman("Zona Foundation", "Daya dukung tanah fondasi dangkal: faktor Terzaghi/Vesic, q ultimit, q izin, dan ukuran telapak persegi."));

  root.append(
    buatFormulir(
      "Faktor daya dukung",
      [{ id: "f-phi", label: "Sudut geser dalam tanah φ (derajat)", def: "30", parse: { tidakNegatif: true } }],
      (n) => {
        const hasil = faktorDayaDukung(n["f-phi"]);
        return [
          barisHasil("Nc", hasil.Nc, "", 2),
          barisHasil("Nq", hasil.Nq, "", 2),
          barisHasil("Nγ (Ngamma, Vesic)", hasil.Ngamma, "", 2),
        ];
      },
    ).element,
  );

  let formUltimit: Formulir;
  formUltimit = buatFormulir(
    "Daya dukung ultimit & izin",
    [
      { id: "f-c", label: "Kohesi tanah c (kPa)", def: "10", parse: { tidakNegatif: true } },
      { id: "f-uphi", label: "Sudut geser dalam tanah φ (derajat)", def: "30", parse: { tidakNegatif: true } },
      { id: "f-gamma", label: "Berat volume tanah gamma (kN/m³)", def: "18", parse: { positif: true } },
      { id: "f-b", label: "Lebar fondasi B (m)", def: "1,5", parse: { positif: true } },
      { id: "f-df", label: "Kedalaman dasar fondasi Df (m)", def: "1", parse: { tidakNegatif: true } },
      { id: "f-bentuk", label: "Bentuk telapak", def: "lajur", parse: {}, pilihan: ["lajur", "persegi"] },
      { id: "f-fs", label: "Faktor keamanan", def: "3", parse: { positif: true } },
    ],
    (n) => {
      const bentuk = formUltimit.bacaPilihan("f-bentuk") as BentukTelapak;
      const hasil = dayaDukungUltimit({ c: n["f-c"], phi: n["f-uphi"], gamma: n["f-gamma"], B: n["f-b"], Df: n["f-df"], bentuk });
      return [
        barisHasil("Nc", hasil.Nc, "", 2),
        barisHasil("Nq", hasil.Nq, "", 2),
        barisHasil("Nγ (Ngamma, Vesic)", hasil.Ngamma, "", 2),
        barisHasil("Overburden q = gamma × Df", hasil.q, "kPa"),
        barisHasil("Daya dukung ultimit qult", hasil.qult, "kPa"),
        barisHasil("Daya dukung izin q izin (qult / FS)", dayaDukungIzin(hasil.qult, n["f-fs"]), "kPa"),
      ];
    },
  );
  root.append(formUltimit.element);

  root.append(
    buatFormulir(
      "Ukuran telapak persegi",
      [
        { id: "f-beban", label: "Beban vertikal total (kN)", def: "500", parse: { positif: true } },
        { id: "f-sc", label: "Kohesi tanah c (kPa)", def: "10", parse: { tidakNegatif: true } },
        { id: "f-sphi", label: "Sudut geser dalam tanah φ (derajat)", def: "30", parse: { tidakNegatif: true } },
        { id: "f-sgamma", label: "Berat volume tanah gamma (kN/m³)", def: "18", parse: { positif: true } },
        { id: "f-sdf", label: "Kedalaman dasar fondasi Df (m)", def: "1", parse: { tidakNegatif: true } },
        { id: "f-sfs", label: "Faktor keamanan", def: "3", parse: { positif: true } },
      ],
      (n) => {
        const hasil = ukuranTelapakPersegi({
          bebanKn: n["f-beban"],
          c: n["f-sc"],
          phi: n["f-sphi"],
          gamma: n["f-sgamma"],
          Df: n["f-sdf"],
          faktorKeamanan: n["f-sfs"],
        });
        return [
          barisHasil("Sisi telapak persegi terpilih B", hasil.B, "m", 2),
          barisHasil("Daya dukung izin pada B terpilih", hasil.qall, "kPa"),
          barisHasil("Tekanan aktual (beban / B²)", hasil.tekananAktual, "kPa"),
        ];
      },
    ).element,
  );

  root.append(
    buatMetode(
      [
        "Faktor daya dukung: Nq dan Nc menurut Prandtl–Reissner, Nγ menurut Vesic (2 × (Nq + 1) × tan φ). Kasus khusus φ = 0 memakai nilai Terzaghi Nc = 5,7; Nq = 1; Nγ = 0.",
        "qult lajur = c·Nc + q·Nq + 0,5·gamma·B·Nγ; qult persegi memakai koreksi bentuk Terzaghi klasik 1,3·c·Nc + q·Nq + 0,4·gamma·B·Nγ, dengan q = gamma × Df.",
        "q izin = qult / faktor keamanan (bawaan 3, tanggung jawab perencana). Ukuran telapak dicari mulai 0,5 m naik 0,05 m sampai tekanan aktual ≤ q izin (batas 10 m); berat sendiri fondasi tidak ditambahkan otomatis ke beban.",
      ],
      [
        "Penurunan (settlement) konsolidasi maupun elastis.",
        "Fondasi dalam dan daya dukung kelompok tiang.",
        "Tanah berlapis, muka air tanah, dan koreksi berat volume efektif/terendam.",
        "Keruntuhan geser lokal/punching, faktor koreksi kedalaman/bentuk di luar koefisien Terzaghi di atas, beban eksentris/miring.",
        "Fondasi lingkaran, interaksi struktur–tanah, pengaruh gempa, dan penggantian penyelidikan tanah/insinyur geoteknik berlisensi.",
      ],
    ),
  );
}
