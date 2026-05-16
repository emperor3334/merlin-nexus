import { useEffect, useState, useRef } from "react";
import { Mic } from "lucide-react";
import { useMerlin } from "@/store/merlinStore";
import { useMerlinAgent } from "@/hooks/useMerlin";

export const MicButton = () => {
  const [active, setActive] = useState(false);
  const recRef = useRef<any>(null);
  const { setOrbState, log } = useMerlin();
  const { sendUserMessage } = useMerlinAgent();

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { log("STT NEPODPOROVÁNO"); return; }
    const rec = new SR();
    rec.lang = "cs-CZ";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      sendUserMessage(text);
    };
    rec.onend = () => { setActive(false); setOrbState("standby"); };
    rec.onerror = () => { setActive(false); setOrbState("standby"); };
    recRef.current = rec;
    rec.start();
    setActive(true);
    setOrbState("listening");
  };

  const stop = () => { recRef.current?.stop(); setActive(false); setOrbState("standby"); };

  const toggle = () => (active ? stop() : start());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement)?.tagName !== "TEXTAREA" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="flex items-center justify-center gap-3 pb-3">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
        style={{
          border: `1px solid ${active ? "var(--merlin-success)" : "rgba(0,255,170,0.35)"}`,
          background: active ? "rgba(0,255,170,0.15)" : "transparent",
          boxShadow: active ? "0 0 20px rgba(0,255,170,0.6)" : "none",
          animation: active ? "orb-pulse 0.5s infinite" : undefined,
        }}
      >
        <Mic size={14} className={active ? "text-[var(--merlin-success)]" : "text-[var(--merlin-text)]"} />
      </button>
      <div className="font-orbitron text-[8px] tracking-[2px] opacity-70">
        STISKNI MEZERNÍK
      </div>
    </div>
  );
};