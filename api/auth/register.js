const { getJSON, putJSON, emailKey, hashPassword, readBody, send, createSession, validEmail } = require("../_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Metode tidak didukung." });
  const { name, email, password } = await readBody(req);
  const em = String(email || "").trim().toLowerCase();
  if (!name || String(name).trim().length < 2 || String(name).length > 80)
    return send(res, 400, { ok: false, error: "Nama wajib diisi (minimal 2 karakter)." });
  if (!validEmail(em)) return send(res, 400, { ok: false, error: "Alamat email tidak valid." });
  if (!password || String(password).length < 8 || String(password).length > 72)
    return send(res, 400, { ok: false, error: "Kata sandi minimal 8 karakter." });
  try {
    if (await getJSON(emailKey(em)))
      return send(res, 409, { ok: false, error: "Email ini sudah terdaftar. Silakan masuk." });
    const user = { name: String(name).trim(), email: em, pass: await hashPassword(String(password)), createdAt: new Date().toISOString() };
    await putJSON(emailKey(em), user);
    const cookie = await createSession(em, true);
    return send(res, 201, { ok: true, user: { name: user.name, email: user.email } }, { "set-cookie": cookie });
  } catch (e) {
    return send(res, 500, { ok: false, error: "Server sedang bermasalah. Coba lagi sebentar lagi." });
  }
};
