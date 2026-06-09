const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function test() {
  try {
    const quote = await yahooFinance.quote('ENPRA.IS');
    console.log(quote.regularMarketPrice, quote.regularMarketChangePercent);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
