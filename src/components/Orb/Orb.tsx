import { motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

const STATE_LABEL: Record<string, string> = {
  standby: "STANDBY",
  thinking: "PROCESSING",
  listening: "LISTENING",
  speaking: "SPEAKING",
};

const Ring = ({ size, duration, reverse, opacity }: { size: number; duration: number; reverse?: boolean; opacity: number }) => (
  <div
    className="orb-ring"
    style={{
      width: size,
      height: size,
      animation: `${reverse ? "spin-ccw" : "spin-cw"} ${duration}s linear infinite`,
      opacity,
      borderWidth: 1.5,
    }}
  >
    <span className="orb-dot" />
  </div>
);

export const Orb = ({ size = 200 }: { size?: number }) => {
  const orbState = useMerlin((s) => s.orbState);
  const showLabel = size >= 120;
  const coreSize = Math.round(size * 0.5);
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
      className="flex flex-col items-center gap-3 select-none"
    >
      <div className={`orb-shell orb-${orbState}`} style={{ width: size, height: size }}>
        <Ring size={size} duration={8} opacity={0.65} />
        <Ring size={size * 0.86} duration={6} reverse opacity={0.55} />
        <Ring size={size * 0.72} duration={10} opacity={0.4} />
        <Ring size={size * 0.58} duration={4} reverse opacity={0.35} />
        <div className="orb-core" style={{ width: coreSize, height: coreSize, fontSize: Math.max(8, size * 0.07) }}>
          {showLabel && <span>MERLIN</span>}
        </div>
      </div>
      {showLabel && (
        <div className="font-orbitron text-[9px] tracking-[5px]" style={{ color: "var(--text)", opacity: 0.7 }}>
          {STATE_LABEL[orbState]}
        </div>
      )}
    </motion.div>
  );
};
