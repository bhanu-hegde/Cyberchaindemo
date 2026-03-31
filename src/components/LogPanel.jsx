import { AnimatePresence, motion } from 'framer-motion';
import GlassCard from './GlassCard';

const toneStyles = {
  info: 'border-sky-400/20 bg-sky-500/10 text-sky-100',
  success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  danger: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
};

function LogPanel({ logs, tone = 'blue' }) {
  return (
    <GlassCard accent={tone}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Realtime Monitoring</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Transaction Logs</h3>
        </div>
        <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.95)]" />
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              className={`rounded-2xl border px-4 py-3 text-sm ${toneStyles[log.tone] ?? toneStyles.info}`}
            >
              <p className="text-[10px] uppercase tracking-[0.25em] opacity-75">{log.timestamp}</p>
              <p className="mt-2 leading-6">{log.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}

export default LogPanel;
