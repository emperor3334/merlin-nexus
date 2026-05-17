import { useEffect, useRef } from "react";
import { useMerlin } from "@/store/merlinStore";
import { useMerlinAgent } from "@/hooks/useMerlin";

const END_PHRASES = [
  "that's all", "thats all", "stop listening",
  "thanks merlin", "goodbye merlin", "stop merlin",
];
const SILENCE_MS = 40000;

export function useWakeWord() {
  const { sendUserMessage } = useMerlinAgent();
  const recRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const sendRef = useRef(sendUserMessage);
  sendRef.current = sendUserMessage;

  const endSession = () => {
    const st = useMerlin.getState();
    st.setSessionActive(false);
    st.setMicFilled(false);
    st.setOrbState("standby");
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const armSilence = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(endSession, SILENCE_MS);
  };

  const ensureRecognizer = () => {
    if (recRef.current) return recRef.current;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      useMerlin.getState().log("STT NOT SUPPORTED");
      return null;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const t = e.results[e.results.length - 1][0].transcript.trim();
      const lo = t.toLowerCase();
      const st = useMerlin.getState();

      if (!st.sessionActive) {
        if (lo.includes("merlin")) {
          st.setSessionActive(true);
          st.setMicFilled(true);
          st.setOrbState("listening");
          st.triggerWakeFlash();
          st.log("WAKE WORD DETECTED");
          const command = t.replace(/^.*?merlin[,.\s]*/i, "").trim();
          if (command) sendRef.current(command);
          armSilence();
        }
      } else {
        if (END_PHRASES.some((p) => lo.includes(p))) {
          st.log("SESSION ENDED");
          endSession();
          return;
        }
        sendRef.current(t);
        armSilence();
      }
    };

    rec.onend = () => {
      // auto-restart so wake word stays alive
      try { rec.start(); } catch {}
    };
    rec.onerror = () => {
      try { rec.stop(); } catch {}
    };
    recRef.current = rec;
    return rec;
  };

  useEffect(() => {
    const rec = ensureRecognizer();
    if (!rec) return;
    try { rec.start(); useMerlin.getState().log("WAKE WORD ACTIVE"); } catch {}
    return () => {
      try { rec.onend = null; rec.stop(); } catch {}
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const st = useMerlin.getState();
    if (st.sessionActive) {
      endSession();
    } else {
      st.setSessionActive(true);
      st.setMicFilled(true);
      st.setOrbState("listening");
      st.log("MIC ACTIVE");
      armSilence();
      ensureRecognizer();
    }
  };

  return { toggle };
}
