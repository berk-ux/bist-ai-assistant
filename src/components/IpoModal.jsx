import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function IpoView() {
  const [ipos, setIpos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingCompany, setAnalyzingCompany] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setAnalysis(null);
    fetch('/api/ipos')
      .then(res => res.json())
      .then(data => {
        setIpos(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleAnalyze = async (company) => {
    setAnalyzingCompany(company.companyName);
    setAnalysis(null);
    try {
      const res = await fetch('/api/ai/ipo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      });
      const data = await res.json();
      if (data.error) {
        setAnalysis("Hata: " + data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      setAnalysis("Analiz sırasında bir sorun oluştu.");
    } finally {
      setAnalyzingCompany(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-secondary glass-panel">
          <RefreshCw className="animate-spin" size={32} />
          <p>Gerçek zamanlı SPK bültenleri taranıyor...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {ipos.map((ipo, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{ipo.companyName}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Sektör: <span style={{ color: 'var(--accent-secondary)' }}>{ipo.sector}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Başlangıç Fiyatı</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-up)' }}>{ipo.price}</div>
              </div>
              
              <button 
                onClick={() => handleAnalyze(ipo)}
                disabled={analyzingCompany === ipo.companyName}
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
              >
                {analyzingCompany === ipo.companyName ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {analyzingCompany === ipo.companyName ? 'Yapay Zeka İnceliyor...' : 'Beklentiyi Analiz Et'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Result Panel */}
      {analysis && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-primary)', background: 'var(--bg-secondary)', marginTop: '1rem' }}>
          <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '1.2rem' }}>
            <Sparkles size={24} /> Yapay Zeka Öngörüsü
          </div>
          <p style={{ color: 'var(--text-primary)', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
            {analysis}
          </p>
        </div>
      )}
    </div>
  );
}
