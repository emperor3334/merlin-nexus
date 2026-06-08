import { useState } from "react";

interface LogItem {
  time?: string;
  timestamp?: string;
  role?: string;
  event?: string;
  content?: string;
  text?: string;
}

type Filter = "ALL" | "USER" | "MERLIN" | "SYSTEM";
const FILTERS: Filter[] = ["ALL", "USER", "MERLIN", "SYSTEM"];

export const LogView = ({ data }: { data: { entries: LogItem[] } }) => {
  const [filter, setFilter] = useState<Filter>("ALL");
  const entries = data?.entries || [];
  const filtered = entries.filter((e) => {
    if (filter === "ALL") return true;
    const tag = (e.role || e.event || "").toUpperCase();
    return tag.includes(filter);
  });

  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="flex gap-3 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="font-orbitron transition-colors"
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: filter === f ? "rgba(0,200,255,0.9)" : "rgba(0,200,255,0.35)",
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto font-mono" style={{ fontSize: 12, lineHeight: 1.6 }}>
        {filtered.map((e, i) => (
          <div key={i} className="flex gap-3 mb-1">
            <span style={{ color: "rgba(0,200,255,0.4)" }}>
              {e.time || e.timestamp || ""}
            </span>
            <span style={{ color: "rgba(255,200,0,0.6)", minWidth: 60 }}>
              {(e.role || e.event || "").toUpperCase()}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              {e.content || e.text || ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};