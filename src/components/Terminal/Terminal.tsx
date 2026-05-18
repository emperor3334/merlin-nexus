import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { useMerlinAgent } from "@/hooks/useMerlin";

export const Terminal = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useMerlin((s) => s.messages);
  const { sendUserMessage } = useMerlinAgent();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.shiftKey && (e.key === "T" || e.key === "t") && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const submit = () => {
    const t = input.trim();
    if (!t) return;
    setHistory((h) => [...h, t]);
    setHIdx(-1);
    setInput("");
    sendUserMessage(t);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(idx);
      setInput(history[idx]);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx < 0) return;
      const idx = hIdx + 1;
      if (idx >= history.length) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(idx);
        setInput(history[idx]);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 right-0 flex flex-col"
          style={{
            width: 280,
            height: "100vh",
            background: "transparent",
            borderLeft: "1px solid rgba(0,200,255,0.08)",
            zIndex: 500,
            padding: "20px 16px 70px 16px",
          }}
        >
          <span
            className="font-orbitron absolute top-2 right-3"
            style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,200,255,0.2)" }}
          >
            ESC
          </span>

          {/* MESSAGES */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {messages.slice(-40).map((m) => (
              <div key={m.id} style={{ marginBottom: 16 }}>
                <div
                  className="font-orbitron"
                  style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,200,255,0.35)", marginBottom: 4 }}
                >
                  {new Date(m.timestamp).toLocaleTimeString("en-GB", { hour12: false })} ›
                </div>
                <div
                  className="font-rajdhani"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.45,
                    color: m.role === "user" ? "rgba(255,255,255,0.6)" : "rgba(0,200,255,0.85)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* INPUT LINE */}
          <div
            className="absolute flex items-center"
            style={{ bottom: 20, left: 16, right: 16 }}
          >
            <span
              className="font-orbitron pr-2"
              style={{ color: "rgba(0,200,255,0.6)", fontSize: 10 }}
            >
              ▶
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 bg-transparent outline-none border-0 font-rajdhani"
              style={{ color: "#c8e8ff", caretColor: "#00c8ff", fontSize: 13 }}
              placeholder="type a command…"
              spellCheck={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};