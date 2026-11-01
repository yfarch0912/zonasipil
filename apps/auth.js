/* ZonaSipil Auth — klien untuk API akun (/api/auth/*). */
(function () {
  "use strict";

  function showResult(form, text, isError) {
    var box = form.querySelector(".zs-auth-result");
    if (!box) return;
    box.textContent = text;
    box.classList.remove("hidden");
    box.style.borderColor = isError ? "rgba(190,60,40,.5)" : "rgba(22,139,131,.5)";
    box.style.background = isError ? "rgba(190,60,40,.08)" : "rgba(22,139,131,.09)";
    box.style.color = isError ? "#7A2716" : "#0C4A45";
  }

  async function post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body || {}),
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* abaikan */ }
    return { status: res.status, data };
  }

  function wireForm(id, path, collect, onOk) {
    var form = document.getElementById(id);
    if (!form) return;
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var old = btn.textContent;
      btn.disabled = true; btn.textContent = "Memproses…";
      try {
        const { data } = await post(path, collect(form));
        if (data.ok) { onOk(data); }
        else showResult(form, data.error || "Terjadi kesalahan. Coba lagi.", true);
      } catch (err) {
        showResult(form, "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.", true);
      }
      btn.disabled = false; btn.textContent = old;
    });
  }

  wireForm("form-login", "/api/auth/login", function (f) {
    return {
      email: f.querySelector("#li-email").value,
      password: f.querySelector("#li-pass").value,
      remember: !!f.querySelector('input[type="checkbox"]').checked,
    };
  }, function () { window.location.href = "/dashboard"; });

  wireForm("form-register", "/api/auth/register", function (f) {
    return {
      name: f.querySelector("#rg-name").value,
      email: f.querySelector("#rg-email").value,
      password: f.querySelector("#rg-pass").value,
    };
  }, function () { window.location.href = "/dashboard"; });

  wireForm("form-forgot", "/api/auth/forgot", function (f) {
    return { email: f.querySelector("#fp-email").value };
  }, function (data) {
    var form = document.getElementById("form-forgot");
    showResult(form, data.message || "Permintaan diterima.", false);
  });

  /* Halaman login/register: bila sudah masuk, langsung ke dashboard. */
  if (document.getElementById("form-login") || document.getElementById("form-register")) {
    fetch("/api/auth/me", { credentials: "same-origin" }).then(function (r) {
      if (r.ok) window.location.href = "/dashboard";
    }).catch(function () {});
  }

  /* Dashboard: jaga sesi + isi identitas + tombol keluar. */
  var dashName = document.getElementById("dash-user-name");
  if (dashName) {
    fetch("/api/auth/me", { credentials: "same-origin" }).then(async function (r) {
      if (!r.ok) { window.location.href = "/login"; return; }
      const data = await r.json();
      dashName.textContent = data.user.name;
      var em = document.getElementById("dash-user-email");
      if (em) em.textContent = data.user.email;
      var ov = document.getElementById("dash-overview-name");
      if (ov) ov.textContent = data.user.name.split(" ")[0];
    }).catch(function () { window.location.href = "/login"; });
    var btn = document.getElementById("btn-logout");
    if (btn) btn.addEventListener("click", async function () {
      await post("/api/auth/logout", {});
      window.location.href = "/";
    });
  }
})();
