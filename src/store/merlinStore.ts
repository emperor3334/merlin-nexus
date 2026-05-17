import { create } from "zustand";

export type OrbState = "standby" | "thinking" | "listening" | "speaking";
export type ContentType = "map" | "video" | "chart" | "search" | "image" | "text" | null;

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
}

export interface LogEntry {
  time: string;
  text: string;
}

interface MerlinState {
  backendOnline: boolean;
  userName: string;
  orbState: OrbState;
  activeContent: ActiveContent;
  messages: Message[];
  isTyping: boolean;
  micActive: boolean;
  micFilled: boolean;
  sessionActive: boolean;
  bootDone: boolean;
  activityLog: LogEntry[];
  setBackendOnline: (b: boolean) => void;
  setOrbState: (s: OrbState) => void;
  setContent: (c: ActiveContent) => void;
  clearContent: () => void;
  addMessage: (m: Message) => void;
  setTyping: (t: boolean) => void;
  setMicActive: (a: boolean) => void;
  setMicFilled: (a: boolean) => void;
  setSessionActive: (a: boolean) => void;
  setBootDone: (b: boolean) => void;
  log: (text: string) => void;
}

const ts = () => new Date().toLocaleTimeString("cs-CZ", { hour12: false });

export const useMerlin = create<MerlinState>((set) => ({
  backendOnline: false,
  userName: "OPERATOR",
  orbState: "standby",
  activeContent: { type: null },
  messages: [],
  isTyping: false,
  micActive: false,
  micFilled: false,
  sessionActive: false,
  bootDone: false,
  activityLog: [],
  setBackendOnline: (b) => set({ backendOnline: b }),
  setOrbState: (s) => set({ orbState: s }),
  setContent: (c) => set({ activeContent: c }),
  clearContent: () => set({ activeContent: { type: null } }),
  addMessage: (m) => set((st) => ({ messages: [...st.messages, m] })),
  setTyping: (t) => set({ isTyping: t }),
  setMicActive: (a) => set({ micActive: a }),
  setMicFilled: (a) => set({ micFilled: a }),
  setSessionActive: (a) => set({ sessionActive: a }),
  setBootDone: (b) => set({ bootDone: b }),
  log: (text) =>
    set((st) => ({ activityLog: [{ time: ts(), text }, ...st.activityLog].slice(0, 8) })),
}));