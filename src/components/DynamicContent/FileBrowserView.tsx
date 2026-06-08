interface FileItem {
  name: string;
  type?: "file" | "folder" | "dir";
  path?: string;
}

export const FileBrowserView = ({
  data,
}: {
  data: { items: FileItem[]; onOpen?: (item: FileItem) => void };
}) => {
  const items = data?.items || [];
  return (
    <div className="w-full h-full overflow-y-auto p-8">
      <div className="max-w-[720px] mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it, i) => {
          const isFolder = it.type === "folder" || it.type === "dir";
          return (
            <button
              key={i}
              onClick={() => data.onOpen?.(it)}
              className="flex items-center gap-2 px-3 py-2 text-left font-rajdhani transition-colors"
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(0,200,255,0.12)",
                background: "rgba(0,200,255,0.03)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(0,200,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(0,200,255,0.03)")
              }
            >
              <span style={{ color: isFolder ? "rgba(0,200,255,0.8)" : "rgba(255,255,255,0.6)" }}>
                {isFolder ? "📁" : "📄"}
              </span>
              <span className="truncate">{it.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};