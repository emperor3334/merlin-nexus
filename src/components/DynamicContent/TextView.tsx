export const TextView = ({ data }: { data: { content: string } }) => (
  <div className="w-full h-full overflow-y-auto p-8">
    <div className="max-w-[720px] text-[15px] leading-[1.75] text-[var(--text-bright)] font-rajdhani whitespace-pre-wrap">
      {data.content}
    </div>
  </div>
);