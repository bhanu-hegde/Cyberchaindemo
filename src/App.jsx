import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SystemSimulationPage from './pages/SystemSimulationPage';
import AttackSimulationPage from './pages/AttackSimulationPage';
import BlockchainSimulationPage from './pages/BlockchainSimulationPage';
import { useAppContext } from './context/AppContext';

function HomeRoute() {
  const { initializing, isAuthenticated, role } = useAppContext();

  if (initializing) {
    return <div className="text-slate-300">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={role === 'admin' ? '/admin' : '/wallet'} replace />;
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute allow="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allow="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system"
          element={
            <ProtectedRoute>
              <SystemSimulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attacks"
          element={
            <ProtectedRoute>
              <AttackSimulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blockchain"
          element={
            <ProtectedRoute>
              <BlockchainSimulationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
