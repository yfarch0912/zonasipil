/* GET /api/auth/google — mulai alur Masuk dengan Google (OAuth 2.0 server-side).
   State anti-CSRF: token acak + kedaluwarsa, ditandatangani HMAC dengan AUTH_SECRET,
   disimpan di cookie HttpOnly dan dibandingkan saat callback. */
const crypto = require("crypto");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const SECRET = process.env.AUTH_SECRET || "";
const REDIRECT = "https://zonasipil.web.id/api/auth/google/callback";

function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

module.exports = async (req, res) => {
  if (!CLIENT_ID || !SECRET) {
    res.writeHead(302, { location: "/login?error=google" });
    return res.end();
  }
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${nonce}.${Date.now() + 10 * 60 * 1000}`;
  const state = `${payload}.${sign(payload)}`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.writeHead(302, {
    "set-cookie": `zs_oauth_state=${encodeURIComponent(state)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    "cache-control": "no-store",
  });
  res.end();
};
