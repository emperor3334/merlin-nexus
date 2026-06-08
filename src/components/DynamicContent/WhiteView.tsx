export const WhiteView = ({ data }: { data: { content: string } }) => (
  <div className="w-full h-full overflow-y-auto p-8" style={{ background: "#ffffff" }}>
    <div
      className="max-w-[720px] mx-auto font-rajdhani whitespace-pre-wrap"
      style={{ fontSize: 15, lineHeight: 1.75, color: "#111" }}
    >
      {data.content}
    </div>
  </div>
);