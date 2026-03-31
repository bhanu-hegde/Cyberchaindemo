import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import MotionButton from './MotionButton';

function Navbar() {
  const { isAuthenticated, role, logout, systemMode } = useAppContext();

  const links = [
    { to: role === 'admin' ? '/admin' : '/wallet', label: role === 'admin' ? 'Admin Console' : 'Wallet' },
    { to: '/system', label: 'System Pipeline' },
    { to: '/attacks', label: 'Threat Center' },
    { to: '/blockchain', label: 'Forensics Lab' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-sky-300">CyberChain Payments</p>
          <h1 className="mt-2 text-2xl font-black text-white text-glow">Digital Currency Security Platform</h1>
        </div>

        <nav className="flex flex-wrap gap-2">
          {!isAuthenticated ? (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                `rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? 'border-sky-400/60 bg-sky-500/10 text-sky-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/35 hover:text-sky-200'
                }`
              }
            >
              Secure Login
            </NavLink>
          ) : (
            links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-sky-400/60 bg-sky-500/10 text-sky-200'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/35 hover:text-sky-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <span
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.32em] ${
                role === 'admin'
                  ? 'border-rose-400/50 bg-rose-500/10 text-rose-200'
                  : 'border-sky-400/50 bg-sky-500/10 text-sky-200'
              }`}
            >
              {role}
            </span>
          ) : null}
          {isAuthenticated ? (
            <span
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] ${
                systemMode === 'blockchain'
                  ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                  : 'border-sky-400/50 bg-sky-500/10 text-sky-200'
              }`}
            >
              {systemMode}
            </span>
          ) : null}
          {isAuthenticated ? (
            <MotionButton
              onClick={logout}
              className="border border-white/10 bg-white/5 text-slate-200 hover:border-rose-400/35 hover:text-rose-200"
            >
              Logout
            </MotionButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

