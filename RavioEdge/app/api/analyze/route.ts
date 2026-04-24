import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import YahooFinance from 'yahoo-finance2';
import * as cheerio from 'cheerio';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const TICKERS = {
  nifty: '^NSEI',
  bankNifty: '^NSEBANK',
  reliance: 'RELIANCE.NS',
  hdfc: 'HDFCBANK.NS',
  icici: 'ICICIBANK.NS',
  sbi: 'SBIN.NS',
  tcs: 'TCS.NS',
  infosys: 'INFY.NS',
  indiaVix: '^INDIAVIX',
  infyAdr: 'INFY',
  hdfcAdr: 'HDB',
  iciciAdr: 'IBN',
  wiproAdr: 'WIT',
  usdInr: 'USDINR=X',
  usOil: 'CL=F', 
  dji: '^DJI',
  ixic: '^IXIC', 
  spx: '^GSPC', 
  nikkei: '^N225',
  hsi: '^HSI',
  kospi: '^KS11'
};

async function getStockData(ticker: string) {
  try {
    const quote = await yahooFinance.quote(ticker, {
      fields: ['regularMarketPrice', 'regularMarketChangePercent', 'regularMarketVolume', 'regularMarketDayHigh', 'regularMarketDayLow']
    });
    return {
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
    };
  } catch (error) {
    console.warn(`Warning: Could not fetch data for ${ticker}`);
    return null;
  }
}

async function scrapePulseNews() {
  try {
    const res = await fetch('https://pulse.zerodha.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 60 } 
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const headlines: string[] = [];
    $('h2.title a').each((i, el) => {
      if (i < 10) headlines.push($(el).text().trim());
    });
    return headlines.join('\n- ');
  } catch (e) {
    console.error("Failed to scrape Pulse News:", e);
    return "News feed currently unavailable.";
  }
}

// Helper to convert base64 to Gemini Part object
function fileToGenerativePart(base64Data: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
}

export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { mode = 'current', manualData = {} } = body;

    const baseKeys = ['nifty', 'bankNifty', 'reliance', 'hdfc', 'icici', 'sbi', 'tcs', 'infosys', 'indiaVix'];
    const basePromises = baseKeys.map(key => getStockData(TICKERS[key as keyof typeof TICKERS]));
    
    let globalKeys: string[] = [];
    let globalPromises: Promise<any>[] = [];

    if (mode === 'pre' || mode === 'post') {
      globalKeys = ['infyAdr', 'hdfcAdr', 'iciciAdr', 'wiproAdr', 'usdInr', 'usOil', 'dji', 'ixic', 'spx', 'nikkei', 'hsi', 'kospi'];
      globalPromises = globalKeys.map(key => getStockData(TICKERS[key as keyof typeof TICKERS]));
    }

    const [baseResults, globalResults, pulseNews] = await Promise.all([
      Promise.all(basePromises),
      Promise.all(globalPromises),
      scrapePulseNews()
    ]);

    const marketData: any = {};
    baseKeys.forEach((key, i) => marketData[key] = baseResults[i]);
    globalKeys.forEach((key, i) => marketData[key] = globalResults[i]);

    let prompt = `
SYSTEM DIRECTIVE: Act as the Ravio Edge Quantitative Market Analyst. 
You are evaluating Nifty 50 options data.
You are currently providing a **${mode.toUpperCase()}-MARKET ANALYSIS**.

**LIVE MARKET DATA SNAPSHOT:**
- Nifty 50: ${marketData.nifty?.price} (${marketData.nifty?.changePercent?.toFixed(2)}%)
- Bank Nifty: ${marketData.bankNifty?.price} (${marketData.bankNifty?.changePercent?.toFixed(2)}%)
- India VIX: ${marketData.indiaVix?.price} (${marketData.indiaVix?.changePercent?.toFixed(2)}%)
- HDFC Bank: ${marketData.hdfc?.price} (${marketData.hdfc?.changePercent?.toFixed(2)}%)
- Reliance: ${marketData.reliance?.price} (${marketData.reliance?.changePercent?.toFixed(2)}%)
- ICICI Bank: ${marketData.icici?.price} (${marketData.icici?.changePercent?.toFixed(2)}%)
`;

    if (mode === 'pre' || mode === 'post') {
      prompt += `
**GLOBAL & OVERNIGHT DATA:**
- US Markets (DJI/IXIC/SPX): ${marketData.dji?.price} (${marketData.dji?.changePercent?.toFixed(2)}%) | ${marketData.ixic?.price} (${marketData.ixic?.changePercent?.toFixed(2)}%) | ${marketData.spx?.price} (${marketData.spx?.changePercent?.toFixed(2)}%)
- Asian Markets (Nikkei/HSI/KOSPI): ${marketData.nikkei?.price} (${marketData.nikkei?.changePercent?.toFixed(2)}%) | ${marketData.hsi?.price} (${marketData.hsi?.changePercent?.toFixed(2)}%) | ${marketData.kospi?.price} (${marketData.kospi?.changePercent?.toFixed(2)}%)
- Key ADRs (INFY/HDB/IBN/WIT): ${marketData.infyAdr?.price} (${marketData.infyAdr?.changePercent?.toFixed(2)}%) | ${marketData.hdfcAdr?.price} (${marketData.hdfcAdr?.changePercent?.toFixed(2)}%) | ${marketData.iciciAdr?.price} (${marketData.iciciAdr?.changePercent?.toFixed(2)}%) | ${marketData.wiproAdr?.price} (${marketData.wiproAdr?.changePercent?.toFixed(2)}%)
- USD/INR: ${marketData.usdInr?.price}
- Crude Oil (USOIL): ${marketData.usOil?.price}
`;
    }

    // Manual Data Injections
    if (manualData.giftNifty && manualData.giftNifty.price) {
      const g = manualData.giftNifty;
      prompt += `\n**MANUAL OVERRIDE - GIFT NIFTY LIVE DATA:**\nPrice: ${g.price} | Change: ${g.changeSign}${g.change} (${g.percentSign}${g.percent}%) | 30m Candle (O: ${g.o}, H: ${g.h}, L: ${g.l}, C: ${g.c})\n`;
    }

    if (manualData.fiiDii && manualData.fiiDii.some((row: any) => row.date)) {
      prompt += `\n**MANUAL OVERRIDE - FII/DII LAST 5 DAYS (Net Value in Cr):**\n`;
      manualData.fiiDii.forEach((row: any) => {
        if (row.date) {
          prompt += `- ${row.date}: FII CASH: ${row.fiiStocks || 0}, FII FUTURES: ${row.fiiOptions || 0}, DII CASH: ${row.diiStocks || 0}, FII OPTIONS: ${row.diiOptions || 0}\n`;
        }
      });
    }

    prompt += `
**LATEST BREAKING NEWS (from Pulse Zerodha):**
- ${pulseNews}

---
### YOUR TASK:
Based on the data, the manual inputs, and specifically the breaking news/geopolitics provided above, generate a highly professional, actionable markdown analysis for a Nifty 50 options buyer.
`;

    if (mode === 'current') {
      prompt += `
Focus on intraday momentum, current sentiment driven by the news, and immediate support/resistance levels.
If an option chain image screenshot is provided, extract strikes' values (OI, OI Change%, Volume, Vol Change%, IV, LTP, Strike Price) for PE/CE and live price, ATM IV, IV Change%, PCR, Market Lot, Days for expiry from the screenshot. Use this extracted data to recommend highly precise option strategies.

If Nifty 50 or Bank Nifty chart screenshots (5-minute timeframe) are provided, visually analyze them using the following indicators which are present on the chart:
- VWAP: Blue dotted line
- EMA 9: Green Line
- EMA 21: Red line
- EMA 50: White Line
- SMA 88: Yellow line
Keep a close eye on support and resistance zones directly on the chart candles. 

**Crucial Requirement for Live Analysis:**
You MUST format your response into two distinct sections:
1. **Important Points**: A separate heading at the very top containing bullet points of the most critical immediate takeaways. THIS SECTION MUST INCLUDE:
   - Detection of whether the market is currently in consolidation/sideways or trending.
   - The overall Bias (Bullish, Bearish, or Neutral).
   - Safe Entry/Exit points with proper Stop Loss (SL) and Target measured strictly in points of the PREMIUM (not the index points), tailored for an intraday scalper.
   - Clearly defined Support and Resistance zones formulated exactly like this: Near Support, Mid near Support, Mid Support, Far Support, and similarly for Resistance (Example: Near Support= 24165-24200, Near Resistance= 24400-24425).
2. **Complete Analysis**: The deep dive into the data, options chain, visual chart analysis, and strategy.
`;
    } else if (mode === 'pre') {
      prompt += `
Focus on analyzing the overnight US action, the latest breaking news, ADR performance, and Asian markets. 
**Crucial Requirement:** Explicitly predict the likely opening behavior for the Indian market (Gap up/down/flat) factoring in the GIFT Nifty data if provided, and suggest the best strategy for the first 30 minutes of trade. Use the 5-day FII/DII data (if provided) to gauge underlying institutional trend.
`;
    } else if (mode === 'post') {
      prompt += `
Focus on summarizing today's action, the impact of breaking news, FII/DII sentiment derived from the manual table (if provided) or news, and explicitly predict the market sentiment for tomorrow based on how the US market is currently opening/trading.
`;
    }

    prompt += `
Keep the response structured and professional. Do not use introductory filler. Just output the raw markdown analysis. Highlight geopolitical impacts if they are present in the news or crude oil prices.
`;

    // Process Multimodal Images if present
    const imageParts = [];
    
    const imagesToProcess = [
      manualData.optionChainImage,
      manualData.niftyChartImage,
      manualData.bankNiftyChartImage
    ];

    for (const img of imagesToProcess) {
      if (img) {
        const mimeType = img.split(';')[0].split(':')[1];
        const base64Data = img.split(',')[1];
        imageParts.push(fileToGenerativePart(base64Data, mimeType));
      }
    }

    const contentArray = [prompt, ...imageParts];

    // Call Gemini API with automatic retries for 503
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    let responseText = "";
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(contentArray);
        responseText = result.response.text();
        break; // Success
      } catch (err: any) {
        console.error(`Attempt ${attempt} failed with error:`, err.message);
        if (err.status === 503 || (err.message && err.message.includes('503'))) {
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
        }
        throw err;
      }
    }

    return NextResponse.json({
      data: marketData,
      news: pulseNews,
      analysis: responseText,
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during analysis.' }, { status: 500 });
  }
}
