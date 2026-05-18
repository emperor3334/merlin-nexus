import { useMerlin } from "@/store/merlinStore";

export const BottomBar = () => {
  const backend = useMerlin((s) => s.backendOnline);
  const mode = useMerlin((s) => s.aiMode);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex items-center justify-between px-5"
      style={{ height: 28, fontFamily: "Orbitron, sans-serif" }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "2px",
          color: "rgba(0,200,255,0.35)",
        }}
      >
        {backend ? "LINK • OK" : "LINK • OFFLINE"} · MODE {mode?.toUpperCase() ?? "—"}
      </div>

      <div className="flex items-center gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              border: "1px solid rgba(0,200,255,0.35)",
              display: "inline-block",
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 9,
          letterSpacing: "2px",
          color: "rgba(0,200,255,0.35)",
        }}
      >
        SYS v2.0 · UTC
      </div>
    </div>
  );
};
