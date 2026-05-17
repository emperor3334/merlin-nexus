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
          initial={{ y: 280, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 280, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 flex flex-col"
          style={{
            height: 280,
            background: "rgba(3,8,18,0.97)",
            borderTop: "1px solid rgba(0,200,255,0.3)",
            zIndex: 900,
          }}
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between px-4"
            style={{
              height: 28,
              borderBottom: "1px solid rgba(0,200,255,0.15)",
              color: "rgba(0,200,255,0.6)",
            }}
          >
            <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: 3 }}>
              MERLIN TERMINAL
            </span>
            <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: 2 }}>
              ESC TO CLOSE
            </span>
          </div>

          {/* CONTENT */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto font-mono px-4 py-2"
            style={{ fontSize: 13, color: "var(--cyan)" }}
          >
            {messages.slice(-40).map((m) => (
              <div key={m.id} className="leading-relaxed">
                {m.role === "user" ? (
                  <span style={{ color: "rgba(0,200,255,0.7)" }}>▶ {m.text}</span>
                ) : (
                  <span style={{ color: "#00ffaa" }}>MERLIN: {m.text}</span>
                )}
              </div>
            ))}
          </div>

          {/* INPUT LINE */}
          <div className="flex items-center px-4 py-2" style={{ borderTop: "1px solid rgba(0,200,255,0.1)" }}>
            <span className="font-mono pr-2" style={{ color: "var(--cyan)", fontSize: 14 }}>
              ▶
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 bg-transparent outline-none font-mono"
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