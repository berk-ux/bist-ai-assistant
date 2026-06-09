import { useState, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { TrendingUp, LogOut, User, LogIn, Wallet, LineChart, Newspaper, Rocket } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import { AuthContext } from './context/AuthContext';

function App() {
  const { token, username, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assets');

  const MainLayout = () => {
    // Başlık ve Açıklama Dinamik Ayarlama
    let headerTitle = "Sabit Hisselerim & Haberler";
    let headerDesc = "Piyasadaki son gelişmeler ve yapay zeka analizleri.";
    
    if (activeTab === 'assets') {
      headerTitle = "Varlıklarım";
      headerDesc = "Portföy değeriniz ve hisse dağılımınız.";
    } else if (activeTab === 'market') {
      headerTitle = "Hisse Fiyatları";
      headerDesc = "BİST 100 hisselerinin canlı piyasa verileri.";
    } else if (activeTab === 'news') {
      headerTitle = "Haberler & Analizler";
      headerDesc = "Gerçek zamanlı haber akışı ve yapay zeka yorumları.";
    } else if (activeTab === 'ipos') {
      headerTitle = "Yaklaşan Halka Arzlar";
      headerDesc = "SPK onaylı halka arz fırsatları ve yapay zeka öngörüleri.";
    }

    return (
      <div className="app-container">
      {/* Sidebar Placeholder */}
      <aside className="glass-panel" style={{ width: '250px', margin: '1rem 0 1rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} />
            BİST AI
          </h1>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          <button 
            className={`btn ${activeTab === 'assets' ? 'btn-primary' : ''}`} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', background: activeTab === 'assets' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'assets' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '0.75rem 1rem' }}
            onClick={() => setActiveTab('assets')}
          >
            <Wallet size={18} /> Varlıklarım
          </button>
          <button 
            className={`btn ${activeTab === 'market' ? 'btn-primary' : ''}`} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', background: activeTab === 'market' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'market' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '0.75rem 1rem' }}
            onClick={() => setActiveTab('market')}
          >
            <LineChart size={18} /> Hisse Fiyatları
          </button>
          <button 
            className={`btn ${activeTab === 'news' ? 'btn-primary' : ''}`} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', background: activeTab === 'news' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'news' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '0.75rem 1rem' }}
            onClick={() => setActiveTab('news')}
          >
            <Newspaper size={18} /> Haberler
          </button>
          <button 
            className={`btn ${activeTab === 'ipos' ? 'btn-primary' : ''}`} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', background: activeTab === 'ipos' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'ipos' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '0.75rem 1rem' }}
            onClick={() => setActiveTab('ipos')}
          >
            <Rocket size={18} /> Yaklaşan Halka Arzlar
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>{headerTitle}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{headerDesc}</p>
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

        <Dashboard activeTab={activeTab} />
      </main>

    </div>
  );
};

  return (
    <Routes>
      <Route path="/auth" element={token ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
