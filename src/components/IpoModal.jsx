import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function IpoModal({ isOpen, onClose }) {
  const [ipos, setIpos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingCompany, setAnalyzingCompany] = useState(null);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
        padding: '2rem', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🚀 Yaklaşan Halka Arzlar
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Canlı haber bültenlerinden derlenen, SPK onaylı veya talep toplayan güncel halka arz (IPO) listesi.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-secondary">
            <RefreshCw className="animate-spin" size={32} />
            <p>Gerçek zamanlı bültenler taranıyor...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ipos.map((ipo, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ipo.companyName}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Sektör: <span style={{ color: 'var(--accent-secondary)' }}>{ipo.sector}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Başlangıç Fiyatı</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--status-up)' }}>{ipo.price}</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleAnalyze(ipo)}
                  disabled={analyzingCompany === ipo.companyName}
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}
                >
                  {analyzingCompany === ipo.companyName ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {analyzingCompany === ipo.companyName ? 'Yapay Zeka İnceliyor...' : 'Beklentiyi Analiz Et'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AI Analysis Result Panel */}
        {analysis && (
          <div className="glass-panel animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              <Sparkles size={20} /> Yapay Zeka Öngörüsü
            </div>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
              {analysis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
