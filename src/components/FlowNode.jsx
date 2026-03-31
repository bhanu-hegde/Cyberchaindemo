function FlowNode({ title, tone = 'blue', metric, children }) {
  const tones = {
    blue: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
    red: 'border-rose-400/35 bg-rose-500/10 text-rose-100',
    green: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  };

  return (
    <div className={`glass relative rounded-[28px] border px-6 py-7 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-300">{title}</p>
          <div className="mt-4 text-sm leading-6 text-slate-200">{children}</div>
        </div>
        {metric ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-300">{metric}</span> : null}
      </div>
    </div>
  );
}

export default FlowNode;
