import { useEffect, useRef } from "react";

type Mode = "standby" | "thinking" | "listening" | "speaking";
type RGB = [number, number, number];

/* ---------------- color helpers ---------------- */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rgb = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const lighten = (c: RGB, t: number): RGB => mix(c, [255, 255, 255], t);

// parse #hex / rgb() / rgba() / oklch() into an approximate RGB
function parseColor(input: string, fallback: RGB): RGB {
  if (!input) return fallback;
  const s = input.trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return fallback;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    if (p.length >= 3) return [p[0], p[1], p[2]];
  }
  // oklch() — render to a probe element so the browser converts it for us
  try {
    const probe = document.createElement("span");
    probe.style.color = s;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const cm = computed.match(/rgba?\(([^)]+)\)/);
    if (cm) {
      const p = cm[1].split(",").map((x) => parseFloat(x));
      return [p[0], p[1], p[2]];
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

// read the live UI palette from CSS tokens
function readTheme(): { base: RGB; success: RGB; warning: RGB; core: RGB } {
  const cs = getComputedStyle(document.documentElement);
  const base = parseColor(cs.getPropertyValue("--cyan"), [0, 200, 255]);
  const core = parseColor(cs.getPropertyValue("--orb-core"), base);
  const success = parseColor(cs.getPropertyValue("--success"), [0, 255, 170]);
  const warning = parseColor(cs.getPropertyValue("--warning"), [255, 170, 0]);
  return { base, success, warning, core };
}

/* derive per-mode aura/accent colors from the live UI palette */
interface ModeCfg {
  base: RGB;   // aura color
  accent: RGB; // core / sphere wire color
  speed: number;
  wob: number;
  dir: number; // sphere rotation direction (+1 / -1)
}
function modeConfig(mode: Mode, theme: ReturnType<typeof readTheme>): ModeCfg {
  const { base, success, core } = theme;
  switch (mode) {
    case "thinking":
      return { base: lighten(base, 0.25), accent: lighten(core, 0.55), speed: 0.42, wob: 1.7, dir: -1 };
    case "listening":
      return { base: mix(base, success, 0.7), accent: lighten(mix(core, success, 0.6), 0.4), speed: 0.24, wob: 2.1, dir: 1 };
    case "speaking":
      return { base: lighten(base, 0.55), accent: lighten(core, 0.7), speed: 0.32, wob: 2.4, dir: -1 };
    default:
      return { base, accent: lighten(core, 0.45), speed: 0.12, wob: 1.1, dir: 1 };
  }
}

/* ---------------- lightweight value noise (organic, non-repeating) ---------------- */
const NSIZE = 256;
const perm = new Uint8Array(NSIZE * 2);
(() => {
  const p = Array.from({ length: NSIZE }, (_, i) => i);
  for (let i = NSIZE - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < NSIZE * 2; i++) perm[i] = p[i & (NSIZE - 1)];
})();
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const grad1 = (h: number, x: number) => ((h & 1) === 0 ? x : -x);
// smooth 2D value/gradient noise in [-1,1]
function noise2(x: number, y: number): number {
  const X = Math.floor(x) & (NSIZE - 1);
  const Y = Math.floor(y) & (NSIZE - 1);
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];
  const x1 = lerp(grad1(aa, xf), grad1(ba, xf - 1), u);
  const x2 = lerp(grad1(ab, xf), grad1(bb, xf - 1), u);
  return lerp(x1, x2, v);
}
// fractal noise for richer turbulence
function fbm(x: number, y: number): number {
  let v = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < 4; i++) {
    v += amp * noise2(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return v;
}

/* ---------------- particle energy torus ----------------
   The aura is a dense cloud of points distributed around a torus.
   The whole ring deforms via flowing noise so it never looks circular
   or geometric — it breathes, stretches, splits and merges like plasma. */
interface TorusParticle {
  theta: number;   // angle around the main ring (0..2π)
  phi: number;     // angle around the tube cross-section
  tube: number;    // 0..1 distance from tube center (density falloff)
  seed: number;    // per-particle noise seed
  flick: number;   // twinkle phase
  flickSpd: number;
}
const PARTICLES = 5200;
function makeParticles(): TorusParticle[] {
  const arr: TorusParticle[] = [];
  for (let i = 0; i < PARTICLES; i++) {
    // bias tube toward outer shell so the ring has a crisp glowing edge
    const t = Math.pow(Math.random(), 0.6);
    arr.push({
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI * 2,
      tube: t,
      seed: Math.random() * 1000,
      flick: Math.random() * Math.PI * 2,
      flickSpd: 0.6 + Math.random() * 2.4,
    });
  }
  return arr;
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

    const dim = size * 2.9;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dim * dpr;
    canvas.height = dim * dpr;
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;
    ctx.scale(dpr, dpr);

    const cx = dim / 2;
    const cy = dim / 2;
    const R = size * 0.32; // core sphere radius
    const squash = 0.92;   // gentle perspective squash

    // particle pool
    const newParticle = (): Particle => ({
      ang: Math.random() * Math.PI * 2,
      rad: 1.5 + Math.random() * 1.5,
      life: 0,
      ttl: 2 + Math.random() * 4,
      age: Math.random() * 2,
      size: 0.4 + Math.random() * 1.1,
      drift: (Math.random() - 0.5) * 0.25,
      spin: (Math.random() - 0.5) * 0.4,
    });
    const particles: Particle[] = Array.from({ length: PARTICLES }, newParticle);

    // smoothed, theme-aware params
    let theme = readTheme();
    let cfg = modeConfig("standby", theme);
    const curBase: RGB = [...cfg.base] as RGB;
    const curAccent: RGB = [...cfg.accent] as RGB;
    let curSpeed = cfg.speed;
    let curWob = cfg.wob;
    let curDir = cfg.dir;
    let curLevel = 0;

    let rot = 0;
    let flow = 0;
    let glowPhase = 0;
    let t = 0;
    let last = performance.now();
    let raf = 0;
    let themeTick = 0;

    const tilt = -0.42;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    // organic radius for an aura wave band — fluid, turbulent, never symmetrical
    const waveR = (baseR: number, ang: number, layer: number, amp: number) => {
      const nx = Math.cos(ang) * 1.4 + layer * 3.1;
      const ny = Math.sin(ang) * 1.4 + flow * 0.25 + layer * 1.7;
      const turb = fbm(nx + flow * 0.18, ny);
      const slow =
        Math.sin(ang * 2 + flow * 0.4 + layer) * 0.4 +
        Math.sin(ang * 3 - flow * 0.3 + layer * 2.0) * 0.25;
      return baseR + (turb * 0.9 + slow * 0.5) * amp * 0.11;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // re-read theme a few times per second so palette changes transition smoothly
      themeTick += dt;
      if (themeTick > 0.4) {
        themeTick = 0;
        theme = readTheme();
      }
      const mode: Mode = (["standby", "thinking", "listening", "speaking"] as Mode[]).includes(
        stateRef.current as Mode,
      )
        ? (stateRef.current as Mode)
        : "standby";
      cfg = modeConfig(mode, theme);

      const k = 1 - Math.pow(0.002, dt);
      for (let i = 0; i < 3; i++) {
        curBase[i] = lerp(curBase[i], cfg.base[i], k);
        curAccent[i] = lerp(curAccent[i], cfg.accent[i], k);
      }
      curSpeed = lerp(curSpeed, cfg.speed, k);
      curWob = lerp(curWob, cfg.wob, k);
      curDir = lerp(curDir, cfg.dir, k * 0.5);
      curLevel = lerp(curLevel, levelRef.current || 0, 0.16);

      t += dt;
      flow += dt * (0.5 + curSpeed * 1.6);
      glowPhase += dt;
      rot += dt * curSpeed * curDir;

      const amp = curWob + curLevel * 3.2;
      const scale = 1 + curLevel * 0.09;
      const glowPulse = 0.85 + 0.15 * Math.sin(glowPhase * 1.1);

      ctx.clearRect(0, 0, dim, dim);
      ctx.globalCompositeOperation = "lighter";

      /* ---- layered volumetric glow (multiple radial layers, not one blur) ---- */
      const glows: [number, number][] = [
        [R * 3.0, 0.05],
        [R * 2.1, 0.07],
        [R * 1.3, 0.10],
        [R * 0.7, 0.16],
      ];
      for (const [gr, ga] of glows) {
        const g = ctx.createRadialGradient(cx, cy, gr * 0.05, cx, cy, gr * scale);
        g.addColorStop(0, rgb(curBase, ga * glowPulse));
        g.addColorStop(0.5, rgb(curBase, ga * 0.35 * glowPulse));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, gr * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ---- flowing aura energy waves (semi-transparent, breathing, merging) ---- */
      const LAYERS = 6;
      const STEPS = 160;
      for (let l = 0; l < LAYERS; l++) {
        const baseR = 1.45 + l * 0.24;
        const layerSeed = l * 7.3;
        const dir = l % 2 === 0 ? 1 : -1;
        const rotPhase = flow * 0.12 * dir + l * 0.5;
        ctx.beginPath();
        for (let s = 0; s <= STEPS; s++) {
          const ang = (s / STEPS) * Math.PI * 2 + rotPhase;
          const rr = waveR(baseR, ang, layerSeed, amp) * R * scale;
          const x = cx + Math.cos(ang) * rr;
          const y = cy + Math.sin(ang) * rr * squash;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        const innerFade = 1 - l / LAYERS;
        const lineW = lerp(0.6, 2.2, Math.abs(Math.sin(flow * 0.4 + l)));
        ctx.lineWidth = lineW;
        ctx.strokeStyle = rgb(curBase, 0.05 + innerFade * 0.16);
        ctx.shadowBlur = 8;
        ctx.shadowColor = rgb(curBase, 0.4);
        ctx.stroke();
        // faint fill on inner layers for volume
        if (l < 3) {
          ctx.fillStyle = rgb(curBase, 0.012 * (3 - l));
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      /* ---- drifting micro particles (detail/depth, reacting to flow) ---- */
      for (const p of particles) {
        p.age += dt;
        if (p.age >= p.ttl) Object.assign(p, newParticle(), { age: 0 });
        const lifeT = p.age / p.ttl;
        p.life = Math.sin(lifeT * Math.PI); // fade in/out
        const turb = fbm(Math.cos(p.ang) * 2 + flow * 0.2, Math.sin(p.ang) * 2);
        p.ang += (p.spin * 0.4 + curSpeed * 0.2 * curDir + turb * 0.15) * dt;
        p.rad += (p.drift + turb * 0.3) * dt;
        const rr = p.rad * R * scale;
        const x = cx + Math.cos(p.ang) * rr;
        const y = cy + Math.sin(p.ang) * rr * squash;
        const a = p.life * 0.5;
        if (a <= 0.01) continue;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rgb(lighten(curBase, 0.3), a);
        ctx.fill();
      }

      /* ---- central suspended energy core ---- */
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05 * scale);
      coreGrad.addColorStop(0, rgb(lighten(curAccent, 0.5), 0.55 * glowPulse));
      coreGrad.addColorStop(0.4, rgb(curBase, 0.28));
      coreGrad.addColorStop(0.75, rgb(curBase, 0.08));
      coreGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05 * scale, 0, Math.PI * 2);
      ctx.fill();

      /* ---- rotating wireframe sphere inside the core ---- */
      ctx.save();
      const ca = Math.cos(rot * 1.5);
      const sa = Math.sin(rot * 1.5);
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
        const alpha = 0.04 + ((d + 1) / 2) * 0.4;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = rgb(curAccent, alpha);
        ctx.lineWidth = 0.4 + ((d + 1) / 2) * 0.45;
        ctx.stroke();
      };
      ctx.shadowBlur = 6;
      ctx.shadowColor = rgb(curAccent, 0.5);
      for (let i = 0; i <= LAT; i++) {
        for (let j = 0; j < LONG; j++) {
          const a = projected[i][j];
          const b = projected[i][(j + 1) % LONG];
          seg(a, b);
          if (i < LAT) {
            const c = projected[i + 1][j];
            seg(a, c);
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
