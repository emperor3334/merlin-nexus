import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

const ITEMS = [
  { sym: "BTC", val: "67,420", chg: "+1.42%" },
  { sym: "ETH", val: "3,512", chg: "+0.88%" },
  { sym: "EUR/USD", val: "1.0892", chg: "-0.12%" },
  { sym: "GOLD", val: "2,418", chg: "+0.34%" },
  { sym: "S&P500", val: "5,621", chg: "+0.55%" },
  { sym: "DXY", val: "104.82", chg: "-0.21%" },
  { sym: "OIL", val: "78.21", chg: "+1.04%" },
];

export const Ticker = () => {
  const hasContent = useMerlin((s) => s.activeContent.type !== null);
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("cs-CZ", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute top-0 left-0 right-0 h-9 z-30 border-b border-[var(--border)] flex items-center"
      style={{ background: "rgba(2,6,18,0.92)", backdropFilter: "blur(6px)" }}
    >
      <div className="px-3 font-orbitron text-[9px] tracking-[3px] text-[var(--cyan)] shrink-0">
        MERLIN // {time ?? "--:--:--"}
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex gap-8 whitespace-nowrap font-mono text-[11px]"
          style={{ animation: "ticker-scroll 60s linear infinite" }}
        >
          {[...ITEMS, ...ITEMS, ...ITEMS].map((it, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-[var(--cyan)]">{it.sym}</span>
              <span className="text-[var(--text-bright)]">{it.val}</span>
              <span style={{ color: it.chg.startsWith("+") ? "var(--success)" : "var(--danger)" }}>
                {it.chg}
              </span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};