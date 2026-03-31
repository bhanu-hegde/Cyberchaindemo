export const FlowPhase = {
  BASELINE: 'baseline',
  ATTACK_ACTIVE: 'attack_active',
  ATTACK_BLOCKED: 'attack_blocked',
  RECOVERY_IN_PROGRESS: 'recovery_in_progress',
  SECURED: 'secured',
};

export const FlowAction = {
  SET_CENTRALIZED: 'set_centralized',
  SET_BLOCKCHAIN: 'set_blockchain',
  RECOVER_CHAIN: 'recover_chain',
  ATTACK_MITM: 'attack_mitm',
  ATTACK_TAMPERING: 'attack_tampering',
  ATTACK_DOUBLE: 'attack_double',
};

const flowBlueprint = [
  { id: 'initiate', label: 'Initiate Transfer' },
  { id: 'attack', label: 'Inject Attack' },
  { id: 'impact', label: 'Observe Impact' },
  { id: 'guard', label: 'Enable Blockchain Guard' },
  { id: 'finality', label: 'Secure Finality' },
];

const stageInfo = {
  [FlowPhase.BASELINE]: {
    title: 'Normal Transaction Flow',
    description: 'Transfers are being processed with no active threat signal.',
  },
  [FlowPhase.ATTACK_ACTIVE]: {
    title: 'Attack Impact Is Active',
    description: 'Centralized flow is compromised and records now show suspicious changes.',
  },
  [FlowPhase.ATTACK_BLOCKED]: {
    title: 'Attack Was Blocked',
    description: 'Blockchain safeguards detected the threat and stopped unauthorized mutation.',
  },
  [FlowPhase.RECOVERY_IN_PROGRESS]: {
    title: 'Recovery In Progress',
    description: 'Consensus reconciliation is rebuilding canonical values and chain integrity.',
  },
  [FlowPhase.SECURED]: {
    title: 'System Secured By Blockchain',
    description: 'Chain integrity is healthy and settlement is protected by verification rules.',
  },
};

const derivePhase = (state) => {
  const attackLevel = state.attackState?.level;
  const recoveryStatus = state.recoveryStatus;
  const secureMode = state.systemMode === 'blockchain';
  const compromisedCount = Number(state.compromisedCount ?? 0);
  const warningCount = Number(state.warningCount ?? 0);
  const hasRisk = compromisedCount > 0 || warningCount > 0 || !state.chainValid;

  if (recoveryStatus === 'in_progress') {
    return FlowPhase.RECOVERY_IN_PROGRESS;
  }

  if (secureMode && recoveryStatus === 'secured' && !hasRisk && attackLevel === 'stable') {
    return FlowPhase.SECURED;
  }

  if (secureMode && attackLevel === 'warning') {
    return FlowPhase.ATTACK_BLOCKED;
  }

  if (attackLevel === 'critical' || hasRisk) {
    return FlowPhase.ATTACK_ACTIVE;
  }

  return FlowPhase.BASELINE;
};

const statusForStep = (stepId, phase, state) => {
  const secureMode = state.systemMode === 'blockchain';
  const hasTransactions = (state.transactions?.length ?? 0) > 0;
  const hasAttackSignal = Boolean(state.attackState?.type) || state.attackState?.level !== 'stable';
  const hasImpact = Number(state.compromisedCount ?? 0) > 0 || Number(state.warningCount ?? 0) > 0 || !state.chainValid;
  const recovered = phase === FlowPhase.SECURED;

  if (stepId === 'initiate') {
    return hasTransactions ? 'done' : 'current';
  }

  if (stepId === 'attack') {
    if (!hasTransactions) return 'pending';
    return hasAttackSignal ? 'done' : phase === FlowPhase.BASELINE ? 'current' : 'pending';
  }

  if (stepId === 'impact') {
    if (phase === FlowPhase.ATTACK_BLOCKED) return 'done';
    if (hasImpact) return 'done';
    if (hasAttackSignal) return 'current';
    return 'pending';
  }

  if (stepId === 'guard') {
    if (secureMode) return 'done';
    return phase === FlowPhase.ATTACK_ACTIVE ? 'current' : 'pending';
  }

  if (stepId === 'finality') {
    if (recovered) return 'done';
    if (secureMode && !hasImpact) return 'current';
    return 'pending';
  }

  return 'pending';
};

const buildControls = (phase, state) => {
  const secureMode = state.systemMode === 'blockchain';
  const hasTransactions = (state.transactions?.length ?? 0) > 0;
  const hasRisk = Number(state.compromisedCount ?? 0) > 0 || Number(state.warningCount ?? 0) > 0 || !state.chainValid;
  const recoveryRunning = phase === FlowPhase.RECOVERY_IN_PROGRESS;

  const attackEnabled = hasTransactions && !recoveryRunning;

  return {
    [FlowAction.SET_CENTRALIZED]: {
      enabled: secureMode && !recoveryRunning,
      reason: secureMode ? null : 'Already in centralized mode.',
    },
    [FlowAction.SET_BLOCKCHAIN]: {
      enabled: !secureMode && !recoveryRunning,
      reason: secureMode ? 'Blockchain guard is already enabled.' : null,
    },
    [FlowAction.RECOVER_CHAIN]: {
      enabled: hasRisk && !recoveryRunning,
      reason: hasRisk ? null : 'No active integrity risk to recover.',
    },
    [FlowAction.ATTACK_MITM]: {
      enabled: attackEnabled,
      reason: hasTransactions ? (recoveryRunning ? 'Recovery is currently running.' : null) : 'No transactions available yet.',
    },
    [FlowAction.ATTACK_TAMPERING]: {
      enabled: attackEnabled,
      reason: hasTransactions ? (recoveryRunning ? 'Recovery is currently running.' : null) : 'No transactions available yet.',
    },
    [FlowAction.ATTACK_DOUBLE]: {
      enabled: attackEnabled,
      reason: hasTransactions ? (recoveryRunning ? 'Recovery is currently running.' : null) : 'No transactions available yet.',
    },
  };
};

const getRecommendedAction = (phase) => {
  if (phase === FlowPhase.BASELINE) return FlowAction.ATTACK_MITM;
  if (phase === FlowPhase.ATTACK_ACTIVE) return FlowAction.SET_BLOCKCHAIN;
  if (phase === FlowPhase.ATTACK_BLOCKED) return FlowAction.RECOVER_CHAIN;
  if (phase === FlowPhase.RECOVERY_IN_PROGRESS) return null;
  return FlowAction.ATTACK_TAMPERING;
};

export const buildFlowModel = (state) => {
  const phase = derivePhase(state);
  const phaseMeta = stageInfo[phase];
  const steps = flowBlueprint.map((step) => ({
    ...step,
    status: statusForStep(step.id, phase, state),
  }));
  const controls = buildControls(phase, state);

  return {
    phase,
    phaseTitle: phaseMeta.title,
    phaseDescription: phaseMeta.description,
    steps,
    controls,
    recommendedAction: getRecommendedAction(phase),
    metrics: {
      compromisedCount: Number(state.compromisedCount ?? 0),
      warningCount: Number(state.warningCount ?? 0),
      chainValid: Boolean(state.chainValid),
      mode: state.systemMode,
    },
  };
};
