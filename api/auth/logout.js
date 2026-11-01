const { blobDel, sha256, parseCookies, send } = require("../_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Metode tidak didukung." });
  const token = parseCookies(req).zs_session;
  if (token) await blobDel(`auth/sessions/${sha256(token)}.json`);
  return send(res, 200, { ok: true }, { "set-cookie": "zs_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" });
};
