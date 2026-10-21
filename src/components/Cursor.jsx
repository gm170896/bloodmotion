import { useEffect, useRef, useState } from "react";
export default function Cursor() {
  const ref = useRef(null);
  const [mode, setMode] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setOn(true);
    let x = 0, y = 0, cx = 0, cy = 0, raf;
    const move = (e) => { x = e.clientX; y = e.clientY; };
    const over = (e) => {
      const t = e.target.closest("[data-cursor], a, button");
      setMode(t ? (t.dataset.cursor || "link") : "");
    };
    const tick = () => { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      if (ref.current) ref.current.style.transform = `translate(${cx}px,${cy}px)`; raf = requestAnimationFrame(tick); };
    window.addEventListener("mousemove", move); document.addEventListener("mouseover", over); tick();
    return () => { window.removeEventListener("mousemove", move); document.removeEventListener("mouseover", over); cancelAnimationFrame(raf); };
  }, []);
  if (!on) return null;
  return <div ref={ref} className="cursor-wrap" aria-hidden="true"><div className={`cursor ${mode}`}><span>VIEW</span></div></div>;
}
