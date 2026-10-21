import { useEffect, useRef, useState } from "react";
import { useContent, API } from "../content.jsx";
// Form muncul hanya setelah tombol "Start a project" ditekan: elemen apa pun dengan data-order membuka form ini.
// data-order="Metal Logo" memilih layanan otomatis. Pilihan budget bisa diubah di src/data.js (budgets).
export default function OrderModal() {
  const { services, links, budgets, site } = useContent();
  const [open, setOpen] = useState(false);
  const [svc, setSvc] = useState("");
  const first = useRef(null);
  const formRef = useRef(null);
  useEffect(() => {
    const h = (e) => { const t = e.target.closest("[data-order]"); if (!t) return; e.preventDefault(); setSvc(t.dataset.order || ""); setOpen(true); };
    document.addEventListener("click", h); return () => document.removeEventListener("click", h);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const k = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", k);
    if (open) setTimeout(() => first.current?.focus(), 80);
    return () => removeEventListener("keydown", k);
  }, [open]);
  const compose = () => {
    const f = new FormData(formRef.current);
    const g = (k) => String(f.get(k) || "").trim();
    const rows = [["Name / band / label", g("name")], ["Email", g("email")], ["WhatsApp", g("phone")], ["Service", g("service")], ["Track duration", g("duration")], ["Release date", g("date")], ["Budget (USD)", g("budget")], ["Link", g("link")], ["Project details", g("brief")]].filter(([, v]) => v);
    return "Hi Blood Motion! I'd like to start a project.\n\n" + rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  };
  // Simpan pesanan ke backend (manajemen order di /admin). Kegagalan tidak menghalangi WhatsApp/email.
  const record = () => {
    const f = new FormData(formRef.current), o = {};
    f.forEach((v, k) => (o[k] = String(v)));
    return fetch(API + "/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o), keepalive: true }).catch(() => {});
  };
  const submit = (e) => {
    e.preventDefault();
    record();
    window.open(`https://wa.me/${links.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(compose())}`, "_blank", "noopener");
    setOpen(false);
  };
  const mail = (e) => { e.preventDefault(); if (!formRef.current.reportValidity()) return; record(); location.href = `mailto:${links.email}?subject=${encodeURIComponent("Project inquiry")}&body=${encodeURIComponent(compose())}`; };
  return (
    <div className={`modal ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)} role="dialog" aria-modal="true" aria-label="Start a project" aria-hidden={!open}>
      <form className="sheet" ref={formRef} onSubmit={submit}>
        <button type="button" className="x" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
        <h2>{site.order.title}</h2>
        <p className="sheet-sub">{site.order.sub}</p>
        <div className="fgrid">
          <input name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }} />
          <label><span className="lb">Name / band / label *</span><input ref={first} name="name" required autoComplete="name" placeholder="Your project name" /></label>
          <label><span className="lb">Your email *</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label><span className="lb">WhatsApp number</span><input name="phone" type="tel" autoComplete="tel" placeholder="+62 8xx-xxxx-xxxx" /></label>
          <label><span className="lb">Service *</span>
            <select name="service" value={svc} onChange={(e) => setSvc(e.target.value)} required>
              <option value="" disabled>Select a service</option>
              {services.map((s) => <option key={s.title}>{s.title}</option>)}
              <option>Other / not sure</option>
            </select></label>
          <label><span className="lb">Track duration</span><input name="duration" placeholder="e.g. 4:30" /></label>
          <label><span className="lb">Release date</span><input name="date" type="date" /></label>
          <label><span className="lb">Budget range (USD)</span>
            <select name="budget" defaultValue={budgets[0]}>{budgets.map((b) => <option key={b}>{b}</option>)}</select></label>
          <label className="full"><span className="lb">Audio / artwork / reference link</span><input name="link" type="url" placeholder="https://" /></label>
          <label className="full"><span className="lb">Tell us about the project</span><textarea name="brief" rows="4" placeholder="The visual direction, formats you need, and any artwork or AI restrictions." /></label>
        </div>
        <div className="sheet-actions">
          <button className="btn solid" type="submit">Send my inquiry ↗</button>
          <a className="alt meta" href={`mailto:${links.email}`} onClick={mail}>or send by email</a>
        </div>
        <p className="sheet-note">{site.order.note}</p>
      </form>
    </div>
  );
}
