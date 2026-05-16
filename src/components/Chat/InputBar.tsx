import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { useVoice } from "@/hooks/useVoice";
import { useMerlinAgent } from "@/hooks/useMerlin";

export const InputBar = () => {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendUserMessage } = useMerlinAgent();
  const micActive = useMerlin((s) => s.micActive);

  const { start, stop } = useVoice({
    onInterim: (t) => setInterim(t),
    onFinal: (t) => {
      setInterim("");
      setText("");
      sendUserMessage(t);
    },
  });

  const toggleMic = () => (micActive ? stop() : start());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText("");
    sendUserMessage(v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(640px,calc(100%-32px))] z-30"
    >
      <form
        onSubmit={submit}
        className="flex items-center gap-3 px-4 py-2.5 bg-[var(--panel-bg)] border border-[var(--border)] backdrop-blur-sm"
        style={{
          boxShadow: micActive
            ? "0 0 30px rgba(0,255,170,0.25), inset 0 0 20px rgba(0,200,255,0.05)"
            : "0 0 30px rgba(0,120,255,0.1), inset 0 0 20px rgba(0,200,255,0.04)",
        }}
      >
        <button
          type="button"
          onClick={toggleMic}
          className="w-8 h-8 flex items-center justify-center rounded-full border transition-all shrink-0"
          style={{
            borderColor: micActive ? "var(--success)" : "var(--border)",
            background: micActive ? "rgba(0,255,170,0.12)" : "transparent",
            color: micActive ? "var(--success)" : "var(--text)",
            animation: micActive ? "mic-pulse 0.7s ease-in-out infinite" : undefined,
          }}
          aria-label="mikrofon"
        >
          <Mic size={14} />
        </button>
        <input
          ref={inputRef}
          value={interim || text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Zadejte příkaz nebo stiskněte mezerník…"
          className="flex-1 bg-transparent outline-none font-rajdhani text-[14px] tracking-wide placeholder:text-[var(--text)] placeholder:opacity-50"
          style={{ color: interim ? "var(--text)" : "var(--text-bright)" }}
        />
        <div className="font-orbitron text-[8px] tracking-[2px] opacity-50 shrink-0 hidden sm:block">
          ENTER • SPACE
        </div>
      </form>
    </motion.div>
  );
};