import { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, Newspaper } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      setLivePrice(currentPrice);
      setLiveChange(change);
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
        })
        .catch(err => {
          console.error('Canlı fiyat fetch hatası:', err);
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

  const linePath = points.length > 0 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z` : '';

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
    // Convert clientX to SVG local coordinate X
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel" style={{
        width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
        padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem',
        position: 'relative'
      }}>
        
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', 
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)'
              }}>
                {symbol.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {symbol}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Borsa İstanbul Piyasa Verisi</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>₺{livePrice}</div>
              <div className={isPositive ? 'text-up' : 'text-down'} style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{liveChange}% Bugün
              </div>
            </div>
            
            <button onClick={onClose} className="btn-icon" style={{ padding: '0.6rem', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '2.5rem',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Chart & Stats */}
          <div className="flex flex-col gap-6">
            {/* Chart Container */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', position: 'relative' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="var(--accent-primary)" /> Fiyat Geçmişi
                </span>
                
                {/* Period Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
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
                        padding: '0.3rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        color: days === t.val ? '#000' : 'var(--text-secondary)',
                        background: days === t.val ? 'var(--text-primary)' : 'transparent',
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
                  <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <RefreshCw className="animate-spin" size={24} />
                    <span style={{ fontSize: '0.8rem' }}>Grafik verileri yükleniyor...</span>
                  </div>
                ) : chartError ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--status-down)' }}>{chartError}</span>
                ) : chartData.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fiyat geçmişi bulunamadı.</span>
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
                        <stop offset="0%" stopColor={isPeriodPositive ? 'var(--status-up)' : 'var(--status-down)'} stopOpacity="0.25"/>
                        <stop offset="100%" stopColor={isPeriodPositive ? 'var(--status-up)' : 'var(--status-down)'} stopOpacity="0.00"/>
                      </linearGradient>
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
                            fill="var(--text-muted)" 
                            fontSize="8" 
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
                          fill="var(--text-muted)" 
                          fontSize="8" 
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
                      d={linePath} 
                      fill="none" 
                      stroke={isPeriodPositive ? 'var(--status-up)' : 'var(--status-down)'} 
                      strokeWidth="2" 
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
                          r="4" 
                          fill={isPeriodPositive ? 'var(--status-up)' : 'var(--status-down)'} 
                          stroke="#fff"
                          strokeWidth="1"
                        />
                        
                        {/* Tooltip Card */}
                        <g>
                          {(() => {
                            const tooltipWidth = 120;
                            const tooltipHeight = 48;
                            const isNearRight = points[hoveredIndex].x + 10 > width - tooltipWidth;
                            const isNearTop = points[hoveredIndex].y - 52 < 5;
                            
                            const rectX = isNearRight ? points[hoveredIndex].x - (tooltipWidth + 10) : points[hoveredIndex].x + 10;
                            const rectY = isNearTop ? points[hoveredIndex].y + 10 : points[hoveredIndex].y - 52;
                            
                            const textX = rectX + 10;
                            const dateY = rectY + 14;
                            const priceY = rectY + 28;
                            const diffY = rectY + 41;

                            return (
                              <>
                                <rect 
                                  x={rectX}
                                  y={rectY} 
                                  width={tooltipWidth} 
                                  height={tooltipHeight} 
                                  rx="5" 
                                  fill="rgba(10,10,12,0.95)" 
                                  stroke="rgba(255,255,255,0.15)" 
                                  style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}
                                />
                                <text 
                                  x={textX} 
                                  y={dateY}
                                  fill="var(--text-secondary)"
                                  fontSize="8"
                                >
                                  {points[hoveredIndex].date} {days === 1 ? 'saat' : ''}
                                </text>
                                <text 
                                  x={textX} 
                                  y={priceY}
                                  fill="#fff"
                                  fontSize="10"
                                  fontWeight="bold"
                                >
                                  ₺{points[hoveredIndex].price.toFixed(2)}
                                </text>
                                {hoveredIndex === 0 ? (
                                  <text x={textX} y={diffY} fill="#8e8e93" fontSize="8">
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

            {/* Performance Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En Yüksek</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {isLoadingChart ? '...' : `₺${maxPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En Düşük</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {isLoadingChart ? '...' : `₺${minPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ortalama</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  {isLoadingChart ? '...' : `₺${avgPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Periyot Getiri</span>
                <span className={isPeriodPositive ? 'text-up' : 'text-down'} style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {isLoadingChart ? '...' : `${isPeriodPositive ? '+' : ''}${periodChange.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Historical / Latest News Hub */}
          <div className="flex flex-col gap-4">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Newspaper size={16} color="var(--accent-secondary)" /> Hisse Haber & Bildirimleri
            </h3>

            <div style={{
              flex: 1, maxHeight: '280px', overflowY: 'auto',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
              padding: '1rem', background: 'var(--bg-secondary)'
            }}>
              {isLoadingNews ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <RefreshCw className="animate-spin" size={20} />
                  <span style={{ fontSize: '0.8rem' }}>Haberler taranıyor...</span>
                </div>
              ) : newsCount === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>
                  Bu hisse hakkında son dönemde KAP veya haber bildirimi bulunamadı.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* KAP Section */}
                  {stockNews.KAP?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#ff9f0a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255, 159, 10, 0.15)', paddingBottom: '0.25rem' }}>
                        KAP Bildirimleri
                      </div>
                      <div className="flex flex-col gap-2">
                        {stockNews.KAP.slice(0, 3).map((item, idx) => (
                          <a key={idx} href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0, lineHeight: 1.3 }}>{item.title}</p>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.time}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bloomberg HT Section */}
                  {stockNews.Bloomberg?.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#0a84ff', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid rgba(10, 132, 255, 0.15)', paddingBottom: '0.25rem' }}>
                        Bloomberg HT
                      </div>
                      <div className="flex flex-col gap-2">
                        {stockNews.Bloomberg.slice(0, 3).map((item, idx) => (
                          <a key={idx} href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0, lineHeight: 1.3 }}>{item.title}</p>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.time}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other / Investing Section */}
                  {(stockNews.Investing?.length > 0 || stockNews.Diger?.length > 0) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                        Piyasa Haberleri
                      </div>
                      <div className="flex flex-col gap-2">
                        {[...(stockNews.Investing || []), ...(stockNews.Diger || [])].slice(0, 3).map((item, idx) => (
                          <a key={idx} href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: 0, lineHeight: 1.3 }}>{item.title}</p>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.time}</span>
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

      </div>
    </div>
  );
}
