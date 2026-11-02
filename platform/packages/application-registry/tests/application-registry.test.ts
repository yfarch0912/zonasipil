import { describe, expect, it } from "vitest";
import { APPS, appsByAccess, appsByStatus, getApp, listApps } from "../src/index";

describe("application-registry", () => {
  it("memiliki tepat 17 entri", () => {
    expect(listApps()).toHaveLength(17);
    expect(APPS).toHaveLength(17);
  });

  it("semua slug unik", () => {
    const slugs = listApps().map((a) => a.slug);
    expect(new Set(slugs).size).toBe(17);
  });

  it("semua slug yang diharapkan dari build_apps.py hadir", () => {
    const expected = [
      "structure",
      "concrete",
      "steel",
      "foundation",
      "rab",
      "quantity",
      "project",
      "calculator",
      "survey",
      "road",
      "bridge",
      "plan",
      "bim",
      "academy",
      "simulator",
      "report",
      "library",
    ];
    expect(listApps().map((a) => a.slug).sort()).toEqual([...expected].sort());
  });

  it("calculator berstatus available dan structure beta", () => {
    expect(getApp("calculator")?.status).toBe("available");
    expect(getApp("structure")?.status).toBe("beta");
  });

  it("concrete in-development dan 14 lainnya coming-soon", () => {
    expect(getApp("concrete")?.status).toBe("in-development");
    expect(appsByStatus("available")).toHaveLength(1);
    expect(appsByStatus("beta")).toHaveLength(1);
    expect(appsByStatus("in-development")).toHaveLength(1);
    expect(appsByStatus("coming-soon")).toHaveLength(14);
  });

  it("semua route berawalan /apps/ dan sama dengan /apps/<slug>", () => {
    for (const app of listApps()) {
      expect(app.route.startsWith("/apps/")).toBe(true);
      expect(app.route).toBe(`/apps/${app.slug}`);
    }
  });

  it("getApp mengembalikan undefined untuk slug tak dikenal", () => {
    expect(getApp("tidak-ada")).toBeUndefined();
    expect(getApp("calculator")?.name).toBe("Zona Calculator");
  });

  it("logicCore true hanya untuk 7 slug inti monorepo", () => {
    const core = listApps()
      .filter((a) => a.logicCore)
      .map((a) => a.slug)
      .sort();
    expect(core).toEqual(
      ["calculator", "concrete", "foundation", "quantity", "rab", "steel", "structure"].sort(),
    );
    expect(getApp("survey")?.logicCore).toBe(false);
    expect(getApp("project")?.logicCore).toBe(false);
  });

  it("implementation: deployed false untuk SEMUA entri (situs live masih kode statis lama)", () => {
    for (const app of listApps()) {
      expect(app.implementation.deployed).toBe(false);
    }
  });

  it("implementation: logic & ui true tepat untuk 7 slug inti (6 app hitung + structure)", () => {
    const withImpl = listApps()
      .filter((a) => a.implementation.logic && a.implementation.ui)
      .map((a) => a.slug)
      .sort();
    expect(withImpl).toEqual(
      ["calculator", "concrete", "foundation", "quantity", "rab", "steel", "structure"].sort(),
    );
    // Konsisten dengan logicCore yang sudah ada.
    for (const app of listApps()) {
      expect(app.implementation.logic).toBe(app.logicCore);
    }
  });

  it("implementation: 10 app lain belum punya logic maupun ui di monorepo", () => {
    const tanpa = listApps().filter((a) => !a.implementation.logic);
    expect(tanpa).toHaveLength(10);
    for (const app of tanpa) {
      expect(app.implementation).toEqual({ logic: false, ui: false, deployed: false });
    }
    expect(getApp("structure")?.implementation).toEqual({
      logic: true,
      ui: true,
      deployed: false,
    });
    expect(getApp("calculator")?.implementation).toEqual({
      logic: true,
      ui: true,
      deployed: false,
    });
  });

  it("status publik tidak berubah oleh field implementation", () => {
    expect(getApp("calculator")?.status).toBe("available");
    expect(getApp("structure")?.status).toBe("beta");
    expect(getApp("concrete")?.status).toBe("in-development");
    expect(appsByStatus("coming-soon")).toHaveLength(14);
  });

  it("access: setiap entri punya access yang valid", () => {
    for (const app of listApps()) {
      expect(["public", "protected", "planned"]).toContain(app.access);
    }
  });

  it("access: protected tepat untuk 7 alat nyata (6 app hitung + structure)", () => {
    const terlindungi = appsByAccess("protected").map((a) => a.slug).sort();
    expect(terlindungi).toEqual(
      ["calculator", "concrete", "foundation", "quantity", "rab", "steel", "structure"].sort(),
    );
  });

  it("access: protected selalu berarti logic dan ui ada (alat benar-benar bisa dibuka)", () => {
    for (const app of appsByAccess("protected")) {
      expect(app.implementation.logic).toBe(true);
      expect(app.implementation.ui).toBe(true);
      expect(app.logicCore).toBe(true);
    }
  });

  it("access: 10 app tanpa alat adalah planned, tidak ada entri public di registry", () => {
    expect(appsByAccess("planned")).toHaveLength(10);
    expect(appsByAccess("public")).toHaveLength(0);
    for (const app of appsByAccess("planned")) {
      expect(app.implementation.logic).toBe(false);
      expect(app.implementation.ui).toBe(false);
    }
  });

  it("access: field access tidak mengubah status publik maupun deployed", () => {
    expect(getApp("calculator")?.status).toBe("available");
    expect(getApp("structure")?.status).toBe("beta");
    for (const app of listApps()) expect(app.implementation.deployed).toBe(false);
  });

  it("setiap entri punya nama, kategori, dan deskripsi non-kosong", () => {
    for (const app of listApps()) {
      expect(app.name.length).toBeGreaterThan(0);
      expect(app.category.length).toBeGreaterThan(0);
      expect(app.description.length).toBeGreaterThan(0);
    }
  });
});
