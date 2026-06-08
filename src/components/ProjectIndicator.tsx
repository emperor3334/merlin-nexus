import { useMerlin } from "@/store/merlinStore";
import { useMerlinAgent } from "@/hooks/useMerlin";

export const ProjectIndicator = () => {
  const project = useMerlin((s) => s.project);
  const { sendUserMessage } = useMerlinAgent();

  if (!project) return null;

  return (
    <button
      onClick={() => sendUserMessage("what's the status of this project?")}
      className="fixed left-5 z-30 font-orbitron"
      style={{ bottom: 40, fontSize: 8, letterSpacing: 2, color: "rgba(0,200,255,0.4)" }}
    >
      ● PROJECT: {project}
    </button>
  );
};