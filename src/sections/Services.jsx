import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";
export default function Services() {
  const { services, projects, site } = useContent();
  return (
    <section id="services" className="sec">
      <Reveal as="h2" mask className="h-lg">{site.services.title}</Reveal>
      <ul className="services">
        {services.map((s) => {
          const n = projects.filter((p) => p.service === s.title).length;
          return (
            <Reveal as="li" key={s.title} className={`svc ${s.isNew ? "svc-new" : ""}`}>
              <h3>{s.title}</h3>
              <div className="svc-body">
                <p>{s.desc}</p>
                <ul>{(s.items || []).map((i) => <li key={i}>{i}</li>)}</ul>
                <div className="svc-actions">
                  {n > 0 && <a className="svc-work" href="#work" data-work={s.title}>View work ({n}) →</a>}
                  <a className="svc-order" href="#contact" data-order={s.title}>Order →</a>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
