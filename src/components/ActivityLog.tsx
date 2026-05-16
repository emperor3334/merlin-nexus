import { useMerlin } from "@/store/merlinStore";

export const ActivityLog = () => {
  const log = useMerlin((s) => s.activityLog);
  return (
    <div className="border-t border-[var(--merlin-border)] p-2 max-h-[120px] overflow-hidden">
      <div className="font-orbitron text-[8px] tracking-[3px] text-[var(--merlin-primary)] mb-1">
        // ACTIVITY
      </div>
      <div className="space-y-0.5 font-orbitron text-[8px] tracking-wider opacity-70">
        {log.slice(0, 6).map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[var(--merlin-success)]">›</span>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};