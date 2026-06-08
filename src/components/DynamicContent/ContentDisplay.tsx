import type { ActiveContent } from "@/store/merlinStore";
import { MapView } from "./MapView";
import { VideoView } from "./VideoView";
import { ChartView } from "./ChartView";
import { SearchView } from "./SearchView";
import { TextView } from "./TextView";
import { ImageView } from "./ImageView";
import { WhiteView } from "./WhiteView";
import { FileBrowserView } from "./FileBrowserView";
import { LogView } from "./LogView";
import { WebContent } from "@/components/ContentWindow/WebContent";

export const ContentDisplay = ({ content }: { content: ActiveContent }) => {
  switch (content.type) {
    case "map":
      return <MapView data={content.data} />;
    case "video":
      return <VideoView data={content.data} />;
    case "chart":
      return <ChartView data={content.data} />;
    case "search":
      return <SearchView data={content.data} />;
    case "text":
      return <TextView data={content.data} />;
    case "white":
      return <WhiteView data={content.data} />;
    case "image":
      return <ImageView data={content.data} />;
    case "files":
      return <FileBrowserView data={content.data} />;
    case "log":
      return <LogView data={content.data} />;
    case "web":
      return <WebContent url={content.data?.url || content.url || ""} />;
    default:
      return null;
  }
};