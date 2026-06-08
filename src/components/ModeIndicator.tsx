import { useMerlin } from "@/store/merlinStore";

export const ModeIndicator = () => {
  const mode = useMerlin((s) => s.aiMode);
  const blockMode = useMerlin((s) => s.blockMode);
  const online = mode === "claude";
  const label = blockMode
    ? "● BLOCK MODE"
    : online
    ? "● CLAUDE"
    : mode === "ollama"
    ? "● OFFLINE // LLAMA 3.2"
    : "● OFFLINE";
  return (
    <div
      className="fixed top-10 left-5 z-30 font-orbitron pointer-events-none"
      style={{
        fontSize: 8,
        letterSpacing: 2,
        color: blockMode
          ? "rgba(255,180,0,0.8)"
          : online
          ? "rgba(0,255,170,0.6)"
          : "rgba(255,170,0,0.6)",
        animation: blockMode ? "mic-fill-pulse 1.4s ease-in-out infinite" : undefined,
      }}
    >
      {label}
    </div>
  );
};