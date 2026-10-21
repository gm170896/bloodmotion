import Reveal from "../components/Reveal.jsx";
import { useContent } from "../content.jsx";
export default function Contact() {
  const { links, site } = useContent();
  const c = site.contact;
  return (
    <section id="contact" className="sec contact">
      <Reveal as="h2" mask className="h-xxl">{c.title}</Reveal>
      <p className="lead">{c.lead}</p>
      <div className="ctas">
        <a className="btn solid" href="#contact" data-order="">{c.ctaPrimary}</a>
        <a className="btn" href="#work">{c.ctaSecondary}</a>
      </div>
      <ul className="socials">
        <li><a href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></li>
        <li><a href={links.instagram} target="_blank" rel="noreferrer">Instagram</a></li>
        <li><a href={links.fiverr} target="_blank" rel="noreferrer">Fiverr</a></li>
        <li><a href={links.lynk} target="_blank" rel="noreferrer">Lynk</a></li>
        <li><a href={`mailto:${links.email}`}>{links.email}</a></li>
      </ul>
    </section>
  );
}
