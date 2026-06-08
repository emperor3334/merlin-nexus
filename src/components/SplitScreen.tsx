import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMerlin, type SplitWindow } from "@/store/merlinStore";
import { ContentDisplay } from "./DynamicContent/ContentDisplay";

const SplitPane = ({ window: win }: { window: SplitWindow }) => (
  <div
    className="relative overflow-hidden w-full h-full"
    style={{
      WebkitMaskImage:
        "radial-gradient(ellipse 90% 85% at 50% 50%, black 40%, transparent 100%)",
      maskImage:
        "radial-gradient(ellipse 90% 85% at 50% 50%, black 40%, transparent 100%)",
    }}
  >
    <ContentDisplay content={win.content} />
  </div>
);

export const SplitScreen = () => {
  const split = useMerlin((s) => s.splitScreen);
  const close = useMerlin((s) => s.setSplitScreen);

  useEffect(() => {
    if (!split) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [split, close]);

  if (!split) return null;

  const gridStyle: React.CSSProperties =
    split.layout === "2-horizontal"
      ? { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" }
      : split.layout === "2-vertical"
      ? { gridTemplateColumns: "1fr", gridTemplateRows: "1fr 1fr" }
      : { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[16] grid"
        style={{
          ...gridStyle,
          gap: 1,
          background: "rgba(0,200,255,0.15)",
          padding: "50px 20px 70px 20px",
        }}
      >
        {split.windows.map((w) => (
          <SplitPane key={w.id} window={w} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};