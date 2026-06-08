export class ClapDetector {
  private lastClap = 0;
  private readonly threshold = 0.35;
  private readonly maxGap = 700;
  private readonly minGap = 80;
  private raf = 0;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;

  constructor(private onDoubleClap: () => void) {}

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(this.stream);
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    const check = () => {
      analyser.getFloatTimeDomainData(buf);
      let vol = 0;
      for (let i = 0; i < buf.length; i++) vol = Math.max(vol, Math.abs(buf[i]));
      if (vol > this.threshold) {
        const now = Date.now();
        const gap = now - this.lastClap;
        if (gap > this.minGap && gap < this.maxGap) this.onDoubleClap();
        this.lastClap = now;
      }
      this.raf = requestAnimationFrame(check);
    };
    check();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
  }
}