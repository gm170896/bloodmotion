import { useEffect, useState } from "react";
export default function Loader() {
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setN((v) => Math.min(100, v + 4)), 40);
    const t = setTimeout(() => setGone(true), 1500);
    return () => { clearInterval(id); clearTimeout(t); };
  }, []);
  return <div className={`loader ${gone ? "gone" : ""}`} aria-hidden="true"><b>BLOOD MOTION</b><i>{String(n).padStart(3, "0")}</i></div>;
}
