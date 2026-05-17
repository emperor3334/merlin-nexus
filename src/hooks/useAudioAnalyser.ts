import { useEffect, useRef } from "react";
import { useMerlin } from "@/store/merlinStore";

/**
 * Hook that listens to mic input while sessionActive=true and pushes
 * a normalized 0..1 volume into the store as audioLevel.
 * Used by the Orb to react to the user's voice.
 */
export function useMicAnalyser() {
  const sessionActive = useMerlin((s) => s.sessionActive);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionActive) return;
    if (typeof window === "undefined" || !navigator.mediaDevices) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const Ctx =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        src.connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const tick = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          const norm = Math.min(1, rms * 3);
          useMerlin.getState().setAudioLevel(norm);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // mic denied — silently fall back
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      useMerlin.getState().setAudioLevel(0);
    };
  }, [sessionActive]);
}