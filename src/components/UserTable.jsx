import GlassCard from './GlassCard';
import { currency } from '../utils/helpers';

function UserTable({ users }) {
  return (
    <GlassCard accent="red">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-rose-200">Administrative Visibility</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Registered Users</h3>
        </div>
        <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-rose-200">
          Admin View
        </span>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.28em] ${user.riskScore === 'low' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
                  {user.riskScore} risk
                </span>
                <p className="text-lg font-bold text-emerald-300">{currency(user.balance ?? 0)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default UserTable;
