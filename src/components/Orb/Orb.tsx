import { motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

const STATE_LABEL: Record<string, string> = {
  standby: "STANDBY",
  thinking: "PŘEMÝŠLÍ",
  listening: "POSLOUCHÁM",
  speaking: "MLUVÍ",
};

const Ring = ({ size, duration, reverse, opacity }: { size: number; duration: number; reverse?: boolean; opacity: number }) => (
  <div
    className="orb-ring"
    style={{
      width: size,
      height: size,
      animation: `${reverse ? "spin-ccw" : "spin-cw"} ${duration}s linear infinite`,
      opacity,
    }}
  >
    <span className="orb-dot" />
  </div>
);

export const Orb = () => {
  const orbState = useMerlin((s) => s.orbState);
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
      className="flex flex-col items-center gap-3 select-none"
    >
      <div className={`orb-shell orb-${orbState}`} style={{ width: 160, height: 160 }}>
        <Ring size={160} duration={8} opacity={0.55} />
        <Ring size={138} duration={6} reverse opacity={0.45} />
        <Ring size={116} duration={10} opacity={0.35} />
        <Ring size={94} duration={4} reverse opacity={0.3} />
        <div className="orb-core">
          <span>MERLIN</span>
        </div>
      </div>
      <div className="font-orbitron text-[8px] tracking-[5px]" style={{ color: "var(--text)", opacity: 0.7 }}>
        {STATE_LABEL[orbState]}
      </div>
    </motion.div>
  );
};