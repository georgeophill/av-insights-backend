// src/ingest/stockDataFetcher.js
import "dotenv/config";
import { supabase } from "../db/supabaseClient.js";
import { getPublicCompanies } from "../../config/avCompanies.js";

// Simple console logger
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
};

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const API_BASE_URL = "https://www.alphavantage.co/query";

// Rate limiting: Alpha Vantage free tier allows 5 calls/minute, 500/day
const RATE_LIMIT_DELAY = 12000; // 12 seconds between calls (5 per minute)

/**
 * Fetch daily stock data from Alpha Vantage
 */
async function fetchStockData(ticker) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("ALPHA_VANTAGE_API_KEY not set in environment");
  }

  const url = new URL(API_BASE_URL);
  url.searchParams.append("function", "TIME_SERIES_DAILY");
  url.searchParams.append("symbol", ticker);
  url.searchParams.append("apikey", ALPHA_VANTAGE_API_KEY);
  url.searchParams.append("outputsize", "compact"); // Last 100 days

  try {
    logger.info(`Fetching stock data for ${ticker}...`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    if (data["Note"]) {
      logger.warn(`Rate limit warning: ${data["Note"]}`);
      return null;
    }

    return data;
  } catch (error) {
    logger.error(`Error fetching stock data for ${ticker}:`, error.message);
    return null;
  }
}

/**
 * Fetch company overview/fundamentals from Alpha Vantage
 */
async function fetchCompanyOverview(ticker) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("ALPHA_VANTAGE_API_KEY not set in environment");
  }

  const url = new URL(API_BASE_URL);
  url.searchParams.append("function", "OVERVIEW");
  url.searchParams.append("symbol", ticker);
  url.searchParams.append("apikey", ALPHA_VANTAGE_API_KEY);

  try {
    logger.info(`Fetching company overview for ${ticker}...`);
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    return data;
  } catch (error) {
    logger.error(`Error fetching overview for ${ticker}:`, error.message);
    return null;
  }
}

/**
 * Parse and store stock price data
 */
async function storeStockPrices(ticker, stockData) {
  const timeSeries = stockData["Time Series (Daily)"];
  
  if (!timeSeries) {
    logger.warn(`No time series data for ${ticker}`);
    return 0;
  }

  // Get company_id from database
  const { data: company } = await supabase
    .from("av_companies")
    .select("id")
    .eq("ticker", ticker)
    .single();

  if (!company) {
    logger.warn(`Company not found for ticker ${ticker}`);
    return 0;
  }

  const records = [];
  
  for (const [date, prices] of Object.entries(timeSeries)) {
    records.push({
      company_id: company.id,
      ticker,
      date,
      open: parseFloat(prices["1. open"]),
      high: parseFloat(prices["2. high"]),
      low: parseFloat(prices["3. low"]),
      close: parseFloat(prices["4. close"]),
      volume: parseInt(prices["5. volume"]),
      adj_close: parseFloat(prices["4. close"]) // Alpha Vantage doesn't provide adjusted close in daily data
    });
  }

  // Upsert records (insert or update if exists)
  const { data, error } = await supabase
    .from("stock_prices")
    .upsert(records, { onConflict: "ticker,date" });

  if (error) {
    logger.error(`Error storing stock prices for ${ticker}:`, error.message);
    return 0;
  }

  logger.info(`Stored ${records.length} price records for ${ticker}`);
  return records.length;
}

/**
 * Store company metrics from overview data
 */
async function storeCompanyMetrics(ticker, overview) {
  if (!overview || Object.keys(overview).length === 0) {
    return;
  }

  // Get company_id
  const { data: company } = await supabase
    .from("av_companies")
    .select("id")
    .eq("ticker", ticker)
    .single();

  if (!company) {
    logger.warn(`Company not found for ticker ${ticker}`);
    return;
  }

  const metrics = {
    company_id: company.id,
    date: new Date().toISOString().split('T')[0],
    market_cap: overview.MarketCapitalization ? parseInt(overview.MarketCapitalization) : null,
    pe_ratio: overview.PERatio ? parseFloat(overview.PERatio) : null,
    price_to_book: overview.PriceToBookRatio ? parseFloat(overview.PriceToBookRatio) : null,
    dividend_yield: overview.DividendYield ? parseFloat(overview.DividendYield) * 100 : null,
    beta: overview.Beta ? parseFloat(overview.Beta) : null,
    fifty_two_week_high: overview["52WeekHigh"] ? parseFloat(overview["52WeekHigh"]) : null,
    fifty_two_week_low: overview["52WeekLow"] ? parseFloat(overview["52WeekLow"]) : null
  };

  const { error } = await supabase
    .from("company_metrics")
    .upsert(metrics, { onConflict: "company_id,date" });

  if (error) {
    logger.error(`Error storing metrics for ${ticker}:`, error.message);
  } else {
    logger.info(`Stored metrics for ${ticker}`);
  }
}

/**
 * Update company information in av_companies table
 */
async function updateCompanyInfo(ticker, overview) {
  if (!overview || Object.keys(overview).length === 0) {
    return;
  }

  const updates = {
    market_cap: overview.MarketCapitalization ? parseInt(overview.MarketCapitalization) : null,
    description: overview.Description || null,
    sector: overview.Sector || null
  };

  const { error } = await supabase
    .from("av_companies")
    .update(updates)
    .eq("ticker", ticker);

  if (error) {
    logger.error(`Error updating company info for ${ticker}:`, error.message);
  }
}

/**
 * Delay function for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch and store stock data for all public AV companies
 */
export async function updateAllStockData(options = {}) {
  const { includeFundamentals = false } = options;

  logger.info("Starting stock data update...");
  
  const publicCompanies = getPublicCompanies();
  logger.info(`Found ${publicCompanies.length} public companies to update`);

  let successCount = 0;
  let errorCount = 0;

  for (const company of publicCompanies) {
    try {
      // Fetch and store daily price data
      const stockData = await fetchStockData(company.ticker);
      
      if (stockData) {
        const recordsStored = await storeStockPrices(company.ticker, stockData);
        if (recordsStored > 0) {
          successCount++;
        }
      } else {
        errorCount++;
      }

      // Rate limiting delay
      await delay(RATE_LIMIT_DELAY);

      // Optionally fetch fundamentals (use sparingly due to rate limits)
      if (includeFundamentals) {
        const overview = await fetchCompanyOverview(company.ticker);
        
        if (overview) {
          await storeCompanyMetrics(company.ticker, overview);
          await updateCompanyInfo(company.ticker, overview);
        }

        await delay(RATE_LIMIT_DELAY);
      }

    } catch (error) {
      logger.error(`Error processing ${company.name} (${company.ticker}):`, error.message);
      errorCount++;
    }
  }

  logger.info(`Stock data update complete: ${successCount} successful, ${errorCount} errors`);
  
  return {
    total: publicCompanies.length,
    successful: successCount,
    errors: errorCount
  };
}

/**
 * Fetch stock data for a single ticker
 */
export async function updateSingleStock(ticker) {
  logger.info(`Updating stock data for ${ticker}...`);

  try {
    const stockData = await fetchStockData(ticker);
    
    if (!stockData) {
      return { success: false, message: "Failed to fetch data" };
    }

    const recordsStored = await storeStockPrices(ticker, stockData);
    
    return {
      success: true,
      recordsStored,
      message: `Stored ${recordsStored} records`
    };

  } catch (error) {
    logger.error(`Error updating ${ticker}:`, error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

// Auto-run when executed directly
const isMainModule = process.argv[1] && process.argv[1].includes('stockDataFetcher');
if (isMainModule) {
  const includeFundamentals = process.argv.includes("--fundamentals");
  
  logger.info("Starting stock data update...");
  logger.info(`Include fundamentals: ${includeFundamentals}`);
  
  updateAllStockData({ includeFundamentals })
    .then((result) => {
      logger.info("Update result:", result);
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Fatal error:", error);
      process.exit(1);
    });
}
