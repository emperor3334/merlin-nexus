import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

const STATE_LABEL: Record<string, string> = {
  standby: "STANDBY",
  thinking: "PROCESSING",
  listening: "LISTENING",
  speaking: "SPEAKING",
};

const Ring = ({
  size,
  duration,
  reverse,
  opacity,
}: {
  size: number;
  duration: number;
  reverse?: boolean;
  opacity: number;
}) => (
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
  const audioLevel = useMerlin((s) => s.audioLevel);
  const wakeFlash = useMerlin((s) => s.wakeFlash);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!wakeFlash) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [wakeFlash]);

  const showLabel = size >= 120;
  const coreSize = Math.round(size * 0.5);
  // Speed multiplier per state
  const speed = orbState === "listening" ? 0.35 : orbState === "speaking" ? 0.6 : orbState === "thinking" ? 0.7 : 1;
  // Pulse: driven by audio level when listening/speaking
  const corePulse = (orbState === "listening" || orbState === "speaking")
    ? 1 + audioLevel * 0.3
    : 1;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
      className="flex flex-col items-center gap-3 select-none"
    >
      <div
        className={`orb-shell orb-${orbState}`}
        style={{ width: size, height: size, position: "relative" }}
      >
        <Ring size={size} duration={10 * speed} opacity={0.65} />
        <Ring size={size * 0.86} duration={8 * speed} reverse opacity={0.55} />
        <Ring size={size * 0.72} duration={14 * speed} opacity={0.4} />
        <Ring size={size * 0.58} duration={6 * speed} reverse opacity={0.35} />

        <motion.div
          className="orb-core"
          style={{
            width: coreSize,
            height: coreSize,
            fontSize: Math.max(8, size * 0.07),
          }}
          animate={{ scale: corePulse }}
          transition={{ duration: 0.08, ease: "easeOut" }}
        >
          {showLabel && <span>MERLIN</span>}
        </motion.div>

        {/* Wake-word flash ripple */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.8, scale: 0.8 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                border: "2px solid #ffffff",
                boxShadow: "0 0 30px rgba(255,255,255,0.8)",
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {showLabel && (
        <div className="font-orbitron text-[9px] tracking-[5px]" style={{ color: "var(--text)", opacity: 0.7 }}>
          {STATE_LABEL[orbState]}
        </div>
      )}
    </motion.div>
  );
};
