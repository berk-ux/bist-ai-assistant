import yahooFinance2 from 'yahoo-finance2';

const yahooFinance = new yahooFinance2({ suppressNotices: ['yahooSurvey'] });

async function test() {
  try {
    const symbol = 'THYAO.IS';
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    
    console.log('Querying from:', fourDaysAgo.toISOString(), 'to', now.toISOString());
    
    const result = await yahooFinance.chart(symbol, {
      period1: fourDaysAgo,
      period2: now,
      interval: '15m'
    });
    
    if (result.quotes && result.quotes.length > 0) {
      // Group by calendar day
      const groups = {};
      for (const quote of result.quotes) {
        if (quote.close === null || quote.close === undefined) continue;
        const dateStr = new Date(quote.date).toISOString().split('T')[0];
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(quote);
      }
      
      const daysWithData = Object.keys(groups).sort();
      console.log('Days with data:', daysWithData);
      
      const lastDayStr = daysWithData[daysWithData.length - 1];
      const lastDayQuotes = groups[lastDayStr] || [];
      console.log('Last Day:', lastDayStr);
      console.log('Number of quotes for last day:', lastDayQuotes.length);
      if (lastDayQuotes.length > 0) {
        console.log('First quote of last day:', lastDayQuotes[0]);
        console.log('Last quote of last day:', lastDayQuotes[lastDayQuotes.length - 1]);
      }
    } else {
      console.log('No quotes found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
