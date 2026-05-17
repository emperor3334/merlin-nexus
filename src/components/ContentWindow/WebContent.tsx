export const WebContent = ({ url }: { url: string }) => (
  <iframe
    src={url}
    className="w-full h-full border-0"
    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    title={url}
  />
);