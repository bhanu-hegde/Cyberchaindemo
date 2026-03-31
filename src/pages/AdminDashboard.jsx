import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../components/GlassCard';
import MotionButton from '../components/MotionButton';
import StatCard from '../components/StatCard';
import TransactionList from '../components/TransactionList';
import UserTable from '../components/UserTable';
import { useAppContext } from '../context/AppContext';
import { currency } from '../utils/helpers';

function AdminDashboard() {
  const {
    users,
    transactions,
    creditUser,
    totalValue,
    securityScore,
    systemHealth,
    resetSystem,
    loading,
    error,
    clearError,
  } = useAppContext();

  const [form, setForm] = useState({ userId: '', amount: '' });

  const userOptions = useMemo(() => users.filter((user) => user.role === 'user'), [users]);

  useEffect(() => {
    if (!form.userId && userOptions[0]?.id) {
      setForm((current) => ({ ...current, userId: userOptions[0].id }));
    }
  }, [form.userId, userOptions]);

  const handleCredit = async (event) => {
    event.preventDefault();
    const ok = await creditUser({ userId: form.userId, amount: Number(form.amount) });
    if (ok) {
      clearError();
      setForm((current) => ({ ...current, amount: '' }));
    }
  };

  const handleReset = async () => {
    const ok = await resetSystem();
    if (ok) {
      clearError();
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard accent="red">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200">Administrative Command Center</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Treasury controls, ledger oversight, and system recovery tools</h2>
            <p className="mt-3 max-w-3xl text-slate-300 leading-7">
              Admin operations are connected to backend-enforced role checks. You can issue treasury credits, monitor
              every account, and reset state for controlled testing cycles.
            </p>
          </div>
          <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-100">
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-200/80">System Health</p>
            <p className="mt-2 text-xl font-bold">{systemHealth}</p>
            <p className="text-sm text-rose-100/80">Security Score: {securityScore}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Reserve Visibility" value={currency(totalValue)} tone="red" helper="Aggregate value currently distributed across all wallets." />
        <StatCard label="Managed Users" value={String(userOptions.length)} tone="red" helper="Number of user wallets under administrative control." />
        <StatCard label="Recovery Controls" value="Enabled" tone="amber" helper="System reset and remediation tooling are available." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,0.92fr]">
        <UserTable users={userOptions} />

        <GlassCard accent="red">
          <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200">Treasury Issuance</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Credit user wallet from reserve</h3>
          <form className="mt-6 space-y-4" onSubmit={handleCredit}>
            <label className="block text-sm text-slate-300">
              User
              <select
                value={form.userId}
                onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-rose-400/50"
              >
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              Credit Amount
              <input
                required
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                type="number"
                min="1"
                placeholder="Enter amount"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-rose-400/50"
              />
            </label>

            <MotionButton type="submit" disabled={loading} className="w-full border border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-60">
              {loading ? 'Applying...' : 'Credit Wallet'}
            </MotionButton>
          </form>

          <MotionButton
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="mt-4 w-full border border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
          >
            Reset Platform State
          </MotionButton>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        </GlassCard>
      </div>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-rose-200">Platform Transaction Ledger</p>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}

export default AdminDashboard;
