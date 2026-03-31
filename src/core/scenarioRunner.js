export const ScenarioType = {
  MITM: 'mitm',
  TAMPERING: 'tampering',
  DOUBLE: 'double',
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withDefaults = (config = {}) => ({
  attackType: config.attackType ?? ScenarioType.MITM,
  includeGuard: config.includeGuard ?? true,
  includeRecovery: config.includeRecovery ?? true,
  startMode: config.startMode ?? 'centralized',
  stepDelayMs: Number.isFinite(config.stepDelayMs) ? config.stepDelayMs : 450,
});

export const buildScenarioPlan = (config = {}) => {
  const normalized = withDefaults(config);

  const steps = [
    {
      id: 'set-baseline',
      kind: 'mode',
      label: `Set ${normalized.startMode} baseline`,
      mode: normalized.startMode,
    },
    {
      id: 'trigger-attack',
      kind: 'attack',
      label: `Trigger ${normalized.attackType.toUpperCase()} attack`,
      attackType: normalized.attackType,
    },
  ];

  if (normalized.includeGuard) {
    steps.push({
      id: 'enable-guard',
      kind: 'mode',
      label: 'Enable blockchain guard',
      mode: 'blockchain',
    });
  }

  if (normalized.includeRecovery) {
    steps.push({
      id: 'recover-ledger',
      kind: 'recover',
      label: 'Recover and rebuild chain',
    });
  }

  return {
    ...normalized,
    steps,
  };
};

export const executeScenarioPlan = async ({ plan, handlers, onStep }) => {
  for (const step of plan.steps) {
    onStep?.({
      type: 'step_start',
      step,
    });

    if (step.kind === 'mode') {
      await handlers.setMode(step.mode);
    }

    if (step.kind === 'attack') {
      await handlers.triggerAttack(step.attackType);
    }

    if (step.kind === 'recover') {
      await handlers.recoverChain();
    }

    onStep?.({
      type: 'step_complete',
      step,
    });

    if (plan.stepDelayMs > 0) {
      await wait(plan.stepDelayMs);
    }
  }
};
