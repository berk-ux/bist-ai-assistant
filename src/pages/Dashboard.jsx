import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ExternalLink, RefreshCw, Edit3, Rocket, AlertCircle } from 'lucide-react';
import PortfolioModal from '../components/PortfolioModal';
import IpoView from '../components/IpoModal';
import FundsView from '../components/FundsView';
import StockDetailModal from '../components/StockDetailModal';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard({ activeTab }) {
  const [newsList, setNewsList] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Portföy AI Koçluk State'leri
  const [portfolioAnalysis, setPortfolioAnalysis] = useState("");
  const [isAnalyzingPortfolio, setIsAnalyzingPortfolio] = useState(false);

  // BİST AI Hisse Önerileri State'leri
  const [stockRecommendations, setStockRecommendations] = useState([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);

  // Yeni Özellik: Arama Filtresi
  const [searchQuery, setSearchQuery] = useState("");

  // Yeni Özellik: Seçilen hisseye özel diğer kaynakları gruplama
  const [groupedSources, setGroupedSources] = useState(null);
  const [isLoadingGrouped, setIsLoadingGrouped] = useState(false);

  // Yeni Özellik: Canlı Piyasa Fiyatları
  const [marketData, setMarketData] = useState([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  // Yeni Özellik: Gerçek Portföy Yönetimi
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  // Yeni Özellik: Hisse Detay & Grafik Modali
  const [selectedStockForDetail, setSelectedStockForDetail] = useState(null);
  const [isStockDetailOpen, setIsStockDetailOpen] = useState(false);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

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
    setIsAnalyzing(true);
    setAnalysis("");
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      // Ziyaretçi değil de üye ise token ekle
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: selectedNews.title,
          snippet: selectedNews.snippet,
          symbol: selectedNews.symbol
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setAnalysis("Hata: " + data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      setAnalysis("Analiz yapılırken bir hata oluştu. İnternet bağlantınızı kontrol edin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Portföy Özel Yapay Zeka Koçu Analizi
  const handleAnalyzePortfolio = async () => {
    if (myPortfolio.length === 0) {
      setPortfolioAnalysis("Lütfen önce portföyünüze hisse ekleyin.");
      return;
    }
    
    setIsAnalyzingPortfolio(true);
    setPortfolioAnalysis("");
    try {
      const portfolioStr = myPortfolio.map(p => `${p.symbol}: ${p.quantity} lot (Maliyet: ${p.buyPrice} ₺)`).join('\n');
      const response = await fetch('/api/ai/portfolio-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioStr })
      });
      const data = await response.json();
      if (data.error) setPortfolioAnalysis("Hata: " + data.error);
      else setPortfolioAnalysis(data.analysis);
    } catch(err) {
      setPortfolioAnalysis("Analiz sırasında bağlantı hatası oluştu.");
    } finally {
      setIsAnalyzingPortfolio(false);
    }
  };

  // Yapay Zeka Hisse Önerileri Alma
  const fetchStockRecommendations = async () => {
    setIsFetchingRecommendations(true);
    setRecommendationError(null);
    try {
      const response = await fetch('/api/ai/stock-recommendations');
      const data = await response.json();
      if (data.error) {
        setRecommendationError(data.error);
      } else {
        setStockRecommendations(data);
      }
    } catch (err) {
      setRecommendationError("Öneriler alınırken hata oluştu.");
    } finally {
      setIsFetchingRecommendations(false);
    }
  };

  const handleStockClick = (symbol, currentPrice = '0.00', change = '0') => {
    setSelectedStockForDetail({ symbol, price: currentPrice, change });
    setIsStockDetailOpen(true);
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
      
      {/* Top Section - Assets */}
      {activeTab === 'assets' && (
      <section className="grid-dashboard-top animate-fade-in">
        {/* Card 1: Total Portfolio Value */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', minHeight: '220px' }}>
          <div style={{ zIndex: 2, position: 'relative' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gerçek Canlı Portföy</div>
              <button 
                onClick={() => {
                  if (!token) {
                    alert('Portföyünüzü ve fonlarınızı yönetmek için ücretsiz bir hesap oluşturmalı veya giriş yapmalısınız.');
                    navigate('/auth');
                    return;
                  }
                  setIsPortfolioModalOpen(true);
                }} 
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
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
        
        {/* Detaylı Portföy Tablosu ve AI Analizi */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          
          {/* Sol: Holding Tablosu */}
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 600 }}>Açık Pozisyonlar</h3>
            {myPortfolio.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>Hisse</th>
                    <th style={{ padding: '0.5rem' }}>Alış Tarihi</th>
                    <th style={{ padding: '0.5rem' }}>Miktar</th>
                    <th style={{ padding: '0.5rem' }}>Ort. Maliyet</th>
                    <th style={{ padding: '0.5rem' }}>Canlı Fiyat</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Kâr/Zarar</th>
                  </tr>
                </thead>
                <tbody>
                  {myPortfolio.map((item, idx) => {
                    const marketItem = marketData.find(m => m.symbol === item.symbol);
                    const currentPrice = marketItem ? parseFloat(marketItem.price) : item.buyPrice;
                    const plVal = (currentPrice - item.buyPrice) * item.quantity;
                    const plPct = ((currentPrice - item.buyPrice) / item.buyPrice) * 100;
                    const isUp = plVal >= 0;
                    
                    const displayQuantity = Number.isInteger(item.quantity) 
                      ? item.quantity 
                      : parseFloat(item.quantity).toLocaleString('tr-TR', { maximumFractionDigits: 4 });
                    
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td 
                          style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
                          onClick={() => {
                            const marketItem = marketData.find(m => m.symbol === item.symbol);
                            handleStockClick(item.symbol, marketItem ? marketItem.price : item.buyPrice.toFixed(2), marketItem ? marketItem.change : '0');
                          }}
                        >
                          {item.symbol}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{item.buyDate || '-'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{displayQuantity} Lot</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>₺{item.buyPrice.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>₺{currentPrice.toFixed(2)}</td>
                        <td className={isUp ? 'text-up' : 'text-down'} style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                          {isUp ? '+' : ''}₺{plVal.toFixed(2)} ({isUp ? '+' : ''}{plPct.toFixed(2)}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                Portföyünüzde hiç hisse bulunmuyor.
              </div>
            )}
          </div>

          {/* Sağ: AI Portföy Koçu */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} className="text-up" /> Portföy Koçu (AI)
            </h3>
            
            <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', overflowY: 'auto', minHeight: '120px' }}>
              {isAnalyzingPortfolio ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="animate-spin text-up" size={16} /> Yapay zeka portföyünüzü inceliyor...
                </div>
              ) : portfolioAnalysis ? (
                <div className="animate-fade-in" dangerouslySetInnerHTML={{ __html: portfolioAnalysis.replace(/\n/g, '<br/>') }} />
              ) : (
                "BİST AI portföyünüzün sektörel dağılımını, maliyet riskini ve büyüme potansiyelini analiz edip size profesyonel tavsiyeler sunar."
              )}
            </div>

            <button 
              onClick={handleAnalyzePortfolio} 
              disabled={isAnalyzingPortfolio}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
            >
              Yapay Zekaya Danış
            </button>
          </div>

        </div>

        {/* BİST AI Hisse Önerileri */}
        <div style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} className="text-up" /> BİST AI "Günün Fırsatları" (Hisse Önerileri)
            </h3>
            <button 
              onClick={fetchStockRecommendations} 
              disabled={isFetchingRecommendations}
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={isFetchingRecommendations ? "animate-spin" : ""} /> 
              {stockRecommendations.length > 0 ? "Önerileri Yenile" : "Yapay Zeka Önerisi Al"}
            </button>
          </div>

          {isFetchingRecommendations && stockRecommendations.length === 0 ? (
            <div className="glass-panel flex flex-col items-center justify-center gap-4" style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-spin text-up" size={32} />
              <p>BİST AI güncel piyasa dinamiklerini ve haberleri tarayarak size özel hisseler seçiyor...</p>
            </div>
          ) : recommendationError ? (
            <div className="glass-panel flex items-center justify-center gap-2 text-down" style={{ padding: '2rem' }}>
              <AlertCircle size={20} /> {recommendationError}
            </div>
          ) : stockRecommendations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {stockRecommendations.map((rec, i) => (
                <div key={i} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                  {/* Dekoratif Arka Plan Işığı */}
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: 'rgba(34, 197, 94, 0.1)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{rec.symbol}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rec.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-up" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{rec.potential}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hedef: {rec.targetPrice}</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Neden?</strong> {rec.reason}
                  </div>
                  
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <Rocket size={16} /> Alış Gir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center gap-3" style={{ padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Sparkles size={32} style={{ opacity: 0.5 }} />
              <p>Piyasa fırsatlarını görmek için "Yapay Zeka Önerisi Al" butonuna tıklayın.</p>
            </div>
          )}
        </div>

      </section>
      )}

      {/* Market Watch */}
      {activeTab === 'market' && (
      <section className="animate-fade-in" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Takip Edilen Hisseler</h3>
        </div>
        
        {isLoadingMarket ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
             <div className="glass-panel animate-pulse" style={{ height: '80px' }}></div>
             <div className="glass-panel animate-pulse" style={{ height: '80px' }}></div>
             <div className="glass-panel animate-pulse" style={{ height: '80px' }}></div>
          </div>
        ) : (
          <>
            {/* Öncelikli Hisseler (Her zaman üstte sabit) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {marketData
                .filter(stock => ['ENPRA', 'ISCTR', 'MIATK', 'THYAO', 'TUPRS', 'SISE', 'ASELS', 'PPZ'].includes(stock.symbol))
                .map((stock, idx) => {
                  const changeFloat = parseFloat(stock.change);
                  const isPositive = changeFloat >= 0;
                  return (
                    <div 
                      key={`top-${idx}`} 
                      className="glass-panel hover-card" 
                      style={{ padding: '1.25rem', cursor: 'pointer' }}
                      onClick={() => handleStockClick(stock.symbol, stock.price, stock.change)}
                    >
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

            {/* Diğer BİST 100 Hisseleri */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Diğer BİST 100 Hisseleri</h3>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Hisse Ara..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-panel"
                  style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '200px', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="scrollable-market-watch">
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1rem' 
              }}>
                {marketData
                  .filter(stock => !['ENPRA', 'ISCTR', 'MIATK', 'THYAO', 'TUPRS', 'SISE', 'ASELS', 'PPZ'].includes(stock.symbol))
                  .filter(stock => stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((stock, idx) => {
                    const changeFloat = parseFloat(stock.change);
                    const isPositive = changeFloat >= 0;
                    return (
                      <div 
                        key={`other-${idx}`} 
                        className="glass-panel hover-card" 
                        style={{ padding: '1.25rem', cursor: 'pointer' }}
                        onClick={() => handleStockClick(stock.symbol, stock.price, stock.change)}
                      >
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
            </div>
          </>
        )}
      </section>
      )}

      {/* News Split-View Section */}
      {activeTab === 'news' && (
      <section className="animate-fade-in" style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Haberler & Analizler</h3>
        
        <div className="split-view-container">
          
          {/* Left Column: Master List */}
          <div className="split-view-list">
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
          <div className="glass-panel split-view-detail">
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
                  
                  <div className="grid-hub">
                    
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
      )}

      {/* IPOs Section */}
      {activeTab === 'ipos' && (
        <section className="animate-fade-in">
          <IpoView />
        </section>
      )}

      {/* Funds Section */}
      {activeTab === 'funds' && (
        <section className="animate-fade-in">
          <FundsView />
        </section>
      )}

      {/* Modals */}
      <PortfolioModal 
        isOpen={isPortfolioModalOpen} 
        onClose={() => setIsPortfolioModalOpen(false)} 
        onSave={savePortfolio}
        initialData={myPortfolio}
        marketData={marketData}
      />

      {selectedStockForDetail && (
        <StockDetailModal
          isOpen={isStockDetailOpen}
          onClose={() => {
            setIsStockDetailOpen(false);
            setSelectedStockForDetail(null);
          }}
          symbol={selectedStockForDetail.symbol}
          currentPrice={selectedStockForDetail.price}
          change={selectedStockForDetail.change}
        />
      )}

    </div>
  );
}
