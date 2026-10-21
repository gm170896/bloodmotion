import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";
export default function Intro() {
  const { intro } = useContent().site;
  return (
    <section className="sec intro">
      <Reveal as="h2" mask className="h-xl">{intro.title}</Reveal>
      <div className="intro-text">
        <Reveal as="p" className="lead">{intro.p1}</Reveal>
        <Reveal as="p" delay={120} className="lead dim">{intro.p2}</Reveal>
      </div>
    </section>
  );
}
