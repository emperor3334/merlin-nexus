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

    const dim = size * 3.4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dim * dpr;
    canvas.height = dim * dpr;
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;
    ctx.scale(dpr, dpr);

    const cx = dim / 2;
    const cy = dim / 2;
    const R = size * 0.95;       // main ring radius
    const TUBE = size * 0.34;    // tube (thickness) radius of the ring

    const particles = makeParticles();

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
    const tilt = -1.12;
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

      /* ---- the living particle torus (the aura) ---- */
      const ca = Math.cos(rot);
      const sa = Math.sin(rot);
      const hi = lighten(curBase, 0.45);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // slow drift around the ring so the whole structure flows
        const theta = p.theta + flow * 0.05 * curDir;

        // ---- organic ring-radius deformation (never a circle) ----
        const n1 = fbm(Math.cos(theta) * 1.3 + p.seed * 0.01 + flow * 0.12,
                       Math.sin(theta) * 1.3 + flow * 0.09);
        const n2 = noise2(theta * 2.0 + flow * 0.2, p.seed * 0.02);
        const ringDeform = 1 + (n1 * 0.55 + n2 * 0.22) * (0.35 + amp * 0.5);
        const ringR = R * ringDeform;

        // ---- tube (thickness) deformation per particle ----
        const tubeN = fbm(p.seed * 0.05 + flow * 0.25, theta * 1.5);
        const tubeR = TUBE * p.tube * (0.7 + tubeN * 0.6 + amp * 0.4);

        // local torus coords
        const cosTh = Math.cos(theta);
        const sinTh = Math.sin(theta);
        const cphi = Math.cos(p.phi + flow * 0.3);
        const sphi = Math.sin(p.phi + flow * 0.3);

        // base ring point in XZ plane + tube offset along outward & up
        let x = (ringR + tubeR * cphi) * cosTh;
        let z = (ringR + tubeR * cphi) * sinTh;
        let y = tubeR * sphi;

        // micro turbulence — independent jitter so particles shimmer/merge
        const tx = noise2(p.seed + flow * 0.6, theta * 3.0) * TUBE * 0.5 * amp;
        const ty = noise2(p.seed * 1.7 + flow * 0.55, p.phi * 2.0) * TUBE * 0.5 * amp;
        x += tx;
        y += ty;

        // rotate around Y (spin) then tilt around X (view from above)
        const rx = x * ca + z * sa;
        const rz = -x * sa + z * ca;
        const ry = y * cosT - rz * sinT;
        const depth = y * sinT + rz * cosT; // +front / -back

        const sx = cx + rx * scale;
        const sy = cy + ry * scale;

        // depth shading: front particles brighter & larger
        const dn = (depth / R + 1) / 2; // ~0..1
        const twinkle = 0.6 + 0.4 * Math.sin(p.flick + t * p.flickSpd);
        const edge = 0.4 + 0.6 * p.tube; // outer-shell particles a touch brighter
        let a = (0.05 + dn * 0.4) * twinkle * edge;
        if (a < 0.012) continue;
        const psize = (0.45 + dn * 1.1) * scale;

        ctx.fillStyle = rgb(dn > 0.62 ? hi : curBase, a);
        ctx.fillRect(sx - psize * 0.5, sy - psize * 0.5, psize, psize);
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
