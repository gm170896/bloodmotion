import Reveal from "../components/Reveal.jsx";
import { useState } from "react";
import { useContent, asset } from "../content.jsx";
// Logo di kanan About: taruh file di /public/assets/about-logo.png (PNG transparan). Kalau file tidak ada, area ini otomatis hilang.
export default function About() {
  const [ok, setOk] = useState(true);
  const { about, images } = useContent().site;
  const logo = asset(images.aboutLogo) || "/assets/about-logo.png";
  return (
    <section id="about" className="sec about">
      <Reveal as="h2" mask className="h-lg">{about.title}</Reveal>
      <div className={`about-body ${ok ? "has-logo" : ""}`}>
        <div className="about-text">
          <Reveal as="p" className="lead">{about.p1}</Reveal>
          <Reveal as="p" delay={120} className="lead dim">{about.p2}</Reveal>
        </div>
        {ok && <Reveal className="about-logo" delay={200}><img src={logo} alt="Blood Motion" loading="lazy" onError={() => setOk(false)} /></Reveal>}
      </div>
    </section>
  );
}
