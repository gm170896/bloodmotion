import { createContext, useContext, useEffect, useState } from "react";
import * as defaults from "./data.js";
// Konten awal = src/data.js. Kalau backend jalan, /api/content menimpa (diedit lewat /admin).
const Ctx = createContext(defaults);
export const useContent = () => useContext(Ctx);
export const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const asset = (u) => (u && u.startsWith("/uploads/") ? API + u : u || "");
const merge = (base, over) => {
  const o = { ...base };
  for (const k of Object.keys(over || {})) {
    const v = over[k];
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") o[k] = merge(base[k], v);
    else if (v !== undefined && v !== null) o[k] = v;
  }
  return o;
};
export function ContentProvider({ children }) {
  const [c, setC] = useState({ ...defaults });
  useEffect(() => {
    fetch(API + "/api/content").then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((r) => setC((p) => {
        const n = merge(p, r);
        n.projects = (r.projects || p.projects).map((x) => ({ ...x, image: asset(x.image), video: asset(x.video) }));
        n.team = (r.team || p.team).map((x) => ({ ...x, photo: asset(x.photo) }));
        n.clientLogos = (r.clientLogos || p.clientLogos).map((x) => ({ ...x, logo: asset(x.logo) }));
        n.steps = r.steps || p.steps; n.nav = r.nav || p.nav;
        return n;
      }))
      .catch((e) => console.warn("Backend tidak terjangkau, memakai src/data.js", e));
  }, []);
  return <Ctx.Provider value={c}>{children}</Ctx.Provider>;
}
