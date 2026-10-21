import { useState } from "react";
import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";

// Kotak foto 4:5. fit = "contain" (foto tampil utuh), "cover" (isi penuh, tepi terpotong), "auto" (default):
// auto = isi penuh bila rasio foto hampir sama dengan 4:5 (praktis tidak ada yang terpotong), selain itu tampil utuh.
function Photo({ m }) {
  const [ratio, setRatio] = useState(0);
  const fit = m.fit === "cover" || m.fit === "contain" ? m.fit : "auto";
  const cover = fit === "cover" || (fit === "auto" && ratio > 0 && Math.abs(ratio / 0.8 - 1) <= 0.12);
  return <img className={cover ? "cover" : ""} src={m.photo} alt={m.name} loading="lazy" decoding="async"
    onLoad={(e) => setRatio(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1))} />;
}
export default function Team() {
  const { team, site } = useContent();
  return (
    <section id="team" className="sec">
      <Reveal as="h2" mask className="h-lg">{site.team.title}</Reveal>
      <div className="team">
        {team.map((m, i) => (
          <Reveal as="figure" key={m.name + i} delay={i * 100} className="member">
            <div className="ph">{m.photo ? <Photo m={m} /> : <em>{(m.name || "?").slice(0, 1)}</em>}</div>
            <figcaption><b>{m.name}</b><span className="meta">{m.role}</span></figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
