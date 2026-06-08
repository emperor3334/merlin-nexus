import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPIv8, streamUrl } from "@/api/merlin-api";

export const SSHTerminal = () => {
  const host = useMerlin((s) => s.sshHost);
  const lines = useMerlin((s) => s.sshLines);
  const addLine = useMerlin((s) => s.addSSHLine);
  const close = useMerlin((s) => s.closeSSH);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host) return;
    const es = new EventSource(streamUrl(`/api/stream/ssh/${host}?since=0`));
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.keepalive) return;
        if (typeof data.line === "string") addLine(data.line);
      } catch {}
    };
    es.onerror = () => {};
    return () => es.close();
  }, [host, addLine]);

  useEffect(() => {
    if (!host) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [host, close]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const send = () => {
    const t = input.trim();
    if (!t || !host) return;
    addLine(`[YOU] $ ${t}`);
    MerlinAPIv8.sshSend(host, t).catch(() => {});
    setInput("");
  };

  const lineColor = (l: string) => {
    if (l.startsWith("[MERLIN]")) return "rgba(255,200,0,0.8)";
    if (l.startsWith("[YOU]")) return "rgba(0,200,255,0.8)";
    if (l.startsWith("[SYS]") || l.startsWith("[SYSTEM]")) return "rgba(255,255,255,0.4)";
    return "rgba(0,255,0,0.85)";
  };

  return (
    <AnimatePresence>
      {host && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[58] flex flex-col"
          style={{
            height: "40vh",
            background: "rgba(0,0,0,0.95)",
            borderTop: "1px solid rgba(0,255,0,0.2)",
            padding: "10px 16px",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-orbitron"
              style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,255,0,0.6)" }}
            >
              TERMINAL · {host}
            </span>
            <button
              onClick={close}
              className="font-orbitron"
              style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,255,0,0.5)" }}
            >
              ESC·CLOSE
            </button>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            style={{ fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.5, scrollbarWidth: "none" }}
          >
            {lines.map((l, i) => (
              <div key={i} style={{ color: lineColor(l), whiteSpace: "pre-wrap" }}>
                {l}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid rgba(0,255,0,0.3)" }}>
            <span style={{ color: "rgba(0,255,0,0.85)", fontFamily: "'Courier New', monospace" }}>$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 bg-transparent outline-none border-0"
              style={{ color: "rgba(0,255,0,0.85)", fontFamily: "'Courier New', monospace", fontSize: 12 }}
              spellCheck={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};