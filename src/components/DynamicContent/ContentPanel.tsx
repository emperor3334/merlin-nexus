import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMerlin } from "@/store/merlinStore";
import { MapView } from "./MapView";
import { VideoView } from "./VideoView";
import { ChartView } from "./ChartView";
import { SearchView } from "./SearchView";
import { TextView } from "./TextView";

export const ContentPanel = () => {
  const active = useMerlin((s) => s.activeContent);
  const clear = useMerlin((s) => s.clearContent);

  return (
    <AnimatePresence mode="wait">
      {active.type && (
        <motion.div
          key={active.type}
          initial={{ opacity: 0, x: -20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute top-12 bottom-24 left-4 md:left-6 right-4 md:right-[340px] z-20"
        >
          <div className="relative w-full h-full border border-[var(--border)] bg-[var(--panel-bg)] overflow-hidden backdrop-blur-sm">
            <button
              onClick={clear}
              className="absolute top-3 right-3 z-30 w-7 h-7 flex items-center justify-center border border-[var(--border)] text-[var(--text)] hover:text-[var(--cyan)] hover:border-[var(--cyan)] transition-colors"
              aria-label="zavřít"
            >
              <X size={14} />
            </button>
            {active.type === "map" && <MapView data={active.data} />}
            {active.type === "video" && <VideoView data={active.data} />}
            {active.type === "chart" && <ChartView data={active.data} />}
            {active.type === "search" && <SearchView data={active.data} />}
            {active.type === "text" && <TextView data={active.data} />}
            <span className="corner-bracket tl" />
            <span className="corner-bracket tr" />
            <span className="corner-bracket bl" />
            <span className="corner-bracket br" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};