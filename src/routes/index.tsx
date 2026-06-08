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
import { TopBar } from "@/components/TopBar";
import { BottomBar } from "@/components/BottomBar";
import { FileUploadButton } from "@/components/FileUploadButton";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ProcessPanel } from "@/components/ProcessPanel";
import { SSHTerminal } from "@/components/SSHTerminal";
import { SplitScreen } from "@/components/SplitScreen";
import { SchedulerBadge } from "@/components/SchedulerBadge";
import { BehaviorBadge } from "@/components/BehaviorBadge";
import { ProjectIndicator } from "@/components/ProjectIndicator";
import { MerlinAPIv8 } from "@/api/merlin-api";
import { ClapDetector } from "@/lib/clap-detector";

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
  const sessionActive = useMerlin((s) => s.sessionActive);
  useMicAnalyser();

  useEffect(() => {
    const { setBackendOnline, setAiMode, setDateTime, log } = useMerlin.getState();
    log("SYSTEM INIT");
    MerlinAPI.status()
      .then((d: any) => {
        setBackendOnline(true);
        if (d?.datetime) setDateTime(d.datetime);
        log("BACKEND CONNECTED");
      })
      .catch(() => { setBackendOnline(false); log("BACKEND OFFLINE — SIM"); });
    MerlinAPI.mode()
      .then((d: any) => {
        if (d?.mode) setAiMode(d.mode, d.internet);
      })
      .catch(() => {});
  }, []);

  // Double-clap wake detection
  useEffect(() => {
    const detector = new ClapDetector(() => {
      MerlinAPIv8.wake("clap")
        .then((data: any) => {
          if (data?.tts?.audio) {
            const a = new Audio(`data:audio/${data.tts.format || "mp3"};base64,${data.tts.audio}`);
            a.play().catch(() => {});
          }
          useMerlin.getState().setSessionActive(true);
          useMerlin.getState().triggerWakeFlash();
        })
        .catch(() => {});
    });
    detector.start().catch(() => {});
    return () => detector.stop();
  }, []);

  // Session heartbeat
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(async () => {
      try {
        const r = await MerlinAPIv8.wakeHeartbeat();
        if (!r?.active) useMerlin.getState().setSessionActive(false);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, [sessionActive]);

  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <GridBackground />
      <Particles />
      <div className="vignette" />
      {!hasContent && <div className="scanline-anim" />}
      <Cursor />

      <AnimatePresence>{!bootDone && <BootSequence />}</AnimatePresence>

      <TopBar />
      <Ticker />
      <ModeIndicator />
      <ContentPanel />
      <SplitScreen />

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="absolute z-20 pointer-events-none"
        style={
          hasContent
            ? { right: 28, bottom: 150 }
            : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <Orb size={hasContent ? 60 : 160} />
      </motion.div>

      <FloatingResponse />
      <ActivityLog />
      <MicIndicator />
      <Terminal />
      <BottomBar />
      <FileUploadButton />
      <AudioPlayer />
      <ProcessPanel />
      <SSHTerminal />
      <SchedulerBadge />
      <BehaviorBadge />
      <ProjectIndicator />
    </div>
  );
}
