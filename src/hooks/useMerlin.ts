import { useCallback } from "react";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPI } from "@/api/merlin-api";
import { CHANNELS } from "@/components/VideoPanel";

const SEARCH_KW = ["vyhledej", "najdi", "zjisti", "co je", "kdo je", "kdy", "kde", "kolik", "jak se", "zprávy", "news"];
const MEDIA_KW = ["pusť", "pusti", "otevři", "zobraz", "zapni", "spusť"];
const MEDIA_TARGETS: Record<string, string[]> = {
  "ct-sport": ["čt sport", "ct sport"],
  ct24: ["čt24", "ct24", "ct 24"],
  yt: ["youtube", "yt"],
  map: ["mapu", "mapa"],
  wiki: ["wikipedia", "wiki"],
};

function detectMedia(text: string): string | null {
  const lo = text.toLowerCase();
  if (!MEDIA_KW.some((k) => lo.includes(k))) return null;
  for (const [id, kws] of Object.entries(MEDIA_TARGETS)) {
    if (kws.some((k) => lo.includes(k))) return id;
  }
  return null;
}

export function useMerlinAgent() {
  const {
    backendMode,
    addMessage,
    setTyping,
    setOrbState,
    setChannel,
    log,
    messages,
    userName,
  } = useMerlin();

  const speak = useCallback(
    async (text: string) => {
      setOrbState("speaking");
      try {
        if (backendMode) {
          const d = await MerlinAPI.tts(text);
          if (d?.audio) {
            const audio = new Audio(`data:audio/${d.format || "mp3"};base64,${d.audio}`);
            await new Promise<void>((res) => {
              audio.onended = () => res();
              audio.onerror = () => res();
              audio.play().catch(() => res());
            });
            setOrbState("standby");
            return;
          }
        }
      } catch {}
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "cs-CZ";
        u.onend = () => setOrbState("standby");
        window.speechSynthesis.speak(u);
      } catch {
        setOrbState("standby");
      }
    },
    [backendMode, setOrbState]
  );

  const sendUserMessage = useCallback(
    async (text: string) => {
      const userMsg = { id: crypto.randomUUID(), role: "user" as const, text, timestamp: new Date() };
      addMessage(userMsg);
      log(`USER: ${text.slice(0, 30)}`);

      const mediaId = detectMedia(text);
      if (mediaId && CHANNELS[mediaId]) {
        setChannel(mediaId, CHANNELS[mediaId].url);
        const reply = `Spouštím ${CHANNELS[mediaId].name}.`;
        addMessage({ id: crypto.randomUUID(), role: "merlin", text: reply, timestamp: new Date() });
        speak(reply);
        return;
      }

      setTyping(true);
      setOrbState("thinking");
      const lo = text.toLowerCase();
      const useSearch = SEARCH_KW.some((k) => lo.includes(k));

      try {
        if (backendMode) {
          const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
          const res = await MerlinAPI.chat(text, history, userName, useSearch);
          const badge = res.merged ? "[CLAUDE+GPT→MERGED]" : res.models_used?.length ? `[${res.models_used.join("+")}]` : undefined;
          addMessage({ id: crypto.randomUUID(), role: "merlin", text: res.response, badge, timestamp: new Date() });
          speak(res.response);
        } else {
          await new Promise((r) => setTimeout(r, 800));
          const reply = simulateReply(text);
          addMessage({
            id: crypto.randomUUID(),
            role: "merlin",
            text: reply,
            badge: "[OFFLINE→SIM]",
            timestamp: new Date(),
          });
          speak(reply);
        }
      } catch (e: any) {
        const reply = `Spojení s backendem selhalo. Pracuji v offline módu. (${e?.message ?? "error"})`;
        addMessage({ id: crypto.randomUUID(), role: "merlin", text: reply, badge: "[OFFLINE]", timestamp: new Date() });
        speak(reply);
      } finally {
        setTyping(false);
        setTimeout(() => setOrbState((s) => s), 50);
      }
    },
    [addMessage, backendMode, log, messages, setChannel, setOrbState, setTyping, speak, userName]
  );

  return { sendUserMessage, speak };
}

function simulateReply(text: string): string {
  const lo = text.toLowerCase();
  if (lo.includes("ahoj") || lo.includes("dobr")) return "Zdravím, operátore. Všechny systémy jsou online a připravené.";
  if (lo.includes("kdo jsi") || lo.includes("kdo si")) return "Jsem MERLIN — váš osobní AI asistent. V2.0-BETA.";
  if (lo.includes("čas") || lo.includes("hodin")) return `Aktuální systémový čas: ${new Date().toLocaleTimeString("cs-CZ")}.`;
  return "Backend není dostupný. Pracuji v simulovaném režimu — pro plnou funkčnost spusťte app.py.";
}