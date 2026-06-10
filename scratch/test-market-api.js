import yahooFinance2 from 'yahoo-finance2';
import BIST100_SYMBOLS from '../api/bist100.js';

const yahooFinance = new yahooFinance2({ suppressNotices: ['yahooSurvey'] });

async function main() {
  try {
    const querySymbols = BIST100_SYMBOLS.map(s => s + '.IS');
    const rawQuotes = await yahooFinance.quote(querySymbols);
    
    const quotes = BIST100_SYMBOLS.map(sym => {
      const quoteInfo = rawQuotes.find(r => r.symbol === sym + '.IS');
      return {
        symbol: sym,
        price: quoteInfo ? quoteInfo.regularMarketPrice : null,
        change: quoteInfo ? quoteInfo.regularMarketChangePercent : null
      };
    });
    
    // Sort quotes by symbol
    quotes.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    quotes.forEach(q => {
      console.log(`${q.symbol}: ${q.price} TL (${q.change}%)`);
    });
  } catch (error) {
    console.error("Error in test-market-api:", error);
  }
}

main();
