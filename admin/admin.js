"use strict";
const app = document.getElementById("app"), toastEl = document.getElementById("toast");
const h = (tag, a = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(a || {})) {
    if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
const toast = (m, err) => { toastEl.textContent = m; toastEl.className = "show" + (err ? " err" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => (toastEl.className = ""), 2600); };
const rp = (n) => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n || 0));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const today = () => new Date().toISOString().slice(0, 10);
const getp = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setp = (o, p, v) => { const ks = p.split("."); let c = o; ks.slice(0, -1).forEach((k) => (c = c[k] ??= {})); c[ks.at(-1)] = v; };

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin" });
  if (r.status === 401 && !url.includes("/login")) { showLogin(); throw new Error("Sesi habis, login lagi."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Gagal (" + r.status + ")");
  return j;
}
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

// ---------- field controls ----------
function upload(file) {
  return new Promise((ok, no) => {
    const fr = new FileReader();
    fr.onload = guard(async () => ok((await api("POST", "/api/admin/upload", { filename: file.name, data: String(fr.result).split(",")[1] })).url));
    fr.onerror = () => no(new Error("Gagal membaca file"));
    fr.readAsDataURL(file);
  });
}
function field(f, get, set) {
  const v = get();
  const wrap = (c) => h("label", { class: "f" + (f.full ? " full" : "") }, h("span", {}, f.label), c);
  if (f.type === "area") return wrap(h("textarea", { oninput: (e) => set(e.target.value) }, v ?? ""));
  if (f.type === "lines") return wrap(h("textarea", { placeholder: "Satu baris = satu poin", oninput: (e) => set(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)) }, (v || []).join("\n")));
  if (f.type === "check") return h("label", { class: "f" }, h("span", {}, f.label), h("input", { type: "checkbox", style: "width:auto", checked: !!v, onchange: (e) => set(e.target.checked) }));
  if (f.type === "select") return wrap(h("select", { onchange: (e) => set(e.target.value) }, [f.noEmpty ? null : h("option", { value: "" }, "— pilih —"), ...f.options().map((o) => { const x = typeof o === "string" ? { v: o, l: o } : o; return h("option", { value: x.v, selected: x.v === v }, x.l); })]));
  if (f.type === "image" || f.type === "video") {
    const pv = h("div", { class: "pv" }), url = h("input", { value: v || "", placeholder: "/uploads/… atau https://…" });
    const draw = () => { pv.textContent = ""; const u = url.value; if (!u) pv.textContent = "kosong"; else pv.append(f.type === "video" ? h("video", { src: u, muted: true, preload: "metadata" }) : h("img", { src: u, alt: "" })); };
    url.oninput = () => { set(url.value.trim()); draw(); };
    const file = h("input", { type: "file", accept: f.type === "video" ? "video/mp4,video/webm" : "image/*", style: "display:none", onchange: guard(async () => { const fl = file.files[0]; if (!fl) return; toast("Mengunggah…"); url.value = await upload(fl); set(url.value); draw(); toast("Terunggah"); }) });
    draw();
    return wrap(h("div", { class: "imgf" }, pv, h("div", { style: "flex:1" }, url, h("div", { style: "margin-top:5px;display:flex;gap:6px" }, h("button", { type: "button", class: "btn sm", onclick: () => file.click() }, "Unggah file"), h("button", { type: "button", class: "btn sm del", onclick: () => { url.value = ""; set(""); draw(); } }, "Hapus")), file)));
  }
  return wrap(h("input", { type: f.type === "num" ? "number" : f.type === "date" ? "date" : "text", value: v ?? "", oninput: (e) => set(f.type === "num" ? Number(e.target.value) : e.target.value) }));
}

// ---------- halaman: teks (objek) ----------
const TEXTS = [
  ["Hero (paling atas)", [["hero.topLeft", "Teks kiri atas"], ["hero.topRight", "Teks kanan atas"], ["hero.slogan", "Slogan di bawah logo"], ["hero.tag", "Tagline"], ["hero.desc", "Deskripsi", "area"], ["hero.ctaPrimary", "Tombol 1"], ["hero.ctaSecondary", "Tombol 2"], ["hero.marquee", "Teks berjalan (marquee)"]]],
  ["Intro", [["intro.title", "Judul"], ["intro.p1", "Paragraf 1", "area"], ["intro.p2", "Paragraf 2", "area"]]],
  ["Selected Work", [["work.title", "Judul"], ["work.sub", "Teks kecil"]]],
  ["What We Do", [["services.title", "Judul"]]],
  ["The Process", [["process.title", "Judul"]]],
  ["Statement", [["statement.line1", "Baris 1"], ["statement.line2", "Baris 2 (merah)"]]],
  ["About", [["about.title", "Judul"], ["about.p1", "Paragraf 1", "area"], ["about.p2", "Paragraf 2", "area"]]],
  ["Our Team", [["team.title", "Judul"]]],
  ["Clients", [["clients.title", "Judul"], ["clients.sub", "Teks pengantar"]]],
  ["Contact", [["contact.title", "Judul"], ["contact.lead", "Teks bawah judul"], ["contact.ctaPrimary", "Tombol 1"], ["contact.ctaSecondary", "Tombol 2"]]],
  ["Footer", [["brand", "Nama brand"], ["footer.place", "Lokasi"], ["footer.tag", "Tagline"], ["footer.copyright", "Copyright"]]],
  ["Form “Start a project”", [["order.title", "Judul"], ["order.sub", "Teks pengantar", "area"], ["order.note", "Catatan bawah", "area"]]],
  ["Logo & gambar", [["images.logo", "Logo header (PNG transparan)", "image"], ["images.heroLogo", "Logo hero (min. 1600 px lebar)", "image"], ["images.aboutLogo", "Logo di About", "image"]]],
];
function pageTexts() {
  const draft = structuredClone(C.site);
  return h("div", {}, head("Teks & Logo", "Semua tulisan di halaman. Kosongkan logo untuk memakai file bawaan."),
    TEXTS.map(([t, fs]) => h("div", { class: "card" }, h("h3", {}, t), h("div", { class: "grid" }, fs.map(([p, l, ty]) => field({ label: l, type: ty || "text", full: ty === "area" }, () => getp(draft, p), (v) => setp(draft, p, v)))))),
    saveBar(async () => { await api("PUT", "/api/admin/content/site", { value: draft }); C.site = draft; toast("Tersimpan ✓"); }));
}
function pageObject(key, title, sub, fields) {
  const draft = structuredClone(C[key]);
  return h("div", {}, head(title, sub), h("div", { class: "card" }, h("div", { class: "grid" }, fields.map(([p, l]) => field({ label: l }, () => draft[p], (v) => (draft[p] = v))))),
    saveBar(async () => { await api("PUT", "/api/admin/content/" + key, { value: draft }); C[key] = draft; toast("Tersimpan ✓"); }));
}

// ---------- koleksi (daftar yang bisa tambah / hapus / urut) ----------
function collection({ key, title, sub, fields, blank, label, small, thumb, after }) {
  let items = structuredClone(C[key]), open = null;
  const box = h("div");
  const render = () => {
    box.textContent = "";
    items.forEach((it, i) => {
      const t = thumb?.(it);
      box.append(h("div", { class: "row" }, t ? (t.endsWith(".mp4") || t.endsWith(".webm") ? h("video", { src: t, muted: true }) : h("img", { src: t, alt: "" })) : null,
        h("div", { class: "t" }, h("b", {}, label(it) || "(tanpa judul)"), small && h("small", {}, small(it))), it.hidden && h("span", { class: "tag off" }, "disembunyikan"),
        h("button", { class: "btn sm", disabled: i === 0, onclick: () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; render(); } }, "↑"),
        h("button", { class: "btn sm", disabled: i === items.length - 1, onclick: () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; render(); } }, "↓"),
        h("button", { class: "btn sm", onclick: () => { open = open === it.id ? null : it.id; render(); } }, open === it.id ? "Tutup" : "Edit"),
        h("button", { class: "btn sm del", onclick: () => { if (confirm("Hapus “" + (label(it) || "item") + "”?")) { items.splice(i, 1); render(); } } }, "Hapus")));
      if (open === it.id) box.append(h("div", { class: "card" }, h("div", { class: "grid" }, fields.map((f) => field(f, () => it[f.name], (v) => (it[f.name] = v))))));
    });
    if (!items.length) box.append(h("p", { class: "sub" }, "Belum ada data."));
  };
  render();
  return h("div", {}, head(title, sub),
    h("div", { style: "margin-bottom:10px" }, h("button", { class: "btn pri", onclick: () => { const n = { id: uid(), ...blank() }; items.unshift(n); open = n.id; render(); } }, "+ Tambah")), box,
    saveBar(async () => {
      items.forEach((x, i) => (x.order = i + 1));
      if (after) await after(items);
      await api("PUT", key === "ratecard" ? "/api/admin/ratecard" : "/api/admin/content/" + key, { value: items }); C[key] = items; toast("Tersimpan ✓");
    }, "Perubahan baru tampil di website setelah disimpan."));
}
const cats = () => C.workCategories.map((c) => c.title);
const pages = {
  texts: pageTexts,
  nav: () => collection({ key: "nav", title: "Menu Navigasi", sub: "Menu di header. “ID section” = work, services, process, about, team, clients, contact.", label: (x) => x.label, small: (x) => "#" + x.id, blank: () => ({ label: "", id: "" }), fields: [{ name: "label", label: "Nama menu" }, { name: "id", label: "ID section" }] }),
  projects: () => collection({ key: "projects", title: "Portfolio / Selected Work", sub: "Project terbaru taruh di paling atas (pakai tombol ↑). Kategori harus sudah dibuat di menu Kategori.", label: (x) => x.title, small: (x) => [x.service, x.year].filter(Boolean).join(" · "), thumb: (x) => x.image || x.video,
    blank: () => ({ title: "", service: cats()[0] || "", year: String(new Date().getFullYear()), description: "", image: "", video: "", link: "", hidden: false }),
    fields: [{ name: "title", label: "Judul" }, { name: "service", label: "Kategori", type: "select", options: cats }, { name: "year", label: "Tahun" }, { name: "link", label: "Link video penuh (YouTube/IG, opsional)" },
      { name: "image", label: "Thumbnail", type: "image" }, { name: "video", label: "Preview klip (mp4/webm 5–10 dtk, ≤4 MB; kosongkan untuk logo)", type: "video" }, { name: "description", label: "Deskripsi singkat", type: "area", full: true }, { name: "hidden", label: "Sembunyikan dari website", type: "check" }] }),
  cats: () => collection({ key: "workCategories", title: "Kategori Portfolio", sub: "Tombol filter di Selected Work. Mengganti nama otomatis ikut mengubah project di kategori itu.", label: (x) => x.title, blank: () => ({ title: "" }), fields: [{ name: "title", label: "Nama kategori" }],
    after: async (items) => { const old = Object.fromEntries(C.workCategories.map((c) => [c.id, c.title])); const ren = Object.fromEntries(items.filter((c) => old[c.id] && old[c.id] !== c.title).map((c) => [old[c.id], c.title]));
      if (Object.keys(ren).length) { const ps = C.projects.map((p) => ({ ...p, service: ren[p.service] ?? p.service })); await api("PUT", "/api/admin/content/projects", { value: ps }); C.projects = ps; } } }),
  services: () => collection({ key: "services", title: "Services (What We Do)", sub: "Samakan nama layanan dengan nama kategori portfolio supaya tombol “View work” muncul.", label: (x) => x.title, small: (x) => x.desc, blank: () => ({ title: "", desc: "", items: [], isNew: false }),
    fields: [{ name: "title", label: "Nama layanan" }, { name: "isNew", label: "Tampilkan badge NEW", type: "check" }, { name: "desc", label: "Deskripsi", type: "area", full: true }, { name: "items", label: "Poin detail", type: "lines", full: true }] }),
  steps: () => collection({ key: "steps", title: "The Process", sub: "Langkah-langkah kerja (nomor otomatis mengikuti urutan).", label: (x) => x.title, small: (x) => x.desc, blank: () => ({ title: "", desc: "", more: "" }),
    fields: [{ name: "title", label: "Judul langkah" }, { name: "desc", label: "Deskripsi", type: "area", full: true }, { name: "more", label: "Teks tambahan (muncul saat hover)", type: "area", full: true }] }),
  team: () => collection({ key: "team", title: "Our Team", sub: "", label: (x) => x.name, small: (x) => x.role, thumb: (x) => x.photo, blank: () => ({ name: "", role: "", photo: "", fit: "auto" }),
    fields: [{ name: "name", label: "Nama" }, { name: "role", label: "Peran" }, { name: "photo", label: "Foto", type: "image", full: true },
      { name: "fit", label: "Tampilan foto", type: "select", noEmpty: true, full: true, options: () => [{ v: "auto", l: "Otomatis (utuh; isi penuh bila rasio mirip 4:5)" }, { v: "contain", l: "Tampil utuh (seluruh foto terlihat)" }, { v: "cover", l: "Isi penuh (tepi foto terpotong, fokus ke atas)" }] }] }),
  logos: () => collection({ key: "clientLogos", title: "Clients — logo", sub: "Logo PNG transparan, warna terang. Tanpa logo = tampil sebagai teks.", label: (x) => x.name, thumb: (x) => x.logo, blank: () => ({ name: "", logo: "" }), fields: [{ name: "name", label: "Nama client" }, { name: "logo", label: "Logo", type: "image" }] }),
  groups: () => collection({ key: "clients", title: "Collaborations (nama saja)", sub: "Dikelompokkan, tampil sebagai teks di bagian Clients.", label: (x) => x.group, small: (x) => (x.names || []).join(", "), blank: () => ({ group: "", names: [] }), fields: [{ name: "group", label: "Nama grup" }, { name: "names", label: "Nama band / brand", type: "lines", full: true }] }),
  links: () => pageObject("links", "Link & Kontak", "Dipakai di Contact, Footer, dan form pesanan.", [["whatsapp", "WhatsApp URL (https://wa.me/628…)"], ["instagram", "Instagram URL"], ["fiverr", "Fiverr URL"], ["lynk", "Lynk URL"], ["email", "Email"]]),
  budgets: () => { const d = [...C.budgets]; return h("div", {}, head("Pilihan Budget", "Opsi di form “Start a project”."), h("div", { class: "card" }, field({ label: "Satu baris = satu pilihan", type: "lines", full: true }, () => d, (v) => d.splice(0, d.length, ...v))), saveBar(async () => { await api("PUT", "/api/admin/content/budgets", { value: d }); C.budgets = d; toast("Tersimpan ✓"); })); },
  finance: pageFinance,
};
const MENU = [["texts", "Teks & Logo"], ["nav", "Menu Navigasi"], ["|"], ["projects", "Portfolio"], ["cats", "Kategori Portfolio"], ["services", "Services"], ["steps", "Process"], ["team", "Team"], ["logos", "Clients (logo)"], ["groups", "Collaborations"], ["|"], ["links", "Link & Kontak"], ["budgets", "Pilihan Budget"], ["|"], ["finance", "💰 Keuangan"]];

// ---------- keuangan ----------
async function pageFinance() {
  const box = h("div");
  const st = { from: "", to: "", edit: null };
  const load = guard(async () => {
    const d = await api("GET", `/api/admin/finance?from=${st.from}&to=${st.to}`), s = d.summary, P = s.pots;
    const pot = (k, name, cls) => h("div", { class: "stat " + cls }, h("small", {}, `${name} (${k === "operational" ? d.opPct : 100 - d.opPct}%)`), h("b", {}, rp(P[k].balance)), h("small", {}, `Masuk ${rp(P[k].in)} · Keluar ${rp(P[k].out)}`));
    const f = st.edit || { date: today(), type: "income", amount: "", category: "", pot: "operational", note: "" }, fd = { ...f };
    const potSel = h("div", { class: "full" }), drawPot = () => { potSel.textContent = ""; if (fd.type === "expense") potSel.append(field({ label: "Dibayar dari kantong", type: "select", options: () => ["operational", "maintenance"] }, () => fd.pot, (v) => (fd.pot = v))); };
    drawPot();
    const typeSel = h("label", { class: "f" }, h("span", {}, "Jenis"), h("select", { onchange: (e) => { fd.type = e.target.value; drawPot(); } }, h("option", { value: "income", selected: fd.type === "income" }, "Pemasukan (dibagi otomatis)"), h("option", { value: "expense", selected: fd.type === "expense" }, "Pengeluaran")));
    box.textContent = "";
    box.append(head("Keuangan Studio", `Setiap pemasukan otomatis dibagi ${d.opPct}% Operasional dan ${100 - d.opPct}% Maintenance Studio. Pengeluaran dicatat ke salah satu kantong.`),
      h("div", { class: "card" }, h("h3", {}, "Periode"), h("div", { class: "grid" }, field({ label: "Dari" }, () => st.from, (v) => (st.from = v)), field({ label: "Sampai" }, () => st.to, (v) => (st.to = v))),
        h("div", { style: "margin-top:10px;display:flex;gap:8px;flex-wrap:wrap" }, h("button", { class: "btn", onclick: load }, "Terapkan"), h("button", { class: "btn", onclick: () => { st.from = st.to = ""; load(); } }, "Semua waktu"), h("a", { class: "btn", href: "/api/admin/finance/export.csv" }, "Unduh CSV"))),
      h("div", { class: "pots" }, h("div", { class: "stat" }, h("small", {}, "Pemasukan"), h("b", { class: "pos" }, rp(s.income))), h("div", { class: "stat" }, h("small", {}, "Pengeluaran"), h("b", { class: "neg" }, rp(s.expense))), h("div", { class: "stat" }, h("small", {}, "Bersih"), h("b", {}, rp(s.net)))),
      h("div", { class: "pots" }, pot("operational", "Operasional", "op"), pot("maintenance", "Maintenance Studio", "mt")),
      h("div", { class: "card" }, h("h3", {}, st.edit ? "Edit transaksi" : "Catat transaksi"), h("div", { class: "grid" },
        field({ label: "Tanggal" , type: "text" }, () => fd.date, (v) => (fd.date = v)), typeSel, field({ label: "Nominal (Rp)", type: "num" }, () => fd.amount, (v) => (fd.amount = v)), field({ label: "Kategori (mis. Project, Listrik, Alat)" }, () => fd.category, (v) => (fd.category = v)), potSel, field({ label: "Catatan", full: true }, () => fd.note, (v) => (fd.note = v))),
        h("div", { style: "margin-top:10px;display:flex;gap:8px" }, h("button", { class: "btn pri", onclick: guard(async () => { st.edit ? await api("PUT", "/api/admin/finance/tx/" + st.edit.id, fd) : await api("POST", "/api/admin/finance/tx", fd); st.edit = null; toast("Tersimpan ✓"); load(); }) }, "Simpan"), st.edit && h("button", { class: "btn", onclick: () => { st.edit = null; load(); } }, "Batal"))),
      h("div", { class: "card" }, h("h3", {}, "Rasio pembagian pemasukan baru"), h("div", { class: "grid" }, field({ label: "% ke Operasional (sisanya ke Maintenance Studio)", type: "num" }, () => d.opPct, (v) => (d.opPct = v))),
        h("p", { class: "sub", style: "margin:8px 0" }, "Hanya berlaku untuk pemasukan yang dicatat setelah ini; catatan lama tetap memakai rasio saat dicatat."), h("button", { class: "btn", onclick: guard(async () => { await api("PUT", "/api/admin/finance/settings", { opPct: d.opPct }); toast("Rasio disimpan ✓"); load(); }) }, "Simpan rasio")),
      h("div", { class: "card" }, h("h3", {}, "Rekap per bulan"), h("table", {}, h("thead", {}, h("tr", {}, ["Bulan", "Pemasukan", "Pengeluaran", "Saldo Operasional", "Saldo Maintenance"].map((x, i) => h("th", { class: i ? "n" : "" }, x)))),
        h("tbody", {}, d.monthly.map((m) => h("tr", {}, h("td", {}, m.month), h("td", { class: "n" }, rp(m.income)), h("td", { class: "n" }, rp(m.expense)), h("td", { class: "n" }, rp(m.pots.operational.balance)), h("td", { class: "n" }, rp(m.pots.maintenance.balance))))))),
      h("div", { class: "card" }, h("h3", {}, "Transaksi (" + d.transactions.length + ")"), h("div", { style: "overflow:auto" }, h("table", {}, h("thead", {}, h("tr", {}, ["Tanggal", "Jenis", "Kategori", "Kantong", "Nominal", ""].map((x, i) => h("th", { class: i === 4 ? "n" : "" }, x)))),
        h("tbody", {}, d.transactions.map((t) => h("tr", {}, h("td", {}, t.date), h("td", {}, t.type === "income" ? "Masuk" : "Keluar"), h("td", {}, t.category, t.note && h("small", { style: "color:var(--d)" }, " — " + t.note)), h("td", {}, t.type === "income" ? `${t.opPct}/${100 - t.opPct}` : t.pot === "operational" ? "Operasional" : "Maintenance"),
          h("td", { class: "n " + (t.type === "income" ? "pos" : "neg") }, (t.type === "income" ? "+" : "−") + rp(t.amount)), h("td", { class: "n" }, h("button", { class: "btn sm", onclick: () => { st.edit = t; load(); scrollTo(0, 0); } }, "Edit"), " ", h("button", { class: "btn sm del", onclick: guard(async () => { if (confirm("Hapus transaksi ini?")) { await api("DELETE", "/api/admin/finance/tx/" + t.id); load(); } }) }, "Hapus"))))))))); 
  });
  await load();
  return box;
}

// ---------- order, invoice, ratecard ----------
const ST = { new: "Baru", discussing: "Negosiasi", confirmed: "Dikonfirmasi", in_progress: "Dikerjakan", done: "Selesai", cancelled: "Dibatalkan" };
const stOpts = () => Object.entries(ST).map(([v, l]) => ({ v, l }));
const LANGS = () => [{ v: "id", l: "Indonesia" }, { v: "en", l: "English" }], CURS = () => [{ v: "IDR", l: "Rupiah (IDR)" }, { v: "USD", l: "US Dollar (USD)" }];
const mny = (n, cur) => cur === "USD" ? "$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) : rp(n);
const tot = (inv) => { const cur = inv.currency === "USD" ? "USD" : "IDR", r = (x) => cur === "USD" ? Math.round(x * 100) / 100 : Math.round(x);
  const sub = r((inv.items || []).reduce((s, i) => { const t = r((+i.price || 0) * (+i.qty || 0)); return s + (i.type === "discount" ? -t : t); }, 0)); const tax = r(sub * (+inv.taxPct || 0) / 100), dp = +inv.dp || 0;
  return { cur, sub, tax, dp, grand: r(sub + tax), total: r(sub + tax - dp) }; };
const dl = (d) => { const [y, m, x] = (d || "").split("-"); return x ? `${x}/${m}/${y}` : ""; };
const badge = (t, cls) => h("span", { class: "tag " + (cls || "") }, t);
let RC = [];
const loadRC = async () => { RC = await api("GET", "/api/admin/ratecard"); };

function itemsEditor(obj, key, getCur) {
  const box = h("div"), items = obj[key];
  const draw = () => {
    box.textContent = "";
    items.forEach((it, i) => box.append(h("div", { class: "row", style: "flex-wrap:wrap" },
      h("div", { style: "flex:3;min-width:160px" }, field({ label: i ? "" : "Deskripsi" }, () => it.desc, (v) => (it.desc = v))),
      h("div", { style: "flex:1.2;min-width:100px" }, field({ label: i ? "" : "Harga", type: "num" }, () => it.price, (v) => { it.price = v; sum(); })),
      h("div", { style: "width:70px" }, field({ label: i ? "" : "Qty", type: "num" }, () => it.qty, (v) => { it.qty = v; sum(); })),
      h("div", { style: "width:120px" }, field({ label: i ? "" : "Jenis", type: "select", noEmpty: true, options: () => [{ v: "item", l: "Item" }, { v: "discount", l: "Diskon" }] }, () => it.type || "item", (v) => { it.type = v; sum(); })),
      h("button", { class: "btn sm del", onclick: () => { items.splice(i, 1); draw(); sum(); } }, "✕"))));
    const pick = h("select", { onchange: () => { const r = RC.find((x) => x.id === pick.value); if (r) { const c = getCur(); items.push({ desc: r.name, price: c === "USD" ? r.priceUsd : r.priceIdr, qty: 1, type: r.type }); draw(); sum(); } } },
      h("option", { value: "" }, "+ Tambah dari Ratecard…"), RC.filter((r) => r.active !== false).map((r) => h("option", { value: r.id }, `${r.name} — ${r.priceIdr ? rp(r.priceIdr) : ""}${r.priceUsd ? " / $" + r.priceUsd : ""}`)));
    box.append(h("div", { style: "display:flex;gap:8px;margin-top:6px;flex-wrap:wrap" }, h("button", { class: "btn sm", onclick: () => { items.push({ desc: "", price: 0, qty: 1, type: "item" }); draw(); } }, "+ Baris kosong"), h("div", { style: "min-width:240px" }, pick)));
  };
  const sum = () => obj.__sum && obj.__sum(); draw(); return box;
}

// ----- order -----
async function pageOrders() {
  await loadRC(); const svc = (C.services || []).map((s) => s.title);
  const box = h("div"); let flt = "all", q = "", edit = null;
  const render = async () => {
    const list = await api("GET", "/api/admin/orders"), cnt = (s) => list.filter((o) => s === "all" || o.status === s).length;
    const shown = list.filter((o) => (flt === "all" || o.status === flt) && (!q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase())));
    box.textContent = "";
    box.append(head("Manajemen Order", "Pesanan dari form “Start a project” di website masuk otomatis ke sini. Dari order, invoice bisa dibuat sekali klik."),
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px" }, h("button", { class: "btn pri", onclick: () => { edit = { _new: true, name: "", contact: "", phone: "", email: "", service: "", duration: "", releaseDate: "", budget: "", link: "", brief: "", notes: "", status: "new", lang: "id", currency: "IDR", quoteItems: [] }; render(); } }, "+ Order manual"),
        h("input", { placeholder: "Cari nama / layanan / catatan…", style: "max-width:280px", value: q, oninput: (e) => { q = e.target.value; clearTimeout(render.t); render.t = setTimeout(render, 250); } })),
      h("div", { class: "chips", style: "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" }, [["all", "Semua"], ...Object.entries(ST)].map(([k, l]) => h("button", { class: "btn sm" + (flt === k ? " pri" : ""), onclick: () => { flt = k; render(); } }, `${l} (${cnt(k)})`))));
    if (edit) box.append(orderForm());
    shown.forEach((o) => box.append(h("div", { class: "row" }, h("div", { class: "t" }, h("b", {}, `${o.code} · ${o.name}${o.contact ? " (" + o.contact + ")" : ""}`), h("small", {}, [o.service, o.budget, o.phone || o.email, dl((o.createdAt || "").slice(0, 10))].filter(Boolean).join(" · "))),
      o.source === "web" && badge("web"), badge(ST[o.status] || o.status, o.status === "new" ? "off" : ""), (o.invoiceIds || []).length ? badge(`${o.invoiceIds.length} invoice`) : null,
      h("button", { class: "btn sm", onclick: () => { edit = structuredClone(o); render(); scrollTo(0, 0); } }, "Edit"),
      h("button", { class: "btn sm pri", onclick: guard(async () => { const inv = await api("POST", "/api/admin/invoices/from-order", { orderId: o.id }); toast("Invoice " + inv.no + " dibuat ✓"); invState.open = inv.id; show("invoices"); }) }, "Buat Invoice"),
      h("button", { class: "btn sm del", onclick: guard(async () => { if (confirm("Hapus order ini?")) { await api("DELETE", "/api/admin/orders/" + o.id); render(); } }) }, "Hapus"))));
    if (!shown.length) box.append(h("p", { class: "sub" }, "Belum ada order."));
  };
  const orderForm = () => {
    const o = edit; o.__sum = () => {};
    return h("div", { class: "card" }, h("h3", {}, o._new ? "Order manual" : "Edit " + o.code),
      h("div", { class: "grid" }, [["name", "Nama / band / label *"], ["contact", "Nama kontak (tampil di “Kepada”)"], ["phone", "WhatsApp / telepon"], ["email", "Email"]].map(([k, l]) => field({ label: l }, () => o[k], (v) => (o[k] = v))),
        field({ label: "Layanan", type: "select", options: () => [...new Set([...svc, o.service].filter(Boolean))] }, () => o.service, (v) => (o.service = v)),
        field({ label: "Status", type: "select", noEmpty: true, options: stOpts }, () => o.status, (v) => (o.status = v)),
        [["duration", "Durasi lagu"], ["releaseDate", "Tanggal rilis"], ["budget", "Budget"], ["link", "Link referensi"]].map(([k, l]) => field({ label: l }, () => o[k], (v) => (o[k] = v))),
        field({ label: "Bahasa invoice", type: "select", noEmpty: true, options: LANGS }, () => o.lang || "id", (v) => (o.lang = v)),
        field({ label: "Mata uang", type: "select", noEmpty: true, options: CURS }, () => o.currency || "IDR", (v) => (o.currency = v)),
        field({ label: "Detail dari klien", type: "area", full: true }, () => o.brief, (v) => (o.brief = v)),
        field({ label: "Catatan internal", type: "area", full: true }, () => o.notes, (v) => (o.notes = v))),
      h("h3", { style: "margin-top:14px" }, "Penawaran / item harga (jadi isi invoice)"), itemsEditor(o, "quoteItems", () => o.currency || "IDR"),
      h("p", { class: "sub", style: "margin:6px 0" }, "Kosongkan jika ingin harga diambil otomatis dari Ratecard sesuai layanan."),
      h("div", { style: "display:flex;gap:8px;margin-top:10px" }, h("button", { class: "btn pri", onclick: guard(async () => { const { _new, __sum, ...b } = o; _new ? await api("POST", "/api/admin/orders", b) : await api("PUT", "/api/admin/orders/" + o.id, b); edit = null; toast("Tersimpan ✓"); render(); }) }, "Simpan order"), h("button", { class: "btn", onclick: () => { edit = null; render(); } }, "Batal")));
  };
  await render(); return box;
}

// ----- invoice -----
const invState = { open: null };
const printView = (id) => (window.__demoPrint ? window.__demoPrint(id) : window.open("/api/admin/invoices/" + id + "/html?print=1", "_blank"));
async function downloadPdf(id, no) {
  if (window.__demoPrint) return window.__demoPrint(id);
  toast("Membuat PDF…");
  const r = await fetch("/api/admin/invoices/" + id + "/pdf", { credentials: "same-origin" });
  if (r.status === 501) { toast("Chrome tidak ditemukan di server → memakai Cetak / Simpan sebagai PDF", true); return printView(id); }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Gagal membuat PDF");
  const cd = r.headers.get("Content-Disposition") || "", nm = (/filename="([^"]+)"/.exec(cd) || [])[1] || `Invoice-${no}.pdf`;
  const a = h("a", { href: URL.createObjectURL(await r.blob()), download: nm }); document.body.append(a); a.click(); a.remove(); toast("PDF diunduh ✓");
}
async function previewInvoice(inv) {
  const { html } = await api("POST", "/api/admin/invoice-preview", { invoice: inv });
  const ov = h("div", { style: "position:fixed;inset:0;background:#000c;z-index:99;display:flex;flex-direction:column;align-items:center;padding:12px" },
    h("div", { style: "margin-bottom:8px" }, h("button", { class: "btn", onclick: () => ov.remove() }, "Tutup pratinjau")),
    h("iframe", { style: "flex:1;width:min(100%,820px);border:0;background:#e9e9e9;border-radius:6px", srcdoc: html }));
  document.body.append(ov);
}
async function pageInvoices() {
  await loadRC(); const S = await api("GET", "/api/admin/settings");
  const box = h("div");
  const list = async () => {
    const invs = await api("GET", "/api/admin/invoices"); box.textContent = "";
    box.append(head("Invoice", "Desain invoice mengikuti PDF Blood Motion (Indonesia & English). Hanya isinya yang berubah."),
      h("div", { style: "margin-bottom:12px;display:flex;gap:8px" }, h("button", { class: "btn pri", onclick: guard(async () => editor(await api("GET", "/api/admin/invoices/new-draft"))) }, "+ Invoice baru")));
    invs.forEach((v) => box.append(h("div", { class: "row" }, h("div", { class: "t" }, h("b", {}, `#${v.no} · ${v.client.name || v.client.org}`), h("small", {}, `${dl(v.date)} · jatuh tempo ${dl(v.dueDate)} · ${v.lang === "en" ? "English" : "Indonesia"}`)),
      h("b", {}, mny(v.calc.grand, v.calc.cur)),
      v.status === "cancelled" ? badge("Dibatalkan", "off") : badge(v.payState === "paid" ? "Lunas" : v.payState === "partial" ? "Dibayar sebagian" : "Belum dibayar", v.payState === "paid" ? "" : "off"),
      h("button", { class: "btn sm", onclick: () => editor(v) }, "Edit"), h("button", { class: "btn sm pri", onclick: guard(() => downloadPdf(v.id, v.no)) }, "PDF"),
      h("button", { class: "btn sm", onclick: () => printView(v.id) }, "Cetak"),
      h("button", { class: "btn sm del", onclick: guard(async () => { if (confirm("Hapus invoice #" + v.no + "?")) { await api("DELETE", "/api/admin/invoices/" + v.id); list(); } }) }, "Hapus"))));
    if (!invs.length) box.append(h("p", { class: "sub" }, "Belum ada invoice."));
    if (invState.open) { const v = invs.find((x) => x.id === invState.open); invState.open = null; v && editor(v); }
  };
  const editor = (v0) => {
    const inv = JSON.parse(JSON.stringify(v0)), isNew = !v0.id; inv.client ||= {}; inv.party2 ||= { line1: "", line2: "" }; inv.items ||= [];
    const sumEl = h("div", { class: "box" }); inv.__sum = () => { const t = tot(inv); sumEl.textContent = ""; sumEl.append(h("div", { class: "g2" }, [["Sub-total", t.sub], ...(inv.taxPct > 0 ? [[`Pajak ${inv.taxPct}%`, t.tax]] : []), ...(t.dp > 0 ? [["Down payment", t.dp]] : []), ["TOTAL tertera di invoice", t.total]].map(([l, x]) => h("div", { class: "st" }, h("small", {}, l), h("b", {}, mny(x, t.cur)))))); };
    const save = async () => { const { __sum, calc, paid, payState, remaining, ...b } = inv; Object.assign(inv, inv.id ? await api("PUT", "/api/admin/invoices/" + inv.id, b) : await api("POST", "/api/admin/invoices", b)); return inv; };
    const payBox = h("div"); const drawPay = () => { payBox.textContent = ""; if (!inv.id) return payBox.append(h("p", { class: "sub" }, "Simpan invoice dulu untuk mencatat pembayaran."));
      const pf = { date: new Date().toISOString().slice(0, 10), amount: "", note: "", amountIdr: "", toFinance: true }, t = tot(inv), left = Math.max(0, t.grand - (inv.payments || []).reduce((s, p) => s + p.amount, 0));
      payBox.append(h("p", { class: "sub", style: "margin:0 0 8px" }, `Sisa tagihan: ${mny(left, t.cur)}`), ...(inv.payments || []).map((p) => h("div", { class: "row" }, h("b", {}, `${dl(p.date)} · ${mny(p.amount, t.cur)}`), h("small", {}, p.note || ""), badge(p.txId ? "masuk Keuangan" : "tidak dicatat"), h("button", { class: "btn sm del", onclick: guard(async () => { Object.assign(inv, await api("DELETE", `/api/admin/invoices/${inv.id}/payments/${p.id}`)); drawPay(); }) }, "Hapus"))),
        h("div", { class: "g2" }, field({ label: "Tanggal bayar", type: "date" }, () => pf.date, (x) => (pf.date = x)), field({ label: "Nominal (" + t.cur + ")", type: "num" }, () => pf.amount, (x) => (pf.amount = x)), t.cur === "USD" ? field({ label: "Setara Rupiah (untuk Keuangan)", type: "num" }, () => pf.amountIdr, (x) => (pf.amountIdr = x)) : null, field({ label: "Catatan (mis. DP / pelunasan)" }, () => pf.note, (x) => (pf.note = x)), field({ label: "Catat ke Keuangan (dibagi otomatis)", type: "check" }, () => pf.toFinance, (x) => (pf.toFinance = x))),
        h("p", {}, h("button", { class: "btn pri", onclick: guard(async () => { Object.assign(inv, await api("POST", `/api/admin/invoices/${inv.id}/payments`, pf)); toast("Pembayaran dicatat ✓"); drawPay(); }) }, "+ Catat pembayaran"))); };
    box.textContent = "";
    box.append(head(isNew ? "Invoice baru" : "Invoice #" + inv.no, ""),
      h("div", { class: "card" }, h("h3", {}, "Data invoice"), h("div", { class: "grid" }, field({ label: "No. invoice" }, () => inv.no, (x) => (inv.no = x)), field({ label: "Bahasa desain", type: "select", noEmpty: true, options: LANGS }, () => inv.lang, (x) => { inv.lang = x; }), field({ label: "Mata uang", type: "select", noEmpty: true, options: CURS }, () => inv.currency, (x) => { inv.currency = x; inv.__sum(); }),
        field({ label: "Tanggal", type: "date" }, () => inv.date, (x) => (inv.date = x)), field({ label: "Jatuh tempo", type: "date" }, () => inv.dueDate, (x) => (inv.dueDate = x)), field({ label: "Status", type: "select", noEmpty: true, options: () => [{ v: "draft", l: "Draft" }, { v: "sent", l: "Terkirim" }, { v: "cancelled", l: "Dibatalkan" }] }, () => inv.status || "draft", (x) => (inv.status = x)))),
      h("div", { class: "card" }, h("h3", {}, "Kepada (Bill to)"), h("div", { class: "grid" }, field({ label: "Nama (baris 1, mis. MR TEDDY KOES)" }, () => inv.client.name, (x) => (inv.client.name = x)), field({ label: "Band / label / channel (baris 2-3)" }, () => inv.client.org, (x) => (inv.client.org = x)), field({ label: "Telepon" }, () => inv.client.phone, (x) => (inv.client.phone = x)), field({ label: "Email (tidak dicetak)" }, () => inv.client.email, (x) => (inv.client.email = x)))),
      h("div", { class: "card" }, h("h3", {}, "Item"), itemsEditor(inv, "items", () => inv.currency), h("div", { class: "grid", style: "margin-top:10px" }, field({ label: "Pajak (%) — kosongkan/0 bila tidak ada", type: "num" }, () => inv.taxPct, (x) => { inv.taxPct = x; inv.__sum(); }), field({ label: "Down payment (sudah dibayar)", type: "num" }, () => inv.dp, (x) => { inv.dp = x; inv.__sum(); }))), sumEl,
      h("div", { class: "card" }, h("h3", {}, "Pembayaran & syarat"), h("div", { class: "grid" }, field({ label: "Metode pembayaran", type: "select", noEmpty: true, options: () => S.paymentMethods.map((p) => ({ v: p.id, l: p.label || p.bank })) }, () => inv.paymentMethodId, (x) => (inv.paymentMethodId = x)),
        field({ label: "Pihak Kedua — baris 1 (nama band/klien)" }, () => inv.party2.line1, (x) => (inv.party2.line1 = x)), field({ label: "Pihak Kedua — baris 2 (peran)" }, () => inv.party2.line2, (x) => (inv.party2.line2 = x)),
        field({ label: "Syarat & ketentuan (kosong = teks bawaan di Pengaturan)", type: "area", full: true }, () => inv.terms, (x) => (inv.terms = x)), field({ label: "Catatan internal (tidak dicetak)", type: "area", full: true }, () => inv.notes, (x) => (inv.notes = x)))),
      h("div", { class: "bar" }, h("button", { class: "btn pri", onclick: guard(async () => { await save(); toast("Tersimpan ✓"); editor(inv); }) }, "Simpan"), h("button", { class: "btn", onclick: guard(async () => { await previewInvoice(inv); }) }, "Pratinjau"),
        h("button", { class: "btn", onclick: guard(async () => { await save(); await downloadPdf(inv.id, inv.no); }) }, "Simpan & Unduh PDF"), h("button", { class: "btn", onclick: () => list() }, "← Daftar")),
      h("div", { class: "card" }, h("h3", {}, "Pembayaran"), payBox));
    inv.__sum(); drawPay();
  };
  await list(); return box;
}

// ----- pengaturan invoice -----
async function pageInvSettings() {
  const S = await api("GET", "/api/admin/settings"), d = structuredClone(S), box = h("div");
  const pm = h("div"), drawPm = () => { pm.textContent = ""; d.paymentMethods.forEach((p, i) => pm.append(h("div", { class: "card" }, h("div", { class: "grid" }, field({ label: "Nama metode (untuk dipilih)" }, () => p.label, (x) => (p.label = x)), field({ label: "Baris 1: Nama bank / PayPal" }, () => p.bank, (x) => (p.bank = x)), field({ label: "Baris 2: Nama rekening" }, () => p.name, (x) => (p.name = x)), field({ label: "Baris 3: No. rekening / email (email tampil merah sesuai desain)" }, () => p.no, (x) => (p.no = x))), h("p", {}, h("button", { class: "btn sm del", onclick: () => { d.paymentMethods.splice(i, 1); drawPm(); } }, "Hapus")))));
    pm.append(h("button", { class: "btn sm", onclick: () => { d.paymentMethods.push({ id: uid(), label: "", bank: "", name: "", no: "" }); drawPm(); } }, "+ Metode pembayaran")); };
  drawPm();
  box.append(head("Pengaturan Invoice", "Penomoran, jatuh tempo, syarat, dan rekening yang tampil di invoice."),
    h("div", { class: "card" }, h("h3", {}, "Umum"), h("div", { class: "grid" }, field({ label: "Nomor invoice berikutnya", type: "num" }, () => d.nextNo, (x) => (d.nextNo = x)), field({ label: "Jumlah digit (0455 = 4)", type: "num" }, () => d.padNo, (x) => (d.padNo = x)), field({ label: "Jatuh tempo (hari setelah tanggal invoice)", type: "num" }, () => d.dueDays, (x) => (d.dueDays = x)),
      field({ label: "Bahasa bawaan", type: "select", noEmpty: true, options: LANGS }, () => d.defaultLang, (x) => (d.defaultLang = x)), field({ label: "Mata uang bawaan", type: "select", noEmpty: true, options: CURS }, () => d.defaultCurrency, (x) => (d.defaultCurrency = x)), field({ label: "Pajak bawaan (%)", type: "num" }, () => d.defaultTaxPct, (x) => (d.defaultTaxPct = x)),
      field({ label: "Pihak Kedua baris 2 — Indonesia" }, () => d.party2Id, (x) => (d.party2Id = x)), field({ label: "Pihak Kedua baris 2 — English" }, () => d.party2En, (x) => (d.party2En = x)))),
    h("div", { class: "card" }, h("h3", {}, "Syarat & ketentuan bawaan"), h("div", { class: "grid" }, field({ label: "Indonesia", type: "area", full: true }, () => d.termsId, (x) => (d.termsId = x)), field({ label: "English", type: "area", full: true }, () => d.termsEn, (x) => (d.termsEn = x)))),
    h("div", { class: "card" }, h("h3", {}, "Desain Indonesia"), field({ label: "Tampilkan tanda tangan contoh (“Signature”) di kolom Pihak Kedua", type: "check" }, () => d.showSampleSignature, (x) => (d.showSampleSignature = x))),
    h("h3", { style: "color:var(--d);font-size:13px;letter-spacing:.08em;text-transform:uppercase" }, "Metode pembayaran"), pm,
    saveBar(async () => { await api("PUT", "/api/admin/settings", { value: d }); toast("Tersimpan ✓"); }));
  return box;
}

pages.orders = pageOrders; pages.invoices = pageInvoices; pages.invsettings = pageInvSettings;
pages.ratecard = async () => { C.ratecard = await api("GET", "/api/admin/ratecard"); return collection({ key: "ratecard", title: "Ratecard", sub: "Daftar harga layananmu. Dipakai untuk mengisi harga otomatis di order & invoice. Jenis “Diskon” akan mengurangi sub-total.", label: (x) => x.name, small: (x) => [x.category, x.priceIdr ? rp(x.priceIdr) : "", x.priceUsd ? "$" + x.priceUsd : ""].filter(Boolean).join(" · "), blank: () => ({ name: "", category: "", priceIdr: 0, priceUsd: 0, type: "item", active: true }),
  fields: [{ name: "name", label: "Nama layanan / paket" }, { name: "category", label: "Kategori" }, { name: "priceIdr", label: "Harga (Rp)", type: "num" }, { name: "priceUsd", label: "Harga (USD)", type: "num" }, { name: "type", label: "Jenis", type: "select", noEmpty: true, options: () => [{ v: "item", l: "Item" }, { v: "discount", l: "Diskon" }] }, { name: "active", label: "Aktif (muncul di pilihan)", type: "check" }] }); };
MENU.splice(MENU.findIndex((m) => m[0] === "finance"), 0, ["orders", "📥 Order"], ["invoices", "🧾 Invoice"], ["ratecard", "💲 Ratecard"], ["invsettings", "⚙ Pengaturan Invoice"], ["|"]);

// ---------- kerangka ----------
const head = (t, s) => h("div", {}, h("h2", {}, t), h("p", { class: "sub" }, s || ""));
const saveBar = (fn, note) => h("div", { class: "bar" }, h("button", { class: "btn pri", onclick: guard(fn) }, "Simpan perubahan"), note && h("small", { style: "color:var(--d)" }, note));
let C = null, cur = "texts";
async function show(k) {
  cur = k; C = await api("GET", "/api/admin/content");
  const main = h("main", {}, h("p", { class: "sub" }, "Memuat…"));
  app.textContent = ""; app.append(h("div", { class: "shell" }, h("nav", { class: "side" }, h("h1", {}, "BLOOD ", h("b", {}, "MOTION")),
    MENU.map(([id, l]) => id === "|" ? h("div", { class: "sep" }) : h("a", { class: id === k ? "on" : "", onclick: () => show(id) }, l)),
    h("div", { class: "sep" }), h("a", { href: "/", target: "_blank" }, "Lihat website ↗"), h("a", { onclick: guard(async () => { await api("POST", "/api/logout"); showLogin(); }) }, "Keluar")), main));
  main.textContent = ""; main.append(await pages[k]());
}
function showLogin() {
  const pw = h("input", { type: "password", placeholder: "Password admin", autofocus: true, autocomplete: "current-password" });
  const go = guard(async () => { await api("POST", "/api/login", { password: pw.value }); show(cur); });
  pw.addEventListener("keydown", (e) => e.key === "Enter" && go());
  app.textContent = ""; app.append(h("div", { class: "login" }, h("h1", {}, "BLOOD MOTION · ADMIN"), pw, h("div", { style: "margin-top:12px" }, h("button", { class: "btn pri", onclick: go }, "Masuk"))));
}
api("GET", "/api/admin/me").then(() => show(cur)).catch(showLogin);
