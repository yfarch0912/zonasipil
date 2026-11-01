const { getJSON, putJSON, blobDel, emailKey, sha256, hashPassword, readBody, send } = require("../_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Metode tidak didukung." });
  const { token, password } = await readBody(req);
  if (!token || !password || String(password).length < 8)
    return send(res, 400, { ok: false, error: "Token atau kata sandi baru tidak valid (kata sandi minimal 8 karakter)." });
  try {
    const key = `auth/resets/${sha256(String(token))}.json`;
    const rec = await getJSON(key);
    if (!rec || rec.expiresAt < Date.now()) return send(res, 400, { ok: false, error: "Tautan atur ulang tidak valid atau sudah kedaluwarsa." });
    const user = await getJSON(emailKey(rec.email));
    if (!user) return send(res, 400, { ok: false, error: "Akun tidak ditemukan." });
    user.pass = await hashPassword(String(password));
    await putJSON(emailKey(rec.email), user);
    await blobDel(key);
    return send(res, 200, { ok: true, message: "Kata sandi berhasil diatur ulang. Silakan masuk." });
  } catch (e) {
    return send(res, 500, { ok: false, error: "Server sedang bermasalah. Coba lagi sebentar lagi." });
  }
};
