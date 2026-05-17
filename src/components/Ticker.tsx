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
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-30 flex items-center"
      style={{ height: 32, background: "rgba(1,4,12,0.9)" }}
    >
      <div className="px-4 font-orbitron text-[9px] tracking-[3px] shrink-0" style={{ color: "rgba(0,200,255,0.7)" }}>
        MERLIN // {time ?? "--:--:--"}
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex gap-10 whitespace-nowrap font-mono text-[10px]"
          style={{ animation: "ticker-scroll 55s linear infinite", letterSpacing: "0.5px" }}
        >
          {[...ITEMS, ...ITEMS, ...ITEMS].map((it, i) => (
            <span key={i} className="flex items-center gap-2">
              <span style={{ color: "rgba(0,200,255,0.9)" }}>{it.sym}</span>
              <span className="text-[var(--text-bright)]">{it.val}</span>
              <span style={{ color: it.chg.startsWith("+") ? "#00ffaa" : "#ff4466" }}>{it.chg}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
