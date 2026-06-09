import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import yahooFinance2 from 'yahoo-finance2';
import db from './database.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json()); // JSON parsing eklendi

const JWT_SECRET = 'bist-ai-super-secret-key-2026';

const parser = new Parser({
  customFields: {
    item: ['source']
  }
});

const PORT = 3000;

// Hisse isimleri ve sembol eşleştirme sözlüğü (Daha sağlam veri için)
const companyMapping = {
  'ENPRA': ['ENPARA', 'ENPRA'],
  'ISCTR': ['İŞ BANKASI', 'ISCTR', 'İSCTR', 'IS BANKASI'],
  'MIATK': ['MİA TEKNOLOJİ', 'MIATK', 'MİATK', 'MIA TEKNOLOJI'],
  'THYAO': ['TÜRK HAVA YOLLARI', 'THY', 'THYAO'],
  'TUPRS': ['TÜPRAŞ', 'TUPRS', 'TUPRAS'],
  'SISE': ['ŞİŞECAM', 'SISE', 'ŞİŞE', 'SISECAM'],
  'ASELS': ['ASELSAN', 'ASELS'],
  'PPZ': ['PPZ', 'AZİMUT', 'PORTFÖY']
};

// Geliştirilmiş Symbol Bulucu
const detectSymbol = (text) => {
  const upperText = text.toUpperCase();
  for (const [symbol, aliases] of Object.entries(companyMapping)) {
    if (aliases.some(alias => upperText.includes(alias))) return symbol;
  }
  return 'BİST';
};

const getSourceColor = (sourceStr) => {
  const s = sourceStr.toLowerCase();
  if (s.includes('kap') || s.includes('kamuyu')) return '#ff9f0a';
  if (s.includes('bloomberg')) return '#0a84ff';
  if (s.includes('foreks')) return '#30d158';
  if (s.includes('investing')) return '#8e8e93';
  return '#bf5af2';
};

const cleanTitle = (title) => {
  let cleaned = title;
  cleaned = cleaned.replace(/\s*[-|]\s*[A-Za-z0-9\s\.]+$/i, '');
  cleaned = cleaned.replace(/KAP:\s*[A-Z]+\s*\[.*?\]\s*[A-ZÇĞİÖŞÜ\s\.,A\.Ş\.]+/i, '');
  cleaned = cleaned.replace(/KAP:\s*[A-Z]+\s*\[.*?\]\s*/i, '');
  cleaned = cleaned.replace(/^[A-ZÇĞİÖŞÜ\s]+ AS - KAP Haberleri.*/i, 'KAP Bildirimi');
  cleaned = cleaned.replace(/\[.*?\]/g, '');
  cleaned = cleaned.replace(/\(Genel\)/gi, '');
  if (cleaned.length > 0) {
    cleaned = cleaned.trim().toLowerCase();
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim() || 'Yeni Bildirim';
};

const stripHtml = (html) => html ? html.replace(/<[^>]*>?/gm, '').trim() : '';

// Arka planda haberin asıl sayfasına gidip detaylı paragraf çeken fonksiyon
async function fetchArticleDetail(url, fallbackSnippet) {
  try {
    // 3 saniye zaman aşımı ile isteği yap
    const response = await axios.get(url, { 
      timeout: 3000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    let paragraphs = [];
    
    // Haberin asıl metinlerini (p etiketlerini) topla
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      // Çok kısa veya çöp paragrafları alma
      if (text.length > 60 && !text.includes('Telif') && !text.includes('Çerez')) {
        paragraphs.push(text);
      }
    });
    
    if (paragraphs.length > 0) {
      // En iyi ihtimalle ilk 2-3 paragrafı alıp birleştirerek okunaklı detaylı haber yap
      return paragraphs.slice(0, 3).join('\n\n');
    }
  } catch (err) {
    // Timeout veya engelleme olursa sessizce eski kısa metne dön
  }
  
  // Eğer detay çekilemediyse fallback temizliği yap
  let cleanedFallback = stripHtml(fallbackSnippet);
  if (cleanedFallback.length < 30) {
    return 'Bu haberin içeriğine doğrudan ulaşılamadı. Ayrıntılar ve tam metin için lütfen orijinal kaynağı ziyaret edin.';
  }
  return cleanedFallback;
}

app.get('/api/news', async (req, res) => {
  try {
    const symbols = ['ENPRA', 'ISCTR', 'MIATK', 'THYAO', 'TUPRS', 'SISE', 'ASELS', 'PPZ'];
    const query = `(${symbols.join(' OR ')}) (KAP OR Bloomberg OR Foreks OR Investing)`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`;
    
    const feed = await parser.parseURL(url);
    
    // Haberleri tarihe göre en yeniden en eskiye (Desc) kesin olarak sırala
    feed.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    const topItems = feed.items.slice(0, 15); // En güncel 15 haberi işle
    
    // Paralel olarak tüm haberlerin detaylarını çek (Hızı artırmak için Promise.all)
    const formattedNews = await Promise.all(topItems.map(async (item, index) => {
      const sourceName = item.source || 'Haber Kaynağı';
      const symbol = detectSymbol(item.title + ' ' + item.contentSnippet);
      
      const pubDate = new Date(item.pubDate);
      const timeDiff = Math.floor((new Date() - pubDate) / (1000 * 60 * 60));
      const timeStr = timeDiff === 0 ? 'Az önce' : (timeDiff < 24 ? `${timeDiff} saat önce` : pubDate.toLocaleDateString('tr-TR'));

      const cTitle = cleanTitle(item.title);
      // Asıl sayfaya gidip uzun içeriği çek
      const cSnippet = await fetchArticleDetail(item.link, item.contentSnippet || item.content);

      return {
        id: index + 1,
        source: sourceName,
        sourceColor: getSourceColor(sourceName),
        symbol: symbol,
        title: cTitle,
        snippet: cSnippet,
        time: timeStr,
        url: item.link
      };
    }));

    res.json(formattedNews);
  } catch (error) {
    console.error('Haber çekme hatası:', error);
    res.status(500).json({ error: 'Haberler çekilemedi' });
  }
});

// Hisse özelinde diğer kaynakları gruplayarak çeken yeni endpoint
app.get('/api/news/symbol/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const aliases = companyMapping[symbol] || [symbol];
    const query = `(${aliases.join(' OR ')}) (KAP OR Bloomberg OR Foreks OR Investing)`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`;
    
    const feed = await parser.parseURL(url);
    
    // Haberleri tarihe göre en yeniden en eskiye (Desc) kesin olarak sırala
    feed.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    const topItems = feed.items.slice(0, 15);
    
    const groupedNews = {
      KAP: [],
      Bloomberg: [],
      Investing: [],
      Diger: []
    };

    topItems.forEach(item => {
      const sourceName = item.source || 'Diğer';
      const s = sourceName.toLowerCase();
      
      const pubDate = new Date(item.pubDate);
      const timeDiff = Math.floor((new Date() - pubDate) / (1000 * 60 * 60));
      const timeStr = timeDiff === 0 ? 'Az önce' : (timeDiff < 24 ? `${timeDiff} saat önce` : pubDate.toLocaleDateString('tr-TR'));

      const newsItem = {
        title: cleanTitle(item.title),
        url: item.link,
        time: timeStr
      };

      if (s.includes('kap') || s.includes('kamuyu') || item.title.toLowerCase().includes('kap')) groupedNews.KAP.push(newsItem);
      else if (s.includes('bloomberg')) groupedNews.Bloomberg.push(newsItem);
      else if (s.includes('investing')) groupedNews.Investing.push(newsItem);
      else groupedNews.Diger.push(newsItem);
    });

    res.json(groupedNews);
  } catch (error) {
    console.error('Hisse haberleri çekme hatası:', error);
    res.status(500).json({ error: 'Hisse haberleri çekilemedi' });
  }
});

// Canlı Piyasa Verileri (Yahoo Finance)
// (yahooFinance import ile gelmediyse manuel olarak oluşturulabilir. Ancak yahoo-finance2 direkt export default ile instance veriyor.)
// Varsa import edilen üzerinden devam edeceğiz:
const yahooFinance = yahooFinance2;
if (yahooFinance.suppressNotices) {
  yahooFinance.suppressNotices(['yahooSurvey']);
}

app.get('/api/market', async (req, res) => {
  try {
    // Portföyümüzdeki ana hisselerin Yahoo Finance kodları
    const symbols = ['ENPRA.IS', 'ISCTR.IS', 'MIATK.IS', 'THYAO.IS', 'TUPRS.IS', 'SISE.IS', 'ASELS.IS', 'PPZ.IS'];
    
    const quotes = await Promise.all(symbols.map(async (sym) => {
      try {
        const quote = await yahooFinance.quote(sym);
        return {
          symbol: sym.replace('.IS', ''),
          price: quote.regularMarketPrice ? quote.regularMarketPrice.toFixed(2) : '0.00',
          change: quote.regularMarketChangePercent ? quote.regularMarketChangePercent.toFixed(2) : 0
        };
      } catch (err) {
        // Hisse bulunamazsa veya hata verirse 0 dön
        return { symbol: sym.replace('.IS', ''), price: '0.00', change: 0 };
      }
    }));
    
    res.json(quotes);
  } catch (error) {
    console.error('Piyasa verileri çekme hatası:', error);
    res.status(500).json({ error: 'Piyasa verileri çekilemedi' });
  }
});

// Yeni: Tarihsel Fiyat Çekme
app.get('/api/market/historical/:symbol/:date', async (req, res) => {
  try {
    const { symbol, date } = req.params; // Format: YYYY-MM-DD
    const querySymbol = symbol.endsWith('.IS') ? symbol : `${symbol}.IS`;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 5); // Hafta sonu vb. için 5 günlük geniş aralık
    
    const queryOptions = {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d'
    };

    const result = await yahooFinance.historical(querySymbol, queryOptions);
    
    if (result && result.length > 0) {
      res.json({ price: result[0].close });
    } else {
      res.status(404).json({ error: 'Bu tarihte fiyat verisi bulunamadı.' });
    }
  } catch (error) {
    console.error('Tarihsel veri hatası:', error);
    res.status(500).json({ error: 'Geçmiş fiyat çekilemedi' });
  }
});

// --- YENİ: AUTH & PORTFOLIO ROTASI (AŞAMA 7) ---

// Kayıt Ol
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' });

  try {
    const hash = bcrypt.hashSync(password, 10);
    await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    res.json({ message: 'Kayıt başarılı! Lütfen giriş yapın.' });
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation code
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
    }
    console.error(err);
    res.status(500).json({ error: `Sunucu hatası: ${err.message}` });
  }
});

// Giriş Yap
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur' });

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
    
    const user = rows[0];
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Giriş hatası: ${err.message}` });
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Portföy Getir (Auth Gerekli)
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM portfolios WHERE user_id = $1', [req.user.id]);
    const formatted = rows.map(i => ({
      id: i.item_id,
      symbol: i.symbol,
      buyPrice: parseFloat(i.buy_price),
      quantity: parseFloat(i.quantity),
      buyDate: i.buy_date
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Portföy getirilemedi.' });
  }
});

// Portföy Kaydet / Güncelle (Auth Gerekli)
app.post('/api/portfolio/save', authenticateToken, async (req, res) => {
  const { portfolio } = req.body; // Array bekliyoruz
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM portfolios WHERE user_id = $1', [req.user.id]);
    
    for (const item of (portfolio || [])) {
      await client.query(
        'INSERT INTO portfolios (user_id, item_id, symbol, buy_price, quantity, buy_date) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, item.id, item.symbol, item.buyPrice, item.quantity, item.buyDate || null]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Portföy kaydedilemedi.' });
  } finally {
    client.release();
  }
});

// Vercel Serverless Function Export
export default app;
