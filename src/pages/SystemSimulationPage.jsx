import { motion } from 'framer-motion';
import FlowNode from '../components/FlowNode';
import GlassCard from '../components/GlassCard';
import LogPanel from '../components/LogPanel';
import { useAppContext } from '../context/AppContext';
import { currency } from '../utils/helpers';

function MovingDot({ color }) {
  return (
    <motion.div
      className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 -mt-[1.5px] rounded-full ${color}`}
      animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.4, times: [0, 0.1, 0.9, 1], repeat: Infinity, ease: 'linear' }}
    />
  );
}

function SystemSimulationPage() {
  const { logs, transactions, attackState, securityScore, systemHealth, systemMode } = useAppContext();
  const activeTone = attackState.level === 'critical' ? 'red' : attackState.level === 'warning' ? 'amber' : 'blue';
  const recent = transactions.slice(0, 4);
  const secureMode = systemMode === 'blockchain';

  return (
    <div className="space-y-6">
      <GlassCard accent={activeTone}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Transaction Infrastructure Visualization</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Wallet -&gt; Gateway -&gt; Ledger Pipeline</h2>
            <p className="mt-3 max-w-3xl text-slate-300 leading-7">
              This view explains the system pipeline. For attack simulation and blockchain security controls, use Threat
              Center where both threat animation and recovery actions are unified.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Security Posture</p>
            <p className="mt-2 text-xl font-bold text-white">{systemHealth}</p>
            <p className={`text-sm ${securityScore > 84 ? 'text-emerald-300' : securityScore > 62 ? 'text-amber-300' : 'text-rose-300'}`}>
              Score: {securityScore}
            </p>
            <p className={`mt-1 text-xs uppercase tracking-[0.25em] ${secureMode ? 'text-emerald-200' : 'text-sky-200'}`}>
              Mode: {systemMode}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1fr,150px,1fr,150px,1fr] xl:items-center">
        <FlowNode title="Wallet Client" tone="blue" metric="origin">
          User submits signed transfer intent from authenticated session.
        </FlowNode>
        <div className="relative hidden h-1 rounded-full bg-sky-400/20 xl:block">
          <MovingDot color="bg-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.95)]" />
        </div>
        <FlowNode title="Processing Layer" tone={activeTone} metric={secureMode ? 'consensus' : 'relay'}>
          {secureMode
            ? 'Consensus validation screens out malicious mutation attempts.'
            : 'Central relay performs verification and can be a single point of compromise.'}
        </FlowNode>
        <div className={`relative hidden h-1 rounded-full xl:block ${attackState.level === 'critical' ? 'bg-rose-400/20' : secureMode ? 'bg-emerald-400/20' : 'bg-sky-400/20'}`}>
          <MovingDot
            color={
              attackState.level === 'critical'
                ? 'bg-rose-300 shadow-[0_0_18px_rgba(251,113,133,0.95)]'
                : secureMode
                ? 'bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.95)]'
                : 'bg-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.95)]'
            }
          />
        </div>
        <FlowNode title="Ledger Layer" tone={attackState.level === 'critical' ? 'red' : secureMode ? 'green' : 'blue'} metric="storage">
          {secureMode
            ? 'Hash-linked blocks anchor integrity checks and reconciliation.'
            : 'Centralized records are efficient but vulnerable to tampering risk.'}
        </FlowNode>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.98fr,1.02fr]">
        <GlassCard accent={activeTone}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Realtime Throughput</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Recent transfer queue</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.28em] ${attackState.level === 'critical' ? 'bg-rose-500/10 text-rose-200' : secureMode ? 'bg-emerald-500/10 text-emerald-200' : 'bg-sky-500/10 text-sky-200'}`}>
              {attackState.level === 'critical' ? 'threat detected' : secureMode ? 'consensus-protected' : 'centralized processing'}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {recent.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {transaction.from} -&gt; {transaction.to}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{transaction.route}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className={`text-xl font-bold ${transaction.integrity === 'compromised' ? 'text-rose-300' : transaction.integrity === 'warning' ? 'text-amber-300' : 'text-sky-300'}`}>
                      {currency(transaction.amount)}
                    </p>
                    <p className="text-sm text-slate-300">{transaction.status}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <LogPanel logs={logs} tone={activeTone} />
      </div>
    </div>
  );
}

export default SystemSimulationPage;
