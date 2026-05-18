import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { MapView } from "./MapView";
import { VideoView } from "./VideoView";
import { ChartView } from "./ChartView";
import { SearchView } from "./SearchView";
import { TextView } from "./TextView";
import { WebContent } from "@/components/ContentWindow/WebContent";
import { useEffect } from "react";

export const ContentPanel = () => {
  const active = useMerlin((s) => s.activeContent);
  const clearContent = useMerlin((s) => s.clearContent);

  useEffect(() => {
    if (!active.type) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearContent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active.type, clearContent]);

  const label = active.title || (active.url ? new URL(active.url.startsWith("http") ? active.url : `https://${active.url}`).hostname.replace(/^www\./, "") : "");

  return (
    <AnimatePresence mode="wait">
      {active.type && (
        <motion.div
          key={active.type + (active.url || "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-[40] pointer-events-none"
        >
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          >
            {active.type === "map" && <MapView data={active.data} />}
            {active.type === "video" && <VideoView data={active.data} />}
            {active.type === "chart" && <ChartView data={active.data} />}
            {active.type === "search" && <SearchView data={active.data} />}
            {active.type === "text" && <TextView data={active.data} />}
            {active.type === "web" && <WebContent url={active.data?.url || active.url || ""} />}
          </div>

          {label && (
            <div
              className="absolute top-6 left-1/2 -translate-x-1/2 font-orbitron pointer-events-none"
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "rgba(0,200,255,0.6)",
                zIndex: 60,
              }}
            >
              ● {label.toUpperCase()}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
