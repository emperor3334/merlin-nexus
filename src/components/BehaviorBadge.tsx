import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

export const BehaviorBadge = () => {
  const trigger = useMerlin((s) => s.behaviorBadge);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 -translate-x-1/2 z-40 font-orbitron pointer-events-none"
          style={{ bottom: 130, fontSize: 9, letterSpacing: 2, color: "rgba(0,255,200,0.6)" }}
        >
          ◈ Using learned behavior
        </motion.div>
      )}
    </AnimatePresence>
  );
};