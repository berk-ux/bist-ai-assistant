import { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COMPANY_NAMES = {
  'ENPRA': 'Enpara Bank',
  'ISCTR': 'İş Bankası C',
  'MIATK': 'Mia Teknoloji',
  'THYAO': 'Türk Hava Yolları',
  'TUPRS': 'Tüpraş',
  'SISE': 'Şişecam',
  'ASELS': 'Aselsan',
  'PPZ': 'Azimut Portföy Para Piyasası Fonu',
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
  'YKBNK': 'Yapı Kredi Bankası'
};

export default function StockDetailModal({ isOpen, onClose, symbol, currentPrice, change }) {
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [chartError, setChartError] = useState(null);
  
  const [stockNews, setStockNews] = useState(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  
  const [days, setDays] = useState(1); // Default 1 day (Günlük)
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const [livePrice, setLivePrice] = useState(currentPrice);
  const [liveChange, setLiveChange] = useState(change);
  const [liveDetails, setLiveDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLivePrice(currentPrice);
      setLiveChange(change);
      setLiveDetails(null);
      setIsLoadingDetails(true);
    }
  }, [isOpen, currentPrice, change]);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    const fetchLivePrice = () => {
      fetch(`/api/market/live/${symbol}`)
        .then(res => {
          if (!res.ok) throw new Error('Canlı fiyat alınamadı.');
          return res.json();
        })
        .then(data => {
          if (data.price) setLivePrice(data.price);
          if (data.change) setLiveChange(data.change);
          setLiveDetails(data);
          setIsLoadingDetails(false);
        })
        .catch(err => {
          console.error('Canlı fiyat fetch hatası:', err);
          setIsLoadingDetails(false);
        });
    };

    fetchLivePrice();
    const interval = setInterval(fetchLivePrice, 10000);
    return () => clearInterval(interval);
  }, [isOpen, symbol]);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    // Fetch Chart History
    setIsLoadingChart(true);
    setChartError(null);
    fetch(`/api/market/history/${symbol}?days=${days}`)
      .then(res => {
        if (!res.ok) throw new Error('Grafik verisi alınamadı.');
        return res.json();
      })
      .then(data => {
        setHistoryData(data);
        setIsLoadingChart(false);
      })
      .catch(err => {
        console.error(err);
        setChartError(err.message);
        setIsLoadingChart(false);
      });
  }, [isOpen, symbol, days]);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    // Fetch Stock News
    setIsLoadingNews(true);
    fetch(`/api/news/symbol/${symbol}`)
      .then(res => res.json())
      .then(data => {
        setStockNews(data);
        setIsLoadingNews(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingNews(false);
      });
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  const changeFloat = parseFloat(liveChange);
  const isPositive = changeFloat >= 0;

  // Bugünü ve anlık saati biçimlendir
  const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  const currentTimeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

  // Canlı fiyatla geçmiş/gün içi veriyi birleştir
  const chartData = [...historyData];
  if (chartData.length > 0 && livePrice) {
    const lastIndex = chartData.length - 1;
    const lastItem = chartData[lastIndex];
    if (days === 1) {
      if (lastItem.date === currentTimeStr) {
        chartData[lastIndex] = {
          ...lastItem,
          price: parseFloat(livePrice)
        };
      } else {
        chartData.push({
          date: currentTimeStr,
          price: parseFloat(livePrice)
        });
      }
    } else {
      if (lastItem.date === todayStr) {
        chartData[lastIndex] = {
          ...lastItem,
          price: parseFloat(livePrice)
        };
      } else {
        chartData.push({
          date: todayStr,
          price: parseFloat(livePrice)
        });
      }
    }
  }

  // Chart configuration
  const width = 500;
  const height = 220;
  const padding = { left: 45, right: 15, top: 20, bottom: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Stats calculation
  const prices = chartData.map(d => d.price);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  
  const startPrice = prices.length > 0 ? prices[0] : 0;
  const endPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
  const periodChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
  const isPeriodPositive = periodChange >= 0;

  // SVG Coordinates mapping
  const priceRange = maxPrice - minPrice || 1;
  const yMin = minPrice - priceRange * 0.05;
  const yMax = maxPrice + priceRange * 0.05;

  const points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.price - yMin) / (yMax - yMin)) * chartHeight;
    return { x, y, price: d.price, date: d.date };
  });

  // Smooth Bezier Curve Path Generator
  const getBezierCurve = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const curvePath = getBezierCurve(points);
  const areaPath = points.length > 0 ? `${curvePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z` : '';

  // Tooltip için bir önceki noktaya göre fark/değişim oranlarını hesapla
  let hoverDiff = 0;
  let hoverDiffPct = 0;
  if (hoveredIndex !== null && hoveredIndex > 0 && points[hoveredIndex] && points[hoveredIndex - 1]) {
    hoverDiff = points[hoveredIndex].price - points[hoveredIndex - 1].price;
    hoverDiffPct = (hoverDiff / points[hoveredIndex - 1].price) * 100;
  }

  // Handle Mouse Move on SVG for Tooltip
  const handleMouseMove = (e) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const chartX = svgX - padding.left;
    const percentX = chartX / chartWidth;
    const idx = Math.max(0, Math.min(chartData.length - 1, Math.round(percentX * (chartData.length - 1))));
    setHoveredIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Get active news items count
  const newsCount = stockNews ? 
    (stockNews.KAP?.length || 0) + 
    (stockNews.Bloomberg?.length || 0) + 
    (stockNews.Investing?.length || 0) + 
    (stockNews.Diger?.length || 0) : 0;

  // Format volume & marketCap in Turkish
  const formatTurkishNumber = (val, isCurrency = false) => {
    if (val === undefined || val === null || val === 0 || isNaN(val)) return '-';
    const num = parseFloat(val);
    const currencySign = isCurrency ? '₺' : '';
    
    if (num >= 1e12) {
      return `${currencySign}${(num / 1e12).toFixed(2)} Trilyon`;
    } else if (num >= 1e9) {
      return `${currencySign}${(num / 1e9).toFixed(2)} Milyar`;
    } else if (num >= 1e6) {
      return `${currencySign}${(num / 1e6).toFixed(2)} Milyon`;
    } else if (num >= 1e3) {
      return `${currencySign}${(num / 1e3).toFixed(2)} Bin`;
    }
    return `${currencySign}${num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const companyName = COMPANY_NAMES[symbol.toUpperCase()] || `${symbol.toUpperCase()} A.Ş.`;
  const trendColor = isPositive ? '#30d158' : '#ff453a';
  const trendBg = isPositive ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 69, 58, 0.12)';
  const trendShadow = isPositive ? 'rgba(48, 209, 88, 0.4)' : 'rgba(255, 69, 58, 0.4)';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        width: '960px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
        padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
        position: 'relative',
        background: 'rgba(15, 15, 17, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        color: '#fff'
      }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '1.3rem', fontWeight: 800, color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}>
                {symbol.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                  {symbol}
                </h2>
                <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>{companyName}</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '2.6rem', 
                fontWeight: 800, 
                color: '#fff', 
                letterSpacing: '-1px',
                lineHeight: '1.1',
                textShadow: `0 0 30px ${trendShadow}` 
              }}>
                ₺{livePrice}
              </div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '6px',
                padding: '0.25rem 0.65rem',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: trendBg,
                color: trendColor,
                border: `1px solid rgba(${isPositive ? '48,209,88' : '255,69,58'}, 0.15)`
              }}>
                {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{liveChange}% Bugün
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              style={{ 
                padding: '0.6rem', 
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a1a1aa';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1.1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Chart & Period Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Chart Container */}
            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '20px',
              position: 'relative' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} color="#0a84ff" /> Fiyat Geçmişi
                </span>
                
                {/* Period Tabs (Capsule style) */}
                <div style={{ 
                  display: 'flex', 
                  gap: '2px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '3px', 
                  borderRadius: '100px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {[
                    { label: '1G', val: 1 },
                    { label: '1H', val: 7 },
                    { label: '1A', val: 30 },
                    { label: '3A', val: 90 }
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => setDays(t.val)}
                      style={{
                        padding: '0.35rem 0.9rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '100px',
                        color: days === t.val ? '#000' : '#8e8e93',
                        background: days === t.val ? '#fff' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loader / Error / SVG Chart */}
              <div style={{ height: '220px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoadingChart ? (
                  <div className="flex flex-col items-center gap-2" style={{ color: '#8e8e93' }}>
                    <RefreshCw className="animate-spin" size={24} />
                    <span style={{ fontSize: '0.8rem' }}>Grafik verileri yükleniyor...</span>
                  </div>
                ) : chartError ? (
                  <span style={{ fontSize: '0.85rem', color: '#ff453a' }}>{chartError}</span>
                ) : chartData.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: '#636366' }}>Fiyat geçmişi bulunamadı.</span>
                ) : (
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox={`0 0 ${width} ${height}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ overflow: 'visible', cursor: 'crosshair' }}
                  >
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPeriodPositive ? '#30d158' : '#ff453a'} stopOpacity="0.2"/>
                        <stop offset="100%" stopColor={isPeriodPositive ? '#30d158' : '#ff453a'} stopOpacity="0.0"/>
                      </linearGradient>
                      <filter id="chart-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                      const y = padding.top + p * chartHeight;
                      const priceVal = yMax - p * (yMax - yMin);
                      return (
                        <g key={i}>
                          <line 
                            x1={padding.left} 
                            y1={y} 
                            x2={width - padding.right} 
                            y2={y} 
                            stroke="rgba(255,255,255,0.03)" 
                            strokeWidth="1" 
                          />
                          <text 
                            x={padding.left - 8} 
                            y={y + 3} 
                            fill="#636366" 
                            fontSize="8" 
                            fontWeight="500"
                            textAnchor="end"
                          >
                            ₺{priceVal.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis Dates */}
                    {[0, 0.5, 1].map((p, i) => {
                      const idx = Math.round(p * (chartData.length - 1));
                      if (!chartData[idx]) return null;
                      const x = padding.left + p * chartWidth;
                      return (
                        <text 
                          key={i}
                          x={x} 
                          y={height - 5} 
                          fill="#636366" 
                          fontSize="8" 
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {chartData[idx].date}
                        </text>
                      );
                    })}

                    {/* Chart Area Fill */}
                    <path d={areaPath} fill="url(#chart-fill)" />

                    {/* Chart Line */}
                    <path 
                      d={curvePath} 
                      fill="none" 
                      stroke={isPeriodPositive ? '#30d158' : '#ff453a'} 
                      strokeWidth="2.5"
                      filter="url(#chart-glow)"
                    />

                    {/* Interactive Tooltip Overlay components */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                      <g>
                        {/* Guide line */}
                        <line 
                          x1={points[hoveredIndex].x} 
                          y1={padding.top} 
                          x2={points[hoveredIndex].x} 
                          y2={padding.top + chartHeight} 
                          stroke="rgba(255, 255, 255, 0.15)" 
                          strokeDasharray="3,3" 
                        />
                        {/* Highlight Point */}
                        <circle 
                          cx={points[hoveredIndex].x} 
                          cy={points[hoveredIndex].y} 
                          r="5" 
                          fill={isPeriodPositive ? '#30d158' : '#ff453a'} 
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                        
                        {/* Tooltip Card */}
                        <g>
                          {(() => {
                            const tooltipWidth = 130;
                            const tooltipHeight = 52;
                            const isNearRight = points[hoveredIndex].x + 10 > width - tooltipWidth;
                            const isNearTop = points[hoveredIndex].y - 56 < 5;
                            
                            const rectX = isNearRight ? points[hoveredIndex].x - (tooltipWidth + 10) : points[hoveredIndex].x + 10;
                            const rectY = isNearTop ? points[hoveredIndex].y + 10 : points[hoveredIndex].y - 56;
                            
                            const textX = rectX + 10;
                            const dateY = rectY + 14;
                            const priceY = rectY + 30;
                            const diffY = rectY + 43;

                            return (
                              <>
                                <rect 
                                  x={rectX}
                                  y={rectY} 
                                  width={tooltipWidth} 
                                  height={tooltipHeight} 
                                  rx="8" 
                                  fill="rgba(15,15,17,0.95)" 
                                  stroke="rgba(255,255,255,0.15)" 
                                  style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))' }}
                                />
                                <text 
                                  x={textX} 
                                  y={dateY}
                                  fill="#8e8e93"
                                  fontSize="8"
                                  fontWeight="500"
                                >
                                  {points[hoveredIndex].date} {days === 1 ? 'saat' : ''}
                                </text>
                                <text 
                                  x={textX} 
                                  y={priceY}
                                  fill="#fff"
                                  fontSize="11"
                                  fontWeight="bold"
                                >
                                  ₺{points[hoveredIndex].price.toFixed(2)}
                                </text>
                                {hoveredIndex === 0 ? (
                                  <text x={textX} y={diffY} fill="#636366" fontSize="8" fontWeight="500">
                                    • Başlangıç
                                  </text>
                                ) : (
                                  <text 
                                    x={textX} 
                                    y={diffY} 
                                    fill={hoverDiff > 0 ? "#30d158" : hoverDiff < 0 ? "#ff453a" : "#8e8e93"} 
                                    fontSize="8" 
                                    fontWeight="bold"
                                  >
                                    {hoverDiff > 0 ? "▲" : hoverDiff < 0 ? "▼" : "•"} {hoverDiff > 0 ? "+" : ""}{hoverDiff.toFixed(2)} ₺ ({hoverDiff > 0 ? "+" : ""}{hoverDiffPct.toFixed(2)}%)
                                  </text>
                                )}
                              </>
                            );
                          })()}
                        </g>
                      </g>
                    )}
                  </svg>
                )}
              </div>
            </div>

            {/* Period Statistics Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'En Yüksek', val: isLoadingChart ? '...' : `₺${maxPrice.toFixed(2)}`, trend: false },
                { label: 'En Düşük', val: isLoadingChart ? '...' : `₺${minPrice.toFixed(2)}`, trend: false },
                { label: 'Ortalama', val: isLoadingChart ? '...' : `₺${avgPrice.toFixed(2)}`, trend: false },
                { 
                  label: 'Periyot Getiri', 
                  val: isLoadingChart ? '...' : `${isPeriodPositive ? '+' : ''}${periodChange.toFixed(2)}%`, 
                  trend: true, 
                  positive: isPeriodPositive 
                }
              ].map((stat, i) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '16px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.2rem' 
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#8e8e93', fontWeight: 500 }}>{stat.label}</span>
                  <span style={{ 
                    fontSize: '1.05rem', 
                    fontWeight: 700, 
                    color: stat.trend ? (stat.positive ? '#30d158' : '#ff453a') : '#fff' 
                  }}>
                    {stat.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Historical / Latest News Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8e8e93', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
              <Newspaper size={14} color="#5e5ce6" /> Haberler & KAP
            </h3>

            <div style={{
              maxHeight: '335px', overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '20px',
              padding: '1rem', background: 'rgba(255, 255, 255, 0.01)'
            }}>
              {isLoadingNews ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: '#8e8e93' }}>
                  <RefreshCw className="animate-spin" size={20} />
                  <span style={{ fontSize: '0.8rem' }}>Haberler taranıyor...</span>
                </div>
              ) : newsCount === 0 ? (
                <div style={{ textAlign: 'center', color: '#636366', fontSize: '0.85rem', padding: '3rem 0' }}>
                  Bu hisse hakkında son dönemde KAP veya haber bildirimi bulunamadı.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* KAP Section */}
                  {stockNews.KAP?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#ff9f0a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                        KAP Bildirimleri
                      </div>
                      <div className="flex flex-col gap-2">
                        {stockNews.KAP.slice(0, 3).map((item, idx) => (
                          <a 
                            key={idx} 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              textDecoration: 'none', 
                              display: 'block',
                              padding: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                            }}
                          >
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>{item.title}</p>
                            <span style={{ fontSize: '0.65rem', color: '#8e8e93', marginTop: '4px', display: 'block' }}>{item.time}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bloomberg HT Section */}
                  {stockNews.Bloomberg?.length > 0 && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#0a84ff', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                        Bloomberg HT
                      </div>
                      <div className="flex flex-col gap-2">
                        {stockNews.Bloomberg.slice(0, 3).map((item, idx) => (
                          <a 
                            key={idx} 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              textDecoration: 'none', 
                              display: 'block',
                              padding: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                            }}
                          >
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>{item.title}</p>
                            <span style={{ fontSize: '0.65rem', color: '#8e8e93', marginTop: '4px', display: 'block' }}>{item.time}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other / Investing Section */}
                  {(stockNews.Investing?.length > 0 || stockNews.Diger?.length > 0) && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                        Piyasa Haberleri
                      </div>
                      <div className="flex flex-col gap-2">
                        {[...(stockNews.Investing || []), ...(stockNews.Diger || [])].slice(0, 3).map((item, idx) => (
                          <a 
                            key={idx} 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              textDecoration: 'none', 
                              display: 'block',
                              padding: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                            }}
                          >
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>{item.title}</p>
                            <span style={{ fontSize: '0.65rem', color: '#8e8e93', marginTop: '4px', display: 'block' }}>{item.time}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Bottom Grid: 8 detailed statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8e8e93', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
            Piyasa İstatistikleri
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            {[
              { 
                label: 'Açılış (Open)', 
                val: liveDetails ? `₺${parseFloat(liveDetails.open).toFixed(2)}` : '₺...' 
              },
              { 
                label: 'En Yüksek (High)', 
                val: liveDetails ? `₺${parseFloat(liveDetails.high).toFixed(2)}` : '₺...' 
              },
              { 
                label: 'En Düşük (Low)', 
                val: liveDetails ? `₺${parseFloat(liveDetails.low).toFixed(2)}` : '₺...' 
              },
              { 
                label: 'Önceki Kapanış (Prev)', 
                val: liveDetails ? `₺${parseFloat(liveDetails.previousClose).toFixed(2)}` : '₺...' 
              },
              { 
                label: 'Hacim (Volume)', 
                val: liveDetails ? formatTurkishNumber(liveDetails.volume) : '...' 
              },
              { 
                label: 'Piyasa Değeri (Cap)', 
                val: liveDetails ? formatTurkishNumber(liveDetails.marketCap, true) : '...' 
              },
              { 
                label: 'F/K Oranı (P/E)', 
                val: liveDetails && liveDetails.pe ? parseFloat(liveDetails.pe).toFixed(2) : '-' 
              },
              { 
                label: 'Temettü Verimi (Yield)', 
                val: liveDetails && liveDetails.dividendYield ? `${(parseFloat(liveDetails.dividendYield) * 100).toFixed(2)}%` : '-' 
              },
              { 
                label: '52H En Yüksek', 
                val: liveDetails ? `₺${parseFloat(liveDetails.fiftyTwoWeekHigh).toFixed(2)}` : '₺...' 
              },
              { 
                label: '52H En Düşük', 
                val: liveDetails ? `₺${parseFloat(liveDetails.fiftyTwoWeekLow).toFixed(2)}` : '₺...' 
              }
            ].slice(0, 8).map((box, i) => (
              <div 
                key={i} 
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <span style={{ fontSize: '0.7rem', color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {box.label}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {box.val}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
