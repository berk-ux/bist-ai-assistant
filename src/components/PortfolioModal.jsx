import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function PortfolioModal({ isOpen, onClose, portfolio, onSave, marketData = [] }) {
  const [symbol, setSymbol] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  // Yeni Tarihsel Hesaplama State'leri
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputType, setInputType] = useState('lot'); // 'lot' veya 'amount'
  const [inputValue, setInputValue] = useState('');
  const [isFetchingHistorical, setIsFetchingHistorical] = useState(false);
  
  // Create a local copy to edit before saving
  const [localPortfolio, setLocalPortfolio] = useState(portfolio || []);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!symbol || !buyDate || !inputValue) {
      alert("Lütfen hisse kodu, tarih ve miktarı/tutarı girin.");
      return;
    }

    setIsFetchingHistorical(true);
    try {
      const response = await fetch(`/api/market/historical/${symbol}/${buyDate}`);
      const data = await response.json();
      
      if (data.error) {
        alert("Girdiğiniz tarihe ait fiyat verisi bulunamadı. Lütfen hafta içi bir tarih seçin.");
        setIsFetchingHistorical(false);
        return;
      }

      const historicalPrice = data.price;
      const inputVal = parseFloat(inputValue);
      
      let finalQuantity = 0;
      if (inputType === 'lot') {
        finalQuantity = inputVal;
      } else {
        finalQuantity = inputVal / historicalPrice;
      }

      const newItem = {
        id: Date.now().toString(),
        symbol: symbol.toUpperCase(),
        buyPrice: historicalPrice,
        quantity: finalQuantity,
        buyDate: buyDate
      };
      
      setLocalPortfolio([...localPortfolio, newItem]);
      setSymbol('');
      setInputValue('');
    } catch (err) {
      alert("Tarihsel fiyat çekilirken bir hata oluştu.");
    } finally {
      setIsFetchingHistorical(false);
    }
  };

  const handleRemove = (id) => {
    setLocalPortfolio(localPortfolio.filter(item => item.id !== id));
  };

  const handleSave = () => {
    onSave(localPortfolio);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel" style={{
        width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto',
        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        <div className="flex justify-between items-center">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>Portföyü Düzenle</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Yeni Ekleme Formu (Tarih ve Akıllı Hesaplama Destekli) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr auto', gap: '0.8rem', alignItems: 'end' }}>
          
          {/* 1. Hisse Kodu (Autocomplete) */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Hisse/Fon</label>
            <input 
              value={symbol} 
              onChange={e => {
                const val = e.target.value.toUpperCase();
                setSymbol(val);
                if (val.length > 0) {
                  const filtered = marketData.filter(m => m.symbol.includes(val)).slice(0, 5);
                  setSuggestions(filtered);
                  setShowSuggestions(true);
                } else setShowSuggestions(false);
              }}
              onFocus={() => { if (symbol.length > 0 && suggestions.length > 0) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Örn: THYAO" 
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }} 
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)', marginTop: '0.2rem', overflow: 'hidden'
              }}>
                {suggestions.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => { setSymbol(s.symbol); setShowSuggestions(false); }}
                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.85rem' }}
                    onMouseEnter={e => e.target.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    {s.symbol} <span style={{ color: 'var(--text-muted)' }}>- {s.price}₺</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Alış Tarihi */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Alış Tarihi</label>
            <input 
              type="date"
              value={buyDate} onChange={e => setBuyDate(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }} 
            />
          </div>

          {/* 3. Giriş Tipi (Lot / Tutar) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Giriş Tipi</label>
            <select
              value={inputType} onChange={e => setInputType(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <option value="lot">Lot (Adet)</option>
              <option value="amount">Tutar (₺)</option>
            </select>
          </div>

          {/* 4. Miktar Girişi */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              {inputType === 'lot' ? 'Kaç Lot Aldınız?' : 'Kaç TL Yatırdınız?'}
            </label>
            <input 
              type="number" step="0.01"
              value={inputValue} onChange={e => setInputValue(e.target.value)}
              placeholder="0.00" 
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }} 
            />
          </div>

          {/* 5. Ekle Butonu */}
          <button 
            onClick={handleAdd} 
            disabled={isFetchingHistorical}
            className="btn" 
            style={{ padding: '0.6rem', background: 'var(--text-primary)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', cursor: isFetchingHistorical ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isFetchingHistorical ? 0.7 : 1 }}
          >
            {isFetchingHistorical ? <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>...</span> : <Plus size={20} />}
          </button>
        </div>

        {/* Mevcut Hisseler */}
        <div style={{ flex: 1, minHeight: '150px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--bg-primary)', overflowY: 'auto' }}>
          {localPortfolio.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', marginTop: '2rem' }}>Portföyünüz şu an boş. Yukarıdan hisse ekleyin.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {localPortfolio.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#fff', marginRight: '1rem' }}>{item.symbol}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.buyDate && <span style={{ marginRight: '1rem', color: 'var(--text-muted)' }}>{item.buyDate}</span>}
                      {item.quantity.toFixed(2)} Lot @ {item.buyPrice.toFixed(2)} ₺ 
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(Maliyet: {(item.quantity * item.buyPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺)</span>
                    </span>
                  </div>
                  <button onClick={() => handleRemove(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>İptal</button>
          <button onClick={handleSave} style={{ padding: '0.6rem 1.5rem', background: 'var(--text-primary)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}
