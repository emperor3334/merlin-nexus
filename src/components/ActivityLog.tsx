import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

export const ActivityLog = () => {
  const log = useMerlin((s) => s.activityLog);
  return (
    <div className="fixed bottom-[60px] right-5 z-20 pointer-events-none space-y-0.5 text-right">
      <AnimatePresence>
        {log.slice(0, 5).map((l) => (
          <motion.div
            key={`${l.time}-${l.text}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 0.45, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-[9px] tracking-[1px]"
            style={{ color: "rgba(0, 200, 255, 0.45)" }}
          >
            <span style={{ opacity: 0.7 }}>{l.time}</span> › {l.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
