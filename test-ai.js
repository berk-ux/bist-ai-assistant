import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

async function test() {
  try {
    const prompt = "Hello";
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    console.log("Success:", response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("AI Analyze Error:", err.response?.data || err.message);
  }
}
test();
