import { motion } from 'framer-motion';

function GlassCard({ children, className = '', accent = 'blue' }) {
  const accentStyles = {
    blue: 'border-sky-400/20 shadow-neon',
    red: 'border-rose-400/25 shadow-danger danger-glow',
    green: 'border-emerald-400/25 shadow-secure secure-glow',
    amber: 'border-amber-400/20',
    slate: 'border-white/10',
  };

  const glowStyles = {
    blue: 'from-sky-400/16 via-transparent to-transparent',
    red: 'from-rose-500/18 via-transparent to-transparent',
    green: 'from-emerald-500/16 via-transparent to-transparent',
    amber: 'from-amber-400/16 via-transparent to-transparent',
    slate: 'from-white/6 via-transparent to-transparent',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={`glass relative overflow-hidden rounded-[28px] border p-5 shadow-glass ${accentStyles[accent]} ${className}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${glowStyles[accent]}`} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default GlassCard;
