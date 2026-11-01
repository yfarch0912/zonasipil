const { getJSON, putJSON, emailKey, sha256, verifyPassword, readBody, send, createSession, validEmail } = require("../_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Metode tidak didukung." });
  const { email, password, remember } = await readBody(req);
  const em = String(email || "").trim().toLowerCase();
  if (!validEmail(em) || !password) return send(res, 400, { ok: false, error: "Email atau kata sandi tidak tepat." });
  try {
    const attKey = `auth/attempts/${sha256(em)}.json`;
    const att = (await getJSON(attKey)) || { count: 0, windowStart: Date.now() };
    if (Date.now() - att.windowStart > 15 * 60 * 1000) { att.count = 0; att.windowStart = Date.now(); }
    if (att.count >= 8) return send(res, 429, { ok: false, error: "Terlalu banyak percobaan masuk. Tunggu 15 menit lalu coba lagi." });
    const user = await getJSON(emailKey(em));
    const ok = user && (await verifyPassword(String(password), user.pass));
    if (!ok) {
      att.count += 1;
      await putJSON(attKey, att);
      return send(res, 401, { ok: false, error: "Email atau kata sandi tidak tepat." });
    }
    await putJSON(attKey, { count: 0, windowStart: Date.now() });
    const cookie = await createSession(em, !!remember);
    return send(res, 200, { ok: true, user: { name: user.name, email: user.email } }, { "set-cookie": cookie });
  } catch (e) {
    return send(res, 500, { ok: false, error: "Server sedang bermasalah. Coba lagi sebentar lagi." });
  }
};
