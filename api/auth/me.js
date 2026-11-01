const { getSessionUser, send } = require("../_lib");

module.exports = async (req, res) => {
  const user = await getSessionUser(req).catch(() => null);
  if (!user) return send(res, 401, { ok: false, error: "Belum masuk." });
  return send(res, 200, { ok: true, user });
};
