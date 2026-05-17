import { useEffect, useRef, useState } from "react";

export const Cursor = () => {
  const crossRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (crossRef.current) {
        crossRef.current.style.left = e.clientX + "px";
        crossRef.current.style.top = e.clientY + "px";
      }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + "px";
        dotRef.current.style.top = e.clientY + "px";
      }
      const el = e.target as HTMLElement | null;
      setHover(
        !!el?.closest("button, a, input, textarea, select, [role='button']")
      );
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  const color = hover ? "rgba(0,220,255,1)" : "rgba(0,200,255,0.85)";
  const scale = hover ? 1.3 : 1;

  return (
    <>
      <div
        ref={crossRef}
        className="cursor-cross"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          color,
        }}
      >
        <span className="cross-line cross-top" style={{ background: color }} />
        <span className="cross-line cross-bottom" style={{ background: color }} />
        <span className="cross-line cross-left" style={{ background: color }} />
        <span className="cross-line cross-right" style={{ background: color }} />
      </div>
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          background: "#00c8ff",
          boxShadow: "0 0 6px #00c8ff",
        }}
      />
    </>
  );
};