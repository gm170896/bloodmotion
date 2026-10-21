import { useEffect, useRef, useState } from "react";
import { useContent, asset } from "../content.jsx";
// Logo hero: file /public/assets/hero-logo.png (PNG transparan, bentuk logo apa saja; warna aslinya diganti efek metal).
// Pakai file resolusi besar (min. 1600 px lebar) supaya tajam. Kalau file tidak ada, otomatis kembali ke judul teks.
export default function Hero() {
  const { site } = useContent();
  const h = site.hero;
  const HERO_LOGO = asset(site.images.heroLogo) || "/assets/hero-logo.png";
  const ref = useRef(null);
  const [logo, setLogo] = useState({ st: "loading", ar: 560 / 288 });
  useEffect(() => {
    const i = new Image();
    i.onload = () => setLogo({ st: "ok", ar: i.naturalWidth / i.naturalHeight });
    i.onerror = () => setLogo((l) => ({ ...l, st: "err" }));
    i.src = HERO_LOGO;
  }, [HERO_LOGO]);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    ref.current.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  return (
    <section id="top" className="hero" ref={ref} onMouseMove={move}>
      <div className="glow" />
      <div className="hero-top"><span>{h.topLeft}</span><span>{h.topRight}</span></div>
      <div className="hero-main">
        {logo.st === "err" ? (
          <h1 className="hero-title" aria-label="Blood Motion">
            <span className="hl red"><span>BLOOD</span></span>
            <span className="hl"><span>MOTION</span></span>
          </h1>
        ) : (
          <h1 className="hero-title is-logo" aria-label="Blood Motion">
            <span className="hl"><span className="hero-logo" role="img" aria-label="Blood Motion" style={{ "--ar": logo.ar, "--logo": `url("${HERO_LOGO}")` }} /></span>
          </h1>
        )}
        <p className="hero-slogan">{h.slogan}</p>
      </div>
      <div className="hero-bottom">
        <div>
          <p className="hero-tag">{h.tag}</p>
          <p className="hero-desc">{h.desc}</p>
        </div>
        <div className="ctas">
          <a className="btn solid" href="#work">{h.ctaPrimary}</a>
          <a className="btn" href="#contact" data-order="">{h.ctaSecondary}</a>
        </div>
      </div>
      <div className="marquee" aria-hidden="true"><div>{Array(8).fill(h.marquee).map((t, i) => <span key={i}>{t}</span>)}</div></div>
    </section>
  );
}
