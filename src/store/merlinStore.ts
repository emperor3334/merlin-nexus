import { create } from "zustand";

export type OrbState = "standby" | "thinking" | "listening" | "speaking";

export interface Message {
  id: string;
  role: "user" | "merlin";
  text: string;
  badge?: string;
  timestamp: Date;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface MerlinState {
  backendMode: boolean;
  apiKey: string;
  userName: string;
  orbState: OrbState;
  messages: Message[];
  isTyping: boolean;
  currentChannel: string | null;
  videoUrl: string | null;
  conversationCount: number;
  searchCount: number;
  cpuPercent: number;
  uptime: number;
  searchResults: SearchResult[];
  showSearchResults: boolean;
  cameraOpen: boolean;
  activityLog: string[];
  setOrbState: (s: OrbState) => void;
  addMessage: (m: Message) => void;
  setTyping: (t: boolean) => void;
  setChannel: (id: string | null, url: string | null) => void;
  setSearchResults: (r: SearchResult[], show: boolean) => void;
  setCameraOpen: (o: boolean) => void;
  log: (s: string) => void;
  tick: () => void;
  setBackendMode: (b: boolean) => void;
}

export const useMerlin = create<MerlinState>((set) => ({
  backendMode: false,
  apiKey: "",
  userName: "OPERATOR",
  orbState: "standby",
  messages: [],
  isTyping: false,
  currentChannel: null,
  videoUrl: null,
  conversationCount: 0,
  searchCount: 0,
  cpuPercent: 12,
  uptime: 0,
  searchResults: [],
  showSearchResults: false,
  cameraOpen: false,
  activityLog: ["SYSTEM INIT", "LOADING CORE", "MERLIN ONLINE"],
  setOrbState: (s) => set({ orbState: s }),
  addMessage: (m) =>
    set((st) => ({
      messages: [...st.messages, m],
      conversationCount: m.role === "merlin" ? st.conversationCount + 1 : st.conversationCount,
    })),
  setTyping: (t) => set({ isTyping: t }),
  setChannel: (id, url) => set({ currentChannel: id, videoUrl: url }),
  setSearchResults: (r, show) =>
    set((st) => ({ searchResults: r, showSearchResults: show, searchCount: st.searchCount + (show ? 1 : 0) })),
  setCameraOpen: (o) => set({ cameraOpen: o }),
  log: (s) => set((st) => ({ activityLog: [s, ...st.activityLog].slice(0, 20) })),
  tick: () =>
    set((st) => ({
      uptime: st.uptime + 1,
      cpuPercent: Math.max(5, Math.min(95, st.cpuPercent + (Math.random() - 0.5) * 10)),
    })),
  setBackendMode: (b) => set({ backendMode: b }),
}));