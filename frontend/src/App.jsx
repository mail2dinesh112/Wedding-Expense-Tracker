import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const { session, loading, error, login, logout } = useAuth();

  if (!session) {
    return <LoginPage onLogin={login} loading={loading} error={error} />;
  }

  return <DashboardPage onLogout={logout} />;
}
