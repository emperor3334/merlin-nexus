export const GridBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      zIndex: 1,
      backgroundImage:
        "linear-gradient(rgba(0,150,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,255,0.055) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
      maskImage: "radial-gradient(ellipse at center, black 30%, transparent 90%)",
      WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 90%)",
    }}
  />
);