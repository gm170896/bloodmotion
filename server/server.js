// Backend Blood Motion: tanpa dependensi (Node 18+). Jalankan: npm run server
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as store from "./store.js";
import * as biz from "./business.js";
import { spawn } from "node:child_process";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT || 3001;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD || PASSWORD.length < 8) { console.error("Set ADMIN_PASSWORD (min. 8 karakter) di .env atau environment."); process.exit(1); }
const SECRET = process.env.SESSION_SECRET || crypto.createHash("sha256").update("bm:" + PASSWORD).digest("hex");
const DAY = 864e5;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain" };
const UPLOAD_OK = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm"]);

// ---- auth ----
const sign = (s) => crypto.createHmac("sha256", SECRET).update(s).digest("base64url");
const mkToken = () => { const p = String(Date.now() + 7 * DAY); return `${p}.${sign(p)}`; };
const okToken = (t) => { if (!t) return false; const [p, s] = t.split("."); return !!s && s.length === sign(p).length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(sign(p))) && Number(p) > Date.now(); };
const cookie = (req) => Object.fromEntries((req.headers.cookie || "").split(/;\s*/).filter(Boolean).map((c) => { const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const isAdmin = (req) => okToken(cookie(req).bm_session);
const safeEq = (a, b) => { const x = crypto.createHash("sha256").update(a).digest(), y = crypto.createHash("sha256").update(b).digest(); return crypto.timingSafeEqual(x, y); };
const tries = new Map();
const limited = (ip) => { const n = (tries.get(ip) || []).filter((t) => Date.now() - t < 6e4); tries.set(ip, n); return n.length >= 5; };

// ---- helpers ----
const json = (res, code, obj, headers = {}) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }); res.end(JSON.stringify(obj)); };
const body = (req, max = 30e6) => new Promise((ok, no) => {
  const c = []; let n = 0;
  req.on("data", (b) => { n += b.length; if (n > max) { no(Object.assign(new Error("Terlalu besar"), { code: 413 })); req.destroy(); } else c.push(b); });
  req.on("end", () => { try { ok(c.length ? JSON.parse(Buffer.concat(c)) : {}); } catch { no(Object.assign(new Error("JSON tidak valid"), { code: 400 })); } });
});
const serveFile = (req, res, file, cache) => {
  let st; try { st = fs.statSync(file); } catch { return false; }
  if (!st.isFile()) return false;
  const ext = path.extname(file).toLowerCase();
  const h = { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": cache, "X-Content-Type-Options": "nosniff" };
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range && (ext === ".mp4" || ext === ".webm")) { // dukung seek video
    const s = range[1] ? +range[1] : 0, en = Math.min(range[2] ? +range[2] : st.size - 1, st.size - 1);
    res.writeHead(206, { ...h, "Content-Range": `bytes ${s}-${en}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": en - s + 1 });
    fs.createReadStream(file, { start: s, end: en }).pipe(res); return true;
  }
  res.writeHead(200, { ...h, "Content-Length": st.size, "Accept-Ranges": "bytes" });
  fs.createReadStream(file).pipe(res); return true;
};
const within = (base, rel) => { const f = path.resolve(base, "." + path.sep + rel); return f.startsWith(base + path.sep) ? f : null; };
const num = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : NaN; };

// ---- keuangan ----
function cleanTx(b, prev) {
  const type = b.type === "expense" ? "expense" : "income";
  const amount = num(b.amount);
  if (!(amount > 0)) throw Object.assign(new Error("Nominal harus lebih dari 0"), { code: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || "")) throw Object.assign(new Error("Tanggal tidak valid (YYYY-MM-DD)"), { code: 400 });
  const t = { id: prev?.id || store.newId(), date: b.date, type, amount, category: String(b.category || "").slice(0, 60), note: String(b.note || "").slice(0, 300) };
  if (type === "income") t.opPct = prev?.opPct ?? store.load().finance.opPct; // rasio dikunci saat pemasukan dicatat
  else {
    if (!["operational", "maintenance"].includes(b.pot)) throw Object.assign(new Error("Pilih kantong: operational / maintenance"), { code: 400 });
    t.pot = b.pot;
  }
  return t;
}
const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

// ---- invoice / order ----
const ctx = {
  newId: store.newId,
  now: () => new Date().toISOString(),
  today: () => new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10), // WIB
  orderCode: (iso) => { const n = store.load().orders.length + 1; return `ORD-${iso.slice(2, 4)}${iso.slice(5, 7)}-${String(n).padStart(3, "0")}`; },
  renderOpt: {},
};
const renders = new Map(); // token sekali pakai untuk Chrome headless
function findChrome() {
  const c = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"];
  return c.find((x) => x && fs.existsSync(x));
}
function chromePdf(chrome, url, out, mode) {
  return new Promise((ok, no) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-chrome-"));
    const args = [mode, "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf-no-header", "--virtual-time-budget=6000", `--user-data-dir=${dir}`, `--print-to-pdf=${out}`];
    if (process.getuid && process.getuid() === 0) args.push("--no-sandbox");
    const ch = spawn(chrome, [...args, url], { stdio: "ignore" });
    const t = setTimeout(() => { ch.kill("SIGKILL"); no(new Error("Chrome timeout")); }, 40000);
    ch.on("exit", () => { clearTimeout(t); fs.rmSync(dir, { recursive: true, force: true }); fs.existsSync(out) && fs.statSync(out).size > 1000 ? ok() : no(new Error("PDF gagal dibuat")); });
    ch.on("error", (e) => { clearTimeout(t); no(e); });
  });
}
async function invoicePdf(inv) {
  const chrome = findChrome(); if (!chrome) return null;
  const token = crypto.randomBytes(16).toString("hex");
  renders.set(token, { html: biz.route(store.load(), () => {}, "GET", `/api/admin/invoices/${inv.id}/html`, {}, {}, ctx).html, exp: Date.now() + 60000 });
  const out = path.join(os.tmpdir(), `bm-inv-${token}.pdf`);
  try { try { await chromePdf(chrome, `http://127.0.0.1:${PORT}/_render/${token}`, out, "--headless=new"); } catch { await chromePdf(chrome, `http://127.0.0.1:${PORT}/_render/${token}`, out, "--headless"); }
    return fs.readFileSync(out); } finally { renders.delete(token); fs.rmSync(out, { force: true }); }
}
const pubTries = new Map();
const pubLimited = (ip) => { const n = (pubTries.get(ip) || []).filter((t) => Date.now() - t < 6e5); n.push(Date.now()); pubTries.set(ip, n); return n.length > 5; };
const cors = (req, res) => { const o = process.env.ALLOWED_ORIGIN; if (o && req.headers.origin === o) { res.setHeader("Access-Control-Allow-Origin", o); res.setHeader("Vary", "Origin"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); } };

// ---- router ----
async function api(req, res, url) {
  const m = req.method, p = url.pathname;
  const ip = req.socket.remoteAddress;
  if (m === "GET" && p === "/api/content") return json(res, 200, store.publicContent(), { "Cache-Control": "no-cache" });
  if (p === "/api/orders") {
    cors(req, res);
    if (m === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (m !== "POST") return json(res, 405, { error: "Method tidak diizinkan" });
    if (pubLimited(ip)) return json(res, 429, { error: "Terlalu banyak kiriman. Coba lagi nanti." });
    const b = await body(req, 5e4);
    try { return json(res, 200, biz.createPublicOrder(store.load(), store.save, b, ctx)); } catch (e) { return json(res, e.code || 400, { error: e.message }); }
  }
  if (m === "POST" && p === "/api/login") {
    if (limited(ip)) return json(res, 429, { error: "Terlalu banyak percobaan. Coba lagi 1 menit." });
    const b = await body(req, 1e4);
    if (!safeEq(String(b.password || ""), PASSWORD)) { tries.get(ip).push(Date.now()); return json(res, 401, { error: "Password salah" }); }
    const sec = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
    return json(res, 200, { ok: true }, { "Set-Cookie": `bm_session=${mkToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400}${sec}` });
  }
  if (m === "POST" && p === "/api/logout") return json(res, 200, { ok: true }, { "Set-Cookie": "bm_session=; HttpOnly; Path=/; Max-Age=0" });
  if (!p.startsWith("/api/admin/")) return json(res, 404, { error: "Tidak ditemukan" });
  if (!isAdmin(req)) return json(res, 401, { error: "Belum login" });
  // CSRF: untuk request yang mengubah data, wajib dari origin yang sama
  if (m !== "GET" && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: "Origin tidak diizinkan" });
  const db = store.load();

  if (m === "GET" && p === "/api/admin/me") return json(res, 200, { ok: true });
  if (m === "GET" && p === "/api/admin/content") { const { finance, orders, invoices, ratecard, settings, ...c } = db; return json(res, 200, c); }
  let r;
  if (m === "PUT" && (r = /^\/api\/admin\/content\/(\w+)$/.exec(p))) {
    if (!store.EDITABLE.includes(r[1])) return json(res, 400, { error: "Bagian tidak dikenal" });
    const b = await body(req, 5e6);
    if (b.value === undefined) return json(res, 400, { error: "value kosong" });
    db[r[1]] = b.value; store.save(); return json(res, 200, { ok: true });
  }
  if (m === "POST" && p === "/api/admin/upload") {
    const b = await body(req, 30e6);
    const ext = path.extname(String(b.filename || "")).toLowerCase();
    if (!UPLOAD_OK.has(ext)) return json(res, 400, { error: "Tipe file tidak diizinkan (png, jpg, webp, gif, mp4, webm)" });
    const buf = Buffer.from(String(b.data || ""), "base64");
    if (!buf.length || buf.length > 25e6) return json(res, 400, { error: "File kosong atau lebih dari 25 MB" });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}${ext}`;
    fs.writeFileSync(path.join(store.UPLOAD_DIR, name), buf);
    return json(res, 200, { url: `/uploads/${name}` });
  }
  if (m === "GET" && p === "/api/admin/uploads") return json(res, 200, fs.readdirSync(store.UPLOAD_DIR).map((n) => `/uploads/${n}`));

  // order, ratecard, pengaturan, invoice
  if (/^\/api\/admin\/(orders|ratecard|settings|invoices|invoice-preview)/.test(p)) {
    let r2;
    if (m === "GET" && (r2 = /^\/api\/admin\/invoices\/(\w+)\/pdf$/.exec(p))) {
      const inv = db.invoices.find((x) => x.id === r2[1]); if (!inv) return json(res, 404, { error: "Invoice tidak ada" });
      const buf = await invoicePdf(inv).catch((e) => { console.error(e); return undefined; });
      if (buf === null) return json(res, 501, { error: "Chrome/Chromium/Edge tidak ditemukan di server. Gunakan tombol Cetak lalu pilih Simpan sebagai PDF, atau set CHROME_PATH.", fallback: "print" });
      if (!buf) return json(res, 500, { error: "Gagal membuat PDF" });
      const nm = `Invoice-${inv.no}-${(inv.client.name || inv.client.org || "").replace(/[^\w]+/g, "-").slice(0, 30)}.pdf`;
      res.writeHead(200, { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nm}"`, "Cache-Control": "no-store" }); return res.end(buf);
    }
    const b2 = m === "GET" ? {} : await body(req, 2e6);
    const out = biz.route(db, store.save, m, p, b2, Object.fromEntries(url.searchParams), ctx);
    if (out) {
      if (out.html) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); return res.end(out.html); }
      return json(res, out.code, out.data);
    }
  }
  // keuangan
  if (m === "GET" && p === "/api/admin/finance") {
    const from = url.searchParams.get("from") || "", to = url.searchParams.get("to") || "";
    const tx = db.finance.transactions.filter((t) => (!from || t.date >= from) && (!to || t.date <= to)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const months = {};
    for (const t of db.finance.transactions) { const k = t.date.slice(0, 7); (months[k] ||= []).push(t); }
    const monthly = Object.keys(months).sort().reverse().map((k) => ({ month: k, ...store.financeSummary(k + "-01", k + "-31") }));
    return json(res, 200, { opPct: db.finance.opPct, summary: store.financeSummary(from, to), allTime: store.financeSummary(), monthly, transactions: tx });
  }
  if (m === "PUT" && p === "/api/admin/finance/settings") {
    const b = await body(req, 1e4), pct = num(b.opPct);
    if (!(pct >= 0 && pct <= 100)) return json(res, 400, { error: "Persen harus 0-100" });
    db.finance.opPct = pct; store.save(); return json(res, 200, { ok: true });
  }
  if (m === "POST" && p === "/api/admin/finance/tx") { const t = cleanTx(await body(req, 1e5)); db.finance.transactions.push(t); store.save(); return json(res, 200, t); }
  if ((r = /^\/api\/admin\/finance\/tx\/(\w+)$/.exec(p))) {
    const i = db.finance.transactions.findIndex((t) => t.id === r[1]);
    if (i < 0) return json(res, 404, { error: "Transaksi tidak ada" });
    if (m === "PUT") { const t = cleanTx(await body(req, 1e5), db.finance.transactions[i]); db.finance.transactions[i] = t; store.save(); return json(res, 200, t); }
    if (m === "DELETE") { db.finance.transactions.splice(i, 1); store.save(); return json(res, 200, { ok: true }); }
  }
  if (m === "GET" && p === "/api/admin/finance/export.csv") {
    const rows = [["Tanggal", "Jenis", "Kategori", "Kantong", "Nominal", "Ke Operasional", "Ke Maintenance", "Catatan"]];
    for (const t of [...db.finance.transactions].sort((a, b) => a.date.localeCompare(b.date))) {
      const op = t.type === "income" ? Math.round((t.amount * t.opPct) / 100) : "";
      rows.push([t.date, t.type === "income" ? "Pemasukan" : "Pengeluaran", t.category, t.type === "income" ? `${t.opPct}/${100 - t.opPct}` : t.pot, t.amount, op, t.type === "income" ? t.amount - op : "", t.note]);
    }
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="keuangan-blood-motion.csv"' });
    return res.end("\ufeff" + csv(rows));
  }
  return json(res, 404, { error: "Tidak ditemukan" });
}

const DIST = path.join(root, "dist"), ADMIN = path.join(root, "admin");
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const p = decodeURIComponent(url.pathname);
    res.setHeader("X-Frame-Options", "SAMEORIGIN"); res.setHeader("Referrer-Policy", "same-origin");
    if (p.startsWith("/_render/")) { const r = renders.get(p.slice(9)); if (!r || r.exp < Date.now() || !/^(127\.0\.0\.1|localhost)/.test(req.headers.host || "")) return json(res, 404, { error: "Tidak ada" }); res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(r.html); }
    if (p.startsWith("/api/")) return await api(req, res, url);
    if (p.startsWith("/uploads/")) { const f = within(store.UPLOAD_DIR, p.slice(9)); return f && serveFile(req, res, f, "public, max-age=31536000, immutable") || json(res, 404, { error: "Tidak ada" }); }
    if (p === "/admin" || p === "/admin/") return serveFile(req, res, path.join(ADMIN, "index.html"), "no-store");
    if (p.startsWith("/admin/")) { const f = within(ADMIN, p.slice(7)); return f && serveFile(req, res, f, "no-store") || json(res, 404, { error: "Tidak ada" }); }
    if (fs.existsSync(DIST)) { // situs hasil build
      const f = within(DIST, p.slice(1) || "index.html");
      if (f && fs.existsSync(f) && fs.statSync(f).isFile()) return serveFile(req, res, f, p.startsWith("/assets/") ? "public, max-age=86400" : "no-cache");
      return serveFile(req, res, path.join(DIST, "index.html"), "no-cache");
    }
    json(res, 404, { error: "Situs belum di-build. Jalankan: npm run build" });
  } catch (e) { json(res, e.code === 413 || e.code === 400 ? e.code : 500, { error: e.code ? e.message : "Kesalahan server" }); if (!e.code) console.error(e); }
}).listen(PORT, () => console.log(`Blood Motion server: http://localhost:${PORT}  |  Admin: http://localhost:${PORT}/admin`));
