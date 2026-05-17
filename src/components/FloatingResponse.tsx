import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

export const FloatingResponse = () => {
  const messages = useMerlin((s) => s.messages);
  const orbState = useMerlin((s) => s.orbState);
  const last = messages[messages.length - 1];
  const prev = messages[messages.length - 2];
  const [showUser, setShowUser] = useState<string | null>(null);
  const [showMerlin, setShowMerlin] = useState<string | null>(null);

  useEffect(() => {
    if (!last) return;
    if (last.role === "user") {
      setShowUser(last.text);
      const t = setTimeout(() => setShowUser(null), 3000);
      return () => clearTimeout(t);
    }
    if (last.role === "merlin") {
      setShowMerlin(last.text);
      if (prev?.role === "user") {
        setShowUser(prev.text);
        const t = setTimeout(() => setShowUser(null), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [last?.id]);

  useEffect(() => {
    if (!showMerlin) return;
    if (orbState === "speaking") return;
    const t = setTimeout(() => setShowMerlin(null), 8000);
    return () => clearTimeout(t);
  }, [showMerlin, orbState]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[min(640px,90vw)] pointer-events-none text-center space-y-1.5">
      <AnimatePresence>
        {showUser && (
          <motion.div
            key={`u-${showUser}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-[11px] tracking-wide"
            style={{ color: "rgba(0,200,255,0.5)" }}
          >
            › {showUser}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMerlin && (
          <motion.div
            key={`m-${showMerlin}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="font-rajdhani text-[15px] leading-[1.6] font-normal"
            style={{ color: "#c8e8ff", textShadow: "0 0 20px rgba(0,200,255,0.3)" }}
          >
            {showMerlin}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
