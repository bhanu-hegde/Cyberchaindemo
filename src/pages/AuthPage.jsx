import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import MotionButton from '../components/MotionButton';
import { useAppContext } from '../context/AppContext';

const pillars = [
  {
    title: 'Secure Authentication',
    body: 'Role-based sign-in with authenticated sessions and protected routes.',
  },
  {
    title: 'Threat Visibility',
    body: 'Observe how MITM, tampering, and double spending impact centralized transactions.',
  },
  {
    title: 'Blockchain Integrity',
    body: 'Inspect linked hashes in a 3D chain and detect integrity breaks instantly.',
  },
];

const initialLogin = { email: '', password: '' };
const initialRegister = { name: '', email: '', password: '' };

function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role, login, register, loading, error, clearError } = useAppContext();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);

  const targetPath = useMemo(() => (role === 'admin' ? '/admin' : '/wallet'), [role]);

  if (isAuthenticated) {
    return <Navigate to={targetPath} replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    const ok = await login(loginForm);
    if (ok) {
      navigate('/');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const ok = await register(registerForm);
    if (ok) {
      navigate('/');
    }
  };

  return (
    <div className="grid min-h-[78vh] gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <motion.section initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-sky-300 w-fit">
          Production Security Suite
        </div>
        <div className="space-y-5">
          <h2 className="max-w-4xl text-5xl font-black leading-tight text-white xl:text-6xl">
            Build and defend digital currency transactions with real authentication and attack telemetry.
          </h2>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            CyberChain combines wallet operations, central payment pipeline monitoring, live attack analysis, and
            blockchain integrity verification in one deployable web application.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <GlassCard key={pillar.title} accent="blue" className="min-h-[200px]">
              <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Platform Capability</p>
              <h3 className="mt-4 text-xl font-bold text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{pillar.body}</p>
            </GlassCard>
          ))}
        </div>
      </motion.section>

      <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
        <GlassCard className="h-full p-8" accent="slate">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                clearError();
                setMode('login');
              }}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${
                mode === 'login' ? 'border-sky-400/50 bg-sky-500/10 text-sky-200' : 'border-white/10 text-slate-400'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                clearError();
                setMode('register');
              }}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${
                mode === 'register' ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200' : 'border-white/10 text-slate-400'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <h3 className="text-2xl font-bold text-white">Secure sign-in</h3>
              <p className="text-sm text-slate-400 leading-6">
                Use your account credentials to access role-based controls and real-time transaction data.
              </p>
              <label className="block text-sm text-slate-300">
                Email
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-sky-400/50"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-sky-400/50"
                />
              </label>
              <MotionButton
                type="submit"
                disabled={loading}
                className="w-full border border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </MotionButton>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <h3 className="text-2xl font-bold text-white">Create account</h3>
              <p className="text-sm text-slate-400 leading-6">
                New accounts are created as user wallets with secure session tokens.
              </p>
              <label className="block text-sm text-slate-300">
                Full Name
                <input
                  required
                  type="text"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/50"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Email
                <input
                  required
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/50"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <input
                  required
                  minLength={8}
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/50"
                />
              </label>
              <MotionButton
                type="submit"
                disabled={loading}
                className="w-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Register'}
              </MotionButton>
            </form>
          )}

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-400">
            Default admin credentials: `admin@cyberchain.app` / `Admin@123`
          </div>
        </GlassCard>
      </motion.aside>
    </div>
  );
}

export default AuthPage;
