import GlassCard from './GlassCard';

function StatCard({ label, value, tone = 'blue', helper }) {
  const tones = {
    blue: 'text-sky-300',
    red: 'text-rose-300',
    green: 'text-emerald-300',
    amber: 'text-amber-300',
  };

  return (
    <GlassCard accent={tone} className="min-h-[152px]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <h3 className={`mt-5 text-3xl font-black ${tones[tone]}`}>{value}</h3>
      {helper ? <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">{helper}</p> : null}
    </GlassCard>
  );
}

export default StatCard;
