import { useEffect, useState } from "react";
import { useContent, asset } from "../content.jsx";
// Header logo: /public/assets/logo.png (transparent PNG, rendered as solid white).
export const LOGO = "/assets/logo.png";
export default function useLogo() {
  const { site } = useContent();
  const src = asset(site.images.logo) || LOGO;
  const [s, set] = useState({ ok: false, ar: 1 });
  useEffect(() => { const i = new Image(); i.onload = () => set({ ok: true, ar: i.naturalWidth / i.naturalHeight, src }); i.onerror = () => set({ ok: false, ar: 1 }); i.src = src; }, [src]);
  return s;
}
