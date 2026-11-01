/* ZonaSipil Apps — katalog (cari & filter), toggle kata sandi, formulir akun.
   Formulir akun TIDAK mengirim data apa pun: backend akun belum diluncurkan,
   dan pengguna diberi tahu secara eksplisit. */
(function () {
  "use strict";

  /* --- Katalog: pencarian + filter kategori/status --- */
  var search = document.getElementById("zs-search");
  var grid = document.getElementById("zs-grid");
  if (search && grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".zs-card"));
    var chips = Array.prototype.slice.call(document.querySelectorAll("#zs-filters .zs-chip"));
    var count = document.getElementById("zs-count");
    var noresult = document.getElementById("zs-noresult");
    var filter = "all";
    function apply() {
      var q = (search.value || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var okFilter = filter === "all" || c.getAttribute("data-cat") === filter ||
          (filter === "available" && c.getAttribute("data-status") === "available");
        var okQuery = !q || (c.getAttribute("data-name") || "").indexOf(q) !== -1;
        var show = okFilter && okQuery;
        c.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (count) count.textContent = "Menampilkan " + shown + " dari " + cards.length + " aplikasi";
      if (noresult) noresult.classList.toggle("hidden", shown !== 0);
    }
    search.addEventListener("input", apply);
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("active"); });
        ch.classList.add("active");
        filter = ch.getAttribute("data-filter");
        apply();
      });
    });
    apply();
  }

  /* --- Toggle tampil/sembunyi kata sandi --- */
  document.querySelectorAll("[data-eye]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.getElementById(btn.getAttribute("data-eye"));
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
      input.focus();
    });
  });

  /* --- Mega menu: dukungan sentuh/klik pada pemicu Apps --- */
  document.querySelectorAll(".zs-apps-wrap > a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var wrap = link.parentElement;
      if (window.matchMedia("(hover: none)").matches && !wrap.classList.contains("open")) {
        e.preventDefault();
        wrap.classList.add("open");
      }
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".zs-apps-wrap.open").forEach(function (w) {
      if (!w.contains(e.target)) w.classList.remove("open");
    });
  });
})();
