import { useMerlin } from "@/store/merlinStore";

export const ModeIndicator = () => {
  const mode = useMerlin((s) => s.aiMode);
  const online = mode === "claude";
  const label = online ? "● CLAUDE" : mode === "ollama" ? "● OFFLINE // LLAMA 3.2" : "● OFFLINE";
  return (
    <div
      className="fixed top-10 left-5 z-30 font-orbitron pointer-events-none"
      style={{
        fontSize: 8,
        letterSpacing: 2,
        color: online ? "rgba(0,255,170,0.6)" : "rgba(255,170,0,0.6)",
      }}
    >
      {label}
    </div>
  );
};