// Logika bisnis order + invoice. Isomorfik: dipakai server Node dan demo browser (tanpa dependensi).
import { calc, renderInvoiceHtml } from "./invoice.js";

export const ORDER_STATUS = ["new", "discussing", "confirmed", "in_progress", "done", "cancelled"];
const E = (code, message) => Object.assign(new Error(message), { code });
const str = (v, n = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const text = (v, n = 3000) => String(v ?? "").replace(/\r/g, "").trim().slice(0, n);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const addDays = (iso, d) => { const t = new Date(iso + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
const pad = (n, w) => String(n).padStart(w, "0");

// ---------- order ----------
function cleanOrder(b, prev, ctx) {
  const o = prev ? { ...prev } : { id: ctx.newId(), createdAt: ctx.now(), source: "manual", status: "new", invoiceIds: [], quoteItems: [] };
  const set = (k, v) => { if (b[k] !== undefined) o[k] = v; };
  set("name", str(b.name, 120)); set("contact", str(b.contact, 120)); set("phone", str(b.phone, 40)); set("email", str(b.email, 120));
  set("service", str(b.service, 120)); set("duration", str(b.duration, 40)); set("releaseDate", str(b.releaseDate, 20)); set("budget", str(b.budget, 60));
  set("link", str(b.link, 300)); set("brief", text(b.brief, 3000)); set("notes", text(b.notes, 3000));
  if (b.lang !== undefined) o.lang = b.lang === "en" ? "en" : "id";
  if (b.currency !== undefined) o.currency = b.currency === "USD" ? "USD" : "IDR";
  if (b.status !== undefined) { if (!ORDER_STATUS.includes(b.status)) throw E(400, "Status tidak valid"); o.status = b.status; }
  if (b.quoteItems !== undefined) o.quoteItems = cleanItems(b.quoteItems);
  if (!o.name) throw E(400, "Nama / band / label wajib diisi");
  if (!o.code) o.code = ctx.orderCode(o.createdAt);
  return o;
}
export function createPublicOrder(db, save, b, ctx) {
  if (b.website) return { ok: true }; // honeypot: bot mengisi kolom tersembunyi
  const name = str(b.name, 120);
  if (!name) throw E(400, "Nama wajib diisi");
  if (!str(b.email, 120) && !str(b.phone, 40)) throw E(400, "Isi email atau nomor WhatsApp");
  const o = cleanOrder({ name, contact: b.contact, phone: b.phone, email: b.email, service: b.service, duration: b.duration, releaseDate: b.date || b.releaseDate, budget: b.budget, link: b.link, brief: b.brief }, null, ctx);
  o.source = "web"; o.status = "new";
  db.orders.push(o); save();
  return { ok: true, code: o.code };
}

// ---------- invoice ----------
function cleanItems(arr) {
  return (Array.isArray(arr) ? arr : []).slice(0, 14).map((it) => ({
    id: str(it.id, 20) || Math.random().toString(36).slice(2, 10),
    desc: str(it.desc, 90), price: Math.max(0, num(it.price)), qty: Math.max(0, num(it.qty) || 1),
    type: it.type === "discount" ? "discount" : "item",
  })).filter((it) => it.desc || it.price);
}
function nextNo(db) {
  const S = db.settings;
  let n = Math.max(1, Math.round(num(S.nextNo)) || 1);
  const used = new Set(db.invoices.map((i) => i.no));
  while (used.has(pad(n, S.padNo || 4))) n++;
  return n;
}
function cleanInvoice(b, prev, db, ctx) {
  const S = db.settings;
  const inv = prev ? { ...prev } : { id: ctx.newId(), createdAt: ctx.now(), payments: [], status: "draft", orderId: "" };
  const set = (k, v) => { if (b[k] !== undefined) inv[k] = v; };
  if (b.lang !== undefined) inv.lang = b.lang === "en" ? "en" : "id";
  if (b.currency !== undefined) inv.currency = b.currency === "USD" ? "USD" : "IDR";
  set("no", str(b.no, 20));
  if (b.date !== undefined) { if (!isDate(b.date)) throw E(400, "Tanggal tidak valid"); inv.date = b.date; }
  if (b.dueDate !== undefined) { if (!isDate(b.dueDate)) throw E(400, "Jatuh tempo tidak valid"); inv.dueDate = b.dueDate; }
  if (b.client !== undefined) inv.client = { name: str(b.client.name, 60), org: str(b.client.org, 90), phone: str(b.client.phone, 40), email: str(b.client.email, 120) };
  if (b.party2 !== undefined) inv.party2 = { line1: str(b.party2.line1, 40), line2: str(b.party2.line2, 40) };
  if (b.items !== undefined) inv.items = cleanItems(b.items);
  set("taxPct", Math.min(100, Math.max(0, num(b.taxPct)))); set("dp", Math.max(0, num(b.dp)));
  set("paymentMethodId", str(b.paymentMethodId, 40)); set("terms", text(b.terms, 400)); set("notes", text(b.notes, 2000));
  if (b.orderId !== undefined) inv.orderId = str(b.orderId, 40);
  if (b.status !== undefined) { if (!["draft", "sent", "cancelled"].includes(b.status)) throw E(400, "Status tidak valid"); inv.status = b.status; }
  if (!inv.no) throw E(400, "Nomor invoice wajib diisi");
  if (db.invoices.some((i) => i.no === inv.no && i.id !== inv.id)) throw E(400, `Nomor invoice ${inv.no} sudah dipakai`);
  inv.client = inv.client || { name: "", org: "", phone: "", email: "" };
  if (!inv.client.name && !inv.client.org) throw E(400, "Isi nama klien (Kepada)");
  if (!(inv.items || []).length) throw E(400, "Tambahkan minimal satu item");
  return inv;
}
const view = (inv) => { const c = calc(inv); const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0); return { ...inv, calc: c, paid, payState: paid <= 0 ? "unpaid" : paid >= c.grand ? "paid" : "partial", remaining: Math.max(0, c.grand - paid) }; };

export function draftFromOrder(db, order, ctx, o = {}) {
  const S = db.settings;
  const lang = o.lang || order.lang || S.defaultLang || "id";
  const cur = o.currency || order.currency || (lang === "en" ? "USD" : S.defaultCurrency || "IDR");
  let items = (order.quoteItems || []).map((x) => ({ ...x }));
  if (!items.length) {
    const rc = db.ratecard.find((r) => r.active !== false && r.name.toLowerCase() === (order.service || "").toLowerCase());
    items = [{ desc: rc ? rc.name : order.service || "", price: rc ? (cur === "USD" ? rc.priceUsd : rc.priceIdr) : 0, qty: 1, type: "item" }];
  }
  const date = ctx.today();
  const pm = (S.paymentMethods || []).find((p) => (lang === "en") === /paypal/i.test(p.id + p.bank)) || (S.paymentMethods || [])[0];
  const person = order.contact || order.name;
  return {
    lang, currency: cur, date, dueDate: addDays(date, Math.round(num(S.dueDays)) || 20),
    client: { name: person, org: order.contact ? order.name : "", phone: order.phone || "", email: order.email || "" },
    party2: { line1: order.name, line2: "" }, items, taxPct: num(S.defaultTaxPct), dp: 0,
    paymentMethodId: pm ? pm.id : "", terms: "", notes: "", orderId: order.id,
  };
}

// ---------- router (admin) ----------
// Mengembalikan { code, data } atau null bila rute bukan milik modul ini.
export function route(db, save, m, p, b, q, ctx) {
  let r;
  const ok = (data) => ({ code: 200, data });
  try {
    // order
    if (m === "GET" && p === "/api/admin/orders") return ok([...db.orders].sort((a, c) => c.createdAt.localeCompare(a.createdAt)));
    if (m === "POST" && p === "/api/admin/orders") { const o = cleanOrder(b, null, ctx); db.orders.push(o); save(); return ok(o); }
    if ((r = /^\/api\/admin\/orders\/(\w+)$/.exec(p))) {
      const i = db.orders.findIndex((o) => o.id === r[1]);
      if (i < 0) throw E(404, "Order tidak ada");
      if (m === "PUT") { db.orders[i] = cleanOrder(b, db.orders[i], ctx); save(); return ok(db.orders[i]); }
      if (m === "DELETE") { db.orders.splice(i, 1); save(); return ok({ ok: true }); }
    }
    // ratecard & pengaturan
    if (m === "GET" && p === "/api/admin/ratecard") return ok(db.ratecard);
    if (m === "PUT" && p === "/api/admin/ratecard") {
      if (!Array.isArray(b.value)) throw E(400, "value harus array");
      db.ratecard = b.value.slice(0, 300).map((x) => ({ id: str(x.id, 20) || ctx.newId(), name: str(x.name, 90), category: str(x.category, 60), priceIdr: Math.max(0, num(x.priceIdr)), priceUsd: Math.max(0, num(x.priceUsd)), type: x.type === "discount" ? "discount" : "item", active: x.active !== false })).filter((x) => x.name);
      save(); return ok({ ok: true });
    }
    if (m === "GET" && p === "/api/admin/settings") return ok(db.settings);
    if (m === "PUT" && p === "/api/admin/settings") {
      const S = db.settings, v = b.value || {};
      S.nextNo = Math.max(1, Math.round(num(v.nextNo)) || S.nextNo); S.padNo = Math.min(8, Math.max(1, Math.round(num(v.padNo)) || 4));
      S.dueDays = Math.min(365, Math.max(0, Math.round(num(v.dueDays)))); S.defaultLang = v.defaultLang === "en" ? "en" : "id"; S.defaultCurrency = v.defaultCurrency === "USD" ? "USD" : "IDR";
      S.defaultTaxPct = Math.min(100, Math.max(0, num(v.defaultTaxPct)));
      S.termsId = text(v.termsId, 400); S.termsEn = text(v.termsEn, 400); S.party2Id = str(v.party2Id, 40); S.party2En = str(v.party2En, 40); S.showSampleSignature = !!v.showSampleSignature;
      if (Array.isArray(v.paymentMethods)) S.paymentMethods = v.paymentMethods.slice(0, 12).map((x) => ({ id: str(x.id, 30) || ctx.newId(), label: str(x.label, 50), bank: str(x.bank, 60), name: str(x.name, 60), no: str(x.no, 70) })).filter((x) => x.label || x.bank);
      save(); return ok(S);
    }
    // invoice
    if (m === "GET" && p === "/api/admin/invoices") return ok([...db.invoices].sort((a, c) => c.createdAt.localeCompare(a.createdAt) || c.no.localeCompare(a.no)).map(view));
    if (m === "POST" && p === "/api/admin/invoices/from-order") {
      const order = db.orders.find((o) => o.id === b.orderId); if (!order) throw E(404, "Order tidak ada");
      const d = draftFromOrder(db, order, ctx, b), n = nextNo(db);
      const inv = cleanInvoice({ ...d, no: pad(n, db.settings.padNo || 4) }, null, db, ctx);
      db.invoices.push(inv); db.settings.nextNo = n + 1; order.invoiceIds = [...(order.invoiceIds || []), inv.id]; save(); return ok(view(inv));
    }
    if (m === "GET" && p === "/api/admin/invoices/new-draft") {
      const S = db.settings, lang = S.defaultLang, cur = lang === "en" ? "USD" : S.defaultCurrency, date = ctx.today();
      const pm = (S.paymentMethods || [])[0];
      return ok({ lang, currency: cur, no: pad(nextNo(db), S.padNo || 4), date, dueDate: addDays(date, Math.round(num(S.dueDays)) || 20), client: { name: "", org: "", phone: "", email: "" }, party2: { line1: "", line2: "" }, items: [{ desc: "", price: 0, qty: 1, type: "item" }], taxPct: num(S.defaultTaxPct), dp: 0, paymentMethodId: pm ? pm.id : "", terms: "", notes: "" });
    }
    if (m === "POST" && p === "/api/admin/invoices") {
      const inv = cleanInvoice({ lang: db.settings.defaultLang, currency: db.settings.defaultCurrency, ...b }, null, db, ctx);
      db.invoices.push(inv);
      const n = parseInt(inv.no, 10); if (Number.isFinite(n) && n >= db.settings.nextNo) db.settings.nextNo = n + 1;
      if (inv.orderId) { const o = db.orders.find((x) => x.id === inv.orderId); if (o && !(o.invoiceIds || []).includes(inv.id)) o.invoiceIds = [...(o.invoiceIds || []), inv.id]; }
      save(); return ok(view(inv));
    }
    if (m === "POST" && p === "/api/admin/invoice-preview") {
      const html = renderInvoiceHtml({ lang: "id", currency: "IDR", no: "—", ...b.invoice }, db.settings, ctx.renderOpt || {});
      return ok({ html });
    }
    if ((r = /^\/api\/admin\/invoices\/(\w+)$/.exec(p))) {
      const i = db.invoices.findIndex((x) => x.id === r[1]);
      if (i < 0) throw E(404, "Invoice tidak ada");
      if (m === "GET") return ok(view(db.invoices[i]));
      if (m === "PUT") { db.invoices[i] = cleanInvoice(b, db.invoices[i], db, ctx); save(); return ok(view(db.invoices[i])); }
      if (m === "DELETE") {
        if ((db.invoices[i].payments || []).length) throw E(400, "Hapus pembayaran invoice ini dulu, atau ubah statusnya menjadi Dibatalkan.");
        const id = db.invoices[i].id; db.invoices.splice(i, 1); db.orders.forEach((o) => (o.invoiceIds = (o.invoiceIds || []).filter((x) => x !== id))); save(); return ok({ ok: true });
      }
    }
    // pembayaran invoice -> otomatis jadi pemasukan di Keuangan (dibagi sesuai rasio)
    if (m === "POST" && (r = /^\/api\/admin\/invoices\/(\w+)\/payments$/.exec(p))) {
      const inv = db.invoices.find((x) => x.id === r[1]); if (!inv) throw E(404, "Invoice tidak ada");
      const amount = Math.round(num(b.amount) * 100) / 100, date = b.date || ctx.today();
      if (!(amount > 0)) throw E(400, "Nominal harus lebih dari 0"); if (!isDate(date)) throw E(400, "Tanggal tidak valid");
      const pay = { id: ctx.newId(), date, amount, note: str(b.note, 150) };
      let cur = calc(inv).cur === "USD" && b.amountIdr ? Math.round(num(b.amountIdr)) : amount; // pembayaran USD dicatat ke keuangan dalam Rupiah
      if (calc(inv).cur === "USD" && !(cur > 0)) throw E(400, "Invoice USD: isi nilai dalam Rupiah untuk dicatat ke Keuangan");
      if (b.toFinance !== false) {
        const tx = { id: ctx.newId(), date, type: "income", amount: Math.round(cur), category: `Invoice ${inv.no}`, note: pay.note, opPct: db.finance.opPct, invoiceId: inv.id };
        db.finance.transactions.push(tx); pay.txId = tx.id;
      }
      inv.payments = [...(inv.payments || []), pay]; save(); return ok(view(inv));
    }
    if (m === "DELETE" && (r = /^\/api\/admin\/invoices\/(\w+)\/payments\/(\w+)$/.exec(p))) {
      const inv = db.invoices.find((x) => x.id === r[1]); if (!inv) throw E(404, "Invoice tidak ada");
      const pay = (inv.payments || []).find((x) => x.id === r[2]); if (!pay) throw E(404, "Pembayaran tidak ada");
      if (pay.txId) db.finance.transactions = db.finance.transactions.filter((t) => t.id !== pay.txId);
      inv.payments = inv.payments.filter((x) => x.id !== r[2]); save(); return ok(view(inv));
    }
    // tampilan HTML invoice (untuk cetak / PDF)
    if (m === "GET" && (r = /^\/api\/admin\/invoices\/(\w+)\/html$/.exec(p))) {
      const inv = db.invoices.find((x) => x.id === r[1]); if (!inv) throw E(404, "Invoice tidak ada");
      return { code: 200, html: renderInvoiceHtml(inv, db.settings, { ...(ctx.renderOpt || {}), print: q && q.print === "1" }) };
    }
  } catch (e) { return { code: e.code || 400, data: { error: e.message } }; }
  return null;
}
