import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Cursor } from "@/components/Cursor";
import { GridBackground } from "@/components/Background/GridBackground";
import { Particles } from "@/components/Background/Particles";
import { Orb } from "@/components/Orb/Orb";
import { ContentPanel } from "@/components/DynamicContent/ContentPanel";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { InputBar } from "@/components/Chat/InputBar";
import { Ticker } from "@/components/Ticker";
import { ActivityLog } from "@/components/ActivityLog";
import { BootSequence } from "@/components/BootSequence";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPI } from "@/api/merlin-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MERLIN — Osobní AI Asistent" },
      { name: "description", content: "MERLIN v2.0 — hlasově ovládaný sci-fi AI asistent inspirovaný JARVISem." },
    ],
  }),
  component: Index,
});

function Index() {
  const bootDone = useMerlin((s) => s.bootDone);
  const hasContent = useMerlin((s) => s.activeContent.type !== null);

  useEffect(() => {
    const { setBackendOnline, log } = useMerlin.getState();
    MerlinAPI.status()
      .then(() => { setBackendOnline(true); log("BACKEND ONLINE"); })
      .catch(() => { setBackendOnline(false); log("BACKEND OFFLINE — SIM"); });
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <GridBackground />
      <Particles />
      <div className="scanlines" />
      <div className="vignette" />
      <div className="scanline-anim" />
      <Cursor />

      <AnimatePresence>{!bootDone && <BootSequence />}</AnimatePresence>

      <Ticker />
      <ContentPanel />
      <ChatPanel />

      <div
        className="absolute z-20 transition-all duration-700 ease-out pointer-events-none"
        style={
          hasContent
            ? { right: 60, top: 80, transform: "scale(0.7)" }
            : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <Orb />
      </div>

      <ActivityLog />
      <InputBar />
    </div>
  );
}