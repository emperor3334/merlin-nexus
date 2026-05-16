import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { Send } from "lucide-react";
import { useMerlinAgent } from "@/hooks/useMerlin";

export const ChatPanel = () => {
  const { messages, isTyping } = useMerlin();
  const { sendUserMessage } = useMerlinAgent();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const submit = () => {
    if (!input.trim()) return;
    sendUserMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="font-orbitron text-[8px] tracking-[3px] text-[var(--merlin-primary)] px-2 py-1 border-b border-[var(--merlin-border)]">
        // CONVERSATION
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] px-2.5 py-1.5 ${m.role === "user" ? "user-bubble" : "merlin-bubble"}`}>
                <div className="font-orbitron text-[7px] tracking-[2px] opacity-50 mb-0.5">
                  {m.role === "user" ? "VY" : "MERLIN"}
                </div>
                <div className="text-[12px] text-[var(--merlin-text-bright)] leading-snug whitespace-pre-wrap">
                  {m.text}
                </div>
                {m.badge && (
                  <div className="font-orbitron text-[7px] tracking-[2px] mt-1 text-[var(--merlin-success)] opacity-60">
                    {m.badge}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <div className="flex justify-start">
            <div className="merlin-bubble px-3 py-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--merlin-primary)]"
                  style={{ animation: `orb-pulse 1s ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-[var(--merlin-border)] flex gap-1.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="ZADEJTE PŘÍKAZ..."
          className="flex-1 bg-black/40 border border-[var(--merlin-border)] px-2 py-1.5 text-[12px] text-[var(--merlin-text-bright)] font-rajdhani resize-none focus:outline-none focus:border-[var(--merlin-primary)]"
        />
        <button
          onClick={submit}
          className="bg-[var(--merlin-primary-dim)] border border-[var(--merlin-primary)] px-3 text-[var(--merlin-primary)]"
          style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};