// Penyimpanan JSON sederhana (tanpa dependensi). File: data/db.json. Tulis atomik + backup harian otomatis.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as d from "../src/data.js";
import { DEFAULT_TERMS } from "./invoice.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = process.env.DATA_DIR || path.join(root, "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB = path.join(DATA_DIR, "db.json");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const id = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const withIds = (a) => a.map((x, i) => ({ id: id(), order: i + 1, ...x }));

function seed() {
  return {
    site: d.site, nav: d.nav, links: d.links, budgets: d.budgets,
    workCategories: d.workCategories.map((title, i) => ({ id: id(), title, order: i + 1 })),
    projects: withIds(d.projects),
    services: withIds(d.services),
    steps: withIds(d.steps.map(([title, desc, more]) => ({ title, desc, more }))),
    team: withIds(d.team),
    clientLogos: withIds(d.clientLogos),
    clients: withIds(d.clients),
    finance: { opPct: 50, transactions: [] }, // opPct = % ke Operasional; sisanya ke Maintenance Studio
    orders: [],
    invoices: [],
    // Ratecard milik studio: ganti lewat admin. Contoh awal diambil dari invoice contoh.
    ratecard: [
      { id: id(), name: "Full Album Stream", category: "Music Visual", priceIdr: 700000, priceUsd: 0, type: "item", active: true },
      { id: id(), name: "Reels Promotion", category: "Video Editing", priceIdr: 150000, priceUsd: 0, type: "item", active: true },
      { id: id(), name: "Thumbnail Reels & YT", category: "Motion Graphics", priceIdr: 50000, priceUsd: 0, type: "item", active: true },
      { id: id(), name: "Discount First Order", category: "Diskon", priceIdr: 200000, priceUsd: 0, type: "discount", active: true },
    ],
    settings: {
      nextNo: 455, padNo: 4, dueDays: 20, defaultLang: "id", defaultCurrency: "IDR", defaultTaxPct: 0,
      termsId: DEFAULT_TERMS.id, termsEn: DEFAULT_TERMS.en, party2Id: "Band/Musician", party2En: "Band / Label Ybs.",
      showSampleSignature: false, // true = tampilkan tanda tangan contoh Pihak Kedua pada desain Indonesia
      paymentMethods: [
        { id: "bca", label: "Transfer BCA", bank: "Bank Central Asia", name: "Hudan Aminulloh", no: "1131862127" },
        { id: "paypal", label: "PayPal", bank: "PayPal", name: "Hudan Aminulloh", no: "hudan.paradigma@gmail.com" },
      ],
    },
  };
}

let db;
export function load() {
  if (db) return db;
  db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : seed();
  // lengkapi key baru dari default tanpa menimpa yang sudah diedit
  const s = seed();
  for (const k of Object.keys(s)) if (db[k] === undefined) db[k] = s[k];
  for (const k of Object.keys(s.site)) if (db.site[k] === undefined) db.site[k] = s.site[k];
  for (const k of Object.keys(s.settings)) if (db.settings[k] === undefined) db.settings[k] = s.settings[k];
  save();
  return db;
}
export function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const bak = path.join(DATA_DIR, "backups", `db-${day}.json`);
  if (fs.existsSync(DB) && !fs.existsSync(bak)) { fs.mkdirSync(path.dirname(bak), { recursive: true }); fs.copyFileSync(DB, bak); }
  const tmp = DB + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB);
}
export const newId = id;
export const ORDER_STATUS = ['new', 'discussing', 'confirmed', 'in_progress', 'done', 'cancelled'];

// Bagian yang boleh diedit lewat PUT /api/admin/content/:key
export const EDITABLE = ["site", "nav", "links", "budgets", "workCategories", "projects", "services", "steps", "team", "clientLogos", "clients"];

// Data publik (tanpa keuangan)
export function publicContent() {
  const { finance, orders, invoices, ratecard, settings, ...rest } = load();
  const byOrder = (a) => [...a].sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
  return {
    ...rest,
    workCategories: byOrder(rest.workCategories).map((c) => c.title),
    projects: rest.projects.filter((p) => !p.hidden),
    services: byOrder(rest.services).map((s) => ({ ...s, items: s.items || [] })),
    steps: byOrder(rest.steps).map((s) => [s.title, s.desc, s.more]),
    team: byOrder(rest.team),
    clientLogos: byOrder(rest.clientLogos),
    clients: byOrder(rest.clients),
  };
}

// ---- Keuangan ----
export function financeSummary(from, to) {
  const f = load().finance;
  const tx = f.transactions.filter((t) => (!from || t.date >= from) && (!to || t.date <= to));
  const pots = { operational: { in: 0, out: 0 }, maintenance: { in: 0, out: 0 } };
  let income = 0, expense = 0;
  for (const t of tx) {
    if (t.type === "income") {
      income += t.amount;
      const op = Math.round((t.amount * t.opPct) / 100);
      pots.operational.in += op; pots.maintenance.in += t.amount - op;
    } else { expense += t.amount; pots[t.pot].out += t.amount; }
  }
  for (const p of Object.values(pots)) p.balance = p.in - p.out;
  return { opPct: f.opPct, income, expense, net: income - expense, pots, count: tx.length };
}
