const crypto = require("crypto");
const { getJSON, putJSON, emailKey, sha256, readBody, send, validEmail } = require("../_lib");

/* Membuat token atur ulang (berlaku 1 jam, tersimpan ter-hash).
   Pengiriman tautan lewat email belum terhubung ke penyedia email —
   respons selalu generik agar tidak membocorkan email terdaftar. */
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Metode tidak didukung." });
  const { email } = await readBody(req);
  const em = String(email || "").trim().toLowerCase();
  const generic = { ok: true, message: "Bila email terdaftar, instruksi atur ulang kata sandi akan dikirim. (Pengiriman email sedang dalam tahap penghubungan — bila mendesak, hubungi pengelola ZonaSipil.)" };
  if (!validEmail(em)) return send(res, 200, generic);
  try {
    const user = await getJSON(emailKey(em));
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await putJSON(`auth/resets/${sha256(token)}.json`, { email: em, expiresAt: Date.now() + 3600 * 1000 });
    }
  } catch (e) { /* tetap generik */ }
  return send(res, 200, generic);
};
