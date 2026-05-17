import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cursor } from "@/components/Cursor";
import { GridBackground } from "@/components/Background/GridBackground";
import { Particles } from "@/components/Background/Particles";
import { Orb } from "@/components/Orb/Orb";
import { ContentPanel } from "@/components/DynamicContent/ContentPanel";
import { Ticker } from "@/components/Ticker";
import { ActivityLog } from "@/components/ActivityLog";
import { BootSequence } from "@/components/BootSequence";
import { MicIndicator } from "@/components/MicIndicator";
import { FloatingResponse } from "@/components/FloatingResponse";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPI } from "@/api/merlin-api";
import { Terminal } from "@/components/Terminal/Terminal";
import { ModeIndicator } from "@/components/ModeIndicator";
import { useMicAnalyser } from "@/hooks/useAudioAnalyser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MERLIN — Personal AI Assistant" },
      { name: "description", content: "MERLIN v2.0 — voice-controlled sci-fi AI assistant inspired by JARVIS." },
    ],
  }),
  component: Index,
});

function Index() {
  const bootDone = useMerlin((s) => s.bootDone);
  const hasContent = useMerlin((s) => s.activeContent.type !== null);
  useMicAnalyser();

  useEffect(() => {
    const { setBackendOnline, setAiMode, log } = useMerlin.getState();
    log("SYSTEM INIT");
    MerlinAPI.status()
      .then(() => { setBackendOnline(true); log("BACKEND CONNECTED"); })
      .catch(() => { setBackendOnline(false); log("BACKEND OFFLINE — SIM"); });
    MerlinAPI.mode()
      .then((d: any) => {
        if (d?.mode) setAiMode(d.mode, d.internet);
      })
      .catch(() => {});
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
      <ModeIndicator />
      <ContentPanel />

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="absolute z-20 pointer-events-none"
        style={
          hasContent
            ? { right: 24, bottom: 80 }
            : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <Orb size={hasContent ? 56 : 160} />
      </motion.div>

      <FloatingResponse />
      <ActivityLog />
      <MicIndicator />
      <Terminal />
    </div>
  );
}
