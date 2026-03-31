import { AnimatePresence, motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { currency } from '../utils/helpers';

const integrityStyles = {
  clean: 'text-sky-200 bg-sky-500/10 border-sky-400/20',
  warning: 'text-amber-200 bg-amber-500/10 border-amber-400/20',
  compromised: 'text-rose-200 bg-rose-500/10 border-rose-400/20',
};

function TransactionList({ transactions, danger = false }) {
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {transactions.map((transaction) => {
          const tone = danger || transaction.integrity === 'compromised' ? 'red' : transaction.integrity === 'warning' ? 'amber' : 'slate';

          return (
            <motion.div
              key={transaction.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.24 }}
            >
              <GlassCard accent={tone}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-white">
                        {transaction.from} <span className="text-slate-500">-&gt;</span> {transaction.to}
                      </p>
                      <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.25em] ${integrityStyles[transaction.integrity] ?? integrityStyles.clean}`}>
                        {transaction.integrity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {transaction.id} • {transaction.timestamp}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{transaction.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">{transaction.route}</p>
                  </div>

                  <div className="min-w-[180px] text-left xl:text-right">
                    <p className={`text-2xl font-black ${danger || transaction.integrity === 'compromised' ? 'text-rose-300' : transaction.integrity === 'warning' ? 'text-amber-300' : 'text-sky-300'}`}>
                      {currency(transaction.amount)}
                    </p>
                    <p className={`mt-1 text-sm ${danger || transaction.integrity === 'compromised' ? 'text-rose-200' : 'text-slate-300'}`}>
                      {transaction.status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 xl:justify-end">
                      {(transaction.flags ?? []).map((flag) => (
                        <span key={`${transaction.id}-${flag}`} className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-300">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default TransactionList;
