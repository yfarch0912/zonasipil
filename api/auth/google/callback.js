/* GET /api/auth/google/callback — tukar code -> profil Google -> sesi ZonaSipil.
   Client secret hanya dipakai di server (env Vercel), tidak pernah masuk kode/klien. */
const crypto = require("crypto");
const { getJSON, putJSON, emailKey, createSession, parseCookies, validEmail } = require("../../_lib");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const SECRET = process.env.AUTH_SECRET || "";
const REDIRECT = "https://zonasipil.web.id/api/auth/google/callback";

function fail(res) {
  res.writeHead(302, { location: "/login?error=google", "cache-control": "no-store" });
  res.end();
}

function stateValid(state, cookieState) {
  if (!state || !cookieState || state !== cookieState) return false;
  const parts = String(state).split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(parts[2]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(parts[1]) > Date.now();
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "https://zonasipil.web.id");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = parseCookies(req).zs_oauth_state;
    if (!code || !CLIENT_ID || !CLIENT_SECRET || !stateValid(state, cookieState)) return fail(res);

    const tokRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
    });
    if (!tokRes.ok) return fail(res);
    const tok = await tokRes.json();

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tok.access_token}` },
    });
    if (!infoRes.ok) return fail(res);
    const info = await infoRes.json();
    const email = String(info.email || "").toLowerCase();
    if (!validEmail(email) || info.email_verified !== true) return fail(res);

    const key = emailKey(email);
    const existing = await getJSON(key);
    const user = existing || { name: "", email, createdAt: Date.now() };
    if (!user.name) user.name = String(info.name || email.split("@")[0]).slice(0, 80);
    user.google = true;
    user.lastLoginAt = Date.now();
    await putJSON(key, user);

    const cookie = await createSession(email, true);
    res.writeHead(302, {
      "set-cookie": [cookie, "zs_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"],
      location: "/dashboard",
      "cache-control": "no-store",
    });
    res.end();
  } catch {
    fail(res);
  }
};
