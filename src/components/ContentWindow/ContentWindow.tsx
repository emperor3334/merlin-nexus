import { useEffect, useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

interface Props {
  url?: string;
  title?: string;
  children: ReactNode;
}

export const ContentWindow = ({ url, title, children }: Props) => {
  const clearContent = useMerlin((s) => s.clearContent);

  const initial = () => {
    if (typeof window === "undefined") return { w: 900, h: 600, x: 100, y: 60 };
    const w = Math.min(Math.round(window.innerWidth * 0.7), 1400);
    const h = Math.min(Math.round(window.innerHeight * 0.75), 900);
    return {
      w,
      h,
      x: Math.round((window.innerWidth - w) / 2),
      y: Math.max(60, Math.round((window.innerHeight - h) / 2) - 30),
    };
  };
  const [box, setBox] = useState(initial);
  const dragRef = useRef<{ ox: number; oy: number; bx: number; by: number } | null>(null);
  const resizeRef = useRef<{ ox: number; oy: number; bw: number; bh: number } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragRef.current) {
        setBox((b) => ({
          ...b,
          x: dragRef.current!.bx + (e.clientX - dragRef.current!.ox),
          y: dragRef.current!.by + (e.clientY - dragRef.current!.oy),
        }));
      }
      if (resizeRef.current) {
        setBox((b) => ({
          ...b,
          w: Math.max(360, resizeRef.current!.bw + (e.clientX - resizeRef.current!.ox)),
          h: Math.max(240, resizeRef.current!.bh + (e.clientY - resizeRef.current!.oy)),
        }));
      }
    };
    const up = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const onChromeDown = (e: React.PointerEvent) => {
    dragRef.current = { ox: e.clientX, oy: e.clientY, bx: box.x, by: box.y };
  };
  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizeRef.current = { ox: e.clientX, oy: e.clientY, bw: box.w, bh: box.h };
  };

  const display = url || title || "";

  return (
    <>
      {/* dim backdrop, click to dismiss */}
      <div
        onClick={clearContent}
        className="fixed inset-0 z-[40]"
        style={{ background: "rgba(0,0,0,0.3)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed z-[50] flex flex-col overflow-hidden"
        style={{
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          background: "rgba(2,8,20,0.95)",
          border: "1px solid rgba(0,200,255,0.25)",
          boxShadow: "0 0 80px 4px rgba(0,120,255,0.25), 0 0 0 1px rgba(0,200,255,0.1)",
        }}
      >
        {/* CHROME BAR */}
        <div
          onPointerDown={onChromeDown}
          className="flex items-center select-none"
          style={{
            height: 28,
            background: "rgba(5,15,30,0.95)",
            borderBottom: "1px solid rgba(0,200,255,0.15)",
            cursor: "grab",
          }}
        >
          <div className="flex items-center gap-[6px] pl-3">
            <Dot color="#ff5f57" onClick={clearContent} />
            <Dot color="#febc2e" />
            <Dot color="#28c840" />
          </div>
          <div
            className="flex-1 text-center truncate px-4 font-mono"
            style={{ fontSize: 10, color: "rgba(0,200,255,0.5)" }}
          >
            {display}
          </div>
          <div className="flex items-center gap-3 pr-3">
            {url && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                aria-label="open in new tab"
                className="transition-colors"
                style={{ color: "rgba(0,200,255,0.4)", fontSize: 13, lineHeight: 1 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,200,255,0.9)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,200,255,0.4)")}
              >
                ↗
              </button>
            )}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={clearContent}
              aria-label="close"
              className="transition-colors"
              style={{ color: "rgba(0,200,255,0.4)", fontSize: 13, lineHeight: 1 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,200,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,200,255,0.4)")}
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "#000" }}>
          {children}
        </div>

        {/* RESIZE HANDLE */}
        <div
          onPointerDown={onResizeDown}
          className="absolute bottom-0 right-0 z-10"
          style={{
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 50%, rgba(0,200,255,0.4) 50%, rgba(0,200,255,0.4) 60%, transparent 60%, transparent 70%, rgba(0,200,255,0.4) 70%, rgba(0,200,255,0.4) 80%, transparent 80%)",
          }}
        />
      </motion.div>
    </>
  );
};

const Dot = ({ color, onClick }: { color: string; onClick?: () => void }) => (
  <button
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onClick}
    style={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color,
      border: "none",
      padding: 0,
    }}
  />
);