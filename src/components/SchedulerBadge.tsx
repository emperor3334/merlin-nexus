import { useEffect } from "react";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPIv8 } from "@/api/merlin-api";
import { useMerlinAgent } from "@/hooks/useMerlin";

export const SchedulerBadge = () => {
  const schedules = useMerlin((s) => s.schedules);
  const setSchedules = useMerlin((s) => s.setSchedules);
  const { sendUserMessage } = useMerlinAgent();

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await MerlinAPIv8.scheduler();
        if (alive) setSchedules(r?.schedules || []);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [setSchedules]);

  if (!schedules.length) return null;
  const s = schedules[0];

  return (
    <button
      onClick={() => sendUserMessage("what's scheduled?")}
      className="fixed bottom-9 z-30 font-orbitron"
      style={{
        right: 56,
        fontSize: 8,
        letterSpacing: 1.5,
        color: "rgba(255,200,0,0.5)",
      }}
    >
      ⏰ {s.label || `${s.action} at ${s.time}`}
    </button>
  );
};