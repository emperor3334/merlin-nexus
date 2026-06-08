import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { streamUrl } from "@/api/merlin-api";

const eventStyles: Record<string, { icon: string; color: string }> = {
  input_received: { icon: "→", color: "rgba(255,255,255,0.5)" },
  cost_router_start: { icon: "⚡", color: "rgba(0,200,255,0.7)" },
  cost_router_done: { icon: "✓", color: "rgba(0,255,150,0.7)" },
  agent_start: { icon: "◆", color: "rgba(0,200,255,0.8)" },
  web_search: { icon: "🔍", color: "rgba(0,200,255,0.6)" },
  translation: { icon: "⇄", color: "rgba(200,200,0,0.7)" },
  translation_done: { icon: "✓", color: "rgba(0,255,150,0.6)" },
  ollama_start: { icon: "◯", color: "rgba(100,150,255,0.7)" },
  grok_start: { icon: "◆", color: "rgba(255,180,0,0.7)" },
  self_modify_start: { icon: "✏", color: "rgba(255,200,0,0.7)" },
  behavior_applied: { icon: "◈", color: "rgba(0,255,200,0.7)" },
  ssh_command: { icon: "⌨", color: "rgba(200,200,255,0.7)" },
  done: { icon: "●", color: "rgba(0,255,150,0.8)" },
};

export const ProcessPanel = () => {
  const show = useMerlin((s) => s.showProcess);
  const setShow = useMerlin((s) => s.setShowProcess);
  const events = useMerlin((s) => s.processEvents);
  const addEvent = useMerlin((s) => s.addProcessEvent);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const es = new EventSource(streamUrl("/api/stream/process"));
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === "keepalive") return;
        addEvent({ ...data, id: Date.now() + Math.random() });
      } catch {}
    };
    es.onerror = () => {};
    return () => es.close();
  }, [show, addEvent]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, setShow]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[55] flex flex-col"
          style={{
            height: "25vh",
            background: "transparent",
            borderTop: "1px solid rgba(0,200,255,0.2)",
            padding: "12px 20px 30px 20px",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-orbitron"
              style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,200,255,0.5)" }}
            >
              PROCESS VIEW
            </span>
            <button
              onClick={() => setShow(false)}
              className="font-orbitron"
              style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,200,255,0.4)" }}
            >
              ESC·CLOSE
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono" style={{ scrollbarWidth: "none" }}>
            {events.map((ev) => {
              const st = eventStyles[ev.event] || { icon: "·", color: "rgba(255,255,255,0.5)" };
              return (
                <div key={ev.id} className="flex gap-2 mb-1" style={{ fontSize: 11, lineHeight: 1.5 }}>
                  <span style={{ color: "rgba(0,200,255,0.35)" }}>
                    [{ev.time || new Date().toLocaleTimeString("en-GB", { hour12: false })}]
                  </span>
                  <span style={{ color: st.color }}>{st.icon}</span>
                  <span style={{ color: st.color }}>
                    {ev.message || ev.detail || ev.event}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};