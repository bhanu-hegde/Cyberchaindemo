import { useState, useRef, useEffect } from 'react';
import AlertBanner from '../components/AlertBanner';
import Chain3DScene from '../components/Chain3DScene';
import FlowTimeline from '../components/FlowTimeline';
import ForensicDiffCard from '../components/ForensicDiffCard';
import GlassCard from '../components/GlassCard';
import LogPanel from '../components/LogPanel';
import MotionButton from '../components/MotionButton';
import ScenarioRunnerPanel from '../components/ScenarioRunnerPanel';
import TransactionList from '../components/TransactionList';
import { useAppContext } from '../context/AppContext';
import { FlowAction } from '../core/flowEngine';

const attackCards = [
  {
    id: 'mitm',
    title: 'MITM Interception',
    body: 'Intercepts transfer traffic and attempts to alter value before persistence.',
  },
  {
    id: 'tampering',
    title: 'Ledger Tampering',
    body: 'Mutates historical records in centralized storage to demonstrate data drift.',
  },
  {
    id: 'double',
    title: 'Double Spending',
    body: 'Injects duplicate spend intent before reconciliation locks final settlement.',
  },
];

const attackActionById = {
  mitm: FlowAction.ATTACK_MITM,
  tampering: FlowAction.ATTACK_TAMPERING,
  double: FlowAction.ATTACK_DOUBLE,
};

const actionLabel = {
  [FlowAction.SET_CENTRALIZED]: 'Switch to centralized baseline',
  [FlowAction.SET_BLOCKCHAIN]: 'Enable blockchain guard',
  [FlowAction.RECOVER_CHAIN]: 'Recover and rebuild chain',
  [FlowAction.ATTACK_MITM]: 'Simulate MITM attack',
  [FlowAction.ATTACK_TAMPERING]: 'Simulate tampering attack',
  [FlowAction.ATTACK_DOUBLE]: 'Simulate double spending',
};

function AttackSimulationPage() {
  const {
    runAttack,
    runScenario,
    scenarioRun,
    attackState,
    flowModel,
    attackEvidence,
    transactions,
    logs,
    blocks,
    updateBlockData,
    chainValid,
    loading,
    error,
    systemMode,
    recoveryStatus,
    setSystemMode,
    recoverBlockchain,
    compromisedCount,
    warningCount,
  } = useAppContext();

  const [selectedBlock, setSelectedBlock] = useState(null);
  const [draft, setDraft] = useState('');
  
  const sceneRef = useRef(null);
  const evidenceRef = useRef(null);

  // Auto-scroll logic when scenario starts
  useEffect(() => {
    if (scenarioRun?.running && sceneRef.current) {
      // Small timeout allows states to settle
      setTimeout(() => {
        sceneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [scenarioRun?.running]);

  // Auto-scroll evidence blocks
  useEffect(() => {
    if (evidenceRef.current) {
      evidenceRef.current.scrollTo({ top: evidenceRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [attackEvidence]);

  const handleBlockClick = (block) => {
    setSelectedBlock(block);
    setDraft(block.data);
  };

  const handleSaveDraft = async () => {
    if (draft.trim() && draft !== selectedBlock.data) {
      const ok = await updateBlockData(selectedBlock.id, draft.trim());
      if (ok) {
        setSelectedBlock(null);
      }
    }
  };

  const controls = flowModel?.controls ?? {};
  const impacted = transactions.filter((entry) => entry.integrity !== 'clean');
  const visible = impacted.length ? impacted : transactions.slice(0, 5);
  const secureMode = systemMode === 'blockchain';

  const centralizedEnabled = controls[FlowAction.SET_CENTRALIZED]?.enabled ?? secureMode;
  const blockchainEnabled = controls[FlowAction.SET_BLOCKCHAIN]?.enabled ?? !secureMode;
  const nextActionLabel = flowModel?.recommendedAction ? actionLabel[flowModel.recommendedAction] : 'Wait for recovery completion';

  return (
    <div className="space-y-6">
      <GlassCard accent="red" className="overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/16 via-transparent to-rose-500/16" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-rose-200">Threat Operations Center</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Centralized Vulnerability vs Blockchain Integrity</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-300">
              Trigger real attack paths, inspect impact propagation in the 3D chain context, manually spoof block data, and execute advanced blockchain recovery algorithms.
            </p>
          </div>
          <div className="rounded-[24px] border border-rose-400/20 bg-black/25 px-5 py-4 text-rose-100">
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-200/75">Threat Level</p>
            <p className="mt-2 text-lg font-semibold">
              {attackState.level === 'critical' ? 'Critical' : attackState.level === 'warning' ? 'Warning' : 'Stable'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.23em] text-rose-200/70">mode: {systemMode}</p>
          </div>
        </div>
      </GlassCard>

      <FlowTimeline flowModel={flowModel} />

      <AlertBanner level={attackState.level} title={attackState.title} message={attackState.message} />

      <GlassCard accent={secureMode ? 'green' : 'blue'}>
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Security Control Plane</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <MotionButton
            type="button"
            onClick={() => setSystemMode('centralized')}
            disabled={loading || !centralizedEnabled}
            className="border border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 disabled:opacity-60"
          >
            Set Centralized Baseline
          </MotionButton>
          <MotionButton
            type="button"
            onClick={() => setSystemMode('blockchain')}
            disabled={loading || !blockchainEnabled}
            className="border border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            Enable Blockchain Guard
          </MotionButton>
        </div>
        <p className="mt-3 text-sm text-slate-300">
          Recovery status: <span className="font-semibold text-white">{recoveryStatus}</span>
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
          Recommended next action: {nextActionLabel}
        </p>
      </GlassCard>

      {/* 3D Viewer embedded with Modals */}
      <div ref={sceneRef} className="relative scroll-mt-[130px]">
        <Chain3DScene
          blocks={blocks}
          chainValid={chainValid}
          attackState={attackState}
          systemMode={systemMode}
          flowModel={flowModel}
          recoveryStatus={recoveryStatus}
          onBlockClick={handleBlockClick}
        />

        {/* Modal Overlay for Deep Analysis / Tampering */}
        {selectedBlock && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-[2px]">
            <GlassCard accent={selectedBlock.edited ? 'red' : 'blue'} className="w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Forensic Block Analysis</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{selectedBlock.label}</h3>
                </div>
                <button 
                  onClick={() => setSelectedBlock(null)}
                  className="rounded-full bg-slate-800 text-slate-400 hover:text-white p-2 w-8 h-8 flex items-center justify-center font-bold"
                >
                  X
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm bg-black/40 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-slate-500 mb-1 font-bold">Current Hash</p>
                  <p className="text-sky-300 font-mono text-xs break-all">{selectedBlock.hash}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1 font-bold">Previous Link</p>
                  <p className="text-slate-400 font-mono text-xs break-all">{selectedBlock.previousHash}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1 font-bold">Transaction Data</p>
                  <p className="text-slate-200 font-mono text-xs">{selectedBlock.transactionId}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 mb-2 font-bold">Simulate Data Drift (Tamper Test)</p>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full min-h-[100px] rounded-xl border border-white/10 bg-slate-900/80 p-3 text-sm text-white focus:border-sky-500/50 outline-none transition-colors shadow-inner"
                />
              </div>

              <MotionButton
                onClick={handleSaveDraft}
                disabled={loading || draft.trim() === selectedBlock.data}
                className="mt-4 w-full border border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-50 font-bold tracking-wide"
              >
                Apply Exploit (Tamper Data)
              </MotionButton>
            </GlassCard>
          </div>
        )}
      </div>

      {!chainValid && (
        <GlassCard accent="red">
          <p className="text-[11px] uppercase tracking-[0.35em] text-rose-300 font-bold mb-4">Blockchain Security Resolution Tactics</p>
          <p className="text-sm text-slate-300 mb-6">The ledger integrity is compromised. Select a recovery algorithm to naturally heal the 3D chain topology.</p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <MotionButton
              onClick={() => recoverBlockchain('pow')}
              disabled={loading}
              className="border border-sky-400/50 bg-sky-500/10 hover:bg-sky-500/20 text-sky-100 h-full flex flex-col items-start p-4 text-left"
            >
              <span className="font-bold text-base block mb-2">Recalculate Hash Tree</span>
              <span className="text-xs text-slate-300 font-normal">Accepts the compromised data as truth and recalculates all subsequent hashes.</span>
            </MotionButton>
            <MotionButton
              onClick={() => recoverBlockchain('pbft')}
              disabled={loading}
              className="border border-emerald-400/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 h-full flex flex-col items-start p-4 text-left"
            >
              <span className="font-bold text-base block mb-2">Network Consensus Override</span>
              <span className="text-xs text-slate-300 font-normal">Polls healthy nodes in the network to override the tamper and restore the original payload.</span>
            </MotionButton>
            <MotionButton
              onClick={() => recoverBlockchain('rollback')}
              disabled={loading}
              className="border border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 h-full flex flex-col items-start p-4 text-left"
            >
              <span className="font-bold text-base block mb-2">State Rollback</span>
              <span className="text-xs text-slate-300 font-normal">Permanently drops the corrupted block and destroys all pending unverified transactions.</span>
            </MotionButton>
          </div>
        </GlassCard>
      )}

      {/* Moved below 3D Viewer so when auto-scroll triggers, both the scene and runner are visible */}
      <ScenarioRunnerPanel scenarioRun={scenarioRun} runScenario={runScenario} loading={loading} />

      <div className="grid gap-4 md:grid-cols-3">
        {attackCards.map((attack) => {
          const attackAction = attackActionById[attack.id];
          const attackEnabled = controls[attackAction]?.enabled ?? true;

          return (
            <GlassCard key={attack.id} accent="red">
              <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200">Attack Vector</p>
              <h3 className="mt-3 text-xl font-bold text-white">{attack.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{attack.body}</p>
              <MotionButton
                onClick={() => runAttack(attack.id)}
                disabled={loading || !attackEnabled}
                className="mt-5 w-full border border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
              >
                {loading ? 'Executing...' : `Simulate ${attack.title}`}
              </MotionButton>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <GlassCard accent="red">
          <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200">Impact Analysis</p>
          <h3 className="mt-3 text-xl font-semibold text-white">Observed consequences</h3>
          <div className="mt-4 space-y-2">
            {(attackState.impacts?.length ? attackState.impacts : ['No active attack impact recorded yet.']).map((impact) => (
              <div key={impact} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {impact}
              </div>
            ))}
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </GlassCard>

        <LogPanel logs={logs} tone="red" />
      </div>

      <GlassCard accent="amber">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-200">Forensic Evidence</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Before/after attack proof trail</h3>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-amber-100">
            {attackEvidence.length} records
          </span>
        </div>

        <div ref={evidenceRef} className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {attackEvidence.length ? (
            attackEvidence.map((entry) => <ForensicDiffCard key={entry.id} event={entry} compact />)
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
              No evidence records yet. Trigger an attack to generate field-level forensic diffs.
            </div>
          )}
        </div>
      </GlassCard>

      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200">Impacted Transactions</p>
        <TransactionList transactions={visible} danger={attackState.level === 'critical'} />
      </div>
    </div>
  );
}

export default AttackSimulationPage;

