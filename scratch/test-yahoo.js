import yahooFinance2 from 'yahoo-finance2';

const yahooFinance = new yahooFinance2({ suppressNotices: ['yahooSurvey'] });

async function main() {
  try {
    const result = await yahooFinance.quote('HALKB.IS');
    console.log("Yahoo Finance HALKB.IS quote result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error fetching Yahoo Finance quote:", err);
  }
}

main();
