import { beta1, estimasiMaterialBeton, kapasitasLenturBalok, tulanganMinimumBalok } from "@zonasipil/app-concrete";
import { barisHasil, buatFormulir, buatJudulHalaman, buatMetode } from "../lib/ui.ts";
import { formatHasil } from "../lib/format.ts";

export function renderConcrete(root: HTMLElement): void {
  root.append(buatJudulHalaman("Zona Concrete", "Kapasitas lentur balok (blok tegangan Whitney), tulangan minimum, dan estimasi material beton."));

  root.append(
    buatFormulir(
      "Kapasitas lentur balok — tulangan tunggal (Whitney)",
      [
        { id: "c-fc", label: "Kuat tekan beton fc (MPa)", def: "25", parse: { positif: true } },
        { id: "c-fy", label: "Tegangan leleh baja fy (MPa)", def: "400", parse: { positif: true } },
        { id: "c-b", label: "Lebar penampang b (mm)", def: "250", parse: { positif: true } },
        { id: "c-d", label: "Tinggi efektif d (mm)", def: "450", parse: { positif: true } },
        { id: "c-as", label: "Luas tulangan tarik As (mm²)", def: "1472,6", parse: { positif: true } },
      ],
      (n) => {
        const hasil = kapasitasLenturBalok({ b: n["c-b"], d: n["c-d"], As: n["c-as"], fy: n["c-fy"], fc: n["c-fc"] });
        const baris: Array<[string, string]> = [
          barisHasil("β1 (beta1)", beta1(n["c-fc"]), "", 3),
          barisHasil("Kedalaman blok tegangan a", hasil.a, "mm"),
          barisHasil("Kedalaman sumbu netral c", hasil.c, "mm"),
          ["Regangan tarik neto εt", formatHasil(hasil.epsilonT, 5)],
          barisHasil("Momen nominal Mn", hasil.Mn_kNm, "kN·m"),
          barisHasil("Faktor reduksi φ", hasil.phi, "", 3),
          barisHasil("Momen tereduksi φMn", hasil.phiMn_kNm, "kN·m"),
          ["Status tension-controlled", hasil.tensionControlled ? "Ya — tension-controlled" : "Tidak — bukan tension-controlled"],
        ];
        if (hasil.peringatan) baris.push(["Peringatan", hasil.peringatan]);
        return baris;
      },
    ).element,
  );

  root.append(
    buatFormulir(
      "Tulangan minimum balok",
      [
        { id: "c-mfc", label: "Kuat tekan beton fc (MPa)", def: "25", parse: { positif: true } },
        { id: "c-mfy", label: "Tegangan leleh baja fy (MPa)", def: "400", parse: { positif: true } },
        { id: "c-mb", label: "Lebar penampang b (mm)", def: "250", parse: { positif: true } },
        { id: "c-md", label: "Tinggi efektif d (mm)", def: "450", parse: { positif: true } },
      ],
      (n) => {
        const hasil = tulanganMinimumBalok({ b: n["c-mb"], d: n["c-md"], fy: n["c-mfy"], fc: n["c-mfc"] });
        return [barisHasil("Rasio tulangan minimum ρmin", hasil.rhoMin, "", 5), barisHasil("Luas tulangan minimum AsMin", hasil.AsMin, "mm²")];
      },
    ).element,
  );

  root.append(
    buatFormulir(
      "Estimasi material beton (metode volume kering)",
      [
        { id: "c-vol", label: "Volume beton basah (m³)", def: "1", parse: { positif: true } },
        { id: "c-semen", label: "Bagian semen", def: "1", parse: { tidakNegatif: true } },
        { id: "c-pasir", label: "Bagian pasir", def: "2", parse: { tidakNegatif: true } },
        { id: "c-kerikil", label: "Bagian kerikil", def: "3", parse: { tidakNegatif: true } },
      ],
      (n) => {
        const hasil = estimasiMaterialBeton(n["c-vol"], { semen: n["c-semen"], pasir: n["c-pasir"], kerikil: n["c-kerikil"] });
        return [
          barisHasil("Semen", hasil.semenKg, "kg"),
          ["Semen (zak 50 kg, dibulatkan ke atas)", `${formatHasil(hasil.semenZak, 0)} zak`],
          barisHasil("Pasir", hasil.pasirM3, "m³"),
          barisHasil("Kerikil", hasil.kerikilM3, "m³"),
        ];
      },
    ).element,
  );

  root.append(
    buatMetode(
      [
        "Whitney: a = As·fy / (0,85·fc·b); c = a / β1; εt = 0,003·(d − c)/c; Mn = As·fy·(d − a/2). β1 = 0,85 untuk fc ≤ 28 MPa, turun 0,05 per 7 MPa di atasnya, minimum 0,65.",
        "Faktor φ adalah satu pendekatan terdokumentasi modul: sengkang biasa — 0,90 bila tension-controlled (εt ≥ 0,005), interpolasi zona transisi dari batas bawah 0,75. Penampang yang tidak tension-controlled disertai peringatan dari fungsi logika.",
        "Tulangan minimum: ρmin = maks(0,25·√fc / fy ; 1,4 / fy); AsMin = ρmin · b · d.",
        "Estimasi material: metode volume kering textbook — volume kering = 1,54 × volume basah; semen memakai massa jenis 1440 kg/m³ dan zak 50 kg.",
      ],
      [
        "Balok T/L, penampang tidak persegi, tulangan rangkap, kolom, pelat dua arah, geser, torsi, lentur biaksial, dan interaksi P–M.",
        "Pemeriksaan lendutan, lebar retak, dan keadaan batas layan lainnya.",
        "Detail penulangan (panjang penyaluran, sambungan lewatan, kait, sengkang minimum, tulangan susut/suhu dan kulit).",
        "Desain campuran beton (job mix design), kebutuhan air campuran, kadar air agregat/admixture, dan analisa harga satuan resmi.",
        "Hasil bukan dokumen desain dan tidak menggantikan perhitungan insinyur berlisensi.",
      ],
    ),
  );
}
