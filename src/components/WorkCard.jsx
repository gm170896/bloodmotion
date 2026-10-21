import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal.jsx";
// Desktop: hover plays the preview. Touch: tap plays, tap again stops. Only one card plays at a time (state lives in Portfolio).
export default function WorkCard({ p, i, active, setActive }) {
  const touch = useRef(false);
  const [ready, setReady] = useState(false);
  const on = active === p.title;
  useEffect(() => { if (!on) setReady(false); }, [on]);
  const toggle = () => { if (p.video) setActive(on ? null : p.title); };
  return (
    <Reveal as="article" delay={(i % 2) * 120} className={`card ${p.video ? "" : "img-only"} ${/logo/i.test(p.service || "") ? "logo-card" : ""} ${on ? "playing" : ""}`} data-cursor="view" data-pid={p.title} tabIndex={0}
      onPointerDown={(e) => { touch.current = e.pointerType !== "mouse"; }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && p.video) setActive(p.title); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setActive(null); }}
      onClick={() => { if (touch.current) toggle(); else if (p.link) window.open(p.link, "_blank", "noopener"); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}>
      <div className="thumb" style={{ "--h": 355 }}>
        {p.image ? <img src={p.image} alt={p.title} loading="lazy" decoding="async" /> : <em>PLACEHOLDER</em>}
        {p.video && on && <video className={`pv ${ready ? "ready" : ""}`} src={p.video} muted loop playsInline autoPlay preload="auto" aria-hidden="true" onCanPlay={() => setReady(true)} />}
        {p.video && <span className="pv-tag">▶ Preview</span>}
        <p className="desc">{p.description}</p>
      </div>
      <div className="card-meta">
        <h3>{p.title}</h3>
        <p className="meta">{p.service}</p>
        <p className="meta yr">{p.year}</p>
        {p.link && <a className="watch" href={p.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Watch full ↗</a>}
      </div>
    </Reveal>
  );
}
