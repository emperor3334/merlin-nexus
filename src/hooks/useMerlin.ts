import { useCallback } from "react";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPI } from "@/api/merlin-api";

const SEARCH_KW = ["vyhledej", "najdi", "zjisti", "google"];

async function geocode(name: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
      { headers: { Accept: "application/json" } }
    );
    const d = await r.json();
    if (d?.[0]) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch {}
  return null;
}

function extractLocation(text: string): string | null {
  const m = text.match(/(?:mapu?|kde je|ukáž|ukaž|jdi na|leť na|fly to)\s+([\p{L}\s]+?)(?:[.,?!]|$)/iu);
  return m ? m[1].trim() : null;
}

function extractYouTube(text: string): string | null {
  const m = text.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  return null;
}

function extractSymbol(text: string): string {
  const lo = text.toLowerCase();
  if (lo.includes("eth")) return "ETH";
  if (lo.includes("zlato") || lo.includes("gold")) return "GOLD";
  if (lo.includes("eur")) return "EUR/USD";
  return "BTC";
}

async function tryVoiceCommand(text: string): Promise<boolean> {
  const lo = text.toLowerCase().trim();
  const st = useMerlin.getState();

  if (/^(zavři|skryj|zavri|odejdi)/.test(lo)) {
    st.clearContent();
    return true;
  }

  const map = (window as any).__merlinMap;
  if (map) {
    if (/přibliž|zoom in/.test(lo)) { map.zoomIn(); return true; }
    if (/oddal|zoom out/.test(lo)) { map.zoomOut(); return true; }
    if (/scroll.+dolů|posuň.+dolů/.test(lo)) { map.panBy([0, 300]); return true; }
    if (/scroll.+nahoru|posuň.+nahoru/.test(lo)) { map.panBy([0, -300]); return true; }
  }

  return false;
}

async function detectContent(userQuery: string, aiResponse: string) {
  const lo = userQuery.toLowerCase();

  if (/mapu|mapa|kde je|ukáž místo|jdi na|leť na/.test(lo)) {
    const place = extractLocation(userQuery) || "Praha";
    const coords = await geocode(place);
    if (coords) return { type: "map" as const, data: { ...coords, zoom: 12, label: place } };
  }

  if (/youtube|video|pusť video|spusť video/.test(lo)) {
    const yt = extractYouTube(aiResponse) || extractYouTube(userQuery);
    if (yt) return { type: "video" as const, data: { url: yt } };
  }

  if (/graf|kurz|cena|btc|ethereum|bitcoin/.test(lo)) {
    return { type: "chart" as const, data: { symbol: extractSymbol(userQuery) } };
  }

  if (aiResponse.length > 220) {
    return { type: "text" as const, data: { content: aiResponse } };
  }

  return null;
}

export function useMerlinAgent() {
  const speak = useCallback(async (text: string) => {
    const st = useMerlin.getState();
    st.setOrbState("speaking");
    try {
      if (st.backendOnline) {
        const d = await MerlinAPI.tts(text);
        if (d?.audio) {
          const audio = new Audio(`data:audio/${d.format || "mp3"};base64,${d.audio}`);
          await new Promise<void>((res) => {
            audio.onended = () => res();
            audio.onerror = () => res();
            audio.play().catch(() => res());
          });
          useMerlin.getState().setOrbState("standby");
          return;
        }
      }
    } catch {}
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "cs-CZ";
      u.rate = 1.05;
      u.onend = () => useMerlin.getState().setOrbState("standby");
      window.speechSynthesis.speak(u);
    } catch {
      useMerlin.getState().setOrbState("standby");
    }
  }, []);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const st = useMerlin.getState();
      st.addMessage({ id: crypto.randomUUID(), role: "user", text, timestamp: new Date() });
      st.log(`USER: ${text.slice(0, 36)}`);

      if (await tryVoiceCommand(text)) return;

      st.setTyping(true);
      st.setOrbState("thinking");

      const lo = text.toLowerCase();
      const useSearch = SEARCH_KW.some((k) => lo.includes(k));

      let reply = "";
      let badge: string | undefined;
      try {
        if (st.backendOnline) {
          const history = st.messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          }));
          const res = await MerlinAPI.chat(text, history, st.userName, useSearch);
          reply = res.response;
          badge = res.merged
            ? "[CLAUDE+GPT→MERGED]"
            : res.models_used?.length
              ? `[${res.models_used.join("+")}]`
              : undefined;
        } else {
          await new Promise((r) => setTimeout(r, 700));
          reply = simulateReply(text);
          badge = "[OFFLINE→SIM]";
        }
      } catch (e: any) {
        reply = `Spojení s backendem selhalo. (${e?.message ?? "error"})`;
        badge = "[OFFLINE]";
      } finally {
        useMerlin.getState().setTyping(false);
      }

      useMerlin.getState().addMessage({
        id: crypto.randomUUID(),
        role: "merlin",
        text: reply,
        badge,
        timestamp: new Date(),
      });

      const content = await detectContent(text, reply);
      if (content) {
        useMerlin.getState().setContent(content);
        useMerlin.getState().log(`CONTENT: ${content.type.toUpperCase()}`);
      }

      speak(reply);
    },
    [speak]
  );

  return { sendUserMessage, speak };
}

function simulateReply(text: string): string {
  const lo = text.toLowerCase();
  if (lo.includes("ahoj") || lo.includes("dobr")) return "Zdravím, operátore. Všechny systémy online.";
  if (lo.includes("kdo jsi")) return "Jsem MERLIN — váš osobní AI asistent.";
  if (lo.includes("mapu") || lo.includes("mapa")) return "Zobrazuji požadovanou lokaci.";
  if (lo.includes("graf") || lo.includes("btc")) return "Zobrazuji požadovaný graf.";
  if (lo.includes("čas") || lo.includes("hodin"))
    return `Systémový čas: ${new Date().toLocaleTimeString("cs-CZ")}.`;
  return "Backend offline — pracuji v simulovaném režimu. Spusťte app.py pro plnou funkčnost.";
}