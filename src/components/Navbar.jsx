import { useEffect, useState } from "react";
import useLogo, { LOGO } from "./useLogo.js";
import { useContent } from "../content.jsx";
export default function Navbar() {
  const { ok, ar, src } = useLogo();
  const content = useContent();
  const nav = content.nav.map((n) => [n.label, n.id]);
  const [small, setSmall] = useState(false);
  const [open, setOpen] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    const f = () => { const h = document.documentElement; setSmall(h.scrollTop > 60); setP(h.scrollTop / (h.scrollHeight - h.clientHeight || 1)); };
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  return (
    <>
      <div className="progress" style={{ transform: `scaleX(${p})` }} />
      <header className={`nav ${small ? "small" : ""}`}>
        <a href="#top" className="logo" aria-label={content.site.brand}>{ok ? <span className="logo-mark" style={{ "--ar": ar, "--logo": `url("${src || LOGO}")` }} /> : content.site.brand}</a>
        <nav aria-label="Primary" className="nav-links">{nav.map(([l, id]) => <a key={id} href={`#${id}`}>{l}</a>)}</nav>
        <button className="burger" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? "CLOSE" : "MENU"}</button>
      </header>
      <div className={`menu ${open ? "open" : ""}`}>
        {nav.map(([l, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{l}</a>)}
      </div>
    </>
  );
}
