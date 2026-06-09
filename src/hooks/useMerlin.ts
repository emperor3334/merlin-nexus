import { useCallback } from "react";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPI, type ChatResponse } from "@/api/merlin-api";
import type { SplitWindow } from "@/store/merlinStore";

const SEARCH_KW = ["search", "find", "google", "look up", "vyhledej", "najdi"];

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
  const m = text.match(/(?:map of|show me|where is|fly to|go to|mapu?|kde je|ukáž|ukaž|jdi na|leť na)\s+([\p{L}\s]+?)(?:[.,?!]|$)/iu);
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

  // Return to the main Merlin page
  if (/^(main page|home|home page|go home|back to main|hlavní stránka|hlavni stranka|domů|domu|zpět na hlavní)/.test(lo)) {
    st.resetToHome();
    return true;
  }

  if (/^(zavři|skryj|zavri|odejdi)/.test(lo)) {
    st.clearContent();
    return true;
  }
  if (/^(close|hide|dismiss|exit)\b/.test(lo)) {
    st.clearContent();
    return true;
  }

  // Process view
  if (/^(show process|show your work|verbose mode)\b/.test(lo)) {
    st.setShowProcess(true);
    return true;
  }
  if (/^(hide process|stop showing process)\b/.test(lo)) {
    st.setShowProcess(false);
    return true;
  }

  // Split screen
  if (/(close split screen|single view)/.test(lo)) {
    st.setSplitScreen(null);
    return true;
  }

  // Audio player voice controls
  const audio = (window as any).__merlinAudio;
  if (audio && st.audioPlayer) {
    if (/skip 10 seconds|skip ten seconds/.test(lo)) { audio.seek(10); return true; }
    if (/go back 10 seconds|back ten seconds/.test(lo)) { audio.seek(-10); return true; }
    if (/faster/.test(lo)) { audio.setSpeed(0.5); return true; }
    if (/slower/.test(lo)) { audio.setSpeed(-0.5); return true; }
    if (/^(pause|play)$/.test(lo)) { audio.toggle(); return true; }
    if (/stop playback/.test(lo)) { audio.stop(); return true; }
  }

  const map = (window as any).__merlinMap;
  if (map) {
    if (/přibliž|zoom in/.test(lo)) { map.zoomIn(); return true; }
    if (/oddal|zoom out/.test(lo)) { map.zoomOut(); return true; }
    if (/scroll down|pan down/.test(lo)) { map.panBy([0, 300]); return true; }
    if (/scroll up|pan up/.test(lo)) { map.panBy([0, -300]); return true; }
  }

  return false;
}

function handleMerlinResponse(res: ChatResponse) {
  const st = useMerlin.getState();

  // Browser action
  if (res.browser_action?.action === "open_url" && res.browser_action.url) {
    st.setContent({
      type: "web",
      data: { url: res.browser_action.url },
      url: res.browser_action.url,
      title: res.browser_action.title,
    });
  }

  // Process events
  if (res.show_process) st.setShowProcess(true);

  // Behavior applied
  if (res.mode === "behavior") {
    st.triggerBehaviorBadge();
    if (res.browser_action?.url) {
      st.setContent({
        type: (res.browser_action.type as any) || "web",
        data: { url: res.browser_action.url },
        url: res.browser_action.url,
        title: res.browser_action.title,
      });
    }
  }

  // SSH shell opened
  if (res.open_shell?.host) {
    st.openSSH(res.open_shell.host);
  } else if (res.mode === "ssh" && /Interactive terminal/i.test(res.response || "")) {
    const m = res.response.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (m) st.openSSH(m[1]);
  }

  // Split screen
  if (res.split_screen?.windows?.length) {
    const windows: SplitWindow[] = res.split_screen.windows.map((w, i) => ({
      id: w.id || String(i),
      position: (w.position as any) || "left",
      content: w.content
        ? (w.content as any)
        : { type: (w.type as any) || "web", data: { url: w.url }, url: w.url, title: w.title },
    }));
    st.setSplitScreen({ layout: res.split_screen.layout || (windows.length > 2 ? "4" : "2-horizontal"), windows });
  }

  // Audio playback
  if (res.play_audio?.url) st.openAudioPlayer(res.play_audio.url, res.play_audio.session_id);

  // Text viewer (white or dark)
  if (res.show_text) {
    st.setContent({
      type: res.show_text.white_bg ? "white" : "text",
      data: { content: res.show_text.content },
      title: res.show_text.title,
    });
  }

  // File browser
  if (res.show_files?.items) {
    st.setContent({ type: "files", data: { items: res.show_files.items }, title: "FILES" });
  }

  // Log viewer
  if (res.show_log?.entries) {
    st.setContent({ type: "log", data: { entries: res.show_log.entries }, title: "LOG" });
  }
}

function parseOpenUrl(text: string): { url: string; rest: string } | null {
  const m = text.match(/^\s*\[OPEN:([^\]]+)\]\s*([\s\S]*)$/);
  if (m) return { url: m[1].trim(), rest: m[2].trim() };
  return null;
}

async function detectContent(userQuery: string, aiResponse: string) {
  const lo = userQuery.toLowerCase();

  if (/\bmap\b|where is|fly to|show me .*?(city|country|place)|mapu|mapa|kde je|ukáž místo|jdi na|leť na/.test(lo)) {
    const place = extractLocation(userQuery) || "Prague";
    const coords = await geocode(place);
    if (coords) return { type: "map" as const, data: { ...coords, zoom: 12, label: place }, title: place };
  }

  if (/youtube|video|play video|pusť video|spusť video/.test(lo)) {
    const yt = extractYouTube(aiResponse) || extractYouTube(userQuery);
    if (yt) return { type: "video" as const, data: { url: yt }, url: yt, title: "YouTube" };
  }

  if (/chart|graph|price|rate|btc|ethereum|bitcoin|graf|kurz|cena/.test(lo)) {
    const sym = extractSymbol(userQuery);
    return { type: "chart" as const, data: { symbol: sym }, title: `${sym}/USD` };
  }

  if (aiResponse.length > 220) {
    return { type: "text" as const, data: { content: aiResponse }, title: "MERLIN" };
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
      u.lang = "en-US";
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
          handleMerlinResponse(res);
        } else {
          await new Promise((r) => setTimeout(r, 700));
          reply = simulateReply(text);
          badge = "[OFFLINE→SIM]";
        }
      } catch (e: any) {
        reply = `Backend connection failed. (${e?.message ?? "error"})`;
        badge = "[OFFLINE]";
      } finally {
        useMerlin.getState().setTyping(false);
      }

      // Detect [OPEN:url] prefix from AI and open in window
      const open = parseOpenUrl(reply);
      const cleanReply = open ? open.rest || "Opening." : reply;

      useMerlin.getState().addMessage({
        id: crypto.randomUUID(),
        role: "merlin",
        text: cleanReply,
        badge,
        timestamp: new Date(),
      });

      if (open) {
        const isYt = /youtube\.com|youtu\.be/.test(open.url);
        const url = isYt && !/embed/.test(open.url)
          ? open.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
          : open.url;
        useMerlin.getState().setContent({
          type: isYt ? "video" : "web",
          data: { url },
          url,
          title: isYt ? "YouTube" : open.url,
        });
        useMerlin.getState().log(`OPEN: ${open.url.slice(0, 36)}`);
      } else {
        const content = await detectContent(text, reply);
        if (content) {
          useMerlin.getState().setContent(content);
          useMerlin.getState().log(`CONTENT: ${content.type.toUpperCase()}`);
        }
      }

      speak(cleanReply);
    },
    [speak]
  );

  return { sendUserMessage, speak };
}

function simulateReply(text: string): string {
  const lo = text.toLowerCase();
  if (lo.includes("hello") || lo.includes("hi ") || lo.includes("hey"))
    return "Greetings, operator. All systems online.";
  if (lo.includes("who are you")) return "I am MERLIN — your personal AI assistant.";
  if (lo.includes("map")) return "Displaying the requested location.";
  if (lo.includes("chart") || lo.includes("btc")) return "Rendering the requested chart.";
  if (lo.includes("time"))
    return `System time: ${new Date().toLocaleTimeString("en-US")}.`;
  return "Backend offline — running in simulation mode. Start app.py for full functionality.";
}