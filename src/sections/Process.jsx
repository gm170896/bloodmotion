import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";
export default function Process() {
  const { steps, site } = useContent();
  return (
    <section id="process" className="sec">
      <Reveal as="h2" mask className="h-lg">{site.process.title}</Reveal>
      <ol className="steps">
        {steps.map(([t, d, more], i) => (
          <li key={t + i} className="step" tabIndex={0}>
            <span className="num">{String(i + 1).padStart(2, "0")}</span>
            <h3>{t}</h3>
            <p>{d}</p>
            <p className="more">{more}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
