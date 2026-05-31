import { useEffect, useRef } from "react";

type Mode = "standby" | "thinking" | "listening" | "speaking";

type RGB = [number, number, number];

interface ModeCfg {
  base: RGB;   // aura particle color
  accent: RGB; // sphere wire color
  speed: number; // base flow speed
  wob: number;   // wave amplitude
  dir: number;   // sphere rotation direction (+1 / -1)
}

const MODE_CFG: Record<Mode, ModeCfg> = {
  // calm teal-cyan, slow CW
  standby:   { base: [40, 200, 220], accent: [150, 225, 255], speed: 0.10, wob: 1.0, dir: 1 },
  // brighter cyan-white, fast CCW
  thinking:  { base: [60, 215, 255], accent: [190, 245, 255], speed: 0.40, wob: 1.6, dir: -1 },
  // greenish living aura, medium CW
  listening: { base: [40, 235, 175], accent: [175, 255, 210], speed: 0.24, wob: 2.0, dir: 1 },
  // whiter aura, medium CCW
  speaking:  { base: [150, 225, 255], accent: [240, 250, 255], speed: 0.30, wob: 2.3, dir: -1 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rgb = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

// ---- 3D wireframe "flower of life" sphere grid ----
const LAT = 14;
const LONG = 22;
const verts: { x: number; y: number; z: number }[][] = [];
for (let i = 0; i <= LAT; i++) {
  const row: { x: number; y: number; z: number }[] = [];
  const phi = (i / LAT) * Math.PI - Math.PI / 2;
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

// ---- aura particle: lives on a wavy concentric band ----
interface Particle {
  band: number;   // which wave band (0..N-1)
  ang: number;    // angular position
  rBase: number;  // base radius multiplier
  seed: number;   // phase seed for the wobble
  size: number;
  spd: number;    // own angular drift
  bright: number; // brightness factor
  tph: number;    // twinkle phase
}

const BANDS = 4;
const PARTICLES = 2600;

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

    const dim = size * 2.7;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dim * dpr;
    canvas.height = dim * dpr;
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;
    ctx.scale(dpr, dpr);

    const cx = dim / 2;
    const cy = dim / 2;
    const R = size * 0.34; // sphere radius

    // band base radii (multiplier of R) — the wavy dot rings
    const bandR = [1.55, 1.95, 2.35, 2.78];

    // build aura particles
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLES; i++) {
      const band = i % BANDS;
      particles.push({
        band,
        ang: Math.random() * Math.PI * 2,
        rBase: bandR[band] * (0.97 + Math.random() * 0.06),
        seed: Math.random() * Math.PI * 2,
        size: Math.random() * 1.1 + 0.35,
        spd: (Math.random() - 0.5) * 0.06,
        bright: 0.4 + Math.random() * 0.6,
        tph: Math.random() * Math.PI * 2,
      });
    }

    // smoothed params
    const curBase: RGB = [...MODE_CFG.standby.base] as RGB;
    const curAccent: RGB = [...MODE_CFG.standby.accent] as RGB;
    let curSpeed = MODE_CFG.standby.speed;
    let curWob = MODE_CFG.standby.wob;
    let curDir = MODE_CFG.standby.dir;
    let curLevel = 0;

    let rot = 0;     // sphere rotation
    let flow = 0;    // aura flow phase
    let t = 0;
    let last = performance.now();
    let raf = 0;

    const tilt = -0.4;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    // multi-harmonic organic radial offset for a particle band
    const waveOffset = (band: number, ang: number, amp: number) => {
      const s = band * 1.7;
      const w =
        Math.sin(ang * 3 + flow * 0.8 + s) * 0.5 +
        Math.sin(ang * 5 - flow * 1.0 + s * 2.1) * 0.28 +
        Math.sin(ang * 2 + flow * 0.5 + s * 0.6) * 0.42 +
        Math.sin(ang * 7 + flow * 1.3 + s * 1.6) * 0.16 +
        Math.sin(ang * 11 - flow * 0.7 + s * 2.4) * 0.08;
      return amp * 0.085 * w;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const mode = (stateRef.current as Mode) in MODE_CFG ? (stateRef.current as Mode) : "standby";
      const cfg = MODE_CFG[mode];
      const k = 1 - Math.pow(0.0015, dt);
      for (let i = 0; i < 3; i++) {
        curBase[i] = lerp(curBase[i], cfg.base[i], k);
        curAccent[i] = lerp(curAccent[i], cfg.accent[i], k);
      }
      curSpeed = lerp(curSpeed, cfg.speed, k);
      curWob = lerp(curWob, cfg.wob, k);
      curDir = lerp(curDir, cfg.dir, k * 0.6); // smoothly flip direction
      curLevel = lerp(curLevel, levelRef.current || 0, 0.18);

      t += dt;
      flow += dt * (0.5 + curSpeed * 1.4);
      rot += dt * curSpeed * curDir;

      const amp = curWob + curLevel * 3.0;
      const scale = 1 + curLevel * 0.1;

      ctx.clearRect(0, 0, dim, dim);
      ctx.globalCompositeOperation = "lighter";

      // soft radial bloom
      const grad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.9);
      grad.addColorStop(0, rgb(curBase, 0.10));
      grad.addColorStop(0.45, rgb(curBase, 0.04));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dim, dim);

      // ---- segmented blocky ring (between sphere and aura) ----
      const segs = 40;
      const ringR = R * 1.22;
      const segRot = rot * 0.4;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2 + segRot;
        const gap = 0.045;
        const a1 = a0 + (Math.PI * 2) / segs - gap;
        const inner = ringR * 0.92;
        const outer = ringR * 1.08;
        const depth = Math.cos(a0); // front/back fade
        const al = 0.1 + ((depth + 1) / 2) * 0.32;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner * 0.5);
        ctx.lineTo(cx + Math.cos(a0) * outer, cy + Math.sin(a0) * outer * 0.5);
        ctx.lineTo(cx + Math.cos(a1) * outer, cy + Math.sin(a1) * outer * 0.5);
        ctx.lineTo(cx + Math.cos(a1) * inner, cy + Math.sin(a1) * inner * 0.5);
        ctx.closePath();
        ctx.fillStyle = rgb(curAccent, al * 0.5);
        ctx.strokeStyle = rgb(curAccent, al);
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }

      // ---- aura particle bands (living wavy dot rings) ----
      for (const p of particles) {
        p.ang += (p.spd + curSpeed * 0.15 * curDir) * dt * 6;
        const off = waveOffset(p.band, p.ang, amp);
        const r = R * (p.rBase + off) * scale;
        const x = cx + Math.cos(p.ang) * r;
        const y = cy + Math.sin(p.ang) * r * 0.62; // perspective squash
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(flow * 1.4 + p.tph));
        const a = p.bright * tw * 0.85;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rgb(curBase, a);
        ctx.fill();
      }

      // ---- rotating wireframe flower-of-life sphere ----
      ctx.save();
      const ca = Math.cos(rot * 1.4);
      const sa = Math.sin(rot * 1.4);
      const proj = (v: { x: number; y: number; z: number }) => {
        const x = v.x * ca + v.z * sa;
        const z = -v.x * sa + v.z * ca;
        const y = v.y;
        const y2 = y * cosT - z * sinT;
        const z2 = y * sinT + z * cosT;
        return { sx: cx + x * R * scale, sy: cy + y2 * R * scale, depth: z2 };
      };
      const projected = verts.map((row) => row.map(proj));
      const seg = (
        a: { sx: number; sy: number; depth: number },
        b: { sx: number; sy: number; depth: number },
      ) => {
        const d = (a.depth + b.depth) / 2;
        const alpha = 0.06 + ((d + 1) / 2) * 0.5;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = rgb(curAccent, alpha);
        ctx.lineWidth = 0.5 + ((d + 1) / 2) * 0.4;
        ctx.stroke();
      };
      ctx.shadowBlur = 5;
      ctx.shadowColor = rgb(curAccent, 0.5);
      for (let i = 0; i <= LAT; i++) {
        for (let j = 0; j < LONG; j++) {
          const a = projected[i][j];
          const b = projected[i][(j + 1) % LONG];
          seg(a, b);
          if (i < LAT) {
            const c = projected[i + 1][j];
            seg(a, c);
            const dpt = projected[i + 1][(j + 1) % LONG];
            seg(a, dpt);
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.restore();

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
