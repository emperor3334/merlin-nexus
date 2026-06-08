export const ImageView = ({ data }: { data: { url: string; title?: string } }) => (
  <div className="w-full h-full flex items-center justify-center p-8">
    <img
      src={data.url}
      alt={data.title || "image"}
      className="max-w-full max-h-full object-contain"
    />
  </div>
);