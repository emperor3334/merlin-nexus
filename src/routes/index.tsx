import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Ticker } from "@/components/Ticker";
import { Orb } from "@/components/Orb";
import { MicButton } from "@/components/MicButton";
import { VideoPanel } from "@/components/VideoPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { Chart } from "@/components/Chart";
import { Footer } from "@/components/Footer";
import { CornerDeco } from "@/components/CornerDeco";
import { Cursor } from "@/components/Cursor";
import { MapBackground } from "@/components/MapBackground";
import { ActivityLog } from "@/components/ActivityLog";
import { CameraOverlay } from "@/components/CameraOverlay";
import { SearchResults } from "@/components/SearchResults";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPI } from "@/api/merlin-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MERLIN — Osobní AI Asistent" },
      { name: "description", content: "MERLIN v2.0-BETA — sci-fi AI command interface inspirovaný JARVISem." },
    ],
  }),
  component: Index,
});

function Index() {
  const { setBackendMode, tick, log } = useMerlin();

  useEffect(() => {
    MerlinAPI.status()
      .then(() => { setBackendMode(true); log("BACKEND ONLINE"); })
      .catch(() => { setBackendMode(false); log("BACKEND OFFLINE — SIM MODE"); });
  }, [setBackendMode, log]);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      <MapBackground />
      <div className="scanlines" />
      <div className="vignette" />
      <div className="scanline-anim" />
      <Cursor />

      <div className="relative z-10 flex flex-col h-full">
        <Ticker />
        <div className="flex-1 flex min-h-0">
          <VideoPanel />
          <div className="w-[320px] m-2 ml-0 merlin-panel flex flex-col min-h-0">
            <CornerDeco />
            <Orb />
            <MicButton />
            <ChatPanel />
            <ActivityLog />
          </div>
        </div>
        <Chart />
        <Footer />
      </div>

      <SearchResults />
      <CameraOverlay />
    </div>
  );
}
