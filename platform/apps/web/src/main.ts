import "./style.css";
import { getApp, listApps } from "@zonasipil/application-registry";
import { SessionClient, classifyAccess, type Session } from "@zonasipil/auth";
import { el } from "./lib/ui.ts";
import { hashAlat, hashLogin, uraiHash, validasiNextWeb } from "./lib/gate.ts";
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
const authChip = el("span", "auth-chip");
header.append(brand, headerSub, authChip);

/** Klien sesi: cookie HttpOnly via API live; tidak ada token di storage browser. */
const sesiKlien = new SessionClient();
let sesiAktif: Session | null = null;

/** Isi chip auth di header dari sesi saat ini (gagal cek = anggap belum masuk). */
async function segarkanChipAuth(): Promise<void> {
  authChip.replaceChildren();
  if (sesiAktif) {
    authChip.append(el("span", "", sesiAktif.user.name || sesiAktif.user.email));
    const keluar = el("button", "btn-secondary tombol-chip", "Keluar");
    keluar.type = "button";
    keluar.addEventListener("click", () => {
      void sesiKlien.logout().catch(() => undefined).finally(() => {
        sesiAktif = null;
        window.location.hash = "#/";
        void segarkanChipAuth();
        void rute();
      });
    });
    authChip.append(keluar);
    return;
  }
  const masuk = el("a", "nav-link", "Masuk");
  masuk.href = hashLogin("#/");
  authChip.append(masuk);
}

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
  for (const app of belum) {
    // App planned tidak bisa dibuka sebagai alat — label jujur "Segera Hadir".
    // Structure protected tetapi UI-nya aplikasi mandiri, bukan shell ini.
    const label =
      app.access === "planned"
        ? "Segera Hadir"
        : "tersedia sebagai aplikasi mandiri di monorepo (apps/structure), perlu masuk di sana";
    ul.append(el("li", "", `${app.name} — ${label} (status publik: ${app.status})`));
  }
  section.append(ul);
  main.append(section);
}

/** Tampilan gate: alat protected dibuka tanpa sesi yang sah. */
function renderGateLogin(slug: string, namaApp: string, layananBermasalah: boolean): void {
  const kartu = el("section", "card");
  kartu.append(el("h3", "", "Masuk diperlukan"));
  kartu.append(
    el(
      "p",
      "",
      `${namaApp} adalah alat terproteksi. Masuk dulu dengan akun ZonaSipil untuk membukanya — sesi memakai cookie aman (HttpOnly) dari server, bukan token yang disimpan di browser.`,
    ),
  );
  if (layananBermasalah) {
    kartu.append(
      el(
        "p",
        "form-error",
        "Layanan sesi tidak dapat dihubungi dari pratinjau lokal ini (API auth hanya berjalan di domain live). Tombol masuk tetap menuju formulir yang sama.",
      ),
    );
  }
  const masuk = el("a", "btn-primary tautan-tombol", "Masuk");
  masuk.href = hashLogin(hashAlat(slug));
  const kembali = el("a", "btn-secondary tautan-tombol", "Kembali ke katalog");
  kembali.href = "#/";
  const aksi = el("p", "aksi-rab");
  aksi.append(masuk, kembali);
  kartu.append(aksi);
  main.append(kartu);
}

/** Formulir masuk: POST ke SessionClient (API live), lalu kembali ke `next` tervalidasi. */
function renderLogin(next: string): void {
  if (sesiAktif) {
    window.location.hash = next;
    return;
  }
  main.append(el("h2", "", "Masuk"));
  const kartu = el("section", "card");
  const form = el("form", "form-grid");
  form.noValidate = true;

  const buatField = (id: string, label: string, tipe: string, autocomplete: HTMLInputElement["autocomplete"]) => {
    const wrap = el("div", "field");
    const lab = el("label", "", label);
    lab.htmlFor = id;
    const input = document.createElement("input");
    input.id = id;
    input.type = tipe;
    input.autocomplete = autocomplete;
    input.required = true;
    wrap.append(lab, input);
    form.append(wrap);
    return input;
  };
  const email = buatField("login-email", "Email", "email", "username");
  const sandi = buatField("login-sandi", "Kata sandi", "password", "current-password");

  const galat = el("p", "form-error");
  galat.setAttribute("role", "alert");
  galat.hidden = true;

  const tombol = el("button", "btn-primary", "Masuk");
  tombol.type = "submit";
  form.append(tombol);
  kartu.append(form, galat);
  kartu.append(
    el("p", "", "Belum punya akun? Pendaftaran memakai endpoint yang sama di situs live (zonasipil.web.id/register)."),
  );
  main.append(kartu);

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    galat.hidden = true;
    tombol.disabled = true;
    void sesiKlien
      .login(email.value.trim(), sandi.value)
      .then((sesi) => {
        sesiAktif = sesi;
        void segarkanChipAuth();
        window.location.hash = validasiNextWeb(next);
      })
      .catch((err: unknown) => {
        galat.textContent = err instanceof Error ? err.message : "Gagal masuk. Coba lagi.";
        galat.hidden = false;
      })
      .finally(() => {
        tombol.disabled = false;
      });
  });
}

let nomorRute = 0;

async function rute(): Promise<void> {
  const nomor = ++nomorRute;
  const { slug, params } = uraiHash(window.location.hash);
  bangunNav(slug);
  main.replaceChildren();
  if (slug === "") {
    // Katalog/landing: public, tanpa cek sesi.
    renderBeranda();
    return;
  }
  if (slug === "login") {
    renderLogin(validasiNextWeb(params.get("next")));
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
  // Gate untuk alat protected: cek sesi dulu, alat dirender hanya bila allow.
  const app = getApp(slug);
  main.append(el("p", "", "Memeriksa sesi…"));
  let layananBermasalah = false;
  try {
    sesiAktif = await sesiKlien.me();
  } catch {
    sesiAktif = null;
    layananBermasalah = true;
  }
  if (nomor !== nomorRute) return; // rute sudah berganti selama menunggu
  void segarkanChipAuth();
  const keputusan = app ? classifyAccess(app, sesiAktif) : "login-required";
  main.replaceChildren();
  if (keputusan !== "allow") {
    // protected tanpa sesi -> gate login. planned tidak terjadi di sini
    // (keenam slug HALAMAN semuanya protected di registry).
    renderGateLogin(slug, app?.name ?? halaman.judul, layananBermasalah);
    return;
  }
  halaman.render(main);
}

window.addEventListener("hashchange", () => {
  void rute();
});
// Cek sesi sekali di awal agar chip header benar; kegagalan = belum masuk.
void sesiKlien
  .me()
  .then((sesi) => {
    sesiAktif = sesi;
  })
  .catch(() => undefined)
  .finally(() => {
    void segarkanChipAuth();
  });
void rute();
