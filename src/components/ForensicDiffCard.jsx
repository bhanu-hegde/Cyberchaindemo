import { motion } from 'framer-motion';

function ForensicDiffCard({ event, compact = false }) {
  const rows = Array.isArray(event?.rows) ? event.rows : [];
  const changed = rows.filter((row) => row.changed).length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="rounded-2xl border border-white/10 bg-black/25 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{event.attackType}</p>
          <p className="mt-1 text-sm font-semibold text-white">{event.summary}</p>
          <p className="mt-1 text-xs text-slate-500">{event.timestamp} • {changed} field{changed === 1 ? '' : 's'} changed</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${changed > 0 ? 'bg-rose-500/10 text-rose-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
          diff
        </span>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        {(rows.length ? rows : [{ key: 'telemetry', before: '-', after: '-', changed: false }]).map((row) => (
          <div key={`${event.id}-${row.key}`} className={`rounded-xl border px-3 py-3 ${row.changed ? 'border-amber-300/25 bg-amber-500/10' : 'border-white/8 bg-white/5'}`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{row.key}</p>
            <p className="mt-2 text-xs text-slate-500">Before</p>
            <p className="text-sm text-slate-200">{row.before}</p>
            <p className="mt-2 text-xs text-slate-500">After</p>
            <p className={`text-sm ${row.changed ? 'text-amber-100' : 'text-slate-300'}`}>{row.after}</p>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

export default ForensicDiffCard;
