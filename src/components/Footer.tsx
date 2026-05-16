import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

export const Footer = () => {
  const [time, setTime] = useState(new Date());
  const backendMode = useMerlin((s) => s.backendMode);
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="h-9 border-t border-[var(--merlin-border)] bg-[var(--merlin-panel)] grid grid-cols-3 items-center px-3 font-orbitron text-[8px] tracking-[2px] uppercase opacity-70">
      <div>MERLIN v2.0-BETA // {time.toLocaleTimeString("cs-CZ")}</div>
      <div className="flex items-end justify-center gap-[2px] h-5">
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            key={i}
            className="w-[2px] bg-[var(--merlin-primary)]"
            style={{ animation: `wave 1s ${i * 0.07}s ease-in-out infinite`, opacity: 0.6 }}
          />
        ))}
      </div>
      <div className="text-right">{backendMode ? "BACKEND // UBUNTU" : "PŘÍMÝ API MÓD"}</div>
    </div>
  );
};