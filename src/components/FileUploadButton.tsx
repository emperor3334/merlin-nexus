import { useRef, useState } from "react";
import { useMerlin } from "@/store/merlinStore";
import { MerlinAPIv8 } from "@/api/merlin-api";

const ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.py,.js";

export const FileUploadButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const setContent = useMerlin((s) => s.setContent);
  const addMessage = useMerlin((s) => s.addMessage);
  const log = useMerlin((s) => s.log);

  const handleFile = async (file: File) => {
    log(`UPLOAD: ${file.name.slice(0, 24)}`);
    addMessage({
      id: crypto.randomUUID(),
      role: "merlin",
      text: `Analyzing ${file.name}...`,
      timestamp: new Date(),
    });
    if (file.type.startsWith("image/")) {
      setContent({
        type: "image",
        data: { url: URL.createObjectURL(file), title: file.name },
        title: file.name,
      });
    }
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("question", "Analyze this file and describe what you see.");
      const result = await MerlinAPIv8.upload(form);
      const text =
        result?.ai_analysis || result?.content || result?.analysis || "Analysis complete.";
      addMessage({
        id: crypto.randomUUID(),
        role: "merlin",
        text,
        timestamp: new Date(),
      });
    } catch (e: any) {
      addMessage({
        id: crypto.randomUUID(),
        role: "merlin",
        text: `Upload failed. (${e?.message ?? "error"})`,
        timestamp: new Date(),
      });
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="upload file"
        className="fixed bottom-9 right-6 z-30 font-orbitron transition-colors"
        style={{
          fontSize: 14,
          lineHeight: 1,
          color: hover ? "rgba(0,200,255,0.5)" : "rgba(0,200,255,0.12)",
        }}
      >
        📎
      </button>
    </>
  );
};