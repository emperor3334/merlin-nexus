import { useEffect, useRef } from "react";

export const ChartView = ({ data }: { data: { symbol: string } }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width;
      c.height = r.height;
    };
    resize();
    window.addEventListener("resize", resize);
    const N = 120;
    let base = 67000;
    const pts = Array.from({ length: N }, () => {
      base += (Math.random() - 0.48) * 600;
      return base;
    });
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const pad = 30;
      const w = c.width - pad * 2;
      const h = c.height - pad * 2;
      ctx.strokeStyle = "rgba(0,200,255,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad + (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(c.width - pad, y);
        ctx.stroke();
      }
      const grad = ctx.createLinearGradient(0, pad, 0, c.height);
      grad.addColorStop(0, "rgba(0,200,255,0.25)");
      grad.addColorStop(1, "rgba(0,200,255,0)");
      ctx.beginPath();
      pts.forEach((v, i) => {
        const x = pad + (w / (N - 1)) * i;
        const y = pad + h - ((v - min) / (max - min)) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(c.width - pad, c.height - pad);
      ctx.lineTo(pad, c.height - pad);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      pts.forEach((v, i) => {
        const x = pad + (w / (N - 1)) * i;
        const y = pad + h - ((v - min) / (max - min)) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#00c8ff";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(0,200,255,0.6)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    draw();
    return () => window.removeEventListener("resize", resize);
  }, [data.symbol]);
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-3 left-4 font-orbitron text-[11px] tracking-[3px] text-[var(--text-bright)] z-10">
        {data.symbol} / USD
      </div>
      <canvas ref={ref} className="w-full h-full" />
    </div>
  );
};