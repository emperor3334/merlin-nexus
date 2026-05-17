import { create } from "zustand";

export type OrbState = "standby" | "thinking" | "listening" | "speaking";
export type ContentType = "map" | "video" | "chart" | "search" | "image" | "text" | "web" | null;

export interface Message {
  id: string;
  role: "user" | "merlin";
  text: string;
  badge?: string;
  timestamp: Date;
}

export interface ActiveContent {
  type: ContentType;
  data?: any;
  url?: string;
  title?: string;
}

export interface LogEntry {
  time: string;
  text: string;
}

interface MerlinState {
  backendOnline: boolean;
  aiMode: "claude" | "ollama" | "offline";
  internet: boolean;
  userName: string;
  orbState: OrbState;
  activeContent: ActiveContent;
  messages: Message[];
  isTyping: boolean;
  micActive: boolean;
  micFilled: boolean;
  sessionActive: boolean;
  bootDone: boolean;
  audioLevel: number;
  wakeFlash: number;
  activityLog: LogEntry[];
  setBackendOnline: (b: boolean) => void;
  setAiMode: (m: "claude" | "ollama" | "offline", internet?: boolean) => void;
  setOrbState: (s: OrbState) => void;
  setContent: (c: ActiveContent) => void;
  clearContent: () => void;
  addMessage: (m: Message) => void;
  setTyping: (t: boolean) => void;
  setMicActive: (a: boolean) => void;
  setMicFilled: (a: boolean) => void;
  setSessionActive: (a: boolean) => void;
  setBootDone: (b: boolean) => void;
  setAudioLevel: (v: number) => void;
  triggerWakeFlash: () => void;
  log: (text: string) => void;
}

const ts = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

export const useMerlin = create<MerlinState>((set) => ({
  backendOnline: false,
  aiMode: "offline",
  internet: false,
  userName: "OPERATOR",
  orbState: "standby",
  activeContent: { type: null },
  messages: [],
  isTyping: false,
  micActive: false,
  micFilled: false,
  sessionActive: false,
  bootDone: false,
  audioLevel: 0,
  wakeFlash: 0,
  activityLog: [],
  setBackendOnline: (b) => set({ backendOnline: b }),
  setAiMode: (m, internet) =>
    set((st) => ({ aiMode: m, internet: internet ?? st.internet })),
  setOrbState: (s) => set({ orbState: s }),
  setContent: (c) => set({ activeContent: c }),
  clearContent: () => set({ activeContent: { type: null } }),
  addMessage: (m) => set((st) => ({ messages: [...st.messages, m] })),
  setTyping: (t) => set({ isTyping: t }),
  setMicActive: (a) => set({ micActive: a }),
  setMicFilled: (a) => set({ micFilled: a }),
  setSessionActive: (a) => set({ sessionActive: a }),
  setBootDone: (b) => set({ bootDone: b }),
  setAudioLevel: (v) => set({ audioLevel: v }),
  triggerWakeFlash: () => set({ wakeFlash: Date.now() }),
  log: (text) =>
    set((st) => ({ activityLog: [{ time: ts(), text }, ...st.activityLog].slice(0, 8) })),
}));