import { useEffect, useRef, useState } from "react";
export default function Reveal({ as: Tag = "div", mask = false, delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`rv ${mask ? "mask" : ""} ${on ? "in" : ""} ${className}`} style={{ "--d": `${delay}ms` }} {...rest}>
      {mask ? <span>{children}</span> : children}
    </Tag>
  );
}
