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

/* ---------------- flowing energy membrane ----------------
   The aura is a stack of continuous closed loops (ribbons) that each
   deform independently via flowing FBM noise. Stroked with additive
   blending and many overlapping layers, they read as a connected,
   living plasma membrane rather than a cloud of independent points.   */
interface MembraneLayer {
  seed: number;     // unique noise seed
  baseR: number;    // 0..1 radius factor of this layer
  amp: number;      // deformation amplitude factor
  freqA: number;    // primary angular frequency
  freqB: number;    // secondary angular frequency
  speed: number;    // flow speed factor
  thick: number;    // stroke thickness factor
  alpha: number;    // base opacity
  z: number;        // -1..1 depth offset for tilt parallax
  phase: number;    // starting phase
}
const LAYERS = 26;        // many overlapping membrane sheets => density
const SEGMENTS = 200;     // smooth continuous loop resolution
function makeLayers(): MembraneLayer[] {
  const arr: MembraneLayer[] = [];
  for (let i = 0; i < LAYERS; i++) {
    const u = i / (LAYERS - 1);
    arr.push({
      seed: Math.random() * 1000,
      baseR: 0.72 + u * 0.34 + (Math.random() - 0.5) * 0.05,
      amp: 0.12 + Math.random() * 0.22,
      freqA: 2 + Math.floor(Math.random() * 4),
      freqB: 5 + Math.floor(Math.random() * 6),
      speed: 0.5 + Math.random() * 1.1,
      thick: 0.6 + Math.random() * 1.6,
      alpha: 0.06 + Math.random() * 0.10,
      z: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return arr;
}

/* light secondary particle detail (<10% of the look) */
interface Detail {
  theta: number;
  r: number;
  seed: number;
  flick: number;
  flickSpd: number;
}
const DETAILS = 360;
function makeDetails(): Detail[] {
  const arr: Detail[] = [];
  for (let i = 0; i < DETAILS; i++) {
    arr.push({
      theta: Math.random() * Math.PI * 2,
      r: 0.7 + Math.random() * 0.4,
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

    const dim = size * 3.4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dim * dpr;
    canvas.height = dim * dpr;
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;
    ctx.scale(dpr, dpr);

    const cx = dim / 2;
    const cy = dim / 2;
    const R = size * 0.92;       // main ring radius
    const TUBE = size * 0.2;     // tube (thickness) radius of the ring

    const layers = makeLayers();
    const details = makeDetails();

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

    // viewed slightly from above so the ring reads as a tilted torus
    const tilt = -0.58;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

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

      const scale = 1 + curLevel * 0.08;
      const glowPulse = 0.85 + 0.15 * Math.sin(glowPhase * 1.1);
      // overall turbulence amplitude (reacts to mode + audio)
      const amp = (0.5 + curWob * 0.35 + curLevel * 1.4);

      ctx.clearRect(0, 0, dim, dim);
      ctx.globalCompositeOperation = "lighter";

      /* ---- soft volumetric glow behind the field ---- */
      const glows: [number, number][] = [
        [R * 1.55, 0.045],
        [R * 1.1, 0.06],
        [R * 0.6, 0.05],
      ];
      for (const [gr, ga] of glows) {
        const g = ctx.createRadialGradient(cx, cy, gr * 0.05, cx, cy, gr * scale);
        g.addColorStop(0, rgb(curBase, ga * glowPulse));
        g.addColorStop(0.55, rgb(curBase, ga * 0.4 * glowPulse));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, gr * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ---- subtle suspended energy core (no wireframe, just a faint source) ---- */
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42 * scale);
      coreGrad.addColorStop(0, rgb(lighten(curAccent, 0.5), 0.18 * glowPulse));
      coreGrad.addColorStop(0.5, rgb(curBase, 0.06));
      coreGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.42 * scale, 0, Math.PI * 2);
      ctx.fill();

      /* ---- the living energy membrane (continuous flowing loops) ---- */
      const ca = Math.cos(rot);
      const sa = Math.sin(rot);
      const hi = lighten(curBase, 0.5);

      // project a 3D ring point (in the tilted/spun torus space) to screen
      const project = (theta: number, radius: number, zOff: number) => {
        const cosTh = Math.cos(theta);
        const sinTh = Math.sin(theta);
        let x = radius * cosTh;
        let z = radius * sinTh;
        let y = zOff;
        const rx = x * ca + z * sa;
        const rz = -x * sa + z * ca;
        const ry = y * cosT - rz * sinT;
        const depth = y * sinT + rz * cosT; // +front / -back
        return {
          sx: cx + rx * scale,
          sy: cy + ry * scale,
          dn: (depth / R + 1) / 2,
        };
      };

      // per-layer radius at a given angle — organic, non-symmetric deformation
      const layerRadius = (L: MembraneLayer, theta: number, fl: number) => {
        // independent multi-octave flow: each angular region moves on its own
        const n1 = fbm(
          Math.cos(theta) * L.freqA * 0.5 + L.seed * 0.013,
          Math.sin(theta) * L.freqA * 0.5 + fl * L.speed * 0.5,
        );
        const n2 = noise2(theta * L.freqB + L.seed, fl * L.speed * 0.8 + L.seed * 0.07);
        const n3 = noise2(theta * (L.freqA + 1) - fl * L.speed * 0.4, L.seed * 0.2);
        const deform = (n1 * 0.6 + n2 * 0.3 + n3 * 0.2) * L.amp * (0.6 + amp * 0.8);
        return R * L.baseR * (1 + deform);
      };

      for (let li = 0; li < layers.length; li++) {
        const L = layers[li];
        const fl = flow + L.phase;
        const zOff = L.z * TUBE * 1.4;
        ctx.beginPath();
        let frontSum = 0;
        for (let s = 0; s <= SEGMENTS; s++) {
          const theta = (s / SEGMENTS) * Math.PI * 2 + flow * 0.04 * curDir;
          const rr = layerRadius(L, theta, fl);
          const pt = project(theta, rr, zOff);
          frontSum += pt.dn;
          if (s === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.closePath();
        const front = frontSum / (SEGMENTS + 1);
        const col = front > 0.55 ? mix(curBase, hi, (front - 0.55) * 2) : curBase;
        ctx.strokeStyle = rgb(col, L.alpha * (0.5 + front) * glowPulse);
        ctx.lineWidth = L.thick * scale;
        ctx.stroke();
      }

      /* ---- secondary particle detail (<10% of the look) ---- */
      for (let i = 0; i < details.length; i++) {
        const d = details[i];
        const theta = d.theta + flow * 0.05 * curDir;
        const n = fbm(Math.cos(theta) * 1.4 + d.seed * 0.01 + flow * 0.1,
                      Math.sin(theta) * 1.4 + flow * 0.08);
        const rr = R * d.r * (1 + n * 0.28 * (0.6 + amp * 0.6));
        const zOff = (noise2(d.seed, flow * 0.4) ) * TUBE * 1.2;
        const pt = project(theta, rr, zOff);
        const twinkle = 0.5 + 0.5 * Math.sin(d.flick + t * d.flickSpd);
        const a = (0.1 + pt.dn * 0.25) * twinkle;
        if (a < 0.01) continue;
        const psize = (0.5 + pt.dn * 0.9) * scale;
        ctx.fillStyle = rgb(pt.dn > 0.6 ? hi : curBase, a);
        ctx.fillRect(pt.sx - psize * 0.5, pt.sy - psize * 0.5, psize, psize);
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
