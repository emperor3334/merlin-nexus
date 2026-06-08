const BASE = (import.meta as any).env?.VITE_BACKEND_URL ?? "";

export interface ChatResponse {
  response: string;
  models_used?: string[];
  merged?: boolean;
  errors?: Record<string, string>;
}

export const MerlinAPI = {
  status: () =>
    fetch(`${BASE}/status`, { signal: AbortSignal.timeout(1500) }).then((r) => r.json()),

  chat: (message: string, history: { role: string; content: string }[], userName: string, useSearch: boolean): Promise<ChatResponse> =>
    fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(-10), user_name: userName, use_search: useSearch, use_gpt: true }),
    }).then((r) => r.json()),

  tts: (text: string) =>
    fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "nova" }),
    }).then((r) => r.json()),

  stt: (audioBase64: string) =>
    fetch(`${BASE}/api/stt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: audioBase64, format: "webm" }),
    }).then((r) => r.json()),

  vision: (imageBase64: string, question: string) =>
    fetch(`${BASE}/api/vision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64, question }),
    }).then((r) => r.json()),

  selfModify: (request: string) =>
    fetch(`${BASE}/api/self-modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
    }).then((r) => r.json()),

  system: () => fetch(`${BASE}/api/system`).then((r) => r.json()),

  browser: (command: string, action?: string, data?: any) =>
    fetch(`${BASE}/api/browser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, action, ...(data || {}) }),
    }).then((r) => r.json()),

  mode: () => fetch(`${BASE}/api/mode`).then((r) => r.json()),
};

const json = (path: string, body: any) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const get = (path: string) => fetch(`${BASE}${path}`).then((r) => r.json());

export const streamUrl = (path: string) => `${BASE}${path}`;

export const MerlinAPIv8 = {
  // Chat session management
  chatNew: () => json("/api/chat/new", {}),
  chatSummarize: () => json("/api/chat/summarize", {}),
  chatContext: (context: any) => json("/api/chat/context", context),
  chatSession: () => get("/api/chat/session"),

  // Wake / session
  wake: (source: "wake_word" | "clap" | "manual") => json("/api/wake", { source }),
  wakeHeartbeat: () => get("/api/wake/heartbeat"),
  wakeDeactivate: () => json("/api/wake/deactivate", {}),

  // Mode / block
  modeSet: (mode: string) => json("/api/mode/set", { mode }),
  blockConfigGet: () => get("/api/block/config"),
  blockConfigSet: (config: any) => json("/api/block/config", config),
  blockStatus: () => get("/api/block/status"),

  // Language / teaching
  translate: (text: string, target: string) => json("/api/translate", { text, target }),
  teach: (data: any) => json("/api/teach", data),
  pronunciation: (data: any) => json("/api/pronunciation", data),

  // File upload
  upload: (form: FormData) =>
    fetch(`${BASE}/api/upload`, { method: "POST", body: form }).then((r) => r.json()),

  // Logs
  logsSessions: () => get("/api/logs/sessions"),
  logsSession: (id: string) => get(`/api/logs/session/${id}`),
  logsSearch: (query: string) => json("/api/logs/search", { query }),
  logsAudioUrl: (sessionId: string) => `${BASE}/api/logs/audio/${sessionId}`,

  // Projects
  projects: () => get("/api/projects"),
  projectCreate: (name: string) => json("/api/projects/create", { name }),
  projectOpen: (name: string) => json("/api/projects/open", { name }),
  projectClose: () => json("/api/projects/close", {}),

  // SSH
  sshSend: (host: string, text: string) => json("/api/ssh/shell/send", { host, text }),
  sshClear: (host: string) => json("/api/ssh/shell/clear", { host }),

  // Scheduler
  scheduler: () => get("/api/scheduler"),
  schedulerStop: (time: string) => json("/api/scheduler/stop", { time }),
  schedulerStart: (time: string) => json("/api/scheduler/start", { time }),
  schedulerCancel: () => json("/api/scheduler/cancel", {}),

  // Behaviors
  behaviors: () => get("/api/behaviors"),
  behaviorAdd: (data: any) => json("/api/behaviors", data),
  behaviorCheck: (text: string) => json("/api/behaviors/check", { text }),
  behaviorDelete: (trigger: string) =>
    fetch(`${BASE}/api/behaviors/${encodeURIComponent(trigger)}`, { method: "DELETE" }).then((r) => r.json()),

  // Process toggle
  processToggle: (enabled: boolean) => json("/api/process/toggle", { enabled }),
};