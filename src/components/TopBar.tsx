import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

export const TopBar = () => {
  const [time, setTime] = useState<string | null>(null);
  const dateTime = useMerlin((s) => s.dateTime);
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Tick marks every 40px across full width
  const ticks = Array.from({ length: 60 });

  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Thin decorative line */}
      <div
        style={{
          height: 1,
          background: "rgba(0,180,255,0.5)",
          boxShadow: "0 0 8px rgba(0,180,255,0.4)",
        }}
      />
      {/* Tick marks below the line */}
      <div className="relative" style={{ height: 8 }}>
        <div className="flex justify-between px-3">
          {ticks.map((_, i) => (
            <span
              key={i}
              style={{
                width: 1,
                height: i % 5 === 0 ? 6 : 3,
                background: "rgba(0,180,255,0.45)",
              }}
            />
          ))}
        </div>
      </div>
      {/* Clock top-left */}
      <div
        className="font-orbitron absolute"
        style={{
          top: 14,
          left: 18,
          fontSize: 10,
          letterSpacing: "3px",
          color: "rgba(0,200,255,0.7)",
        }}
      >
        MERLIN // {time ?? "--:--:--"}
      </div>
      {/* Date / day top-right */}
      {dateTime && (
        <div
          className="font-orbitron absolute"
          style={{
            top: 14,
            right: 56,
            fontSize: 9,
            letterSpacing: "2px",
            color: "rgba(0,200,255,0.5)",
          }}
        >
          {dateTime}
        </div>
      )}
    </div>
  );
};
