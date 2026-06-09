import { useState, useEffect, useContext } from 'react';
import { Sparkles, ExternalLink, RefreshCw, Edit3 } from 'lucide-react';
import PortfolioModal from '../components/PortfolioModal';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard({ hasApiKey, apiKey }) {
  const [newsList, setNewsList] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Yeni Özellik: Seçilen hisseye özel diğer kaynakları gruplama
  const [groupedSources, setGroupedSources] = useState(null);
  const [isLoadingGrouped, setIsLoadingGrouped] = useState(false);

  // Yeni Özellik: Canlı Piyasa Fiyatları
  const [marketData, setMarketData] = useState([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  // Yeni Özellik: Gerçek Portföy Yönetimi
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;
    
    fetch('/api/portfolio', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMyPortfolio(data);
        }
      })
      .catch(err => console.error("Portföy getirme hatası:", err));
  }, [token]);

  const savePortfolio = (newPortfolio) => {
    setMyPortfolio(newPortfolio);
    fetch('/api/portfolio/save', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ portfolio: newPortfolio })
    }).catch(err => console.error("Portföy kaydetme hatası:", err));
  };

  // Canlı Piyasa Fiyatlarını Çekme
  useEffect(() => {
    const fetchMarket = () => {
      fetch('/api/market')
        .then(res => res.json())
        .then(data => {
          setMarketData(data);
          setIsLoadingMarket(false);
        })
        .catch(err => {
          console.error('Piyasa verileri hatası:', err);
          setIsLoadingMarket(false);
        });
    };
    fetchMarket();
    // 3 dakikada bir fiyatları yenile
    const interval = setInterval(fetchMarket, 180000);
    return () => clearInterval(interval);
  }, []);

  // Arka plandan gerçek haberleri çekme (Ana Liste) ve Otomatik Yenileme
  useEffect(() => {
    const fetchNews = () => {
      fetch('/api/news')
        .then(res => res.json())
        .then(data => {
          setNewsList(data);
          // Sadece ilk yüklemede ilk haberi seç
          if (data.length > 0 && isLoadingNews) {
            setSelectedNews(data[0]);
          }
          setIsLoadingNews(false);
        })
        .catch(err => {
          console.error('Haber çekme hatası:', err);
          setIsLoadingNews(false);
        });
    };

    // Sayfa açıldığında ilk veriyi çek
    fetchNews();

    // Sayfa açık kaldığı sürece her 2 dakikada bir (120000 ms) arka planda yeni haber var mı diye kontrol et
    const interval = setInterval(fetchNews, 120000);
    return () => clearInterval(interval);
  }, [isLoadingNews]);

  // Seçili haber (hisse) değiştiğinde, o hisseye özel diğer kaynakları asenkron çek
  useEffect(() => {
    if (selectedNews && selectedNews.symbol) {
      setIsLoadingGrouped(true);
      fetch(`/api/news/symbol/${selectedNews.symbol}`)
        .then(res => res.json())
        .then(data => {
          setGroupedSources(data);
          setIsLoadingGrouped(false);
        })
        .catch(err => {
          console.error('Gruplanmış haber çekme hatası:', err);
          setIsLoadingGrouped(false);
        });
    }
  }, [selectedNews]);

  const handleAnalyze = async () => {
    if (!hasApiKey) {
      alert("Lütfen yapay zeka analizini kullanmak için önce Ayarlar'dan API Anahtarınızı girin.");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis("");
    
    try {
      const prompt = `Sen profesyonel bir Borsa İstanbul (BİST) analisti ve portföy yöneticisisin. Sana gönderdiğim haberi özellikle "${selectedNews.symbol}" hissesi açısından incele. 

Bu haberin ${selectedNews.symbol} hissesi üzerinde kısa ve orta vadeli nasıl bir etki yaratacağını, yatırımcıların neye dikkat etmesi gerektiğini 2-3 cümlelik net, elit ve profesyonel bir dille özetle. Asla kesin yatırım tavsiyesi verme.

Haber Başlığı: ${selectedNews.title}
Haber Detayı: ${selectedNews.snippet}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setAnalysis("API Anahtarı geçersiz veya kotalar doldu: " + data.error.message);
      } else {
        const text = data.candidates[0].content.parts[0].text;
        setAnalysis(text);
      }
    } catch (err) {
      setAnalysis("Analiz yapılırken bir hata oluştu. İnternet bağlantınızı kontrol edin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dinamik Portföy Değeri Hesaplama (Gerçek Maliyet ve Canlı Fiyat Üzerinden)
  const calculatePortfolioValue = () => {
    if (myPortfolio.length === 0) return { total: '0,00', changeStr: '₺0,00 (0.00%)', isPositive: true, allocations: [] };
    
    let totalCurrentValue = 0;
    let totalCost = 0;
    let allocations = [];

    myPortfolio.forEach(item => {
      const marketItem = marketData.find(m => m.symbol === item.symbol);
      const currentPrice = marketItem ? parseFloat(marketItem.price) : item.buyPrice; // Bulunamazsa alış fiyatı sabit kalır
      
      const itemCost = item.buyPrice * item.quantity;
      const itemCurrentValue = currentPrice * item.quantity;
      
      totalCost += itemCost;
      totalCurrentValue += itemCurrentValue;
      
      allocations.push({
        symbol: item.symbol,
        value: itemCurrentValue
      });
    });

    const totalProfit = totalCurrentValue - totalCost;
    const percentProfit = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const formatter = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    return {
      total: formatter.format(totalCurrentValue),
      changeStr: `${totalProfit >= 0 ? '+' : ''}₺${formatter.format(totalProfit)} (${percentProfit >= 0 ? '+' : ''}${percentProfit.toFixed(2)}%)`,
      isPositive: totalProfit >= 0,
      allocations: allocations.sort((a, b) => b.value - a.value)
    };
  };

  const portfoy = calculatePortfolioValue();

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ paddingBottom: '4rem' }}>
      
      {/* Top Section - Exact Reference Style */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr 1fr', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {/* Card 1: Total Portfolio Value */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', minHeight: '220px' }}>
          <div style={{ zIndex: 2, position: 'relative' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gerçek Canlı Portföy</div>
              <button onClick={() => setIsPortfolioModalOpen(true)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Edit3 size={14} /> Düzenle
              </button>
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: '0.25rem' }}>₺{portfoy.total}</div>
            <div className={portfoy.isPositive ? 'text-up' : 'text-down'} style={{ fontSize: '0.9rem', fontWeight: 500 }}>{portfoy.changeStr}</div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', zIndex: 1 }}>
            <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
              <path d="M0,80 Q20,70 40,80 T80,60 T120,70 T160,40 T200,60 T240,30 T280,50 T320,20 T360,40 T400,10 L400,100 L0,100 Z" fill="rgba(255,255,255,0.03)" />
              <path d="M0,80 Q20,70 40,80 T80,60 T120,70 T160,40 T200,60 T240,30 T280,50 T320,20 T360,40 T400,10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: Equity Allocation */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Gerçek Hisse Dağılımı</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            {/* Dinamik CSS Donut Chart */}
            {(() => {
              const totalValue = portfoy.allocations.reduce((sum, a) => sum + a.value, 0);
              let gradientString = 'conic-gradient(';
              const colors = ['#fff', '#8e8e93', '#636366', '#333', '#1c1c1e'];
              let currentPercent = 0;
              
              if (totalValue === 0) {
                gradientString = 'conic-gradient(#333 0% 100%)';
              } else {
                portfoy.allocations.forEach((item, idx) => {
                  const percent = (item.value / totalValue) * 100;
                  const color = colors[idx % colors.length];
                  gradientString += `${color} ${currentPercent}% ${currentPercent + percent}%, `;
                  currentPercent += percent;
                });
                gradientString = gradientString.slice(0, -2) + ')'; // Son virgülü sil
              }

              return (
                <div style={{
                  width: '100px', height: '100px',
                  borderRadius: '50%',
                  background: gradientString,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}></div>
                </div>
              );
            })()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            {portfoy.allocations.length > 0 ? (
              portfoy.allocations.slice(0, 4).map((item, idx) => {
                const colors = ['#fff', '#8e8e93', '#636366', '#333', '#1c1c1e'];
                const totalVal = portfoy.allocations.reduce((sum, a) => sum + a.value, 0);
                const pct = ((item.value / totalVal) * 100).toFixed(1);
                return (
                  <div key={idx} className="flex items-center gap-1">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[idx % colors.length] }}></span> %{pct} {item.symbol}
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center">Portföy boş</div>
            )}
          </div>
        </div>

        {/* Card 3: Account Performance */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Account Performance</div>
          <div style={{ height: '80px', margin: '1rem 0' }}>
            <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
              <path d="M0,45 L10,35 L20,40 L30,25 L40,30 L50,15 L60,20 L70,10 L80,15 L90,5 L100,0" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex justify-between items-end" style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>6 Aylık Getiri:</span>
            <span className="text-up" style={{ fontWeight: 600 }}>+12.4%</span>
          </div>
        </div>
      </section>

      {/* Market Watch */}
      <section style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Canlı Piyasa Fiyatları (Market Watch)</h3>
        
        {isLoadingMarket ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
             <div className="glass-panel animate-pulse" style={{ height: '80px' }}></div>
             <div className="glass-panel animate-pulse" style={{ height: '80px' }}></div>
             <div className="glass-panel animate-pulse" style={{ height: '80px' }}></div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {marketData.map((stock, idx) => {
              const changeFloat = parseFloat(stock.change);
              const isPositive = changeFloat >= 0;
              return (
                <div key={idx} className="glass-panel hover-card" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>
                      {stock.symbol.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{stock.symbol}:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>₺{stock.price}</span>
                    <span className={isPositive ? 'text-up' : 'text-down'} style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      ({isPositive ? '+' : ''}{stock.change}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* News Split-View Section */}
      <section style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Haberler & Analizler</h3>
        
        <div style={{ display: 'flex', flex: 1, gap: '2rem', minHeight: 0 }}>
          
          {/* Left Column: Master List */}
          <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: '0.5rem' }}>
            {isLoadingNews ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem auto' }} />
                Gerçek zamanlı haberler taranıyor...
              </div>
            ) : newsList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Şu an için yeni haber bulunamadı.
              </div>
            ) : (
              newsList.map(news => (
                <div 
                  key={news.id} 
                  onClick={() => { setSelectedNews(news); setAnalysis(""); }}
                  style={{ 
                    padding: '1.25rem', 
                    background: selectedNews?.id === news.id ? 'var(--bg-tertiary)' : 'transparent',
                    border: selectedNews?.id === news.id ? '1px solid var(--border-color)' : '1px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="flex justify-between" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: selectedNews?.id === news.id ? '#fff' : 'var(--text-secondary)', opacity: 0.8 }}>
                      {news.source}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{news.time}</span>
                  </div>
                  <h4 style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 500, 
                    lineHeight: 1.5, 
                    color: selectedNews?.id === news.id ? '#fff' : '#ccc',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {news.title}
                  </h4>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Detail View */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {selectedNews ? (
              <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                
                <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
                  <span style={{ background: 'var(--bg-secondary)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600, border: `1px solid var(--border-color)` }}>
                    {selectedNews.symbol}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedNews.source}</span>
                  <span style={{ color: 'var(--text-muted)' }}>• {selectedNews.time}</span>
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '2rem', color: '#fff' }}>
                  {selectedNews.title}
                </h1>

                <p style={{ fontSize: '1.15rem', lineHeight: 1.8, color: '#bbb', marginBottom: '3rem' }}>
                  {selectedNews.snippet}
                </p>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                   <a href={selectedNews.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      Orijinal Haberi Görüntüle <ExternalLink size={14} />
                   </a>
                </div>

                {/* Stock-Centric Hub (Diğer Kaynaklar & AI) */}
                <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '2rem' }}>
                    {selectedNews.symbol} Hakkında Genel Görünüm
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    
                    {/* KAP Column */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 159, 10, 0.03)', borderColor: 'rgba(255, 159, 10, 0.15)' }}>
                      <h4 style={{ color: '#ff9f0a', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid rgba(255, 159, 10, 0.2)', paddingBottom: '0.5rem' }}>KAP Bildirimleri</h4>
                      {isLoadingGrouped ? <RefreshCw className="animate-spin" size={16} color="var(--text-muted)" /> : (
                        groupedSources?.KAP?.length > 0 ? groupedSources.KAP.slice(0,3).map((item, i) => (
                          <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '1.2rem', textDecoration: 'none' }}>
                            <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4, marginBottom: '0.3rem' }}>{item.title}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</span>
                          </a>
                        )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Son KAP bildirimi bulunamadı.</span>
                      )}
                    </div>

                    {/* Bloomberg Column */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(10, 132, 255, 0.03)', borderColor: 'rgba(10, 132, 255, 0.15)' }}>
                      <h4 style={{ color: '#0a84ff', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid rgba(10, 132, 255, 0.2)', paddingBottom: '0.5rem' }}>Bloomberg HT</h4>
                      {isLoadingGrouped ? <RefreshCw className="animate-spin" size={16} color="var(--text-muted)" /> : (
                        groupedSources?.Bloomberg?.length > 0 ? groupedSources.Bloomberg.slice(0,3).map((item, i) => (
                          <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '1.2rem', textDecoration: 'none' }}>
                            <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4, marginBottom: '0.3rem' }}>{item.title}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</span>
                          </a>
                        )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bloomberg haberi yok.</span>
                      )}
                    </div>

                    {/* Investing Column */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(142, 142, 147, 0.03)', borderColor: 'rgba(142, 142, 147, 0.15)' }}>
                      <h4 style={{ color: '#bbb', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid rgba(142, 142, 147, 0.2)', paddingBottom: '0.5rem' }}>Investing</h4>
                      {isLoadingGrouped ? <RefreshCw className="animate-spin" size={16} color="var(--text-muted)" /> : (
                        groupedSources?.Investing?.length > 0 ? groupedSources.Investing.slice(0,3).map((item, i) => (
                          <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '1.2rem', textDecoration: 'none' }}>
                            <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4, marginBottom: '0.3rem' }}>{item.title}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</span>
                          </a>
                        )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Investing haberi yok.</span>
                      )}
                    </div>

                    {/* AI Analysis Column (4th Square) */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(94, 92, 230, 0.05)', borderColor: 'rgba(94, 92, 230, 0.2)', display: 'flex', flexDirection: 'column' }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(94, 92, 230, 0.2)', paddingBottom: '0.5rem' }}>
                        <Sparkles size={18} color="var(--accent-secondary)" />
                        <h4 style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Yapay Zeka Öngörüsü</h4>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {!analysis && !isAnalyzing && (
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Bu hisse için haberlerin piyasa etkisini hesaplayın.</p>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }}
                              onClick={handleAnalyze}
                            >
                              <Sparkles size={16} /> Analiz Et
                            </button>
                          </div>
                        )}

                        {isAnalyzing && (
                          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Sparkles className="animate-glow" size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                            <span style={{ fontSize: '0.85rem' }}>Gelecek vizyonu hesaplanıyor...</span>
                          </div>
                        )}

                        {analysis && (
                          <div className="animate-fade-in" style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#fff', whiteSpace: 'pre-line' }}>
                              {analysis}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {isLoadingNews ? 'Haberler Yükleniyor...' : 'Bir haber seçin'}
              </div>
            )}
          </div>

        </div>
      </section>

      <PortfolioModal 
        isOpen={isPortfolioModalOpen} 
        onClose={() => setIsPortfolioModalOpen(false)} 
        portfolio={myPortfolio}
        onSave={savePortfolio}
        marketData={marketData}
      />

    </div>
  );
}
