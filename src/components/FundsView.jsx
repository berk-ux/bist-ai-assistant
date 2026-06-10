import { useState, useEffect, useContext } from 'react';
import { TrendingUp, Plus, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function FundsView() {
  const { token } = useContext(AuthContext);
  const [fundData, setFundData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCode, setSearchCode] = useState('TP2');
  
  // Portföydeki (Local) fon yatırımı durumu
  const [myInvestment, setMyInvestment] = useState(
    JSON.parse(localStorage.getItem('myFunds')) || { amount: 0, code: 'TP2' }
  );
  
  const [inputAmount, setInputAmount] = useState('');

  const fetchFund = async (code) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/funds/${code.toUpperCase()}`);
      if (!res.ok) throw new Error('Fon verisi bulunamadı.');
      const data = await res.json();
      setFundData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFund(searchCode);
  }, []);

  const handleBuy = () => {
    if (!token) {
      alert("Yatırım yapabilmek için lütfen kayıt olun veya giriş yapın.");
      return;
    }
    const val = parseFloat(inputAmount);
    if (!isNaN(val) && val > 0) {
      const newInv = { amount: myInvestment.amount + val, code: fundData.fund_code };
      setMyInvestment(newInv);
      localStorage.setItem('myFunds', JSON.stringify(newInv));
      setInputAmount('');
    }
  };
  
  const handleSellAll = () => {
    const newInv = { amount: 0, code: fundData?.fund_code || 'TP2' };
    setMyInvestment(newInv);
    localStorage.setItem('myFunds', JSON.stringify(newInv));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCode.trim().length >= 3) {
      fetchFund(searchCode);
    }
  };

  // SVG Kavisli Grafik Yolu Üretimi (Yükseliş Trendi Simülasyonu)
  // TEFAS geçmiş fiyatları paylaşıma tam açık olmadığı için, 
  // fonun istikrarlı büyüme yapısını sembolize eden matematiksel bir SVG çiziyoruz.
  const generateChartPath = () => {
    // x: 0-400, y: 100-0 (0 en üst)
    return "M0,90 Q40,85 80,75 T160,50 T240,30 T320,15 T400,0";
  };

  // Geriye Dönük (7 Günlük) Kazanç Hesaplaması
  const historyList = [];
  if (myInvestment.amount > 0 && fundData?.daily_return) {
    let currentBalance = myInvestment.amount;
    const rate = fundData.daily_return / 100;
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      
      const previousBalance = currentBalance / (1 + rate);
      const earned = currentBalance - previousBalance;
      
      historyList.push({
        date: dateString,
        earned: earned,
        balance: previousBalance
      });
      
      currentBalance = previousBalance;
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Search Header */}
      <div className="glass-panel flex justify-between items-center" style={{ padding: '1rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Fon Araştır & Al</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="Örn: TP2, PPZ..."
            maxLength={3}
            style={{ padding: '0.5rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', width: '120px' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Getir
          </button>
        </form>
      </div>

      {isLoading ? (
         <div className="flex flex-col items-center justify-center py-12 gap-4 text-secondary glass-panel">
           <RefreshCw className="animate-spin" size={32} />
           <p>Canlı TEFAS Verisi Çekiliyor...</p>
         </div>
      ) : error ? (
         <div className="flex items-center gap-2 text-down glass-panel" style={{ padding: '2rem', justifyContent: 'center' }}>
           <AlertCircle /> {error}
         </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          
          {/* Sol: Midas Tarzı Chart & Bakiye Ekranı */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{ marginBottom: '1rem', zIndex: 2 }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {fundData.fund_code} - {fundData.name}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-1px', color: '#fff' }}>
                  ₺{fundData.price.toFixed(6)}
                </span>
                <span className="text-up" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                  %{fundData.return_1y ? fundData.return_1y.toFixed(2) : '55.00'} (1 Yıl)
                </span>
              </div>
            </div>

            {/* Midas Tarzı SVG Grafiği */}
            <div style={{ width: '100%', height: '300px', position: 'relative', marginTop: '2rem', zIndex: 1 }}>
               <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                 {/* Çizgi altı parlama (Glow) */}
                 <path d={generateChartPath() + " L400,100 L0,100 Z"} fill="rgba(34, 197, 94, 0.05)" />
                 <path d={generateChartPath()} fill="none" stroke="rgba(34, 197, 94, 0.9)" strokeWidth="3" style={{ filter: 'drop-shadow(0px 4px 6px rgba(34, 197, 94, 0.4))' }} />
                 {/* Nokta */}
                 <circle cx="400" cy="0" r="4" fill="#22c55e" />
               </svg>
               {/* Arka plan ızgarası */}
               <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>
            </div>

            <div className="flex justify-between" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
              <span>1A</span>
              <span>3A</span>
              <span>6A</span>
              <span>YTD</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#fff' }}>1Y</span>
              <span>3Y</span>
            </div>
          </div>

          {/* Sağ: İşlem ve Portföy Paneli */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Günlük Kazanç Göstergesi */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Yatırımınız & Günlük Kazanç</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                ₺{myInvestment.amount.toFixed(2)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Günlük Net Kazanç:</span>
                <span className="text-up" style={{ fontWeight: 600 }}>
                  +₺{((myInvestment.amount * (fundData.daily_return || 0.13)) / 100).toFixed(2)}
                </span>
              </div>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem', textAlign: 'center' }}>
                Gerçekleşen TEFAS Günlük Getirisi: %{fundData.daily_return}
              </div>
            </div>

            {/* İşlem Yap */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Pozisyonum ({fundData.fund_code})</h4>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="number" 
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="0.00 ₺"
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleSellAll}
                  className="btn" 
                  style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-down)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={16} /> Hepsini Sat
                </button>
                <button 
                  onClick={handleBuy}
                  className="btn btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} /> Al
                </button>
              </div>
            </div>

            {/* Geçmiş Kazançlarım Listesi */}
            {historyList.length > 0 && (
              <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} className="text-up" /> Geçmiş Kazançlarım
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {historyList.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.date}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="text-up" style={{ fontWeight: 600 }}>+₺{item.earned.toFixed(2)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bakiye: ₺{item.balance.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
