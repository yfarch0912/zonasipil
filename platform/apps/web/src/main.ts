import "./style.css";
import { listApps } from "@zonasipil/application-registry";
import { el } from "./lib/ui.ts";
import { renderCalculator } from "./pages/calculator.ts";
import { renderQuantity } from "./pages/quantity.ts";
import { renderConcrete } from "./pages/concrete.ts";
import { renderSteel } from "./pages/steel.ts";
import { renderFoundation } from "./pages/foundation.ts";
import { renderRAB } from "./pages/rab.ts";

/** Enam app hitung yang punya halaman aktif di shell web ini. */
const HALAMAN: Record<string, { judul: string; render: (root: HTMLElement) => void }> = {
  calculator: { judul: "Zona Calculator", render: renderCalculator },
  quantity: { judul: "Zona Quantity", render: renderQuantity },
  concrete: { judul: "Zona Concrete", render: renderConcrete },
  steel: { judul: "Zona Steel", render: renderSteel },
  foundation: { judul: "Zona Foundation", render: renderFoundation },
  rab: { judul: "Zona RAB", render: renderRAB },
};

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("Elemen #app tidak ditemukan.");

const header = el("header", "site-header");
const brand = el("a", "brand", "zonasipil");
brand.href = "#/";
const headerSub = el("span", "brand-sub", "Apps — pratinjau lokal monorepo");
header.append(brand, headerSub);

const nav = el("nav", "main-nav");
nav.setAttribute("aria-label", "Daftar aplikasi aktif");
const main = el("main", "container");
const footer = el(
  "footer",
  "site-footer",
  "Pratinjau lokal dari monorepo zonasipil-platform. Implementasi di sini belum berjalan di situs live zonasipil.web.id (situs live masih menjalankan kode statis lama). Tanpa klaim kepatuhan terhadap SNI atau standar apa pun.",
);
appRoot.append(header, nav, main, footer);

function bangunNav(aktif: string): void {
  nav.replaceChildren();
  const apps = listApps();
  for (const slug of Object.keys(HALAMAN)) {
    const app = apps.find((a) => a.slug === slug);
    const link = el("a", slug === aktif ? "nav-link aktif" : "nav-link", app?.name ?? slug);
    link.href = `#/${slug}`;
    if (slug === aktif) link.setAttribute("aria-current", "page");
    nav.append(link);
  }
}

function renderBeranda(): void {
  main.replaceChildren();
  main.append(el("h2", "", "ZonaSipil Apps"));
  main.append(
    el(
      "p",
      "lead",
      "Shell web tipis untuk enam inti logika yang sudah teruji di monorepo: Calculator, Quantity, Concrete, Steel, Foundation, dan RAB. Semua perhitungan di halaman-halamannya memanggil fungsi dari paket logika — tidak ada rumus yang ditulis ulang di UI.",
    ),
  );
  const grid = el("div", "app-grid");
  const apps = listApps();
  for (const slug of Object.keys(HALAMAN)) {
    const app = apps.find((a) => a.slug === slug);
    if (!app) continue;
    const kartu = el("article", "card app-card");
    kartu.append(el("h3", "", app.name), el("p", "", app.description));
    const link = el("a", "btn-primary tautan-tombol", "Buka aplikasi");
    link.href = `#/${slug}`;
    kartu.append(link);
    grid.append(kartu);
  }
  main.append(grid);

  const belum = apps.filter((a) => !(a.slug in HALAMAN));
  const section = el("section", "card");
  section.append(el("h3", "", "Belum tersedia di pratinjau lokal ini"));
  section.append(
    el(
      "p",
      "",
      "Aplikasi berikut terdaftar di registry tetapi tidak punya halaman di shell web ini. Zona Structure punya aplikasi mandiri penuh di monorepo (apps/structure) dan tidak termasuk shell ini; aplikasi lain belum punya inti logika maupun UI di monorepo.",
    ),
  );
  const ul = el("ul", "");
  for (const app of belum) ul.append(el("li", "", `${app.name} — status publik: ${app.status}`));
  section.append(ul);
  main.append(section);
}

function rute(): void {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const slug = hash.split("/")[0] ?? "";
  bangunNav(slug);
  main.replaceChildren();
  if (slug === "" ) {
    renderBeranda();
    return;
  }
  const halaman = HALAMAN[slug];
  if (!halaman) {
    main.append(el("h2", "", "Halaman tidak ditemukan"));
    main.append(el("p", "", "Aplikasi tersebut belum tersedia di pratinjau lokal ini."));
    const kembali = el("a", "btn-primary tautan-tombol", "Kembali ke beranda");
    kembali.href = "#/";
    main.append(kembali);
    return;
  }
  halaman.render(main);
}

window.addEventListener("hashchange", rute);
rute();
