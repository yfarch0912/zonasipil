/* ZonaSipil Auth — pustaka bersama (bukan rute).
   Penyimpanan: Vercel Blob privat via API resmi (header sesuai @vercel/blob v13).
   Kata sandi: scrypt (node:crypto). Sesi: token acak, disimpan ter-hash, cookie HttpOnly. */
const crypto = require("crypto");

const API = "https://vercel.com/api/blob";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";

function storeId() {
  return (TOKEN.split("_")[3] || "");
}
function authHeaders(extra) {
  return Object.assign({
    authorization: `Bearer ${TOKEN}`,
    "x-api-version": "13",
    "x-vercel-blob-store-id": storeId(),
  }, extra || {});
}

async function blobPut(pathname, text) {
  const res = await fetch(`${API}/?pathname=${encodeURIComponent(pathname)}`, {
    method: "PUT",
    headers: authHeaders({
      "x-vercel-blob-access": "private",
      "x-add-random-suffix": "0",
      "x-allow-overwrite": "1",
      "x-content-type": "application/json",
    }),
    body: text,
  });
  if (!res.ok) throw new Error(`blob put ${res.status}`);
  return res.json();
}

async function blobGet(pathname) {
  const url = `https://${storeId()}.private.blob.vercel-storage.com/${pathname}`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${TOKEN}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`blob get ${res.status}`);
  return res.text();
}

async function blobDel(pathname) {
  const url = `https://${storeId()}.private.blob.vercel-storage.com/${pathname}`;
  await fetch(`${API}/delete`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ urls: [url] }),
  }).catch(() => {});
}

async function getJSON(pathname) {
  const t = await blobGet(pathname);
  if (!t) return null;
  try { return JSON.parse(t); } catch { return null; }
}
async function putJSON(pathname, obj) {
  return blobPut(pathname, JSON.stringify(obj));
}

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const emailKey = (email) => `auth/users/${sha256(email)}.json`;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt.toString("hex")}$${key.toString("hex")}`);
    });
  });
}
function verifyPassword(password, stored) {
  return new Promise((resolve) => {
    const parts = String(stored || "").split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return resolve(false);
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    crypto.scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) return resolve(false);
      resolve(crypto.timingSafeEqual(key, expected));
    });
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 20000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}
function send(res, status, obj, extraHeaders) {
  res.writeHead(status, Object.assign({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, extraHeaders || {}));
  res.end(JSON.stringify(obj));
}
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

const SESSION_TTL = 30 * 24 * 3600 * 1000;
const SESSION_TTL_SHORT = 12 * 3600 * 1000;

async function createSession(email, remember) {
  const token = crypto.randomBytes(32).toString("hex");
  const ttl = remember ? SESSION_TTL : SESSION_TTL_SHORT;
  await putJSON(`auth/sessions/${sha256(token)}.json`, { email, expiresAt: Date.now() + ttl });
  const cookie = [`zs_session=${token}`, "HttpOnly", "Secure", "SameSite=Lax", "Path=/"];
  if (remember) cookie.push(`Max-Age=${SESSION_TTL / 1000}`);
  return cookie.join("; ");
}

async function getSessionUser(req) {
  const token = parseCookies(req).zs_session;
  if (!token) return null;
  const s = await getJSON(`auth/sessions/${sha256(token)}.json`);
  if (!s || !s.expiresAt || s.expiresAt < Date.now()) return null;
  const user = await getJSON(emailKey(s.email));
  if (!user) return null;
  return { name: user.name, email: user.email, createdAt: user.createdAt };
}

const validEmail = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

module.exports = { blobPut, blobGet, blobDel, getJSON, putJSON, sha256, emailKey, hashPassword, verifyPassword, readBody, send, parseCookies, createSession, getSessionUser, validEmail };
