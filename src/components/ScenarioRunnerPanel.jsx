import { motion } from 'framer-motion';
import MotionButton from './MotionButton';

const scenarios = [
  {
    id: 'mitm',
    title: 'Auto MITM Journey',
    description: 'Runs baseline, MITM injection, blockchain guard activation, and recovery.',
  },
  {
    id: 'tampering',
    title: 'Auto Tampering Journey',
    description: 'Runs record tampering path and then demonstrates secure reconciliation.',
  },
  {
    id: 'double',
    title: 'Auto Double Spend Journey',
    description: 'Runs duplicate-spend attempt and then completes blockchain restoration.',
  },
];

function ScenarioRunnerPanel({ scenarioRun, runScenario, loading }) {
  const running = scenarioRun?.running;
  const completed = new Set(scenarioRun?.completedSteps ?? []);
  const current = scenarioRun?.currentStep;
  const plan = Array.isArray(scenarioRun?.lastPlan) ? scenarioRun.lastPlan : [];

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Scenario Runner</p>
          <h3 className="mt-2 text-xl font-semibold text-white">One-click full flow orchestration</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Executes the complete story from attack to blockchain protection through the core runner.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${
            running ? 'bg-amber-500/10 text-amber-200' : 'bg-sky-500/10 text-sky-200'
          }`}
        >
          {running ? 'Scenario running' : 'Ready'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">{scenario.title}</p>
            <p className="mt-2 text-sm text-slate-400">{scenario.description}</p>
            <MotionButton
              type="button"
              onClick={() =>
                runScenario({
                  attackType: scenario.id,
                  includeGuard: true,
                  includeRecovery: true,
                  startMode: 'centralized',
                  stepDelayMs: 2500,
                })
              }
              disabled={loading || running}
              className="mt-4 w-full border border-sky-400/35 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 disabled:opacity-60"
            >
              {running ? 'Running...' : 'Run Scenario'}
            </MotionButton>
          </div>
        ))}
      </div>

      {plan.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Current plan</p>
          {plan.map((entry, index) => {
            const stepId = typeof entry === 'string' ? entry : entry.id;
            const label = typeof entry === 'string' ? entry : entry.label;
            const isDone = completed.has(stepId);
            const isCurrent = current === stepId;

            return (
              <motion.div
                key={`${stepId}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  isDone
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                    : isCurrent
                    ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                    : 'border-white/10 bg-black/20 text-slate-300'
                }`}
              >
                {label}
              </motion.div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default ScenarioRunnerPanel;
