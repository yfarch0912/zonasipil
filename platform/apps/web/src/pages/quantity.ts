import {
  beratTulanganElemen,
  kebutuhanBata,
  kebutuhanBataPerM2,
  luasAcian,
  rekapMaterial,
  volumeBetonElemen,
  volumeMortarPlester,
} from "@zonasipil/app-quantity";
import { barisHasil, buatFormulir, buatJudulHalaman, buatMetode } from "../lib/ui.ts";
import { formatHasil } from "../lib/format.ts";

export function renderQuantity(root: HTMLElement): void {
  root.append(buatJudulHalaman("Zona Quantity", "Take-off kuantitas: beton, tulangan, bata, plester, acian, dan rekap material."));

  root.append(
    buatFormulir(
      "Volume beton elemen",
      [
        { id: "q-p", label: "Panjang elemen (m)", def: "4", parse: { positif: true } },
        { id: "q-l", label: "Lebar elemen (m)", def: "0,25", parse: { positif: true } },
        { id: "q-t", label: "Tebal/tinggi elemen (m)", def: "0,5", parse: { positif: true } },
        { id: "q-n", label: "Jumlah elemen", def: "2", parse: { positif: true, bulat: true } },
      ],
      (n) => [barisHasil("Volume beton", volumeBetonElemen(n["q-p"], n["q-l"], n["q-t"], n["q-n"]), "m³")],
    ).element,
  );

  root.append(
    buatFormulir(
      "Berat tulangan elemen",
      [
        { id: "q-d", label: "Diameter tulangan (mm)", def: "13", parse: { positif: true } },
        { id: "q-jb", label: "Jumlah batang", def: "8", parse: { positif: true, bulat: true } },
        { id: "q-pp", label: "Panjang per batang (m)", def: "4", parse: { positif: true } },
      ],
      (n) => {
        const hasil = beratTulanganElemen({ diameterMm: n["q-d"], jumlahBatang: n["q-jb"], panjangPerBatangM: n["q-pp"] });
        return [barisHasil("Berat per meter", hasil.perMeter, "kg/m"), barisHasil("Berat total kelompok", hasil.totalKg, "kg")];
      },
    ).element,
  );

  root.append(
    buatFormulir(
      "Kebutuhan bata (dinding setengah bata)",
      [
        { id: "q-luas", label: "Luas dinding bersih (m²)", def: "10", parse: { positif: true } },
        { id: "q-pb", label: "Panjang bata (m)", def: "0,20", parse: { positif: true } },
        { id: "q-tb", label: "Tinggi bata (m)", def: "0,05", parse: { positif: true } },
        { id: "q-siar", label: "Tebal siar/nat (m)", def: "0,01", parse: { tidakNegatif: true } },
        { id: "q-waste", label: "Waste (%)", def: "0", parse: { tidakNegatif: true, maksimum: 100 } },
      ],
      (n) => [
        barisHasil("Kebutuhan per m²", kebutuhanBataPerM2(n["q-pb"], n["q-tb"], n["q-siar"]), "bata/m²"),
        ["Total kebutuhan bata", `${formatHasil(kebutuhanBata(n["q-luas"], n["q-pb"], n["q-tb"], n["q-siar"], n["q-waste"]), 0)} bata`],
      ],
    ).element,
  );

  root.append(
    buatFormulir(
      "Plester & acian",
      [
        { id: "q-lp", label: "Luas permukaan (m²)", def: "10", parse: { positif: true } },
        { id: "q-tebal", label: "Tebal plester (m)", def: "0,015", parse: { positif: true } },
      ],
      (n) => [
        barisHasil("Volume mortar plester", volumeMortarPlester(n["q-lp"], n["q-tebal"]), "m³"),
        barisHasil("Luas acian", luasAcian(n["q-lp"]), "m²"),
      ],
    ).element,
  );

  root.append(
    buatFormulir(
      "Rekap material (satu elemen: beton + tulangan)",
      [
        { id: "q-rp", label: "Panjang elemen (m)", def: "4", parse: { positif: true } },
        { id: "q-rl", label: "Lebar elemen (m)", def: "0,25", parse: { positif: true } },
        { id: "q-rt", label: "Tebal/tinggi elemen (m)", def: "0,5", parse: { positif: true } },
        { id: "q-rn", label: "Jumlah elemen", def: "2", parse: { positif: true, bulat: true } },
        { id: "q-rd", label: "Diameter tulangan (mm)", def: "13", parse: { positif: true } },
        { id: "q-rjb", label: "Jumlah batang per elemen", def: "8", parse: { positif: true, bulat: true } },
        { id: "q-rpp", label: "Panjang per batang (m)", def: "4", parse: { positif: true } },
      ],
      (n) => {
        const hasil = rekapMaterial([
          {
            nama: "Elemen rekap",
            beton: { panjangM: n["q-rp"], lebarM: n["q-rl"], tebalM: n["q-rt"], jumlah: n["q-rn"] },
            tulangan: [{ diameterMm: n["q-rd"], jumlahBatang: n["q-rjb"] * n["q-rn"], panjangPerBatangM: n["q-rpp"] }],
          },
        ]);
        const rincian = hasil.rincian[0];
        return [
          barisHasil("Volume beton elemen", rincian ? rincian.volumeBetonM3 : 0, "m³"),
          barisHasil("Berat tulangan elemen", rincian ? rincian.beratTulanganKg : 0, "kg"),
          barisHasil("Total volume beton rekap", hasil.totalVolumeBetonM3, "m³"),
          barisHasil("Total berat tulangan rekap", hasil.totalBeratTulanganKg, "kg"),
        ];
      },
    ).element,
  );

  root.append(
    buatMetode(
      [
        "Beton elemen: volume prisma persegi panjang (panjang × lebar × tebal × jumlah) — geometris murni, belum termasuk waste dan belum dikurangi volume tulangan.",
        "Tulangan elemen: per meter = 0,006165 × d²; total = per meter × jumlah batang × panjang per batang.",
        "Bata setengah bata: kebutuhan per m² = 1 / ((panjang bata + siar) × (tinggi bata + siar)); total dibulatkan ke atas termasuk waste.",
        "Plester: volume = luas × tebal. Acian dihitung per m² luas permukaan (hasilnya sama dengan luas masukan). Rekap adalah penjumlahan murni per elemen.",
      ],
      [
        "Bata: hanya dinding setengah bata satu lapis, siar seragam; luas harus sudah bersih (bukaan dikurangi sendiri). Tidak ada data ukuran bata baku bawaan.",
        "Plester & acian: tidak ada konversi ke bahan kering (sak semen, m³ pasir, kg acian) atau komposisi campuran.",
        "Beton: bekisting tidak dihitung; tidak ada waste/susut kecuali ditambahkan sendiri di luar.",
        "Tulangan: bengkokan, kait, sengkang terpisah, sambungan lewatan, dan waste potongan tidak ditambahkan otomatis; tidak ada konversi ke batang standar 12 m.",
        "Rekap bukan RAB: tidak ada harga satuan maupun konversi satuan pembelian.",
      ],
    ),
  );
}
