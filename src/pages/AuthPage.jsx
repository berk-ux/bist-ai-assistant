import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, Lock, User, Terminal } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      if (isLogin) {
        login(data.token, data.username);
        navigate('/');
      } else {
        alert(data.message);
        setIsLogin(true); // switch to login mode after register
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--accent-primary)', opacity: 0.2, filter: 'blur(50px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 150, height: 150, background: 'var(--accent-secondary)', opacity: 0.2, filter: 'blur(50px)', borderRadius: '50%' }}></div>

        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '20px', background: 'var(--accent-gradient)', marginBottom: '1rem' }}>
            <Terminal size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>BİST AI Platform</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isLogin ? 'Portföyünüze erişmek için giriş yapın.' : 'Kendi canlı portföyünüzü oluşturun.'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--status-down-bg)', color: 'var(--status-down)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(255, 69, 58, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', paddingLeft: '0.2rem' }}>Kullanıcı Adı</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><User size={18} /></div>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="bist-trader" 
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', paddingLeft: '0.2rem' }}>Şifre</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Lock size={18} /></div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}
            disabled={isLoading}
          >
            {isLoading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              style={{ color: 'var(--accent-primary)', fontWeight: 600, padding: 0, background: 'transparent' }}
            >
              {isLogin ? 'Hemen Kayıt Olun' : 'Giriş Yapın'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
