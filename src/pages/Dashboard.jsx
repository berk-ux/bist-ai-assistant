import { useState, useEffect, useContext, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ExternalLink, RefreshCw, Edit3, Rocket, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PortfolioModal from '../components/PortfolioModal';
import IpoView from '../components/IpoModal';
import FundsView from '../components/FundsView';
import StockDetailModal from '../components/StockDetailModal';
import { AuthContext } from '../context/AuthContext';

const COMPANY_NAMES = {
  'ENPRA': 'Enpara Bank',
  'ISCTR': 'İş Bankası C',
  'MIATK': 'Mia Teknoloji',
  'THYAO': 'Türk Hava Yolları',
  'TUPRS': 'Tüpraş',
  'SISE': 'Şişecam',
  'ASELS': 'Aselsan',
  'PPZ': 'Azimut Para Piyasası Fonu',
  'AKBNK': 'Akbank T.A.Ş.',
  'ARCLK': 'Arçelik A.Ş.',
  'BIMAS': 'BİM Birleşik Mağazalar',
  'EKGYO': 'Emlak Konut GYO',
  'EREGL': 'Ereğli Demir Çelik',
  'FROTO': 'Ford Otosan',
  'GARAN': 'Garanti BBVA',
  'GUBRF': 'Gübre Fabrikaları',
  'HALKB': 'Halkbank',
  'KCHOL': 'Koç Holding',
  'KOZAL': 'Koza Altın İşletmeleri',
  'KARDM': 'Kardemir D',
  'PETKM': 'Petkim',
  'PGSUS': 'Pegasus Hava Taşımacılığı',
  'SAHOL': 'Sabancı Holding',
  'SASA': 'Sasa Polyester',
  'TCELL': 'Turkcell',
  'TOASO': 'Tofaş Oto. Fab.',
  'TTKOM': 'Türk Telekom',
  'VAKBN': 'Vakıfbank',
  'YKBNK': 'Yapı Kredi Bankası',
  'AEFES': 'Anadolu Efes',
  'AGHOL': 'Anadolu Grubu Holding',
  'AHGAZ': 'Ahlatcı Doğalgaz',
  'AKCNS': 'Akçansa Çimento',
  'AKFGY': 'Akfen GYO',
  'AKSA': 'Aksa Akrilik',
  'AKSEN': 'Aksa Enerji',
  'ALARK': 'Alarko Holding',
  'ALBRK': 'Albaraka Türk',
  'ALFAS': 'Alfa Solar Enerji',
  'ASTOR': 'Astor Enerji',
  'ASUZU': 'Anadolu Isuzu',
  'AYDEM': 'Aydem Enerji'
};

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

  // Yeni Özellik: Akordeon Genişleme State'i
  const [expandedStocks, setExpandedStocks] = useState({});

  // Yeni Özellik: Yatırım Fonu Bilgileri (Açık Pozisyon Kar Oranı İçin)
  const [myFunds, setMyFunds] = useState({ amount: 0, code: 'TP2' });
  const [fundDetails, setFundDetails] = useState(null);
  const [isLoadingFund, setIsLoadingFund] = useState(false);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab !== 'assets') return;

    // localStorage'dan güncel fon miktarını ve kodunu oku
    let localFunds = { amount: 0, code: 'TP2' };
    try {
      const stored = localStorage.getItem('myFunds');
      if (stored) {
        localFunds = JSON.parse(stored);
      }
    } catch (e) {
      console.error("localStorage myFunds okuma hatası:", e);
    }
    setMyFunds(localFunds);

    setIsLoadingFund(true);
    fetch(`/api/funds/${localFunds.code.toUpperCase()}`)
      .then(res => {
        if (!res.ok) throw new Error("Fon verisi alınamadı");
        return res.json();
      })
      .then(data => {
        setFundDetails(data);
        setIsLoadingFund(false);
      })
      .catch(err => {
        console.error("Fon detayı çekme hatası:", err);
        setIsLoadingFund(false);
      });
  }, [activeTab]);

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
    const groupedAllocations = {};

    myPortfolio.forEach(item => {
      const marketItem = marketData.find(m => m.symbol === item.symbol);
      const currentPrice = marketItem ? parseFloat(marketItem.price) : item.buyPrice; // Bulunamazsa alış fiyatı sabit kalır
      
      const itemCost = item.buyPrice * item.quantity;
      const itemCurrentValue = currentPrice * item.quantity;
      
      totalCost += itemCost;
      totalCurrentValue += itemCurrentValue;
      
      if (!groupedAllocations[item.symbol]) {
        groupedAllocations[item.symbol] = 0;
      }
      groupedAllocations[item.symbol] += itemCurrentValue;
    });

    const allocations = Object.keys(groupedAllocations).map(symbol => ({
      symbol,
      value: groupedAllocations[symbol]
    }));

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

  const getGroupedPortfolio = () => {
    const groups = {};
    myPortfolio.forEach(item => {
      if (!groups[item.symbol]) {
        groups[item.symbol] = {
          symbol: item.symbol,
          transactions: [],
          totalQuantity: 0,
          totalCost: 0
        };
      }
      groups[item.symbol].transactions.push(item);
      groups[item.symbol].totalQuantity += item.quantity;
      groups[item.symbol].totalCost += (item.buyPrice * item.quantity);
    });

    return Object.values(groups).map(group => {
      const avgPrice = group.totalQuantity > 0 ? group.totalCost / group.totalQuantity : 0;
      const sortedTransactions = [...group.transactions].sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate));
      return {
        symbol: group.symbol,
        totalQuantity: group.totalQuantity,
        avgPrice: avgPrice,
        transactions: sortedTransactions
      };
    });
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

        {/* Card 3: Yatırım Fonu Performansı */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px',
            background: 'rgba(94, 92, 230, 0.15)',
            filter: 'blur(30px)',
            borderRadius: '50%'
          }}></div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#5e5ce6' }}></span>
                Fon Getirisi ({myFunds.code})
              </div>
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(94, 92, 230, 0.2)', color: '#9a98f0', fontWeight: 600 }}>
                TEFAS
              </span>
            </div>

            {myFunds.amount > 0 ? (
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                  ₺{myFunds.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Toplam Yatırımım
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#5e5ce6', letterSpacing: '-0.5px', textShadow: '0 0 10px rgba(94, 92, 230, 0.3)' }}>
                  %{fundDetails?.return_1y ? fundDetails.return_1y.toFixed(2) : '55.00'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Yıllık Getiri
                </div>
              </div>
            )}
          </div>

          <div style={{ height: '55px', margin: '0.5rem 0', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="fund-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5e5ce6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5e5ce6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,35 Q20,33 40,28 T80,15 T100,2" fill="none" stroke="#5e5ce6" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 4px rgba(94, 92, 230, 0.6))' }} />
              <path d="M0,35 Q20,33 40,28 T80,15 T100,2 L100,40 L0,40 Z" fill="url(#fund-grad)" />
              <circle cx="100" cy="2" r="3.5" fill="#5e5ce6" style={{ filter: 'drop-shadow(0 0 3px rgba(94, 92, 230, 0.8))' }} />
            </svg>
          </div>

          <div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Günlük Getiri:</span>
              <span className="text-up" style={{ fontWeight: 600, color: '#30d158', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                ▲ %{fundDetails?.daily_return ? fundDetails.daily_return.toFixed(2) : '0.13'}
              </span>
            </div>
            
            {myFunds.amount > 0 && (
              <div className="flex justify-between items-center" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Günlük Net Kazanç:</span>
                <span style={{ color: '#30d158', fontWeight: 600 }}>
                  +₺{((myFunds.amount * (fundDetails?.daily_return || 0.13)) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
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
                  {getGroupedPortfolio().map((group) => {
                    const marketItem = marketData.find(m => m.symbol === group.symbol);
                    const currentPrice = marketItem ? parseFloat(marketItem.price) : group.avgPrice;
                    const plVal = (currentPrice - group.avgPrice) * group.totalQuantity;
                    const plPct = group.avgPrice > 0 ? ((currentPrice - group.avgPrice) / group.avgPrice) * 100 : 0;
                    const isUp = plVal >= 0;
                    const canExpand = group.transactions.length > 1;
                    const isExpanded = expandedStocks[group.symbol];

                    const toggleExpand = () => {
                      if (!canExpand) return;
                      setExpandedStocks(prev => ({
                        ...prev,
                        [group.symbol]: !prev[group.symbol]
                      }));
                    };

                    return (
                      <Fragment key={group.symbol}>
                        <tr 
                          onClick={toggleExpand}
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            cursor: canExpand ? 'pointer' : 'default',
                            background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <td 
                            style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const marketItem = marketData.find(m => m.symbol === group.symbol);
                              handleStockClick(group.symbol, marketItem ? marketItem.price : group.avgPrice.toFixed(2), marketItem ? marketItem.change : '0');
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              {group.symbol}
                              {canExpand && (
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  background: 'rgba(255,255,255,0.06)', 
                                  color: 'var(--text-secondary)',
                                  padding: '1px 5px', 
                                  borderRadius: '10px' 
                                }}>
                                  {group.transactions.length}
                                </span>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                            {canExpand ? `Çoklu Alım` : (group.transactions[0]?.buyDate || '-')}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                            {group.totalQuantity.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} Lot
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                            ₺{group.avgPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>
                            ₺{currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={isUp ? 'text-up' : 'text-down'} style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: '100%', justifyContent: 'flex-end' }}>
                              {isUp ? '+' : ''}₺{plVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isUp ? '+' : ''}{plPct.toFixed(2)}%)
                              {canExpand && (
                                <span style={{ 
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  marginLeft: '0.2rem',
                                  display: 'inline-block'
                                }}>
                                  ▼
                                </span>
                              )}
                            </span>
                          </td>
                        </tr>
                        {canExpand && isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: '0.5rem 1rem 1rem 1rem', background: 'rgba(0, 0, 0, 0.15)' }}>
                              <div className="glass-panel" style={{ 
                                padding: '1rem', 
                                background: 'rgba(255,255,255,0.01)', 
                                border: '1px solid rgba(255,255,255,0.03)',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>İşlem Geçmişi</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {group.transactions.map((t, tIdx) => {
                                    const tPlVal = (currentPrice - t.buyPrice) * t.quantity;
                                    const tPlPct = t.buyPrice > 0 ? ((currentPrice - t.buyPrice) / t.buyPrice) * 100 : 0;
                                    const tIsUp = tPlVal >= 0;
                                    return (
                                      <div key={t.id || tIdx} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        fontSize: '0.8rem',
                                        padding: '0.25rem 0',
                                        borderBottom: tIdx < group.transactions.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none'
                                      }}>
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                          <span style={{ fontWeight: 500, marginRight: '1rem', color: 'var(--text-muted)' }}>{t.buyDate}</span>
                                          <span>{t.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} Lot @ ₺{t.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className={tIsUp ? 'text-up' : 'text-down'} style={{ fontWeight: 600 }}>
                                          {tIsUp ? '+' : ''}₺{tPlVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({tIsUp ? '+' : ''}{tPlPct.toFixed(2)}%)
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.3px' }}>Takip Edilen Hisseler</h3>
        </div>
        
        {isLoadingMarket ? (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="animate-pulse" style={{ height: '45px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}></div>
              <div className="animate-pulse" style={{ height: '45px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}></div>
              <div className="animate-pulse" style={{ height: '45px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}></div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', marginBottom: '2.5rem' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Hisse</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Son Fiyat</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Günlük Değişim</th>
                  <th style={{ padding: '0.75rem 1rem', width: '120px' }}>Son Trend</th>
                </tr>
              </thead>
              <tbody>
                {marketData
                  .filter(stock => ['ENPRA', 'ISCTR', 'MIATK', 'THYAO', 'TUPRS', 'SISE', 'ASELS', 'PPZ'].includes(stock.symbol))
                  .map((stock) => {
                    const changeFloat = parseFloat(stock.change);
                    const isPositive = changeFloat >= 0;
                    const cName = COMPANY_NAMES[stock.symbol.toUpperCase()] || `${stock.symbol.toUpperCase()} A.Ş.`;
                    return (
                      <tr 
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock.symbol, stock.price, stock.change)}
                        className="market-list-row"
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{stock.symbol}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                          ₺{stock.price}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`stock-change-badge ${isPositive ? 'up' : changeFloat < 0 ? 'down' : 'neutral'}`} style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {isPositive ? '▲' : changeFloat < 0 ? '▼' : '•'} {isPositive ? '+' : ''}{stock.change}%
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 1rem', width: '120px', height: '40px' }}>
                          <div style={{ width: '100px', height: '24px', display: 'flex', alignItems: 'center' }}>
                            <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                              <defs>
                                <filter id="glow-up" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                                <linearGradient id={`line-grad-up-${stock.symbol}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#00f2fe" />
                                  <stop offset="100%" stopColor="#4facfe" />
                                </linearGradient>
                                <linearGradient id={`area-grad-up-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.22" />
                                  <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id={`line-grad-down-${stock.symbol}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ff0844" />
                                  <stop offset="100%" stopColor="#ffb199" />
                                </linearGradient>
                                <linearGradient id={`area-grad-down-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ff0844" stopOpacity="0.22" />
                                  <stop offset="100%" stopColor="#ff0844" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {isPositive ? (
                                <>
                                  <path d="M0,22 C20,18 40,24 60,10 C80,3 90,8 100,5 L100,30 L0,30 Z" fill={`url(#area-grad-up-${stock.symbol})`} />
                                  <path d="M0,22 C20,18 40,24 60,10 C80,3 90,8 100,5" fill="none" stroke="#00f2fe" strokeWidth="3" opacity="0.25" filter="url(#glow-up)" strokeLinecap="round" />
                                  <path d="M0,22 C20,18 40,24 60,10 C80,3 90,8 100,5" fill="none" stroke={`url(#line-grad-up-${stock.symbol})`} strokeWidth="2" strokeLinecap="round" />
                                  <circle cx="100" cy="5" r="2.5" fill="#ffffff" filter="url(#glow-up)" />
                                  <circle cx="100" cy="5" r="1" fill="#00f2fe" />
                                </>
                              ) : changeFloat < 0 ? (
                                <>
                                  <path d="M0,8 C20,14 40,8 60,20 C80,26 90,22 100,25 L100,30 L0,30 Z" fill={`url(#area-grad-down-${stock.symbol})`} />
                                  <path d="M0,8 C20,14 40,8 60,20 C80,26 90,22 100,25" fill="none" stroke="#ff0844" strokeWidth="3" opacity="0.25" filter="url(#glow-up)" strokeLinecap="round" />
                                  <path d="M0,8 C20,14 40,8 60,20 C80,26 90,22 100,25" fill="none" stroke={`url(#line-grad-down-${stock.symbol})`} strokeWidth="2" strokeLinecap="round" />
                                  <circle cx="100" cy="25" r="2.5" fill="#ffffff" filter="url(#glow-up)" />
                                  <circle cx="100" cy="25" r="1" fill="#ff0844" />
                                </>
                              ) : (
                                <path d="M0,15 L100,15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
                              )}
                            </svg>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Diğer BİST 100 Hisseleri */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.3px' }}>Diğer BİST 100 Hisseleri</h3>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Hisse Ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                padding: '0.5rem 1rem 0.5rem 2.2rem', 
                borderRadius: '100px', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                background: 'rgba(255, 255, 255, 0.03)',
                color: '#fff', 
                width: '220px', 
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.05)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#8e8e93', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {isLoadingMarket ? (
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="animate-pulse" style={{ height: '45px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}></div>
              <div className="animate-pulse" style={{ height: '45px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}></div>
              <div className="animate-pulse" style={{ height: '45px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}></div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Hisse</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Son Fiyat</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Günlük Değişim</th>
                  <th style={{ padding: '0.75rem 1rem', width: '120px' }}>Son Trend</th>
                </tr>
              </thead>
              <tbody>
                {marketData
                  .filter(stock => !['ENPRA', 'ISCTR', 'MIATK', 'THYAO', 'TUPRS', 'SISE', 'ASELS', 'PPZ'].includes(stock.symbol))
                  .filter(stock => stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((stock) => {
                    const changeFloat = parseFloat(stock.change);
                    const isPositive = changeFloat >= 0;
                    const cName = COMPANY_NAMES[stock.symbol.toUpperCase()] || `${stock.symbol.toUpperCase()} A.Ş.`;
                    return (
                      <tr 
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock.symbol, stock.price, stock.change)}
                        className="market-list-row"
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{stock.symbol}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                          ₺{stock.price}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`stock-change-badge ${isPositive ? 'up' : changeFloat < 0 ? 'down' : 'neutral'}`} style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {isPositive ? '▲' : changeFloat < 0 ? '▼' : '•'} {isPositive ? '+' : ''}{stock.change}%
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 1rem', width: '120px', height: '40px' }}>
                          <div style={{ width: '100px', height: '24px', display: 'flex', alignItems: 'center' }}>
                            <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                              <defs>
                                <filter id="glow-up-other" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                                <linearGradient id={`line-grad-up-other-${stock.symbol}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#00f2fe" />
                                  <stop offset="100%" stopColor="#4facfe" />
                                </linearGradient>
                                <linearGradient id={`area-grad-up-other-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.22" />
                                  <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id={`line-grad-down-other-${stock.symbol}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ff0844" />
                                  <stop offset="100%" stopColor="#ffb199" />
                                </linearGradient>
                                <linearGradient id={`area-grad-down-other-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ff0844" stopOpacity="0.22" />
                                  <stop offset="100%" stopColor="#ff0844" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {isPositive ? (
                                <>
                                  <path d="M0,22 C20,18 40,24 60,10 C80,3 90,8 100,5 L100,30 L0,30 Z" fill={`url(#area-grad-up-other-${stock.symbol})`} />
                                  <path d="M0,22 C20,18 40,24 60,10 C80,3 90,8 100,5" fill="none" stroke="#00f2fe" strokeWidth="3" opacity="0.25" filter="url(#glow-up-other)" strokeLinecap="round" />
                                  <path d="M0,22 C20,18 40,24 60,10 C80,3 90,8 100,5" fill="none" stroke={`url(#line-grad-up-other-${stock.symbol})`} strokeWidth="2" strokeLinecap="round" />
                                  <circle cx="100" cy="5" r="2.5" fill="#ffffff" filter="url(#glow-up-other)" />
                                  <circle cx="100" cy="5" r="1" fill="#00f2fe" />
                                </>
                              ) : changeFloat < 0 ? (
                                <>
                                  <path d="M0,8 C20,14 40,8 60,20 C80,26 90,22 100,25 L100,30 L0,30 Z" fill={`url(#area-grad-down-other-${stock.symbol})`} />
                                  <path d="M0,8 C20,14 40,8 60,20 C80,26 90,22 100,25" fill="none" stroke="#ff0844" strokeWidth="3" opacity="0.25" filter="url(#glow-up-other)" strokeLinecap="round" />
                                  <path d="M0,8 C20,14 40,8 60,20 C80,26 90,22 100,25" fill="none" stroke={`url(#line-grad-down-other-${stock.symbol})`} strokeWidth="2" strokeLinecap="round" />
                                  <circle cx="100" cy="25" r="2.5" fill="#ffffff" filter="url(#glow-up-other)" />
                                  <circle cx="100" cy="25" r="1" fill="#ff0844" />
                                </>
                              ) : (
                                <path d="M0,15 L100,15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
                              )}
                            </svg>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
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
        portfolio={myPortfolio}
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
