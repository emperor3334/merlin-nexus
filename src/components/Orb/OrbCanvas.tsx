import { useEffect, useRef } from "react";

/* ------------------------------ noise ------------------------------ */
function makeNoise2D(seed = 1337) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed >>> 0 || 1;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const hash = (xi: number, yi: number) =>
    (perm[(xi + perm[yi & 255]) & 255] / 255) * 2 - 1;
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);
    const aa = hash(xi, yi);
    const ba = hash(xi + 1, yi);
    const ab = hash(xi, yi + 1);
    const bb = hash(xi + 1, yi + 1);
    return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v);
  };
}

const lp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ----------------------------- component --------------------------- */
export const OrbCanvas = ({
  size,
  state,
  level,
  lite = false,
}: {
  size: number;
  state: string;
  level: number;
  lite?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  stateRef.current = state;
  levelRef.current = level;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let raf = 0;

    const dim = size * 3.4;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.floor(dim * dpr);
    canvas.height = Math.floor(dim * dpr);
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = dim;
    const height = dim;

    /* offscreen cache for the expensive full-canvas gradient layers
       (haze base, aura fog base, ring bloom). They depend only on R and
       brightPulse, both of which vary smoothly, so refreshing them every
       few frames is visually imperceptible but saves most of the fill-rate. */
    const bg = document.createElement("canvas");
    bg.width = canvas.width;
    bg.height = canvas.height;
    const bgCtx = bg.getContext("2d", { alpha: true })!;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let bgFrame = 0;
    const BG_REFRESH = 6;

    const renderBackground = (R: number, brightPulse: number) => {
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgCtx.globalCompositeOperation = "source-over";
      bgCtx.clearRect(0, 0, width, height);
      bgCtx.globalCompositeOperation = "lighter";
      // haze base
      {
        const g = bgCtx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 2.3);
        g.addColorStop(0, `rgba(0, 90, 120, ${0.03 * brightPulse})`);
        g.addColorStop(0.35, `rgba(0, 65, 95, ${0.014 * brightPulse})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        bgCtx.fillStyle = g;
        bgCtx.fillRect(0, 0, width, height);
      }
      // aura fog base
      {
        const ga = bgCtx.createRadialGradient(cx, cy, baseR * 0.45 * 0.25, cx, cy, R * 1.04);
        ga.addColorStop(0, `rgba(0, 120, 150, ${0.035 * brightPulse})`);
        ga.addColorStop(0.32, `rgba(0, 95, 120, ${0.014 * brightPulse})`);
        ga.addColorStop(0.66, `rgba(0, 70, 95, ${0.007 * brightPulse})`);
        ga.addColorStop(1, "rgba(0,0,0,0)");
        bgCtx.fillStyle = ga;
        bgCtx.fillRect(0, 0, width, height);
      }
      // ring bloom
      {
        const g = bgCtx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.4);
        g.addColorStop(0, "rgba(0,90,110,0)");
        g.addColorStop(0.55, `rgba(0, 130, 155, ${0.05 * brightPulse})`);
        g.addColorStop(0.78, `rgba(0, 150, 170, ${0.028 * brightPulse})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        bgCtx.fillStyle = g;
        bgCtx.fillRect(0, 0, width, height);
      }
    };

    const noiseLow = makeNoise2D(11);
    const noiseMid = makeNoise2D(73);
    const noiseCore = makeNoise2D(404);
    const noiseAura = makeNoise2D(919);

    /* ----- ribbons (the waves) ----- */
    type Ribbon = {
      rOffset: number;
      phase: number;
      phaseSpd: number;
      seed: number;
      z: number;
      amp: number;
      microAmp: number;
      thickness: number;
    };
    const minDim = Math.min(width, height);
    const ribbonCount = Math.round((minDim < 500 ? 88 : minDim < 900 ? 112 : 136) * 0.729 * (lite ? 0.25 : 1));
    const ribbons: Ribbon[] = new Array(ribbonCount);
    for (let i = 0; i < ribbonCount; i++) {
      ribbons[i] = {
        rOffset: (Math.random() - 0.5) * 0.52,
        phase: Math.random() * Math.PI * 2,
        phaseSpd: (Math.random() - 0.5) * 0.12,
        seed: Math.random() * 1000,
        z: Math.random(),
        amp: 0.85 + Math.random() * 0.35,
        microAmp: 0.004 + Math.random() * 0.012,
        thickness: (0.24 + Math.random() * 0.06) * 1.4,
      };
    }

    type Haze = {
      a0: number;
      rOff: number;
      drift: number;
      tw: number;
      twSpd: number;
      size: number;
      bright: number;
      z: number;
    };
    const area = width * height;
    const hazeCount = lite ? 700 : Math.max(5200, Math.min(13000, Math.floor(area / 150)));
    const haze: Haze[] = new Array(hazeCount);
    for (let i = 0; i < hazeCount; i++) {
      const band = Math.random() * 2 - 1;
      haze[i] = {
        a0: Math.random() * Math.PI * 2,
        rOff: band * 0.32,
        drift: (Math.random() - 0.5) * 0.06,
        tw: Math.random() * Math.PI * 2,
        twSpd: 0.6 + Math.random() * 2.8,
        size: 0.22 + Math.random() * 0.28,
        bright: 0.16 + Math.random() * 0.28,
        z: Math.random(),
      };
    }

    /* ----- core particles: volumetric sphere ----- */
    type CoreP = {
      x: number;
      y: number;
      z: number;
      rho: number;
      spin: number;
      phase: number;
      tw: number;
      twSpd: number;
      size: number;
      bright: number;
      ang0: number;
    };
    const coreCount = lite ? 2200 : 11000;
    const coreParticles: CoreP[] = new Array(coreCount);
    for (let i = 0; i < coreCount; i++) {
      const shellBias = Math.random() < 0.62;
      const rho = shellBias ? 0.72 + Math.random() * 0.28 : Math.pow(Math.random(), 0.62);
      const z = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const xy = Math.sqrt(Math.max(0, 1 - z * z));
      coreParticles[i] = {
        x: Math.cos(a) * xy,
        y: Math.sin(a) * xy,
        z,
        rho,
        spin: 0.35 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        tw: Math.random() * Math.PI * 2,
        twSpd: 0.35 + Math.random() * 1.35,
        size: 0.28 + Math.random() * 0.78,
        bright: 0.1 + Math.random() * 0.48,
        ang0: a,
      };
    }

    type CoreVein = {
      kind: number;
      u: number;
      band: number;
      phase: number;
      twist: number;
      bright: number;
      size: number;
    };
    const veinCount = lite ? 1400 : 7500;
    const coreVeins: CoreVein[] = new Array(veinCount);
    for (let i = 0; i < veinCount; i++) {
      coreVeins[i] = {
        kind: Math.random() < 0.58 ? 0 : 1,
        u: Math.random(),
        band: Math.random() * 2 - 1,
        phase: Math.random() * Math.PI * 2,
        twist: (Math.random() - 0.5) * 1.4,
        bright: 0.12 + Math.random() * 0.42,
        size: 0.28 + Math.random() * 0.58,
      };
    }

    /* ----- aura particles ----- */
    type AuraP = {
      a0: number;
      rRel: number;
      layer: number;
      drift: number;
      radialDrift: number;
      swirl: number;
      tw: number;
      twSpd: number;
      size: number;
      bright: number;
      seed: number;
    };
    const auraCount = lite ? 900 : Math.max(3600, Math.min(7500, Math.floor(area / 300)));
    const auraParticles: AuraP[] = new Array(auraCount);
    for (let i = 0; i < auraCount; i++) {
      const layer = Math.floor(Math.random() * 4);
      const rRel = Math.pow(Math.random(), 0.75 + layer * 0.12);
      auraParticles[i] = {
        a0: Math.random() * Math.PI * 2,
        rRel,
        layer,
        drift: (Math.random() - 0.5) * (0.025 + layer * 0.012),
        radialDrift: (Math.random() - 0.5) * 0.035,
        swirl: (Math.random() - 0.5) * 0.34,
        tw: Math.random() * Math.PI * 2,
        twSpd: 0.25 + Math.random() * 1.8,
        size: 0.35 + Math.random() * 1.05,
        bright: 0.08 + Math.random() * 0.36,
        seed: Math.random() * 1000,
      };
    }

    type Current = {
      a0: number;
      rRel: number;
      span: number;
      bend: number;
      layer: number;
      phase: number;
      drift: number;
      bright: number;
      dots: number;
    };
    const currents: Current[] = new Array(lite ? 22 : 90);
    for (let i = 0; i < currents.length; i++) {
      currents[i] = {
        a0: Math.random() * Math.PI * 2,
        rRel: Math.random(),
        span: 0.1 + Math.random() * 0.28,
        bend: (Math.random() - 0.5) * 0.85,
        layer: Math.floor(Math.random() * 4),
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.045,
        bright: 0.05 + Math.random() * 0.16,
        dots: 26 + Math.floor(Math.random() * 34),
      };
    }

    const baseR = size * 0.92;
    const cx = width / 2;
    const cy = height / 2;
    const start = performance.now();
    let last = start;

    // smoothed mode-driven parameters
    let waveSpeed = 1; // ribbon/wave rotation multiplier
    let waveRange = 1; // wave radial extent (shrinks in processing)
    let uniform = 0; // 0 = random core, 1 = uniform clockwise core spin (listening)
    let speakLevel = 0; // speaking inflation

    let rotation = 0; // accumulated wave rotation
    let coreSpin = 0; // accumulated core drift
    let uniformAng = 0; // accumulated uniform core spin

    const deformGlobal = (angle: number, t: number) => {
      const cx1 = Math.cos(angle) * 1.4;
      const sy1 = Math.sin(angle) * 1.4;
      const cx2 = Math.cos(angle * 2 + 0.6) * 1.1;
      const sy2 = Math.sin(angle * 2 + 0.6) * 1.1;
      const a = noiseLow(cx1 + t * 0.07, sy1 - t * 0.05);
      const b = noiseMid(cx2 + t * 0.18, sy2 + t * 0.12);
      return a * 0.7 + b * 0.3;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // resolve current mode -> targets
      const mode = stateRef.current;
      const lvl = Math.max(0, Math.min(1, levelRef.current || 0));
      let tSpeed = 1, tRange = 1, tUniform = 0, tSpeak = 0;
      if (mode === "thinking") {
        tSpeed = 7;        // waves spin fast to the right
        tRange = 0.82;     // shrink the wave range
      } else if (mode === "listening") {
        tSpeed = 1;        // gentle breathing rotation
        tUniform = 1;      // sphere dots lock into clockwise spin
      } else if (mode === "speaking") {
        tSpeed = 1.3;
        tSpeak = lvl;      // waves inflate with the voice
      }
      const k = 1 - Math.pow(0.0015, dt);
      waveSpeed = lp(waveSpeed, tSpeed, k);
      waveRange = lp(waveRange, tRange, k);
      uniform = lp(uniform, tUniform, k);
      speakLevel = lp(speakLevel, tSpeak, 0.18);

      // breathing pulse
      const pulse = Math.sin((t / 4) * Math.PI * 2);
      const breathe = 1 + pulse * 0.015;
      const brightPulse = 1 + pulse * 0.08;
      // speaking adds an inflate/deflate pulse on top of breathing
      const inflate = 1 + speakLevel * 0.26 + speakLevel * 0.12 * Math.sin(t * 11);
      const waveScale = breathe * waveRange * inflate;
      const R = baseR * waveScale;

      const coreR = baseR * 0.45 * breathe; // sphere unaffected by wave range
      const gapInner = coreR * 1.05;
      const gapOuter = R * 0.92;
      const gap = gapOuter - gapInner;

      // speaking: jagged, voice-reactive radial waveform on the outer waves only
      const liveJitter = 0.6 + 0.4 * Math.max(0, Math.min(1, lvl));
      const speakSpike = (a: number) => {
        if (speakLevel < 0.001) return 0;
        const s =
          Math.sin(a * 9 + t * 9) * 0.55 +
          Math.sin(a * 17 - t * 13) * 0.32 +
          noiseMid(Math.cos(a) * 6, Math.sin(a) * 6 - t * 0.5) * 0.85;
        return s * speakLevel * liveJitter;
      };

      // accumulate rotations
      rotation += dt * (Math.PI / 90) * 12 * waveSpeed;
      coreSpin += dt * ((Math.PI * 2) / 68);
      uniformAng += dt * 0.55;

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      // 2+3+6) cached full-canvas gradient layers (haze base, aura fog base, ring bloom)
      if (bgFrame % BG_REFRESH === 0) renderBackground(R, brightPulse);
      bgFrame++;
      ctx.drawImage(bg, 0, 0, width, height);

      // 3b) Aura fog blobs
      {
        for (let i = 0; i < 16; i++) {
          const h = Math.sin(i * 91.37) * 43758.5453;
          const f = h - Math.floor(h);
          const a = f * Math.PI * 2 + noiseAura(i * 0.13, t * 0.045) * 0.45;
          const rr = coreR * 1.15 + (0.08 + ((Math.sin(i * 37.1) + 1) * 0.46)) * gap;
          const drift = noiseAura(Math.cos(a) * 0.7 + i, Math.sin(a) * 0.7 - t * 0.035);
          const x = cx + Math.cos(a + drift * 0.35) * rr;
          const y = cy + Math.sin(a - drift * 0.2) * rr;
          const rad = R * (0.14 + ((Math.sin(i * 17.27) + 1) * 0.075));
          const pg = ctx.createRadialGradient(x, y, 0, x, y, rad);
          pg.addColorStop(0, `rgba(40, 150, 170, ${0.016 * brightPulse})`);
          pg.addColorStop(0.55, `rgba(0, 110, 130, ${0.009 * brightPulse})`);
          pg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = pg;
          ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
      }

      // 4) Aura particles — wave dots: bright (like sphere) but small
      for (let i = 0; i < auraParticles.length; i++) {
        const p = auraParticles[i];
        const layerPhase = p.layer * 0.73;
        const flow = noiseAura(
          Math.cos(p.a0 + layerPhase) * 1.6 + p.seed * 0.006 + t * 0.025,
          Math.sin(p.a0 - layerPhase) * 1.6 - t * 0.045
        );
        const curl = noiseMid(
          Math.cos(p.a0) * 2.2 + p.seed * 0.004,
          Math.sin(p.a0) * 2.2 + t * 0.05 + p.layer
        );
        const localPulse = Math.sin(t * (0.13 + p.layer * 0.04) + p.tw) * 0.028;
        const a = p.a0 + p.drift * t + p.swirl * flow + curl * 0.1 + rotation * (0.08 + p.layer * 0.025);
        const rr = gapInner + (p.rRel + flow * 0.055 + p.radialDrift * Math.sin(t * 0.18 + p.tw) + localPulse) * gap;
        if (rr < gapInner * 0.9 || rr > gapOuter * 1.05) continue;
        const parallax = (p.layer - 1.5) * 1.8;
        const x = cx + Math.cos(a) * rr + parallax;
        const y = cy + Math.sin(a) * rr - parallax * 0.45;
        const tw = 0.45 + 0.55 * Math.sin(p.tw + t * p.twSpd + flow * 2.2);
        const edgeFade =
          Math.min(1, (rr - gapInner * 0.96) / (gap * 0.23)) *
          Math.min(1, (gapOuter * 1.04 - rr) / (gap * 0.3));
        const density = 0.45 + 0.55 * Math.max(0, noiseAura(x * 0.012 + t * 0.02, y * 0.012 - p.seed * 0.01));
        // brightened to match the sphere dots
        const alpha = (p.bright + 0.5) * tw * density * brightPulse * Math.max(0, edgeFade) * (0.85 + p.layer * 0.12);
        ctx.fillStyle = `rgba(${66 + p.layer * 16}, 205, 255, ${alpha})`;
        const sz = p.size * (0.62 + p.layer * 0.12); // smaller than sphere dots
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }

      // 5) Particle plasma currents
      for (let i = 0; i < currents.length; i++) {
        const c = currents[i];
        for (let k2 = 0; k2 < c.dots; k2++) {
          const u = k2 / (c.dots - 1);
          const alive = 0.45 + 0.55 * Math.sin(c.phase + t * 0.22 + u * Math.PI * 2);
          const local = c.rRel + (u - 0.5) * c.span;
          const rr = gapInner + Math.max(0.02, Math.min(0.98, local)) * gap;
          const n = noiseAura(Math.cos(c.a0) * 1.4 + u * 1.6, Math.sin(c.a0) * 1.4 - t * 0.06 + i);
          const a = c.a0 + c.drift * t + c.bend * (u - 0.5) + n * 0.22 + rotation * 0.12;
          const fade = Math.sin(Math.PI * u) * alive;
          if (fade <= 0.08) continue;
          const x = cx + Math.cos(a) * rr + (c.layer - 1.5) * 2.2;
          const y = cy + Math.sin(a) * rr - (c.layer - 1.5) * 0.8;
          const alpha = (c.bright + 0.12) * fade * brightPulse * 0.6;
          ctx.fillStyle = `rgba(96, 206, 255, ${alpha})`;
          const sz = 0.4 + c.layer * 0.08 + fade * 0.35;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }

      // 7) Broken filament wave dots (bright, small)
      for (let si = 0; si < 10; si++) {
        const phase = si * 0.7 + t * 0.12;
        const rOff = (si - 5) * R * 0.014;
        for (let i = 0; i < 300; i++) {
          const u = i / 300;
          const a = u * Math.PI * 2 + rotation + phase * 0.05;
          const d = deformGlobal(a + phase, t);
          const broken = noiseMid(Math.cos(a) * 4 + si, Math.sin(a) * 4 - t * 0.08);
          if (broken < -0.35) continue;
          const rr = R + d * R * 0.08 + rOff + broken * R * 0.006 + speakSpike(a) * R * 0.1;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          const fade = 0.35 + Math.max(0, broken) * 0.75;
          ctx.fillStyle = `rgba(146, 220, 255, ${0.34 * fade * brightPulse})`;
          const sz = 0.6 + fade * 0.6;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }

      // 8) Ribbon stack (the bright waves)
      const samplesPerRibbon = 460;
      for (let ri = 0; ri < ribbons.length; ri++) {
        const rb = ribbons[ri];
        const rbPhase = rb.phase + t * rb.phaseSpd;
        const zAlpha = 0.25 + rb.z * 0.85;
        const baseAlpha = 1.5 * zAlpha * brightPulse;
        const px = cx + (rb.z - 0.5) * 6;
        const py = cy + (rb.z - 0.5) * 3;

        for (let i = 0; i < samplesPerRibbon; i++) {
          const a = (i / samplesPerRibbon) * Math.PI * 2 + rotation + rbPhase * 0.02;
          const dG = deformGlobal(a, t);
          const micro =
            noiseMid(
              Math.cos(a) * 3 + rb.seed,
              Math.sin(a) * 3 - t * 0.4 + rb.seed
            ) * rb.microAmp;
          const rr =
            R * (1 + rb.rOffset) + dG * R * 0.075 * rb.amp + micro * R * 8 + speakSpike(a) * R * 0.13;
          const x = px + Math.cos(a) * rr;
          const y = py + Math.sin(a) * rr;
          const tw = 0.7 + 0.3 * Math.sin(a * 7 + t * 2 + rb.seed);
          const alpha = baseAlpha * tw;
          ctx.fillStyle = `rgba(160, 222, 255, ${alpha})`;
          const sz = rb.thickness * 1.25;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }

      // 9) Haze particles around the ring
      for (let i = 0; i < haze.length; i++) {
        const p = haze[i];
        const a = p.a0 + rotation + p.drift * t;
        const dG = deformGlobal(a, t);
        const rr = R + dG * R * 0.06 + p.rOff * R + speakSpike(a) * R * 0.08;
        const x = cx + (p.z - 0.5) * 6 + Math.cos(a) * rr;
        const y = cy + (p.z - 0.5) * 3 + Math.sin(a) * rr;
        const tw = 0.5 + 0.5 * Math.sin(p.tw + t * p.twSpd);
        const a2 = p.bright * tw * brightPulse * (0.4 + p.z * 0.6) * 1.8;
        ctx.fillStyle = `rgba(126, 212, 255, ${a2})`;
        const sz = p.size * 1.2;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }

      // 10) === CORE === particle sphere
      {
        const rotY = coreSpin;
        const rotX = Math.sin(t * 0.021) * 0.34 + 0.18;
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const project = (x0: number, y0: number, z0: number, wobble: number) => {
          const x1 = x0 * cosY + z0 * sinY;
          const z1 = -x0 * sinY + z0 * cosY;
          const y1 = y0 * cosX - z1 * sinX;
          const z2 = y0 * sinX + z1 * cosX;
          const scale3d = 0.92 + z2 * 0.12 + wobble;
          return {
            x: cx + x1 * coreR * scale3d,
            y: cy + y1 * coreR * scale3d,
            z: z2,
            edge: Math.sqrt(x1 * x1 + y1 * y1),
          };
        };

        // faint internal mist
        for (let i = 0; i < 22; i++) {
          const a = i * 2.399963 + noiseCore(i * 0.1, t * 0.025) * 0.5;
          const rr = Math.sqrt((i % 29) / 29) * coreR * 1.18;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr * 0.92;
          const rad = coreR * (0.12 + ((i * 17) % 11) * 0.012);
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, `rgba(80,210,225,${0.04 * brightPulse})`);
          g.addColorStop(1, "rgba(0,200,220,0)");
          ctx.fillStyle = g;
          ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }

        // suspended particles — random circulation, or uniform clockwise (listening)
        for (let i = 0; i < coreParticles.length; i++) {
          const cp = coreParticles[i];
          const randCirc = coreSpin * cp.spin + noiseCore(cp.x * 1.7 + cp.phase, cp.y * 1.7 + t * 0.035) * 0.055;
          // uniform spin keeps each dot's start angle and adds a shared clockwise turn
          const circulation = lp(randCirc, cp.ang0 + uniformAng, uniform);
          const ca = Math.cos(circulation);
          const sa = Math.sin(circulation);
          const x0 = (cp.x * ca - cp.y * sa) * cp.rho;
          const y0 = (cp.x * sa + cp.y * ca) * cp.rho;
          const z0 = cp.z * cp.rho;
          const turb = noiseCore(x0 * 2.4 + cp.phase, y0 * 2.4 - t * 0.055) * 0.035 * (1 - uniform);
          const p3 = project(x0, y0, z0, turb);
          const dN = (p3.z + 1) * 0.5;
          const shell = Math.max(0, (cp.rho - 0.58) / 0.42);
          const tw = 0.45 + 0.55 * Math.sin(cp.tw + t * cp.twSpd + turb * 8);
          const alpha = cp.bright * tw * brightPulse * (0.12 + dN * 0.34 + shell * 0.36) * (1 - Math.max(0, p3.edge - 1) * 0.8);
          const sz = cp.size * (0.62 + dN * 0.55 + shell * 0.35);
          const rch = Math.floor(85 + dN * 115 + shell * 35);
          ctx.fillStyle = `rgba(${rch}, 255, 255, ${alpha})`;
          ctx.fillRect(p3.x - sz / 2, p3.y - sz / 2, sz, sz);
        }

        // surface formations
        for (let i = 0; i < coreVeins.length; i++) {
          const v = coreVeins[i];
          const u = v.u;
          let x0 = 0;
          let y0 = 0;
          let z0 = 0;
          if (v.kind === 0) {
            z0 = Math.max(-0.92, Math.min(0.92, v.band * 0.82 + noiseCore(v.band * 2, t * 0.025 + v.phase) * 0.035));
            const rad = Math.sqrt(Math.max(0, 1 - z0 * z0));
            const a = u * Math.PI * 2 + v.twist * Math.sin(u * Math.PI * 2 + t * 0.05) + coreSpin * 0.65;
            x0 = Math.cos(a) * rad;
            y0 = Math.sin(a) * rad;
          } else {
            z0 = (u * 2 - 1) * 0.94;
            const rad = Math.sqrt(Math.max(0, 1 - z0 * z0));
            const a = v.band * Math.PI + v.twist * z0 + Math.sin(u * Math.PI * 3 + v.phase + t * 0.04) * 0.18;
            x0 = Math.cos(a + coreSpin * 0.45) * rad;
            y0 = Math.sin(a + coreSpin * 0.45) * rad;
          }
          const broken = noiseMid(x0 * 5 + v.phase, y0 * 5 - t * 0.06);
          if (broken < -0.42) continue;
          const wob = noiseCore(x0 * 3 + v.phase, z0 * 3 + t * 0.04) * 0.028;
          const p3 = project(x0, y0, z0, wob);
          const dN = (p3.z + 1) * 0.5;
          const rim = Math.max(0, Math.min(1, (p3.edge - 0.38) / 0.62));
          const alpha = v.bright * brightPulse * (0.1 + dN * 0.36 + rim * 0.34) * (0.45 + Math.max(0, broken) * 0.55);
          const sz = v.size * (0.75 + dN * 0.65 + rim * 0.35);
          ctx.fillStyle = `rgba(${125 + Math.floor(dN * 95)}, 255, 255, ${alpha})`;
          ctx.fillRect(p3.x - sz / 2, p3.y - sz / 2, sz, sz);
        }
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, lite]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ transform: "translate(-50%, -50%)" }}
      aria-label="Holographic energy ring"
    />
  );
};
