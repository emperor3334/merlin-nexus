import { AnimatePresence } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { MapView } from "./MapView";
import { VideoView } from "./VideoView";
import { ChartView } from "./ChartView";
import { SearchView } from "./SearchView";
import { TextView } from "./TextView";
import { ContentWindow } from "@/components/ContentWindow/ContentWindow";
import { WebContent } from "@/components/ContentWindow/WebContent";

export const ContentPanel = () => {
  const active = useMerlin((s) => s.activeContent);

  return (
    <AnimatePresence mode="wait">
      {active.type && (
        <ContentWindow key={active.type + (active.url || "")} url={active.url} title={active.title}>
          {active.type === "map" && <MapView data={active.data} />}
          {active.type === "video" && <VideoView data={active.data} />}
          {active.type === "chart" && <ChartView data={active.data} />}
          {active.type === "search" && <SearchView data={active.data} />}
          {active.type === "text" && <TextView data={active.data} />}
          {active.type === "web" && <WebContent url={active.data?.url || active.url || ""} />}
        </ContentWindow>
      )}
    </AnimatePresence>
  );
};
