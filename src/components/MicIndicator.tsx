import { useMerlin } from "@/store/merlinStore";
import { useWakeWord } from "@/hooks/useWakeWord";

export const MicIndicator = () => {
  const filled = useMerlin((s) => s.micFilled);
  const { toggle } = useWakeWord();
  return (
    <button
      onClick={toggle}
      aria-label="microphone"
      className="fixed top-5 right-6 z-[1000] rounded-full transition-all"
      style={{
        width: 28,
        height: 28,
        border: filled ? "1.5px solid #00c8ff" : "1.5px solid rgba(0,200,255,0.5)",
        background: filled ? "#00c8ff" : "transparent",
        boxShadow: filled
          ? "0 0 12px rgba(0,200,255,0.8), 0 0 24px rgba(0,200,255,0.4)"
          : "none",
        animation: filled ? "mic-fill-pulse 0.8s ease-in-out infinite" : undefined,
      }}
    />
  );
};
