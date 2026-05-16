import { useMerlin } from "@/store/merlinStore";
import { CornerDeco } from "./CornerDeco";
import { Camera, Play } from "lucide-react";

export const CHANNELS: Record<string, { name: string; url: string }> = {
  "ct-sport": { name: "ČT SPORT", url: "https://www.ceskatelevize.cz/sport/zive-vysilani/" },
  ct24: { name: "ČT24", url: "https://ct24.ceskatelevize.cz/" },
  yt: { name: "YOUTUBE", url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
  map: { name: "MAPA", url: "https://www.openstreetmap.org/export/embed.html?bbox=12.0%2C48.5%2C19.0%2C51.2&layer=mapnik" },
  wiki: { name: "WIKI", url: "https://cs.wikipedia.org/wiki/Speci%C3%A1ln%C3%AD:N%C3%A1hodn%C3%A1_str%C3%A1nka" },
};

export const VideoPanel = () => {
  const { currentChannel, videoUrl, setChannel, setCameraOpen } = useMerlin();

  return (
    <div className="merlin-panel flex-1 m-2 flex flex-col overflow-hidden">
      <CornerDeco />
      <div className="flex items-center justify-between border-b border-[var(--merlin-border)] px-3 py-1.5 gap-2">
        <div className="font-orbitron text-[9px] tracking-[3px] text-[var(--merlin-primary)]">
          // MEDIA CENTER
        </div>
        <div className="flex gap-1.5">
          {Object.entries(CHANNELS).map(([id, ch]) => (
            <button
              key={id}
              className={`tech-btn ${currentChannel === id ? "active" : ""}`}
              onClick={() => setChannel(id, ch.url)}
            >
              {ch.name}
            </button>
          ))}
          <button className="tech-btn" onClick={() => setCameraOpen(true)}>
            <Camera size={10} className="inline mr-1" />
            KAM
          </button>
        </div>
      </div>
      <div className="flex-1 relative bg-black/40">
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className="w-full h-full"
            style={{ border: "none" }}
            allow="autoplay; encrypted-media"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[var(--merlin-text)]">
            <div className="relative">
              <Play size={64} className="text-[var(--merlin-primary)] opacity-60" />
              <div className="absolute inset-0 animate-ping">
                <Play size={64} className="text-[var(--merlin-primary)] opacity-20" />
              </div>
            </div>
            <div className="font-orbitron text-xs tracking-[3px] opacity-70">
              ŘEKNĚTE MERLINOVI CO ZOBRAZIT
            </div>
          </div>
        )}
      </div>
    </div>
  );
};