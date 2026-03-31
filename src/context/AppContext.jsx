import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStorage } from '../lib/apiClient';
import { buildFlowModel } from '../core/flowEngine';
import { buildScenarioPlan, executeScenarioPlan } from '../core/scenarioRunner';

const AppContext = createContext(null);

const defaultAttackState = {
  type: null,
  level: 'stable',
  title: 'No active threat',
  message: 'Transaction pipeline is stable with no detected intrusion.',
  impacts: [],
};

const emptyAppState = {
  role: null,
  profile: null,
  users: [],
  transactions: [],
  logs: [],
  blocks: [],
  attackState: defaultAttackState,
  attackEvidence: [],
  chainValid: true,
  securityScore: 100,
  systemHealth: 'Healthy',
  totalValue: 0,
  systemMode: 'centralized',
  recoveryStatus: 'idle',
  lastRecoveryAt: null,
  compromisedCount: 0,
  warningCount: 0,
};

const defaultScenarioRun = {
  running: false,
  currentStep: null,
  completedSteps: [],
  lastPlan: [],
  lastRunAt: null,
};

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => authStorage.getToken());
  const [authUser, setAuthUser] = useState(null);
  const [appState, setAppState] = useState(emptyAppState);
  const [scenarioRun, setScenarioRun] = useState(defaultScenarioRun);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyState = useCallback((nextState) => {
    setAppState((current) => ({ ...current, ...nextState }));
    if (nextState?.profile) {
      setAuthUser(nextState.profile);
    }
  }, []);

  const runWithLoading = useCallback(async (task) => {
    setLoading(true);
    setError('');

    try {
      const result = await task();
      return { ok: true, result };
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'Unexpected request failure');
      return { ok: false, error: taskError };
    } finally {
      setLoading(false);
    }
  }, []);

  const syncFromServer = useCallback(
    async (nextToken) => {
      if (!nextToken) {
        setAppState(emptyAppState);
        setAuthUser(null);
        setInitializing(false);
        return;
      }

      const outcome = await runWithLoading(async () => {
        const payload = await api.state(nextToken);
        applyState(payload);
      });

      if (!outcome.ok) {
        authStorage.clearToken();
        setToken(null);
        setAuthUser(null);
        setAppState(emptyAppState);
      }

      setInitializing(false);
    },
    [applyState, runWithLoading],
  );

  useEffect(() => {
    syncFromServer(token);
  }, [token, syncFromServer]);

  const login = useCallback(
    async (credentials) => {
      const outcome = await runWithLoading(async () => {
        const payload = await api.login(credentials);
        authStorage.setToken(payload.token);
        setToken(payload.token);
        setAuthUser(payload.user);
        applyState(payload.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading],
  );

  const register = useCallback(
    async (payload) => {
      const outcome = await runWithLoading(async () => {
        const response = await api.register(payload);
        authStorage.setToken(response.token);
        setToken(response.token);
        setAuthUser(response.user);
        applyState(response.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading],
  );

  const logout = useCallback(() => {
    authStorage.clearToken();
    setToken(null);
    setAuthUser(null);
    setAppState(emptyAppState);
    setScenarioRun(defaultScenarioRun);
    setError('');
    setInitializing(false);
  }, []);

  const refreshState = useCallback(async () => {
    if (!token) return false;

    const outcome = await runWithLoading(async () => {
      const payload = await api.state(token);
      applyState(payload);
    });

    return outcome.ok;
  }, [applyState, runWithLoading, token]);

  const sendMoney = useCallback(
    async (payload) => {
      if (!token) return false;

      const outcome = await runWithLoading(async () => {
        const response = await api.sendMoney(token, payload);
        applyState(response.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading, token],
  );

  const creditUser = useCallback(
    async (payload) => {
      if (!token) return false;

      const outcome = await runWithLoading(async () => {
        const response = await api.credit(token, payload);
        applyState(response.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading, token],
  );

  const runAttack = useCallback(
    async (type) => {
      if (!token) return false;

      const outcome = await runWithLoading(async () => {
        const response = await api.triggerAttack(token, { type });
        applyState(response.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading, token],
  );

  const setSystemMode = useCallback(
    async (mode) => {
      if (!token) return false;

      const outcome = await runWithLoading(async () => {
        const response = await api.setSystemMode(token, mode);
        applyState(response.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading, token],
  );

  const recoverBlockchain = useCallback(async (method = 'pbft') => {
    if (!token) return false;

    const outcome = await runWithLoading(async () => {
      const response = await api.recoverBlockchain(token, method);
      applyState(response.state);
    });

    return outcome.ok;
  }, [applyState, runWithLoading, token]);

  const runScenario = useCallback(
    async (config = {}) => {
      if (!token) return false;

      setScenarioRun({
        ...defaultScenarioRun,
        running: true,
      });

      const outcome = await runWithLoading(async () => {
        const plan = buildScenarioPlan(config);

        setScenarioRun((current) => ({
          ...current,
          lastPlan: plan.steps.map((step) => ({ id: step.id, label: step.label })),
        }));

        await executeScenarioPlan({
          plan,
          handlers: {
            setMode: async (mode) => {
              const response = await api.setSystemMode(token, mode);
              applyState(response.state);
            },
            triggerAttack: async (type) => {
              const response = await api.triggerAttack(token, { type });
              applyState(response.state);
            },
            recoverChain: async () => {
              const response = await api.recoverBlockchain(token);
              applyState(response.state);
            },
          },
          onStep: ({ type, step }) => {
            if (type === 'step_start') {
              setScenarioRun((current) => ({
                ...current,
                currentStep: step.id,
              }));
            }

            if (type === 'step_complete') {
              setScenarioRun((current) => ({
                ...current,
                currentStep: step.id,
                completedSteps: Array.from(new Set([...current.completedSteps, step.id])),
              }));
            }
          },
        });
      });

      setScenarioRun((current) => ({
        ...current,
        running: false,
        currentStep: null,
        lastRunAt: new Date().toISOString(),
      }));

      return outcome.ok;
    },
    [applyState, runWithLoading, token],
  );

  const updateBlockData = useCallback(
    async (blockId, data) => {
      if (!token) return false;

      const outcome = await runWithLoading(async () => {
        const response = await api.updateBlock(token, blockId, { data });
        applyState(response.state);
      });

      return outcome.ok;
    },
    [applyState, runWithLoading, token],
  );

  const resetSystem = useCallback(async () => {
    if (!token) return false;

    const outcome = await runWithLoading(async () => {
      const response = await api.resetSystem(token);
      applyState(response.state);
    });

    return outcome.ok;
  }, [applyState, runWithLoading, token]);

  const flowModel = useMemo(() => buildFlowModel(appState), [appState]);

  const value = useMemo(
    () => ({
      token,
      authUser,
      ...appState,
      flowModel,
      scenarioRun,
      initializing,
      loading,
      error,
      isAuthenticated: Boolean(token && authUser),
      login,
      register,
      logout,
      refreshState,
      sendMoney,
      creditUser,
      runAttack,
      setSystemMode,
      recoverBlockchain,
      runScenario,
      updateBlockData,
      resetSystem,
      clearError: () => setError(''),
    }),
    [
      token,
      authUser,
      appState,
      flowModel,
      scenarioRun,
      initializing,
      loading,
      error,
      login,
      register,
      logout,
      refreshState,
      sendMoney,
      creditUser,
      runAttack,
      setSystemMode,
      recoverBlockchain,
      runScenario,
      updateBlockData,
      resetSystem,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => useContext(AppContext);

