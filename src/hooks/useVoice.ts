import { useEffect, useRef } from "react";
import { useMerlin } from "@/store/merlinStore";

interface Opts {
  onInterim?: (t: string) => void;
  onFinal: (t: string) => void;
}

export function useVoice(opts: Opts) {
  const recRef = useRef<any>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => () => recRef.current?.stop?.(), []);

  const start = () => {
    const { setMicActive, setOrbState, log } = useMerlin.getState();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      log("STT NEPODPOROVÁNO");
      return;
    }
    const rec = new SR();
    rec.lang = "cs-CZ";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) optsRef.current.onInterim?.(interim);
      if (final) optsRef.current.onFinal(final.trim());
    };
    const end = () => {
      const st = useMerlin.getState();
      st.setMicActive(false);
      st.setOrbState("standby");
    };
    rec.onend = end;
    rec.onerror = end;
    recRef.current = rec;
    try {
      rec.start();
      setMicActive(true);
      setOrbState("listening");
      log("MIC AKTIVNÍ");
    } catch {
      setMicActive(false);
    }
  };

  const stop = () => {
    const st = useMerlin.getState();
    recRef.current?.stop?.();
    st.setMicActive(false);
    st.setOrbState("standby");
  };

  return { start, stop };
}