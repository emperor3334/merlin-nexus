import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { MapView } from "./MapView";
import { VideoView } from "./VideoView";
import { ChartView } from "./ChartView";
import { SearchView } from "./SearchView";
import { TextView } from "./TextView";

export const ContentPanel = () => {
  const active = useMerlin((s) => s.activeContent);

  return (
    <AnimatePresence mode="wait">
      {active.type && (
        <motion.div
          key={active.type}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-10"
          style={{ background: "transparent" }}
        >
          <div className="absolute inset-0">
            {active.type === "map" && <MapView data={active.data} />}
            {active.type === "video" && <VideoView data={active.data} />}
            {active.type === "chart" && <ChartView data={active.data} />}
            {active.type === "search" && <SearchView data={active.data} />}
            {active.type === "text" && <TextView data={active.data} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
