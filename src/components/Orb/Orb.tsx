import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useMerlin } from "@/store/merlinStore";

const STATE_LABEL: Record<string, string> = {
  standby: "STANDBY",
  thinking: "PROCESSING",
  listening: "LISTENING",
  speaking: "SPEAKING",
};

// Geodesic "flower of life" style sphere mesh, generated as SVG lines.
const useGeoMesh = () => {
  return useMemo(() => {
    const c = 50;
    const n = 12;
    const rings = [9, 18, 27, 36, 44];
    const TAU = Math.PI * 2;
    const pt = (r: number, a: number): [number, number] => [
      c + r * Math.cos(a),
      c + r * Math.sin(a),
    ];
    const lines: [[number, number], [number, number]][] = [];
    // ring polygons
    rings.forEach((r) => {
      for (let j = 0; j < n; j++) {
        lines.push([pt(r, (j / n) * TAU), pt(r, ((j + 1) / n) * TAU)]);
      }
    });
    // radial + diagonal connectors -> triangles
    for (let i = 0; i < rings.length - 1; i++) {
      const r1 = rings[i];
      const r2 = rings[i + 1];
      for (let j = 0; j < n; j++) {
        const a = (j / n) * TAU;
        const an = ((j + 1) / n) * TAU;
        lines.push([pt(r1, a), pt(r2, a)]);
        lines.push([pt(r1, a), pt(r2, an)]);
      }
    }
    // center spokes
    for (let j = 0; j < n; j++) {
      lines.push([[c, c], pt(rings[0], (j / n) * TAU)]);
    }
    return { lines, c };
  }, []);
};

const GeoSphere = ({ size, color }: { size: number; color: string }) => {
  const { lines } = useGeoMesh();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="pointer-events-none"
      style={{ overflow: "visible" }}
    >
      <circle cx={50} cy={50} r={44} fill="none" stroke={color} strokeWidth={0.6} opacity={0.5} />
      <g stroke={color} strokeWidth={0.35} opacity={0.6} strokeLinecap="round">
        {lines.map((l, i) => (
          <line key={i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} />
        ))}
      </g>
    </svg>
  );
};

// Aura wave rings + expanding pulses that swirl around the center sphere.
const RING_DEFS = [
  { r: 31, dash: "1.5 3", w: 1.2, dir: 1, op: 0.55 },
  { r: 36, dash: "5 4", w: 2.2, dir: -1, op: 0.6 },
  { r: 41, dash: "1 5", w: 1, dir: 1, op: 0.4 },
  { r: 46, dash: "8 5", w: 2.6, dir: -1, op: 0.5 },
  { r: 49, dash: "1 7", w: 1, dir: 1, op: 0.3 },
];

const AuraWaves = ({
  size,
  color,
  state,
  level,
}: {
  size: number;
  color: string;
  state: string;
  level: number;
}) => {
  // speed multiplier (lower = faster rotation)
  const speed =
    state === "thinking" ? 0.4 : state === "speaking" ? 0.65 : state === "listening" ? 0.8 : 1;
  const pulseDur =
    state === "thinking" ? 1.5 : state === "speaking" ? 1 : state === "listening" ? 0.9 : 3.4;
  const reactiveScale =
    state === "listening" ? 1 + level * 0.12 : 1;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
      animate={{ scale: reactiveScale }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ overflow: "visible" }}
      >
        {/* Expanding aura pulse waves */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`p${i}`}
            cx={50}
            cy={50}
            r={32}
            fill="none"
            stroke={color}
            strokeWidth={1}
            style={{ transformOrigin: "50px 50px" }}
            animate={{ scale: [0.7, 1.55], opacity: [0.55, 0] }}
            transition={{
              duration: pulseDur,
              ease: "easeOut",
              repeat: Infinity,
              delay: (pulseDur / 3) * i,
            }}
          />
        ))}
        {/* Rotating segmented rings */}
        {RING_DEFS.map((ring, i) => (
          <motion.circle
            key={`r${i}`}
            cx={50}
            cy={50}
            r={ring.r}
            fill="none"
            stroke={color}
            strokeWidth={ring.w}
            strokeDasharray={ring.dash}
            strokeLinecap="round"
            opacity={ring.op}
            style={{ transformOrigin: "50px 50px" }}
            animate={{ rotate: 360 * ring.dir }}
            transition={{
              duration: (10 + i * 3) * speed,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
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
  const showCenter = true;

  // Glow strength reacts to state + audio
  const baseGlow =
    orbState === "listening" || orbState === "speaking"
      ? 1 + audioLevel * 0.5
      : 1;

  const ringColor =
    orbState === "listening"
      ? "#40d0ff"
      : orbState === "speaking"
      ? "#00ccff"
      : "#00b4ff";

  const glowSpread = baseGlow;

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

        {/* THE RING */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            border: `${Math.max(2, size * 0.018)}px solid ${ringColor}`,
            background: "transparent",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            boxShadow: [
              `0 0 ${20 * glowSpread}px ${ringColor}, 0 0 ${40 * glowSpread}px rgba(0,180,255,0.7), 0 0 ${80 * glowSpread}px rgba(0,140,255,0.4), 0 0 ${120 * glowSpread}px rgba(0,100,255,0.2), inset 0 0 20px rgba(0,180,255,0.10)`,
              `0 0 ${28 * glowSpread}px ${ringColor}, 0 0 ${56 * glowSpread}px rgba(0,180,255,0.8), 0 0 ${100 * glowSpread}px rgba(0,140,255,0.45), 0 0 ${140 * glowSpread}px rgba(0,100,255,0.22), inset 0 0 24px rgba(0,180,255,0.14)`,
              `0 0 ${20 * glowSpread}px ${ringColor}, 0 0 ${40 * glowSpread}px rgba(0,180,255,0.7), 0 0 ${80 * glowSpread}px rgba(0,140,255,0.4), 0 0 ${120 * glowSpread}px rgba(0,100,255,0.2), inset 0 0 20px rgba(0,180,255,0.10)`,
            ],
          }}
          transition={{
            duration: orbState === "thinking" ? 1.2 : orbState === "speaking" ? 0.6 : 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Rotating arc for thinking state */}
        {orbState === "thinking" && (
          <motion.div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: size + 14,
              height: size + 14,
              borderRadius: "50%",
              border: `2px solid transparent`,
              borderTopColor: "#80e0ff",
              borderRightColor: "rgba(128,224,255,0.6)",
              marginLeft: -(size + 14) / 2,
              marginTop: -(size + 14) / 2,
              boxShadow: "0 0 18px rgba(128,224,255,0.6)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "linear", repeat: Infinity }}
          />
        )}

        {/* Center logo */}
        {showCenter && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none flex flex-col items-center"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {showLabel ? (
              <motion.div
                className="flex items-center justify-center"
                style={{ width: size * 0.82, height: size * 0.82 }}
                animate={
                  orbState === "listening"
                    ? { scale: 1 + audioLevel * 0.18, rotate: 0 }
                    : orbState === "speaking"
                    ? { scale: [1, 1.05, 1], rotate: 0 }
                    : orbState === "thinking"
                    ? { rotate: 360, scale: 1 }
                    : { rotate: 360, scale: 1 }
                }
                transition={
                  orbState === "thinking"
                    ? { rotate: { duration: 6, ease: "linear", repeat: Infinity } }
                    : orbState === "speaking"
                    ? { scale: { duration: 0.7, ease: "easeInOut", repeat: Infinity } }
                    : orbState === "listening"
                    ? { scale: { duration: 0.15, ease: "easeOut" } }
                    : { rotate: { duration: 60, ease: "linear", repeat: Infinity } }
                }
              >
                <motion.div
                  className="flex items-center justify-center"
                  style={{ width: "100%", height: "100%" }}
                  animate={{
                    opacity:
                      orbState === "thinking"
                        ? [0.55, 1, 0.55]
                        : orbState === "speaking"
                        ? [0.7, 1, 0.7]
                        : [0.6, 0.85, 0.6],
                    filter: [
                      `drop-shadow(0 0 4px ${ringColor})`,
                      `drop-shadow(0 0 10px ${ringColor})`,
                      `drop-shadow(0 0 4px ${ringColor})`,
                    ],
                  }}
                  transition={{
                    duration:
                      orbState === "thinking" ? 1.2 : orbState === "speaking" ? 0.7 : 3.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                >
                  <GeoSphere size={size * 0.82} color={ringColor} />
                </motion.div>
              </motion.div>
            ) : (
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
            )}
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
          className="font-orbitron mt-4"
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 10,
            letterSpacing: "8px",
            fontWeight: 400,
          }}
        >
          {STATE_LABEL[orbState]}
        </div>
      )}
    </motion.div>
  );
};
