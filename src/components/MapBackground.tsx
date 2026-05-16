export const MapBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{ zIndex: 1, opacity: 0.38, filter: "saturate(2) hue-rotate(185deg) brightness(0.45) contrast(1.2)" }}
  >
    <iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=-10%2C42%2C30%2C58&layer=mapnik"
      className="w-full h-full"
      style={{ border: 0, pointerEvents: "none" }}
      title="map-bg"
    />
  </div>
);