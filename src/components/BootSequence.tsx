import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

const STEPS = ["INITIALIZING...", "LOADING MODULES...", "SYSTEM ONLINE", "STANDBY"];

export const BootSequence = () => {
  const [i, setI] = useState(0);
  const setBoot = useMerlin((s) => s.setBootDone);

  useEffect(() => {
    if (i < STEPS.length - 1) {
      const t = setTimeout(() => setI(i + 1), 550);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBoot(true), 600);
    return () => clearTimeout(t);
  }, [i, setBoot]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 16 }}
          className="orb-shell orb-standby relative"
          style={{ width: 140, height: 140 }}
        >
          <div className="orb-ring" style={{ width: 140, height: 140, animation: "spin-cw 8s linear infinite", opacity: 0.65, borderWidth: 1.5 }}>
            <span className="orb-dot" />
          </div>
          <div className="orb-ring" style={{ width: 120, height: 120, animation: "spin-ccw 6s linear infinite", opacity: 0.55, borderWidth: 1.5 }}>
            <span className="orb-dot" />
          </div>
          <div className="orb-core" style={{ width: 70, height: 70 }}>
            <span>MERLIN</span>
          </div>
        </motion.div>
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-orbitron text-[11px] tracking-[5px]"
          style={{ color: "var(--cyan)" }}
        >
          {STEPS[i]}
        </motion.div>
      </div>
    </motion.div>
  );
};
