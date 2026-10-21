import { useEffect, useState } from "react";
import Reveal from "../components/Reveal.jsx";
import WorkCard from "../components/WorkCard.jsx";
import { useContent } from "../content.jsx";
export default function Portfolio() {
  const { projects, workCategories, site } = useContent();
  const [f, setF] = useState("All");
  const [active, setActive] = useState(null); // title of the card whose preview is playing
  const count = (t) => projects.filter((p) => p.service === t).length;
  // Tombol filter = kategori yang punya project (urutan dari admin), ditambah kategori project yang belum terdaftar.
  const groups = [...new Set([...workCategories, ...projects.map((x) => x.service)])].filter((t) => t && count(t));
  useEffect(() => { // any element with data-work="Service" filters the portfolio
    const h = (e) => { const t = e.target.closest("[data-work]"); if (t) { const w = t.dataset.work || "All"; setF(w === "All" || groups.includes(w) ? w : "All"); } };
    document.addEventListener("click", h); return () => document.removeEventListener("click", h);
  }, [groups.join("|")]);
  useEffect(() => setActive(null), [f]);
  useEffect(() => { // stop the preview when its card scrolls off screen
    const h = () => { if (!active) return; const el = document.querySelector(`[data-pid="${CSS.escape(active)}"]`); if (!el) return; const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) setActive(null); };
    addEventListener("scroll", h, { passive: true }); return () => removeEventListener("scroll", h);
  }, [active]);
  const list = f === "All" ? projects : projects.filter((p) => p.service === f);
  return (
    <section id="work" className="sec">
      <div className="sec-head">
        <Reveal as="h2" mask className="h-lg">{site.work.title}</Reveal>
        <p className="meta cats">{site.work.sub}</p>
      </div>
      <div className="chips" role="tablist">
        {[["All", projects.length], ...groups.map((t) => [t, count(t)])].map(([t, n]) => (
          <button key={t} role="tab" aria-selected={f === t} className={`chip ${f === t ? "on" : ""}`} onClick={() => setF(t)}>{t} <i>{n}</i></button>
        ))}
      </div>
      <div className="grid">
        {list.map((p, i) => <WorkCard key={f + p.title} p={p} i={i} active={active} setActive={setActive} />)}
      </div>
    </section>
  );
}
