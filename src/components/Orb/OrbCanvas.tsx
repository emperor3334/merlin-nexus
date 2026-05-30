import { useEffect, useRef } from "react";

type Mode = "standby" | "thinking" | "listening" | "speaking";

type RGB = [number, number, number];

interface ModeCfg {
  base: RGB;     // aura color
  accent: RGB;   // sphere wire color
  speed: number; // rotation / flow speed
  wob: number;   // wave irregularity / amplitude
  pulse: number; // rhythmic pulse amount
}

const MODE_CFG: Record<Mode, ModeCfg> = {
  // calm cyan
  standby: { base: [0, 170, 255], accent: [150, 220, 255], speed: 0.12, wob: 1.0, pulse: 0.0 },
  // brighter, faster cyan-white
  thinking: { base: [40, 200, 255], accent: [180, 240, 255], speed: 0.55, wob: 1.7, pulse: 0.18 },
  // greenish living aura
  listening: { base: [40, 235, 165], accent: [170, 255, 205], speed: 0.3, wob: 2.0, pulse: 0.0 },
  // whiter aura
  speaking: { base: [150, 215, 255], accent: [240, 250, 255], speed: 0.38, wob: 2.4, pulse: 0.28 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rgb = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

// 3D wireframe sphere grid
const LAT = 11;
const LONG = 18;
const verts: { x: number; y: number; z: number }[][] = [];
for (let i = 0; i <= LAT; i++) {
  const row: { x: number; y: number; z: number }[] = [];
  const phi = (i / LAT) * Math.PI - Math.PI / 2; // -90..90
  for (let j = 0; j < LONG; j++) {
    const theta = (j / LONG) * Math.PI * 2;
    row.push({
      x: Math.cos(phi) * Math.cos(theta),
      y: Math.sin(phi),
      z: Math.cos(phi) * Math.sin(theta),
    });
  }
  verts.push(row);
}

interface Particle {
  ang: number;
  rad: number;
  spd: number;
  size: number;
  ph: number;
}

export const OrbCanvas = ({
  size,
  state,
  level,
}: {
  size: number;
  state: string;
  level: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  stateRef.current = state;
  levelRef.current = level;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dim = size * 2.4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dim * dpr;
    canvas.height = dim * dpr;
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;
    ctx.scale(dpr, dpr);

    const cx = dim / 2;
    const cy = dim / 2;
    const R = size * 0.42; // sphere radius

    // particle dust field
    const particles: Particle[] = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        ang: Math.random() * Math.PI * 2,
        rad: R * (1.15 + Math.random() * 1.05),
        spd: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.6 + 0.4,
        ph: Math.random() * Math.PI * 2,
      });
    }

    // smoothed current colors / params
    let curBase: RGB = [...MODE_CFG.standby.base] as RGB;
    let curAccent: RGB = [...MODE_CFG.standby.accent] as RGB;
    let curSpeed = MODE_CFG.standby.speed;
    let curWob = MODE_CFG.standby.wob;
    let curPulse = MODE_CFG.standby.pulse;
    let curLevel = 0;

    let rot = 0;
    let t = 0;
    let last = performance.now();
    let raf = 0;

    const tilt = -0.42; // fixed X tilt for 3D feel
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    // multi-harmonic organic wave radius
    const waveR = (baseMult: number, ang: number, seed: number, amp: number) => {
      const w =
        Math.sin(ang * 3 + t * 0.7 + seed) * 0.55 +
        Math.sin(ang * 5 - t * 0.9 + seed * 2.1) * 0.3 +
        Math.sin(ang * 2 + t * 0.4 + seed * 0.7) * 0.4 +
        Math.sin(ang * 7 + t * 1.3 + seed * 1.7) * 0.18;
      return R * baseMult * (1 + amp * 0.05 * w);
    };

    const drawWave = (
      baseMult: number,
      seed: number,
      color: RGB,
      alpha: number,
      width: number,
      dashed: boolean,
      rotOff: number,
      amp: number,
    ) => {
      const steps = 140;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const ang = (i / steps) * Math.PI * 2 + rotOff;
        const r = waveR(baseMult, ang, seed, amp);
        // squash vertically a touch for perspective
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r * 0.94;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.lineWidth = width;
      ctx.strokeStyle = rgb(color, alpha);
      ctx.shadowBlur = 14;
      ctx.shadowColor = rgb(color, 0.6);
      if (dashed) ctx.setLineDash([width * 3.5, width * 4]);
      else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const mode = (stateRef.current as Mode) in MODE_CFG ? (stateRef.current as Mode) : "standby";
      const cfg = MODE_CFG[mode];
      const k = 1 - Math.pow(0.001, dt); // smoothing factor
      for (let i = 0; i < 3; i++) {
        curBase[i] = lerp(curBase[i], cfg.base[i], k);
        curAccent[i] = lerp(curAccent[i], cfg.accent[i], k);
      }
      curSpeed = lerp(curSpeed, cfg.speed, k);
      curWob = lerp(curWob, cfg.wob, k);
      curPulse = lerp(curPulse, cfg.pulse, k);
      curLevel = lerp(curLevel, levelRef.current || 0, 0.2);

      t += dt * (0.6 + curSpeed * 1.6);
      rot += dt * curSpeed;

      const pulse =
        mode === "speaking" || mode === "thinking"
          ? 1 + Math.sin(t * (mode === "speaking" ? 6 : 3.2)) * curPulse * 0.12
          : 1;
      const ampBoost = curWob + curLevel * 3.5;
      const scale = pulse * (1 + curLevel * 0.12);

      ctx.clearRect(0, 0, dim, dim);
      ctx.globalCompositeOperation = "lighter";

      // soft radial bloom behind everything
      const grad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.1);
      grad.addColorStop(0, rgb(curBase, 0.14));
      grad.addColorStop(0.5, rgb(curBase, 0.05));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dim, dim);

      // living aura waves (organic, irregular, slowly counter-rotating)
      drawWave(2.05, 1.1, curBase, 0.18, 1, true, rot * 0.4, ampBoost);
      drawWave(1.82, 3.4, curBase, 0.3, 2.4, true, -rot * 0.6, ampBoost);
      drawWave(1.58, 5.7, curBase, 0.22, 1.2, false, rot * 0.8, ampBoost);
      drawWave(1.4, 0.6, curBase, 0.42, 2.8, true, -rot * 1.0, ampBoost);
      drawWave(1.22, 2.2, curAccent, 0.32, 1.4, false, rot * 1.3, ampBoost);

      // rotating wireframe sphere
      ctx.save();
      const ca = Math.cos(rot * 1.6);
      const sa = Math.sin(rot * 1.6);
      const proj = (v: { x: number; y: number; z: number }) => {
        // rotate around Y
        let x = v.x * ca + v.z * sa;
        let z = -v.x * sa + v.z * ca;
        let y = v.y;
        // tilt around X
        const y2 = y * cosT - z * sinT;
        const z2 = y * sinT + z * cosT;
        return { sx: cx + x * R * scale, sy: cy + y2 * R * scale, depth: z2 };
      };

      const projected = verts.map((row) => row.map(proj));
      const seg = (a: { sx: number; sy: number; depth: number }, b: { sx: number; sy: number; depth: number }) => {
        const d = (a.depth + b.depth) / 2; // -1..1
        const alpha = 0.12 + ((d + 1) / 2) * 0.6;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = rgb(curAccent, alpha);
        ctx.lineWidth = 0.6 + ((d + 1) / 2) * 0.5;
        ctx.stroke();
      };

      ctx.shadowBlur = 6;
      ctx.shadowColor = rgb(curAccent, 0.5);
      for (let i = 0; i <= LAT; i++) {
        for (let j = 0; j < LONG; j++) {
          const a = projected[i][j];
          const b = projected[i][(j + 1) % LONG];
          seg(a, b); // horizontal
          if (i < LAT) {
            const c = projected[i + 1][j];
            seg(a, c); // vertical
            const dpt = projected[i + 1][(j + 1) % LONG];
            seg(a, dpt); // diagonal -> triangles
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.restore();

      // particle dust
      for (const p of particles) {
        p.ang += p.spd * dt * (0.4 + curSpeed);
        const wobR = p.rad * (1 + 0.04 * Math.sin(t + p.ph));
        const x = cx + Math.cos(p.ang) * wobR;
        const y = cy + Math.sin(p.ang) * wobR * 0.94;
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.5 + p.ph));
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rgb(curBase, tw * 0.6);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ transform: "translate(-50%, -50%)" }}
    />
  );
};
