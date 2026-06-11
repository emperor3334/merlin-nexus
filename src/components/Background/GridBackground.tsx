export const GridBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      zIndex: 1,
      backgroundImage:
        "linear-gradient(rgba(30,120,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(30,120,255,0.18) 1px, transparent 1px)",
      backgroundSize: "45px 45px",
    }}
  />
);