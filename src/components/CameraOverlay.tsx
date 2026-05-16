import { useEffect, useRef, useState } from "react";
import { useMerlin } from "@/store/merlinStore";
import { Camera, X } from "lucide-react";
import { MerlinAPI } from "@/api/merlin-api";

export const CameraOverlay = () => {
  const { cameraOpen, setCameraOpen, backendMode, log } = useMerlin();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cameraOpen) return;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      } catch (e) { log("KAMERA NEDOSTUPNÁ"); }
    })();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setAnalysis("");
    };
  }, [cameraOpen, log]);

  if (!cameraOpen) return null;

  const analyze = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    const b64 = c.toDataURL("image/jpeg").split(",")[1];
    try {
      if (backendMode) {
        const r = await MerlinAPI.vision(b64, "Co vidíš na obrázku?");
        setAnalysis(r.analysis || "Bez výsledku.");
      } else {
        setAnalysis("Vision API vyžaduje backend. Spusťte app.py pro plnou analýzu.");
      }
    } catch (e: any) {
      setAnalysis(`Chyba: ${e?.message}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[800] flex items-center justify-center backdrop-blur-md">
      <div className="merlin-panel p-4 max-w-[600px]">
        <div className="corner tl" /><div className="corner tr" />
        <div className="corner bl" /><div className="corner br" />
        <div className="flex justify-between items-center mb-3">
          <div className="font-orbitron text-xs tracking-[3px] text-[var(--merlin-primary)]">// VISION SYSTEM</div>
          <button onClick={() => setCameraOpen(false)} className="text-[var(--merlin-text)]"><X size={16} /></button>
        </div>
        <video ref={videoRef} width={480} height={270} className="bg-black border border-[var(--merlin-border)]" />
        <div className="flex gap-2 mt-3">
          <button onClick={analyze} disabled={busy} className="tech-btn active flex-1 py-2">
            <Camera size={10} className="inline mr-1" /> {busy ? "ANALYZUJI..." : "ANALYZOVAT"}
          </button>
          <button onClick={() => setCameraOpen(false)} className="tech-btn py-2">ZAVŘÍT</button>
        </div>
        {analysis && (
          <div className="merlin-bubble mt-3 p-2 text-[12px] text-[var(--merlin-text-bright)]">
            {analysis}
          </div>
        )}
      </div>
    </div>
  );
};