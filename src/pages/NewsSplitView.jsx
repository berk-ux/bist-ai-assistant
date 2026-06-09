import { useState } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

const MOCK_NEWS = [
  {
    id: 1,
    source: 'KAP',
    sourceColor: '#ff9f0a',
    symbol: 'MIATK',
    title: 'Yeni İş İlişkisi Hakkında Bildirim',
    snippet: 'Şirketimiz ile yurt içinde yerleşik bir müşteri arasında, akıllı şehir teknolojileri altyapı kurulumu kapsamında 15.000.000 TL tutarında sözleşme imzalanmıştır. Bu sözleşmenin 2026 yılı gelirlerine katkısı beklenmektedir.',
    time: '2 saat önce',
    url: '#'
  },
  {
    id: 2,
    source: 'Bloomberg HT',
    sourceColor: '#0a84ff',
    symbol: 'THYAO',
    title: 'THY\'den yeni uçak siparişi hazırlığı',
    snippet: 'Türk Hava Yolları Yönetim Kurulu Başkanı, filoyu genişletme planları kapsamında Airbus ve Boeing ile 200\'ün üzerinde yeni dar gövde uçak alımı için görüşüldüğünü belirtti. Bu devasa alımın kapasite artışına %15 katkı sağlaması hedefleniyor.',
    time: '4 saat önce',
    url: '#'
  },
  {
    id: 3,
    source: 'Foreks Haber',
    sourceColor: '#30d158',
    symbol: 'TUPRS',
    title: 'Tüpraş rafineri marjları beklentileri aştı',
    snippet: 'Akdeniz rafineri marjlarındaki toparlanmanın etkisiyle Tüpraş\'ın çeyreklik kâr beklentilerinde yukarı yönlü revizyonlar gelmeye devam ediyor.',
    time: '5 saat önce',
    url: '#'
  },
  {
    id: 4,
    source: 'Investing',
    sourceColor: '#8e8e93',
    symbol: 'ISCTR',
    title: 'Bankacılık sektöründe kredi büyümesi yavaşlıyor',
    snippet: 'Merkez Bankası\'nın sıkılaşma adımları sonrasında ticari kredi büyümesinde ivme kaybı sürerken, İş Bankası rasyolarındaki güçlü duruşunu korumaya devam ediyor.',
    time: '1 gün önce',
    url: '#'
  }
];

export default function NewsSplitView() {
  const [selectedNews, setSelectedNews] = useState(MOCK_NEWS[0]);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysis("");
    setTimeout(() => {
      let res = "Bu gelişme, şirketin pazar payını ve gelecekteki büyüme oranlarını doğrudan etkileyebilecek niteliktedir. Yatırımcıların dikkatle takip etmesi önerilir.";
      if (selectedNews.symbol === 'MIATK') res = "Bu yeni iş anlaşması, şirketin nakit akışını kısa vadede destekleyecektir. Akıllı şehir teknolojileri alanındaki büyüme trendi göz önüne alındığında orta-uzun vade için çok pozitif bir gelişme.";
      if (selectedNews.symbol === 'THYAO') res = "Yeni uçak siparişleri kapasite artışı anlamına gelse de yüksek yatırım harcaması demektir. Piyasalar genellikle büyüme vizyonunu pozitif fiyatlar, kâr marjları yakından izlenmeli.";
      
      setAnalysis(res);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', padding: '0 2rem' }}>Demo 2: Açık ve Erişilebilir Haber Akışı (Split-View)</h2>
      
      <div style={{ display: 'flex', flex: 1, gap: '2rem', padding: '0 2rem 2rem 2rem', minHeight: 0 }}>
        
        {/* Left Column: Master List */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {MOCK_NEWS.map(news => (
            <div 
              key={news.id} 
              onClick={() => { setSelectedNews(news); setAnalysis(""); }}
              style={{ 
                padding: '1.25rem', 
                background: selectedNews.id === news.id ? 'var(--bg-tertiary)' : 'transparent',
                border: '1px solid',
                borderColor: selectedNews.id === news.id ? 'var(--border-color-focus)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="flex justify-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: news.sourceColor }}>{news.source}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{news.time}</span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.4, color: selectedNews.id === news.id ? '#fff' : 'var(--text-secondary)' }}>
                {news.title}
              </h4>
            </div>
          ))}
        </div>

        {/* Right Column: Detail View */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            
            <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
              <span style={{ background: 'var(--bg-secondary)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${selectedNews.sourceColor}` }}>
                {selectedNews.symbol}
              </span>
              <span style={{ color: selectedNews.sourceColor, fontWeight: 600 }}>{selectedNews.source}</span>
              <span style={{ color: 'var(--text-muted)' }}>• {selectedNews.time}</span>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '2rem' }}>
              {selectedNews.title}
            </h1>

            <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '3rem' }}>
              "{selectedNews.snippet}"
            </p>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              {!analysis && !isAnalyzing && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                  onClick={handleAnalyze}
                >
                  <Sparkles size={20} /> Yapay Zeka ile Analiz Et
                </button>
              )}

              {isAnalyzing && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <Sparkles className="animate-glow" size={32} style={{ margin: '0 auto 1rem auto' }} />
                  Yapay zeka piyasa etkisini hesaplıyor...
                </div>
              )}

              {analysis && (
                <div className="animate-fade-in" style={{ 
                  background: 'rgba(94, 92, 230, 0.1)', 
                  border: '1px solid var(--accent-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem'
                }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>
                    <Sparkles size={24} />
                    <h3 style={{ fontSize: '1.2rem' }}>AI Gelecek Görüşü</h3>
                  </div>
                  <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#fff' }}>
                    {analysis}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
               <a href={selectedNews.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  Orijinal Haberi Görüntüle <ExternalLink size={14} />
               </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
