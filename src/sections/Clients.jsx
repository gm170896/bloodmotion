import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";
export default function Clients() {
  const { clients, clientLogos, site } = useContent();
  const named = clients.flatMap((c) => (c.names || []).map((n) => ({ name: n, logo: "" })));
  const items = [...clientLogos.filter((c) => c.logo || !named.length), ...named];
  return (
    <section id="clients" className="sec">
      <Reveal as="h2" mask className="h-lg">{site.clients.title}</Reveal>
      <Reveal as="p" delay={100} className="lead dim">{site.clients.sub}</Reveal>
      <div className="logo-wall">
        {items.map((c, i) => (
          <Reveal key={c.name + i} delay={(i % 6) * 60} className="logo-cell">
            {c.logo ? <img src={c.logo} alt={c.name} loading="lazy" /> : <span>{c.name}</span>}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
