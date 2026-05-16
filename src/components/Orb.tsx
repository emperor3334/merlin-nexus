import { useMerlin } from "@/store/merlinStore";

export const Orb = () => {
  const orbState = useMerlin((s) => s.orbState);
  const labels: Record<string, string> = {
    standby: "STANDBY",
    thinking: "PŘEMÝŠLÍ",
    listening: "POSLOUCHÁ",
    speaking: "MLUVÍ",
  };
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative" style={{ width: 120, height: 120 }}>
        <div className="ring" style={{ inset: 0, animation: "spin-cw 7s linear infinite" }} />
        <div className="ring" style={{ inset: 9, animation: "spin-ccw 5s linear infinite", opacity: 0.7 }} />
        <div className="ring" style={{ inset: 18, animation: "spin-cw 10s linear infinite", opacity: 0.5 }} />
        <div className="ring" style={{ inset: 26, animation: "spin-ccw 4s linear infinite", opacity: 0.4 }} />
        <div className={`orb-core ${orbState}`}>M</div>
      </div>
      <div className="font-orbitron text-[8px] tracking-[4px] text-[var(--merlin-text-bright)]">
        {labels[orbState]}
      </div>
    </div>
  );
};