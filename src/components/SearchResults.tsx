import { motion, AnimatePresence } from "framer-motion";
import { useMerlin } from "@/store/merlinStore";
import { CHANNELS } from "./VideoPanel";

export const SearchResults = () => {
  const { searchResults, showSearchResults, setSearchResults, setChannel } = useMerlin();
  return (
    <AnimatePresence>
      {showSearchResults && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed left-1/2 -translate-x-1/2 z-[600] merlin-panel p-3 w-[560px] max-h-[210px] overflow-y-auto"
          style={{ bottom: 60 }}
        >
          <div className="corner tl" /><div className="corner tr" />
          <div className="flex justify-between mb-2">
            <div className="font-orbitron text-[9px] tracking-[3px] text-[var(--merlin-primary)]">// SEARCH RESULTS</div>
            <button className="tech-btn" onClick={() => setSearchResults([], false)}>×</button>
          </div>
          {searchResults.map((r, i) => (
            <button
              key={i}
              onClick={() => { setChannel("yt", r.url); setSearchResults([], false); }}
              className="block w-full text-left p-2 mb-1 border border-[var(--merlin-border)] hover:border-[var(--merlin-primary)] hover:bg-[var(--merlin-primary-dim)]"
            >
              <div className="font-orbitron text-[10px] text-[var(--merlin-text-bright)]">{r.title}</div>
              <div className="text-[10px] opacity-60 truncate">{r.url}</div>
              <div className="text-[11px] mt-1">{r.snippet}</div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};