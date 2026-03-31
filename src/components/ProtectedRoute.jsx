import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function ProtectedRoute({ children, allow }) {
  const { initializing, isAuthenticated, role } = useAppContext();

  if (initializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">Initializing secure session...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (allow && role !== allow) return <Navigate to={role === 'admin' ? '/admin' : '/wallet'} replace />;

  return children;
}

export default ProtectedRoute;
