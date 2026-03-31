import { motion } from 'framer-motion';

function AlertBanner({ level, title, message }) {
  if (!message || level === 'stable') return null;

  const warning = level === 'warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border px-4 py-3 ${warning ? 'border-amber-400/35 bg-amber-500/10 text-amber-100' : 'border-rose-400/40 bg-rose-500/10 text-rose-100'}`}
    >
      <p className="text-[11px] uppercase tracking-[0.28em] opacity-85">{warning ? 'Threat Blocked' : 'Threat Active'}</p>
      <p className="mt-1 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{message}</p>
    </motion.div>
  );
}

export default AlertBanner;
