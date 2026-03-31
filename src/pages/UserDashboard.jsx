import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../components/GlassCard';
import MotionButton from '../components/MotionButton';
import StatCard from '../components/StatCard';
import TransactionList from '../components/TransactionList';
import { useAppContext } from '../context/AppContext';
import { currency } from '../utils/helpers';

function UserDashboard() {
  const { profile, users, sendMoney, transactions, attackState, securityScore, loading, error, clearError } = useAppContext();
  const [form, setForm] = useState({ recipientId: '', amount: '' });

  const recipients = useMemo(
    () => users.filter((user) => user.id !== profile?.id && user.role === 'user'),
    [users, profile?.id],
  );

  useEffect(() => {
    if (!form.recipientId && recipients[0]?.id) {
      setForm((current) => ({ ...current, recipientId: recipients[0].id }));
    }
  }, [form.recipientId, recipients]);

  const walletTransactions = useMemo(
    () => transactions.filter((entry) => entry.fromUserId === profile?.id || entry.toUserId === profile?.id),
    [transactions, profile?.id],
  );

  const latestTransaction = walletTransactions[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await sendMoney({ recipientId: form.recipientId, amount: Number(form.amount) });
    if (ok) {
      setForm((current) => ({ ...current, amount: '' }));
      clearError();
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <GlassCard accent="blue">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Wallet Workspace</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{profile.name} can transfer digital currency securely</h2>
            <p className="mt-3 max-w-3xl text-slate-300 leading-7">
              Transactions are now powered by authenticated API calls and centralized processing. Threat status and
              blockchain integrity are monitored in real time across the platform.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Security Score</p>
            <p className={`mt-2 text-2xl font-black ${securityScore > 84 ? 'text-emerald-300' : securityScore > 62 ? 'text-amber-300' : 'text-rose-300'}`}>
              {securityScore}
            </p>
            <p className={`mt-1 text-sm font-semibold ${attackState.level === 'critical' ? 'text-rose-200' : 'text-emerald-200'}`}>
              {attackState.title}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Wallet Balance" value={currency(profile.balance ?? 0)} helper="Live wallet balance returned by the backend API." />
        <StatCard label="Latest Transfer" value={currency(latestTransaction?.amount ?? 0)} helper="Most recent transfer involving your wallet identity." />
        <StatCard label="Threat Status" value={attackState.level === 'critical' ? 'Threat Detected' : 'Protected'} tone={attackState.level === 'critical' ? 'red' : 'green'} helper="Centralized risk posture updates as attacks are triggered." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <GlassCard accent="blue">
          <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Send Money</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Initiate a wallet transfer</h3>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              Recipient
              <select
                required
                value={form.recipientId}
                onChange={(event) => setForm((current) => ({ ...current, recipientId: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-sky-400/50"
              >
                {recipients.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              Amount
              <input
                required
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                type="number"
                min="1"
                placeholder="Enter amount"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-sky-400/50"
              />
            </label>

            <MotionButton type="submit" disabled={loading} className="w-full border border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 disabled:opacity-60">
              {loading ? 'Processing...' : 'Send Transfer'}
            </MotionButton>
          </form>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        </GlassCard>

        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">Wallet Activity</p>
          <TransactionList transactions={walletTransactions} />
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
