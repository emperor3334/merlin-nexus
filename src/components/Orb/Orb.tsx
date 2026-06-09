import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useMerlin } from "@/store/merlinStore";
import { OrbCanvas } from "./OrbCanvas";

const STATE_LABEL: Record<string, string> = {
  standby: "STANDBY",
  thinking: "PROCESSING",
  listening: "LISTENING",
  speaking: "SPEAKING",
};

// 8 compass tick marks around the ring
const Ticks = ({ size }: { size: number }) => {
  const r = size / 2;
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = i * 45;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: 2,
              height: 9,
              background: "rgba(0,200,255,0.7)",
              boxShadow: "0 0 4px rgba(0,200,255,0.7)",
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${r + 10}px)`,
              transformOrigin: "center",
            }}
          />
        );
      })}
    </>
  );
};

// 4 corner brackets at 45deg positions
const CornerBrackets = ({ size }: { size: number }) => {
  const offset = size / 2 + 22;
  const bracket = (rot: number) => (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        width: 10,
        height: 10,
        transform: `translate(-50%, -50%) rotate(${rot}deg) translateY(-${offset}px)`,
        transformOrigin: "center",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderTop: "1px solid rgba(0,200,255,0.55)",
          borderLeft: "1px solid rgba(0,200,255,0.55)",
        }}
      />
    </div>
  );
  return (
    <>
      {bracket(45)}
      {bracket(135)}
      {bracket(225)}
      {bracket(315)}
    </>
  );
};

export const Orb = ({ size = 160 }: { size?: number }) => {
  const orbState = useMerlin((s) => s.orbState);
  const audioLevel = useMerlin((s) => s.audioLevel);
  const wakeFlash = useMerlin((s) => s.wakeFlash);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!wakeFlash) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [wakeFlash]);

  const showLabel = size >= 110;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
      className="flex flex-col items-center select-none"
      style={{ width: size + 80, height: size + 80 }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size + 60, height: size + 60 }}
      >
        {/* Tick marks */}
        <Ticks size={size} />
        {/* Corner brackets */}
        {showLabel && <CornerBrackets size={size} />}

        {/* Big idle orb: living rotating sphere + organic aura (canvas) */}
        {showLabel && (
          <OrbCanvas size={size} state={orbState} level={audioLevel} />
        )}

        {/* Small orb: lightweight version of the center piece */}
        {!showLabel && (
          <OrbCanvas size={size} state={orbState} level={audioLevel} lite />
        )}

        {/* Center text for the small orb */}
        {!showLabel && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none flex flex-col items-center"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <span
              className="font-orbitron"
              style={{
                color: "#ffffff",
                fontSize: Math.max(7, size * 0.11),
                letterSpacing: Math.max(1, size * 0.025) + "px",
                fontWeight: 500,
                textShadow: "0 0 12px rgba(0,200,255,0.8)",
              }}
            >
              MERLIN
            </span>
          </div>
        )}

        {/* Wake-word flash ripple */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                border: "2px solid #ffffff",
                boxShadow: "0 0 30px rgba(255,255,255,0.8)",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <div
          className="font-orbitron"
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 10,
            letterSpacing: "8px",
            fontWeight: 400,
            marginTop: size * 0.6,
          }}
        >
          {STATE_LABEL[orbState]}
        </div>
      )}
    </motion.div>
  );
};
