import { create } from "zustand";

export type OrbState = "standby" | "thinking" | "listening" | "speaking";
export type ContentType =
  | "map"
  | "video"
  | "chart"
  | "search"
  | "image"
  | "text"
  | "web"
  | "files"
  | "log"
  | "white"
  | null;

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

export interface ProcessEvent {
  id: number;
  event: string;
  message?: string;
  detail?: string;
  time?: string;
}

export interface SplitWindow {
  id: string;
  content: ActiveContent;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "right";
}

export interface SplitScreenState {
  layout: "2-horizontal" | "2-vertical" | "4";
  windows: SplitWindow[];
}

export interface AudioPlayerState {
  url: string;
  sessionId?: string;
}

export interface Schedule {
  action: "start" | "stop";
  time: string;
  label?: string;
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
  blockMode: boolean;
  project: string | null;
  dateTime: string | null;
  behaviorBadge: number;
  showProcess: boolean;
  processEvents: ProcessEvent[];
  sshHost: string | null;
  sshLines: string[];
  splitScreen: SplitScreenState | null;
  audioPlayer: AudioPlayerState | null;
  schedules: Schedule[];
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
  setBlockMode: (b: boolean) => void;
  setProject: (p: string | null) => void;
  setDateTime: (d: string | null) => void;
  triggerBehaviorBadge: () => void;
  setShowProcess: (b: boolean) => void;
  addProcessEvent: (e: ProcessEvent) => void;
  clearProcessEvents: () => void;
  openSSH: (host: string) => void;
  addSSHLine: (line: string) => void;
  clearSSH: () => void;
  closeSSH: () => void;
  setSplitScreen: (s: SplitScreenState | null) => void;
  openAudioPlayer: (url: string, sessionId?: string) => void;
  closeAudioPlayer: () => void;
  setSchedules: (s: Schedule[]) => void;
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
  blockMode: false,
  project: null,
  dateTime: null,
  behaviorBadge: 0,
  showProcess: false,
  processEvents: [],
  sshHost: null,
  sshLines: [],
  splitScreen: null,
  audioPlayer: null,
  schedules: [],
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
  setBlockMode: (b) => set({ blockMode: b }),
  setProject: (p) => set({ project: p }),
  setDateTime: (d) => set({ dateTime: d }),
  triggerBehaviorBadge: () => set({ behaviorBadge: Date.now() }),
  setShowProcess: (b) => set({ showProcess: b }),
  addProcessEvent: (e) =>
    set((st) => ({ processEvents: [...st.processEvents, e].slice(-50) })),
  clearProcessEvents: () => set({ processEvents: [] }),
  openSSH: (host) => set({ sshHost: host, sshLines: [] }),
  addSSHLine: (line) =>
    set((st) => ({ sshLines: [...st.sshLines, line].slice(-200) })),
  clearSSH: () => set({ sshLines: [] }),
  closeSSH: () => set({ sshHost: null, sshLines: [] }),
  setSplitScreen: (s) => set({ splitScreen: s }),
  openAudioPlayer: (url, sessionId) => set({ audioPlayer: { url, sessionId } }),
  closeAudioPlayer: () => set({ audioPlayer: null }),
  setSchedules: (s) => set({ schedules: s }),
}));