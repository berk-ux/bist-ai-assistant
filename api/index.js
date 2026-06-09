import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import yahooFinance2 from 'yahoo-finance2';
import db, { initDb } from './database.js';
import BIST100_SYMBOLS from './bist100.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json()); // JSON parsing eklendi

// Veritabanının hazır olduğundan emin olan Middleware
app.use(async (req, res, next) => {
  await initDb();
  next();
});

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
  // Önce 100 hisselik dev listede tam eşleşme ara
  for (const sym of BIST100_SYMBOLS) {
    // Sadece kelime olarak geçiyorsa veya direkt varsa
    if (upperText.includes(sym)) return sym;
  }
  
  // Bulunamazsa özel şirket takma adlarına (aliases) bak
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
    const query = `"Borsa İstanbul" OR "BİST 100" OR "Hisse senedi" OR "KAP"`;
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
const yahooFinance = new yahooFinance2({ suppressNotices: ['yahooSurvey'] });

app.get('/api/market', async (req, res) => {
  try {
    const querySymbols = BIST100_SYMBOLS.map(s => s + '.IS');
    let rawQuotes = [];
    try {
      // Yahoo'nun çoklu sembol sorgulamasını kullanarak 100 hisseyi tek seferde (batch) çekiyoruz.
      rawQuotes = await yahooFinance.quote(querySymbols);
    } catch(err) {
      console.error('Yahoo Finance batch query hatası:', err);
    }

    const quotes = BIST100_SYMBOLS.map(sym => {
      const quoteInfo = rawQuotes.find(r => r.symbol === sym + '.IS');
      return {
        symbol: sym,
        price: (quoteInfo?.regularMarketPrice || 0).toFixed(2),
        change: (quoteInfo?.regularMarketChangePercent || 0).toFixed(2)
      };
    });

    res.json(quotes);
  } catch (error) {
    console.error('Market veri hatası:', error);
    res.status(500).json({ error: 'Piyasa verileri alınamadı' });
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

// --- YAPAY ZEKA (AI) ENDPOINTLERI ---

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const getFriendlyErrorMessage = (err) => {
  const errorMessage = err.response?.data?.error?.message || err.message || '';
  if (errorMessage.includes('quota') || errorMessage.includes('429')) {
    return 'Şu anda çok fazla kişi analiz istiyor. Google API kotalarımız geçici olarak doldu, lütfen 1 dakika sonra tekrar deneyin.';
  }
  if (errorMessage.includes('demand') || errorMessage.includes('503')) {
    return 'Yapay zeka sunucularında (Google Gemini) anlık bir yoğunluk yaşanıyor. Lütfen birazdan tekrar sorun.';
  }
  return `Bağlantı sorunu: ${errorMessage}`;
};

// 1. Haber Analizi
const analysisCache = new Map();

app.post('/api/ai/analyze', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Sunucu tarafında API Anahtarı eksik.' });
  }

  const { title, snippet, symbol } = req.body;
  if (!title || !snippet) return res.status(400).json({ error: 'Haber başlığı ve detayı gerekli.' });

  // --- CACHE KONTROLÜ ---
  const cacheKey = `${symbol || 'BİST'}_${title}`;
  if (analysisCache.has(cacheKey)) {
    console.log("Cache hit for:", cacheKey);
    return res.json({ analysis: analysisCache.get(cacheKey) });
  }

  const prompt = `Sen profesyonel bir Borsa İstanbul (BİST) analisti ve portföy yöneticisisin. Sana gönderdiğim haberi özellikle "${symbol || 'BİST'}" hissesi/piyasası açısından incele. 
Bu haberin kısa ve orta vadeli nasıl bir etki yaratacağını, yatırımcıların neye dikkat etmesi gerektiğini 2-3 cümlelik net, elit ve profesyonel bir dille özetle. 
Bütün analiz bittikten sonra, EN SONA yeni bir paragraf olarak mutlaka haberin hisse üzerindeki olası etkisini belirten net bir yapay zeka tahmini ekle (Örn: "🎯 Yapay Zeka Tahmini: Kısa vadede yükseliş beklentisi (Pozitif)", "🎯 Yapay Zeka Tahmini: Kısa vadede düşüş beklentisi (Negatif)" veya "🎯 Yapay Zeka Tahmini: Nötr"). Asla kesin al/sat tavsiyesi verme.

Haber Başlığı: ${title}
Haber Detayı: ${snippet}`;

  try {
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const analysis = response.data.candidates[0].content.parts[0].text;
    
    // Analizi hafızaya kaydet
    analysisCache.set(cacheKey, analysis);
    
    // Cache'in çok büyümesini engellemek için (örn. 500 analizden sonra temizle)
    if (analysisCache.size > 500) {
      analysisCache.clear();
    }

    res.json({ analysis });
  } catch (err) {
    console.error("AI Analyze Error:", err.response?.data || err.message);
    res.status(500).json({ error: getFriendlyErrorMessage(err) });
  }
});



// Halka Arz (IPO) Çekme ve Ayrıştırma (Gerçek Zamanlı Haberlerden)
app.get('/api/ipos', async (req, res) => {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent('"halka arz" (onay OR taslak OR "talep toplama") (SPK OR BİST)')}&hl=tr&gl=TR&ceid=TR:tr`;
    const feed = await parser.parseURL(url);
    const newsText = feed.items.slice(0, 15).map(item => item.title).join('\n');

    const prompt = `Aşağıdaki güncel borsa haber başlıklarını incele ve Borsa İstanbul'da yakında halka arz olacak (veya SPK'dan yeni onay almış, talep toplayan) şirketleri bul. 
Her biri için şirket adını (companyName), sektörünü (sector) ve halka arz fiyatını (price) çıkar. Fiyat yoksa "Belirsiz" yaz. Sektörü haberden anlaşılmıyorsa "Genel" yaz. Aynı şirketi iki kere yazma.
SADECE aşağıdaki formatta geçerli bir JSON dizisi (array) dön. Hiçbir ekstra metin veya markdown işareti ekleme. 
Örnek Format: [{"companyName": "X Lojistik A.Ş.", "sector": "Lojistik", "price": "24.50 ₺"}]

Haber Başlıkları:
${newsText}`;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let resultText = response.data.candidates[0].content.parts[0].text;
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let ipos = [];
    try {
      ipos = JSON.parse(resultText);
    } catch(e) {
      console.error('JSON Parse Hatası:', e, resultText);
    }
    
    if (ipos.length === 0) {
      ipos = [{ companyName: "Şu an onaylı yeni halka arz bulunamadı.", sector: "-", price: "-" }];
    }
    
    res.json(ipos);
  } catch (err) {
    console.error('IPO Fetch Error:', err);
    res.json([{ companyName: "Sistem güncelleniyor, SPK bülteni bekleniyor.", sector: "Genel", price: "Belirsiz" }]);
  }
});

// Halka Arz (IPO) Özel Yapay Zeka Beklenti Analizi
app.post('/api/ai/ipo-analysis', async (req, res) => {
  try {
    const { companyName, sector, price } = req.body;
    const prompt = `Sen profesyonel bir Borsa İstanbul analistisin. "${companyName}" (Sektör: ${sector}) şirketi ${price} fiyatıyla halka arz oluyor/oldu.
Bu şirketin sektörel konumunu, halka arzının potansiyelini ve uzun vadeli beklentileri yorumla. Yatırımcıların nelere dikkat etmesi gerektiğini 2-3 cümlelik net, elit ve profesyonel bir dille özetle. Asla kesin al/sat tavsiyesi verme.`;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const analysis = response.data.candidates[0].content.parts[0].text;
    res.json({ analysis });
  } catch(err) {
    res.status(500).json({ error: 'Analiz yapılamadı.' });
  }
});

// Vercel Serverless Function Export
export default app;
