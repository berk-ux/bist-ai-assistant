import { useState, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TrendingUp, Settings, Cpu, LogOut, User } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/auth" />;
  return children;
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const { token, username, logout } = useContext(AuthContext);

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setIsSettingsOpen(false);
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', color: 'var(--accent-primary)' }}>
              <User size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
              <Cpu size={16} className={apiKey ? 'text-up' : 'text-down'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                AI: {apiKey ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} /> Ayarlar
            </button>
            <button className="btn btn-secondary" style={{ color: 'var(--status-down)' }} onClick={logout}>
              <LogOut size={18} /> Çıkış
            </button>
          </div>
        </header>

        <Dashboard hasApiKey={!!apiKey} apiKey={apiKey} />
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h3>Yapay Zeka Ayarları</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Haberleri okuyup size finansal yorum yapabilmem (gelecek tahmini vs.) için ücretsiz bir Gemini API Anahtarına ihtiyacım var.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Gemini API Anahtarı</label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                defaultValue={apiKey}
                id="api-key-input"
                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => {
                const val = document.getElementById('api-key-input').value;
                saveApiKey(val);
              }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/auth" element={token ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
