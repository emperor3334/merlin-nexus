import { motion } from "framer-motion";

export interface SearchHit { title: string; url: string; snippet: string }

export const SearchView = ({ data }: { data: { results: SearchHit[]; query?: string } }) => (
  <div className="w-full h-full overflow-y-auto p-6">
    {data.query && (
      <div className="font-orbitron text-[10px] tracking-[3px] text-[var(--cyan)] mb-4 opacity-80">
        // VÝSLEDKY: {data.query.toUpperCase()}
      </div>
    )}
    <div className="space-y-3 max-w-[680px]">
      {data.results.map((r, i) => (
        <motion.a
          key={i}
          href={r.url}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="block p-3 border border-[var(--border)] bg-[var(--panel-bg)] hover:border-[var(--cyan)] transition-all"
        >
          <div className="font-orbitron text-[11px] tracking-[2px] text-[var(--text-bright)] mb-1">{r.title}</div>
          <div className="text-[11px] text-[var(--text)] opacity-70 leading-relaxed">{r.snippet}</div>
          <div className="text-[9px] text-[var(--cyan)] mt-1 opacity-60 truncate">{r.url}</div>
        </motion.a>
      ))}
    </div>
  </div>
);