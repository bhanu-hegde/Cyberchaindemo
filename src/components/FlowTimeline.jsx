import { motion } from 'framer-motion';

const statusStyles = {
  done: {
    pill: 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100',
    dot: 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.95)]',
  },
  current: {
    pill: 'border-sky-400/35 bg-sky-500/12 text-sky-100',
    dot: 'bg-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.95)]',
  },
  pending: {
    pill: 'border-white/12 bg-white/5 text-slate-300',
    dot: 'bg-slate-500',
  },
};

function FlowTimeline({ flowModel }) {
  if (!flowModel) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <p className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Flow Engine</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{flowModel.phaseTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{flowModel.phaseDescription}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        {flowModel.steps.map((step, index) => {
          const tone = statusStyles[step.status] ?? statusStyles.pending;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] ${tone.pill}`}
            >
              <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
              {step.label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default FlowTimeline;
