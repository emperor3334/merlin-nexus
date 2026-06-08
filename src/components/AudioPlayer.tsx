import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";

const fmt = (s: number) => {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const SPEEDS = [0.5, 1.0, 1.5, 2.0];

export const AudioPlayer = () => {
  const player = useMerlin((s) => s.audioPlayer);
  const close = useMerlin((s) => s.closeAudioPlayer);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    if (!player) return;
    const a = new Audio(player.url);
    audioRef.current = a;
    a.playbackRate = speed;
    a.play().catch(() => setPlaying(false));
    a.ontimeupdate = () => setTime(a.currentTime);
    a.onloadedmetadata = () => setDur(a.duration);
    a.onended = () => setPlaying(false);
    return () => {
      a.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.url]);

  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, close]);

  // Expose voice controls
  useEffect(() => {
    (window as any).__merlinAudio = {
      seek: (d: number) => {
        if (audioRef.current) audioRef.current.currentTime += d;
      },
      setSpeed: (d: number) => {
        setSpeed((s) => {
          const ns = Math.min(2, Math.max(0.5, s + d));
          if (audioRef.current) audioRef.current.playbackRate = ns;
          return ns;
        });
      },
      toggle: () => toggle(),
      stop: () => close(),
    };
    return () => {
      delete (window as any).__merlinAudio;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (d: number) => {
    if (audioRef.current) audioRef.current.currentTime += d;
  };

  const cycleSpeed = () => {
    setSpeed((s) => {
      const idx = SPEEDS.indexOf(s);
      const ns = SPEEDS[(idx + 1) % SPEEDS.length];
      if (audioRef.current) audioRef.current.playbackRate = ns;
      return ns;
    });
  };

  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <AnimatePresence>
      {player && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col"
          style={{
            bottom: "20%",
            width: 400,
            maxWidth: "90vw",
            background: "rgba(4,8,20,0.85)",
            borderTop: "1px solid rgba(0,200,255,0.3)",
            padding: "14px 18px",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-orbitron"
              style={{ fontSize: 9, letterSpacing: 2, color: "rgba(0,200,255,0.8)" }}
            >
              🎵 {player.sessionId || "SESSION"}
            </span>
            <button
              onClick={close}
              className="font-orbitron"
              style={{ fontSize: 8, letterSpacing: 2, color: "rgba(0,200,255,0.4)" }}
            >
              ESC·CLOSE
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Ctrl onClick={() => seek(-10)}>◀◀</Ctrl>
            <Ctrl onClick={toggle}>{playing ? "❚❚" : "▶"}</Ctrl>
            <Ctrl onClick={() => seek(10)}>▶▶</Ctrl>
            <div
              className="flex-1 relative"
              style={{ height: 2, background: "rgba(0,200,255,0.2)" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const r = (e.clientX - rect.left) / rect.width;
                if (audioRef.current && dur) audioRef.current.currentTime = r * dur;
              }}
            >
              <div
                className="absolute top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${pct}%`,
                  width: 7,
                  height: 7,
                  background: "#00c8ff",
                  boxShadow: "0 0 8px rgba(0,200,255,0.8)",
                }}
              />
            </div>
            <button
              onClick={cycleSpeed}
              className="font-mono"
              style={{ fontSize: 11, color: "rgba(0,200,255,0.8)" }}
            >
              {speed.toFixed(1)}×
            </button>
          </div>

          <div
            className="font-mono text-center"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}
          >
            {fmt(time)} / {fmt(dur)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Ctrl = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="font-orbitron"
    style={{ fontSize: 13, color: "rgba(0,200,255,0.8)" }}
  >
    {children}
  </button>
);