import { useContent } from "../content.jsx";
import { icons } from "../icons.js";
export default function Footer() {
  const { links, site } = useContent();
  const items = [["WhatsApp", links.whatsapp, "whatsapp"], ["Instagram", links.instagram, "instagram"], ["Fiverr", links.fiverr, "fiverr"], ["Lynk", links.lynk, "lynk"], ["Email", `mailto:${links.email}`, "mail"]];
  return (
    <footer className="footer">
      <div><b>{site.brand}</b><p className="meta">{site.footer.place}</p></div>
      <p className="meta">{site.footer.tag}</p>
      <div className="icons">
        {items.map(([name, href, k]) => (
          <a key={k} className="ico" href={href} aria-label={name} title={name} target={k === "mail" ? undefined : "_blank"} rel="noreferrer">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[k] }} />
          </a>
        ))}
      </div>
      <p className="meta">{site.footer.copyright}</p>
    </footer>
  );
}
