import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

export const ActivityLog = () => {
  const log = useMerlin((s) => s.activityLog);
  return (
    <div className="absolute bottom-[90px] right-4 md:right-6 w-[260px] z-20 pointer-events-none space-y-0.5">
      <AnimatePresence>
        {log.slice(0, 5).map((l) => (
          <motion.div
            key={`${l.time}-${l.text}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 0.55, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-[9px] text-[var(--text)] tracking-wide text-right"
          >
            <span className="text-[var(--cyan)] opacity-70">{l.time}</span> › {l.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};