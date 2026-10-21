import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";
export default function Statement() {
  const { statement: s } = useContent().site;
  return (
    <section className="statement">
      <Reveal as="h2" mask className="h-xxl">{s.line1}</Reveal>
      <Reveal as="h2" mask delay={150} className="h-xxl red">{s.line2}</Reveal>
    </section>
  );
}
