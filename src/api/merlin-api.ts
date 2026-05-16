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
};