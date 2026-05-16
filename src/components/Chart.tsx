import { useEffect, useRef, useState } from "react";
import { useMerlin } from "@/store/merlinStore";
import { CornerDeco } from "./CornerDeco";

export const Chart = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length: 60 }, (_, i) => 67000 + Math.sin(i / 5) * 800 + Math.random() * 400)
  );
  const { cpuPercent, conversationCount, searchCount, uptime } = useMerlin();

  useEffect(() => {
    const id = setInterval(() => {
      setData((d) => [...d.slice(1), d[d.length - 1] + (Math.random() - 0.5) * 300]);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(0,200,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(0,200,255,0.25)");
    grad.addColorStop(1, "rgba(0,200,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 10) - 5;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0,200,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 10) - 5;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const lastX = (data.length - 1) * step;
    const lastY = h - ((data[data.length - 1] - min) / range) * (h - 10) - 5;
    ctx.fillStyle = "#00c8ff";
    ctx.shadowColor = "#00c8ff";
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(lastX, lastY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }, [data]);

  const fmtUptime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="h-[130px] mx-2 mb-2 flex gap-2">
      <div className="merlin-panel flex-1 p-2 relative">
        <CornerDeco />
        <div className="flex items-center justify-between mb-1">
          <div className="font-orbitron text-[8px] tracking-[3px] text-[var(--merlin-primary)]">// BTC/USD</div>
          <div className="font-orbitron text-[10px] text-[var(--merlin-text-bright)]">
            ${Math.round(data[data.length - 1]).toLocaleString()}
          </div>
        </div>
        <canvas ref={ref} className="w-full" style={{ height: 95 }} />
      </div>
      <div className="merlin-panel w-[180px] p-2 relative">
        <CornerDeco />
        <div className="font-orbitron text-[8px] tracking-[3px] text-[var(--merlin-primary)] mb-2">// SYSTEM</div>
        <Stat label="CPU" value={`${Math.round(cpuPercent)}%`} bar={cpuPercent} />
        <Stat label="KONVERZACE" value={String(conversationCount)} />
        <Stat label="SEARCH" value={String(searchCount)} />
        <Stat label="UPTIME" value={fmtUptime(uptime)} />
      </div>
    </div>
  );
};

const Stat = ({ label, value, bar }: { label: string; value: string; bar?: number }) => (
  <div className="mb-1.5">
    <div className="flex justify-between font-orbitron text-[8px] tracking-wider">
      <span className="opacity-60">{label}</span>
      <span className="text-[var(--merlin-text-bright)]">{value}</span>
    </div>
    {bar !== undefined && (
      <div className="h-[2px] bg-[var(--merlin-border)] mt-0.5">
        <div className="h-full bg-[var(--merlin-primary)] shadow-[0_0_6px_var(--merlin-primary-glow)]" style={{ width: `${bar}%` }} />
      </div>
    )}
  </div>
);