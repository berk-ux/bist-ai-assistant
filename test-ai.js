import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

async function test() {
  try {
    const prompt = `Sen Türkiye piyasalarına hakim uzman bir yapay zeka fon yöneticisisin. Bana Borsa İstanbul'dan (BİST100) güncel makroekonomik dinamiklere ve haber akışlarına göre yükseleceğini öngördüğün (potansiyeli olan) tamamen farklı 3 adet hisse öner.
    
DİKKAT: YALNIZCA aşağıdaki formatta GEÇERLİ BİR JSON DİZİSİ döndür. Başka hiçbir açıklama, markdown veya not ekleme!
Örnek Format:
[
  { "symbol": "THYAO", "name": "Türk Hava Yolları", "targetPrice": "340.50 ₺", "potential": "+%18.5", "reason": "Turizm sezonu beklentileri ve artan yolcu kapasitesi nedeniyle havacılık sektörü ön plana çıkıyor." }
]`;
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    console.log("Success:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("AI Analyze Error:", err.response?.data || err.message);
  }
}
test();
