import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMerlin } from "@/store/merlinStore";

export const ChatPanel = () => {
  const messages = useMerlin((s) => s.messages);
  const isTyping = useMerlin((s) => s.isTyping);
  const hasContent = useMerlin((s) => s.activeContent.type !== null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  if (messages.length === 0 || !hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute right-4 md:right-6 top-12 bottom-24 w-[300px] z-20"
    >
      <div className="h-full flex flex-col bg-[var(--panel-bg)] border border-[var(--border)] backdrop-blur-sm">
        <div className="px-3 py-2 border-b border-[var(--border)] font-orbitron text-[9px] tracking-[3px] text-[var(--cyan)] opacity-80">
          // KOMUNIKACE
        </div>
        <div ref={ref} className="flex-1 overflow-y-auto p-3 space-y-2.5 font-rajdhani text-[13px] leading-[1.55]">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`px-2.5 py-1.5 ${m.role === "user" ? "msg-user" : "msg-merlin"}`}
              >
                {m.badge && (
                  <div className="font-orbitron text-[7px] tracking-[2px] opacity-60 mb-0.5">
                    {m.badge}
                  </div>
                )}
                <div className="text-[var(--text-bright)]">{m.text}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <div className="msg-merlin px-2.5 py-1.5 inline-flex gap-1">
              <span className="dot-pulse" style={{ animationDelay: "0s" }} />
              <span className="dot-pulse" style={{ animationDelay: "0.15s" }} />
              <span className="dot-pulse" style={{ animationDelay: "0.3s" }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};