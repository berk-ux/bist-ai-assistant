import { Activity } from 'lucide-react';

const CORE_STOCKS = [
  { symbol: 'ENPRA', name: 'Enpara Bank', price: '72.60', change: 2.15 },
  { symbol: 'ISCTR', name: 'İş Bankası C', price: '13.45', change: 0.52 },
  { symbol: 'MIATK', name: 'Mia Teknoloji', price: '64.20', change: -1.20 },
  { symbol: 'THYAO', name: 'Türk Hava Yolları', price: '315.50', change: 1.20 },
  { symbol: 'TUPRS', name: 'Tüpraş', price: '185.30', change: -0.45 },
  { symbol: 'SISE', name: 'Şişecam', price: '48.90', change: 0.10 },
  { symbol: 'ASELS', name: 'Aselsan', price: '58.75', change: 1.85 },
  { symbol: 'PPZ', name: 'Pusula Portföy', price: '12.450', change: 0.85, isFund: true },
];

export default function PortfolioRef() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Demo 1: Portföy Özeti (Referans Tasarım)</h2>
      
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
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Portfolio Value</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: '0.25rem' }}>$1,248,650.32</div>
            <div className="text-up" style={{ fontSize: '0.9rem', fontWeight: 500 }}>+$14,560.10 (+1.18%)</div>
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
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Equity Allocation</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            {/* CSS Donut Chart */}
            <div style={{
              width: '100px', height: '100px',
              borderRadius: '50%',
              background: 'conic-gradient(#fff 0% 65%, #8e8e93 65% 85%, #636366 85% 95%, #333 95% 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></span> 65% Equities</div>
            <div className="flex items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8e8e93' }}></span> 20% Bonds</div>
            <div className="flex items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#636366' }}></span> 10% Cash</div>
            <div className="flex items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }}></span> 5% Alt</div>
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
            <span style={{ color: 'var(--text-secondary)' }}>6M growth:</span>
            <span className="text-up" style={{ fontWeight: 600 }}>+12.4%</span>
          </div>
        </div>
      </section>

      {/* Market Watch */}
      <section>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Market Watch</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          {CORE_STOCKS.map(stock => (
            <div key={stock.symbol} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>
                  {stock.symbol.charAt(0)}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{stock.symbol}:</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>₺{stock.price}</span>
                <span className={stock.change >= 0 ? 'text-up' : 'text-down'} style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  ({stock.change > 0 ? '+' : ''}{stock.change}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
