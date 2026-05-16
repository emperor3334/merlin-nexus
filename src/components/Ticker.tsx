const tickerData = [
  { sym: "BTC", val: "$67,420", chg: "+2.4%", up: true },
  { sym: "ETH", val: "$3,210", chg: "+1.8%", up: true },
  { sym: "S&P500", val: "5,241", chg: "-0.3%", up: false },
  { sym: "NASDAQ", val: "18,330", chg: "+0.9%", up: true },
  { sym: "EUR/CZK", val: "25.42", chg: "-0.1%", up: false },
  { sym: "USD/CZK", val: "23.18", chg: "+0.2%", up: true },
  { sym: "GOLD", val: "$2,380", chg: "+0.6%", up: true },
  { sym: "NVIDIA", val: "$875", chg: "+5.2%", up: true },
  { sym: "TSLA", val: "$248", chg: "+3.1%", up: true },
  { sym: "AAPL", val: "$192", chg: "+0.4%", up: true },
];

export const Ticker = () => {
  const items = [...tickerData, ...tickerData];
  return (
    <div className="h-10 border-b border-[var(--merlin-border)] bg-[var(--merlin-panel)] flex items-center overflow-hidden relative">
      <div className="bg-[var(--merlin-danger)] text-white font-orbitron text-[10px] tracking-[3px] px-3 py-1 mx-2 flex-shrink-0 z-10 shadow-[0_0_15px_rgba(255,60,90,0.5)]">
        ● LIVE
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex gap-8 whitespace-nowrap"
          style={{ animation: "ticker-move 60s linear infinite", width: "max-content" }}
        >
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 font-orbitron text-[10px] tracking-wider">
              <span className="text-[var(--merlin-text-bright)]">{it.sym}</span>
              <span className="text-[var(--merlin-text)]">{it.val}</span>
              <span style={{ color: it.up ? "var(--merlin-success)" : "var(--merlin-danger)" }}>
                {it.chg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};