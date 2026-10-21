// Mesin invoice (dipakai server Node DAN demo browser). Tidak ada dependensi.
// Tata letak = desain PDF milik Blood Motion (halaman 595.5 x 870 pt). Semua angka di bawah adalah koordinat asli dari PDF.
// Latar (logo, judul, label statis, tanda tangan, segel) = gambar template; yang dirender ulang hanya ISI (teks dinamis).

const PW = 595.5, PH = 870;
const OFF = 7.92; // selisih MediaBox PDF desain: koordinat teks dari pdfplumber + OFF = posisi tampil
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const thousands = (s, sep) => s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

// ---------- format & hitung ----------
export function money(n, cur = "IDR") {
  n = num(n);
  if (cur === "USD") return "$ " + thousands(n.toFixed(2).split(".")[0], ",") + "." + n.toFixed(2).split(".")[1];
  return "Rp. " + thousands(String(Math.round(n)), ".");
}
export function fmtDate(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; }
const r2 = (n, cur) => (cur === "USD" ? Math.round(n * 100) / 100 : Math.round(n));

// subtotal = jumlah item - diskon; total = subtotal + pajak - down payment (sisa yang harus dibayar)
export function calc(inv) {
  const cur = inv.currency === "USD" ? "USD" : "IDR";
  const lines = (inv.items || []).map((it) => {
    const price = Math.max(0, num(it.price)), qty = Math.max(0, num(it.qty) || 0);
    return { ...it, price, qty, total: r2(price * qty, cur), discount: it.type === "discount" };
  });
  const subtotal = r2(lines.reduce((s, l) => s + (l.discount ? -l.total : l.total), 0), cur);
  const taxPct = Math.max(0, num(inv.taxPct));
  const tax = taxPct > 0 ? r2((subtotal * taxPct) / 100, cur) : 0;
  const dp = Math.max(0, num(inv.dp));
  const grand = r2(subtotal + tax, cur);           // nilai tagihan penuh (dasar status lunas)
  const total = r2(grand - dp, cur);               // yang tampil di bar TOTAL
  return { cur, lines, subtotal, taxPct, tax, dp, grand, total };
}

// ---------- geometri per bahasa (pt) ----------
const GEO = {
  id: {
    slots: 6, sepY: [348.0, 384.4, 421.9, 458.0, 494.7, 528.9], sepX: [[77.5, 512.1], [77.5, 512.1], [77.5, 512.1], [78.5, 511.2], [76.0, 508.7], [76.0, 508.7]],
    textOff: 22.0, totalRight: 516.6, labelX: 296.5, firstSize: 11.0, orgItalic: true, bankMax: 119, taxLabel: "PAJAK", terms: 466, splice: true,
  },
  en: {
    slots: 5, sepY: [347.6, 395.3, 442.9, 489.1, 536.4], sepX: [[77.5, 512.1], [77.5, 512.1], [77.5, 512.1], [78.5, 511.2], [78.5, 511.2]],
    textOff: 27.3, totalRight: 512.5, labelX: 345.9, firstSize: 10.6, orgItalic: false, bankMax: 171, taxLabel: "TAX", terms: 466, splice: false,
  },
};
const COL = { prod: 75.6, price: 315.6, qty: 404.4 };
const RED = "#E20000";
// Kontur putih tebal ~0.95pt di sekeliling teks (meniru garis tepi desain asli). Dua cincin supaya lubang angka 0/4 juga terisi rapi.
const OUTLINE_R = 0.95;
function outline(r, color = "#fff") {
  const parts = [];
  for (const k of [1, 0.55]) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; parts.push(`${(Math.cos(a) * r * k).toFixed(3)}pt ${(Math.sin(a) * r * k).toFixed(3)}pt 0 ${color}`); }
  return parts.join(",");
}

// koreksi vertikal posisi teks agar baseline HTML = baseline PDF (dikalibrasi terhadap PDF asli)
const DY = { poppins: -0.2, lib: -0.1 };

export const DEFAULT_TERMS = {
  id: "Harap melakukan pembayaran maksimal 10 hari setelah invoice diterima. Keterlambatan pembayaran akan dikenakan denda 10% per hari.",
  en: "Please send payment within 30 days of receiving this invoice. There will be 10% interest charge per month on late invoice.",
};

// ---------- render ----------
// opt: { bg: {id:url,en:url}, fonts: {Poppins-Light:url,...} | fontBase:url, print:boolean }
export function renderInvoiceHtml(inv, S = {}, opt = {}) {
  const lang = inv.lang === "en" ? "en" : "id", g = GEO[lang], c = calc(inv);
  const pm = (S.paymentMethods || []).find((p) => p.id === inv.paymentMethodId) || (S.paymentMethods || [])[0] || { bank: "", name: "", no: "" };
  const terms = (inv.terms && inv.terms.trim()) || (lang === "en" ? S.termsEn : S.termsId) || DEFAULT_TERMS[lang];
  const party1 = lang === "id" || true;
  const cl = inv.client || {};
  const p2l1 = (inv.party2 && inv.party2.line1) || cl.org || cl.name || (lang === "en" ? "Band / Label" : "Band/Musician");
  const p2l2 = (inv.party2 && inv.party2.line2) || (lang === "en" ? (S.party2En || "Band / Label Ybs.") : (S.party2Id || "Band/Musician"));
  const out = [];
  // elemen teks: top = "top" kotak teks PDF (pt); font-size di-set lewat kelas; posisi horizontal left / right / center
  const T = (cls, size, top, pos, text, extra = "", dy = DY.poppins, fit = 0) => {
    const y = (top + OFF + dy * size).toFixed(2);
    let h = pos.l != null ? `left:${pos.l}pt;` : pos.r != null ? `right:${(PW - pos.r).toFixed(2)}pt;` : `left:${pos.c}pt;transform:translateX(-50%);`;
    out.push(`<div class="t ${cls}" style="top:${y}pt;${h}font-size:${size}pt;${extra}"${fit ? ` data-fit="${fit}"` : ""}>${esc(text)}</div>`);
  };

  // meta kiri atas (rata kanan di x=257.7)
  T("sb", 12, 207.1, { r: 257.7 }, inv.no);
  T("sb", 12, 222.0, { r: 257.7 }, fmtDate(inv.date));
  T("sb", 12, 238.1, { r: 257.7 }, fmtDate(inv.dueDate));

  // Kepada (blok rata kanan di x=526.4, mengalir & membungkus seperti desain)
  const bill = [];
  if (cl.name) bill.push(`<div class="sb">${esc(cl.name)}</div>`);
  if (cl.org) bill.push(`<div class="${g.orgItalic ? "bi" : "sb"} og">${esc(cl.org)}</div>`);
  if (cl.phone) bill.push(`<div class="sb nu ph">${esc(cl.phone)}</div>`);
  out.push(`<div class="bill" style="top:${(207.1 + OFF - 2.4).toFixed(2)}pt;right:${(PW - 526.4).toFixed(2)}pt">${bill.join("")}</div>`);

  // baris tabel
  const rows = c.lines.slice(0, 14);
  const n = Math.max(rows.length, g.slots);
  const first = g.sepY[0], last = Math.max(g.sepY[g.slots - 1], rows.length > g.slots ? first + (rows.length - 1) * 24 : 0);
  const ys = [], xs = [];
  for (let i = 0; i < n; i++) {
    if (n <= g.slots) { ys.push(g.sepY[i]); xs.push(g.sepX[i]); }
    else { const lastY = Math.min(540, g.sepY[g.slots - 1] + (n - g.slots) * 15); ys.push(first + (i * (lastY - first)) / (n - 1)); xs.push(g.sepX[Math.min(i, g.slots - 1)]); }
  }
  ys.forEach((y, i) => out.push(`<div class="ln" style="top:${(y + OFF - 0.35).toFixed(2)}pt;left:${xs[i][0]}pt;width:${(xs[i][1] - xs[i][0]).toFixed(2)}pt"></div>`));
  const rowOff = n <= g.slots ? g.textOff : g.textOff - (ys.length > 1 ? Math.max(0, (g.sepY[1] - g.sepY[0]) - (ys[1] - ys[0])) * 0.35 : 0);
  for (let i = 0; i < n; i++) {
    const L = rows[i], top = ys[i] - rowOff, size = i === 0 ? g.firstSize : 10.6;
    const cls = (!L ? "rg" : L.discount ? "bd red" : i === 0 ? "lt" : "rg") + " ls";
    if (!L) { T(cls, size, top, { l: COL.prod }, "-"); T(cls, size, top, { c: COL.price }, "-"); T(cls, size, top, { c: COL.qty }, "-"); T(cls, size, top, { r: g.totalRight }, "-"); continue; }
    T(cls, size, top, { l: COL.prod }, L.desc || "", "max-width:200pt;overflow:hidden", DY.poppins, 200);
    T(cls, size, top, { c: COL.price }, money(L.price, c.cur));
    T(cls, size, top, { c: COL.qty }, String(L.qty));
    T(cls, size, top, { r: g.totalRight }, money(L.total, c.cur));
  }

  // blok total: label & nilai (sub-total label = statis di template)
  T("bd ls", 11.5, 563.2, { r: 512.6 }, money(c.subtotal, c.cur));
  const ex = [];
  if (c.tax > 0 || c.taxPct > 0) ex.push([`${g.taxLabel} (${String(c.taxPct).replace(/\.0+$/, "")}%)`, c.tax]);
  if (c.dp > 0) ex.push(["DOWN PAYMENT", c.dp]);
  const exTops = ex.length === 1 ? [588.0] : [581.2, 599.2];
  const subTop = ex.length === 2 ? 563.2 : 563.2;
  ex.forEach(([lb, v], i) => { T("bd", 11.5, exTops[i], { l: g.labelX }, lb); T("bd ls", 11.5, exTops[i], { r: 512.6 }, money(v, c.cur)); });
  // TOTAL (di bar hitam). Desain Indonesia memakai efek "splice": lapisan putih + lapisan merah offset
  // Satu lapisan saja (posisi sama dengan teks merah asli): teks merah + kontur putih rata di semua sisi (text-shadow melingkar, ujung membulat).
  if (g.splice) T("bd ls", 11.5, 630.8, { r: 512.6 }, money(c.total, c.cur), `color:${RED};text-shadow:${outline(OUTLINE_R)}`);
  else T("bd ls", 11.5, 631.6, { r: 512.6 }, money(c.total, c.cur), "color:#fff");

  // metode pembayaran (3 baris nilai di kanan label statis)
  const email = /@/.test(pm.no || "");
  T("rg up bk", 11.9, 589.0, { l: 169.0 }, pm.bank || "", "", DY.poppins, g.bankMax);
  T("rg up bk", 11.9, 603.4, { l: 169.0 }, pm.name || "", "", DY.poppins, g.bankMax);
  T("rg bk" + (email ? " red" : " up"), email ? 10.9 : 11.9, 617.7, { l: 169.0 }, pm.no || "", "", DY.poppins, g.bankMax);

  // syarat & ketentuan
  out.push(`<div class="terms" style="top:${(663.1 + OFF - 2.4).toFixed(2)}pt;width:${g.terms}pt">${esc(terms)}</div>`);

  // Pihak Kedua (tengah x=317). Canva Sans diganti Liberation Sans
  if (lang === "id" && !S.showSampleSignature) out.push(`<div class="cover" style="left:271pt;top:${(741 + OFF).toFixed(2)}pt;width:90pt;height:49pt"></div>`);
  T("cv" + (lang === "en" ? " it" : ""), 10.8, 734.8, { c: 317.0 }, p2l1, "", DY.lib, 100);
  T("cv", 10.8, 788.7, { c: 317.0 }, p2l2, "", DY.lib, 100);

  const F = (opt.fonts || {});
  const fu = (n) => F[n] || `${opt.fontBase || "/admin/invoice-assets/fonts"}/${n}.ttf`;
  const bg = (opt.bg && opt.bg[lang]) || `/admin/invoice-assets/bg-${lang}.jpg`;
  const title = `Invoice ${esc(inv.no)}${cl.name ? " - " + esc(cl.name) : ""}`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@font-face{font-family:BMP;font-weight:300;src:url("${fu("Poppins-Light")}")}
@font-face{font-family:BMP;font-weight:400;src:url("${fu("Poppins-Regular")}")}
@font-face{font-family:BMP;font-weight:500;src:url("${fu("Poppins-Medium")}")}
@font-face{font-family:BMP;font-weight:700;src:url("${fu("Poppins-Bold")}")}
@font-face{font-family:BMP;font-weight:700;font-style:italic;src:url("${fu("Poppins-BoldItalic")}")}
@font-face{font-family:BMC;font-weight:400;src:url("${fu("LiberationSans-Regular")}")}
@font-face{font-family:BMC;font-weight:400;font-style:italic;src:url("${fu("LiberationSans-Italic")}")}
@page{size:${PW}pt ${PH}pt;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${PW}pt;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{min-height:${PH}pt}
.page{position:relative;width:${PW}pt;height:${PH - 0.2}pt;overflow:hidden;background:#fff url("${bg}") 0 0/100% 100% no-repeat;font-family:BMP,Poppins,sans-serif;color:#000;break-after:avoid}
.t{position:absolute;white-space:nowrap;line-height:1;color:#000;font-variant-ligatures:none}
.lt{font-weight:300}.rg{font-weight:400}.bd{font-weight:700}.bi{font-weight:700;font-style:italic}
.sb{font-weight:500;-webkit-text-stroke:.012em currentColor;letter-spacing:.004em}
.red{color:${RED}}.up{text-transform:uppercase}.nu{text-transform:none}
.ln{position:absolute;height:.8pt;background:#a6a6a6}
.bill{position:absolute;width:150pt;text-align:right;font-size:12pt;line-height:12.7pt;max-height:${(12.7 * 5).toFixed(1)}pt;overflow:hidden;text-transform:uppercase;word-break:break-word}
.terms{position:absolute;left:63.2pt;font-size:11.9pt;line-height:14.3pt;font-weight:500;-webkit-text-stroke:.012em currentColor;letter-spacing:-.047em;text-transform:uppercase;max-height:${(14.3 * 3).toFixed(1)}pt;overflow:hidden}
.cv{font-family:BMC,Arial,sans-serif;font-weight:400}.cv.it{font-style:italic}
.cover{position:absolute;background:#fff}
.bill .nu{text-transform:none}.ls{letter-spacing:.028em}.bk{letter-spacing:-.034em}.og{letter-spacing:-.05em}.bill .ph{letter-spacing:-.075em}
@media screen{body{background:#e9e9e9}html,body{width:auto}.page{margin:0 auto;box-shadow:0 2px 18px #0004}}
</style></head><body><div class="page" id="pg">${out.join("\n")}</div>
<script>
(function(){
function fit(){document.querySelectorAll("[data-fit]").forEach(function(e){var mx=parseFloat(e.dataset.fit)*96/72,fs=parseFloat(e.style.fontSize);var k=0;while(e.scrollWidth>mx+0.5&&fs>6.5&&k++<40){fs-=0.25;e.style.fontSize=fs+"pt";}});}
function go(){fit();document.documentElement.setAttribute("data-ready","1");${opt.print ? "setTimeout(function(){window.print()},250);" : ""}}
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go)}else{addEventListener("load",go)}
})();
</script></body></html>`;
}
