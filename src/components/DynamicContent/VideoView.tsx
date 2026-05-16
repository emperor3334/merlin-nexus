export const VideoView = ({ data }: { data: { url: string; title?: string } }) => (
  <div className="w-full h-full relative">
    <iframe
      src={data.url}
      className="w-full h-full border-0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      title={data.title || "video"}
    />
    <div
      className="pointer-events-none absolute inset-0"
      style={{ boxShadow: "inset 0 0 80px 10px rgba(3,9,18,0.7)" }}
    />
  </div>
);