import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function AIChat() {
  const { token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Merhaba! Ben BİST AI Finans Asistanıyım. Borsa, hisse senetleri veya yatırımlarla ilgili sormak istediğiniz bir şey var mı?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.slice(-5).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      
      chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Hata: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Bağlantı hatası oluştu, lütfen tekrar deneyin.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Yüzen Buton */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            boxShadow: '0 4px 15px rgba(10, 132, 255, 0.4)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Penceresi */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '350px',
            maxWidth: 'calc(100vw - 32px)',
            height: '500px',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(10, 132, 255, 0.2)',
                color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>BİST AI Asistan</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--status-up)' }}>Çevrimiçi</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-primary)'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '12px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: msg.role === 'user' ? 'rgba(94, 92, 230, 0.2)' : 'rgba(10, 132, 255, 0.2)',
                  color: msg.role === 'user' ? 'var(--accent-secondary)' : 'var(--accent-primary)'
                }}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{
                  padding: '12px',
                  borderRadius: '16px',
                  maxWidth: '75%',
                  fontSize: '14px',
                  background: msg.role === 'user' ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  borderTopRightRadius: msg.role === 'user' ? '0' : '16px',
                  borderTopLeftRadius: msg.role === 'user' ? '16px' : '0'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'row' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(10, 132, 255, 0.2)', color: 'var(--accent-primary)'
                }}>
                  <Bot size={16} />
                </div>
                <div style={{
                  padding: '12px', borderRadius: '16px', borderTopLeftRadius: '0',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
                }}>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Düşünüyor...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={{
            padding: '12px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Finansal bir soru sorun..."
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '10px 16px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: (!input.trim() || isLoading) ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: (!input.trim() || isLoading) ? 'var(--text-muted)' : '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
