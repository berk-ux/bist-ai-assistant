import { useState, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { TrendingUp, LogOut, User, LogIn } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import { AuthContext } from './context/AuthContext';

function App() {
  const { token, username, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const MainLayout = () => (
    <div className="app-container">
      {/* Sidebar Placeholder */}
      <aside className="glass-panel" style={{ width: '250px', margin: '1rem 0 1rem 1rem', display: 'none' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h1 className="text-gradient" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} />
            BİST AI
          </h1>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>Sabit Hisselerim & Haberler</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Piyasadaki son gelişmeler ve yapay zeka analizleri.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {token ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', color: 'var(--accent-primary)' }}>
                  <User size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{username}</span>
                </div>
                <button className="btn btn-secondary" style={{ color: 'var(--status-down)' }} onClick={logout}>
                  <LogOut size={18} /> Çıkış
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                <LogIn size={18} /> Kayıt Ol / Giriş Yap
              </button>
            )}
          </div>
        </header>

        <Dashboard />
      </main>

    </div>
  );

  return (
    <Routes>
      <Route path="/auth" element={token ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
