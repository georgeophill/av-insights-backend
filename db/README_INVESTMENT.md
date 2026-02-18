# Investment Data Infrastructure

This directory contains the investment data infrastructure for tracking stock prices and financial metrics of AV companies.

## Setup Instructions

### 1. Database Setup

Run the SQL schema in Supabase SQL Editor:

```bash
# Execute this file in Supabase SQL Editor
db/schema_investment_data.sql
```

This creates the following tables:
- `av_companies` - Master list of AV companies with tickers
- `stock_prices` - Daily stock price data
- `company_financials` - Quarterly/annual financial reports
- `company_metrics` - Real-time company metrics (P/E, market cap, etc.)
- `company_news_sentiment` - Aggregated news sentiment per company
- `investment_events` - Major investment events (funding, IPOs, M&A)

### 2. API Key Setup

Get a free API key from Alpha Vantage:
1. Visit https://www.alphavantage.co/support/#api-key
2. Sign up for a free API key (500 requests/day)
3. Add to your `.env` file:

```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

**Note:** Free tier limitations:
- 5 API calls per minute
- 500 API calls per day
- Consider upgrading for production use

### 3. Seed Company Data

Populate the `av_companies` table with AV company information:

```bash
node scripts/seedCompanies.js
```

This will insert ~80+ AV companies including:
- Pure-play AV companies (Waymo, Cruise, Aurora, etc.)
- Traditional automakers (Tesla, GM, Ford, etc.)
- Tech companies (Alphabet, Amazon, NVIDIA, etc.)
- Chinese EV/AV companies (Baidu, NIO, XPeng, etc.)
- Sensor/LiDAR companies (Luminar, Ouster, etc.)

### 4. Initial Stock Data Fetch

Fetch historical stock prices for all public companies:

```bash
# Fetch last 100 days of stock prices (takes ~10 minutes due to rate limits)
node src/ingest/stockDataFetcher.js

# Include fundamental data (P/E, market cap, etc.) - takes longer
node src/ingest/stockDataFetcher.js --fundamentals
```

### 5. Schedule Auto-Updates

The stock data scheduler will automatically:
- Update stock prices daily at 6 PM ET (weekdays)
- Update fundamental metrics weekly on Saturdays at 10 AM

To enable schedulers, update your main server file to import:

```javascript
import { initializeInvestmentSchedulers } from './scheduler/investmentScheduler.js';

// After starting server
initializeInvestmentSchedulers();
```

## API Endpoints

### Investment Dashboard
```
GET /api/investment/dashboard?days=7
```
Returns overview with top performers, business news, metrics, and sentiment.

### Companies
```
GET /api/investment/companies?publicOnly=true&sector=Autonomous%20Vehicles
```
Get all AV companies with optional filters.

### Stock Prices
```
GET /api/investment/stocks/latest?limit=50
GET /api/investment/stocks/{ticker}/history?days=30
GET /api/investment/stocks/performance?days=30&limit=20
```

### Company Metrics
```
GET /api/investment/metrics?limit=20
```
Get fundamental metrics (P/E, market cap, beta, etc.)

### Sentiment Analysis
```
GET /api/investment/sentiment-correlation?days=30&minMentions=5
```
Correlate news sentiment with stock performance.

### Business News
```
GET /api/investment/business-news?limit=20&days=7
```
Get business/market/partnership category articles.

## Data Sources

### Stock Data
- **Provider:** Alpha Vantage
- **Coverage:** US and international stocks
- **Update Frequency:** Daily (end of day)
- **Historical Data:** Up to 20 years

### Company Metadata
- Manually curated in `config/avCompanies.js`
- Regularly updated with new AV companies
- Maps company names to stock tickers

### News Sentiment
- Aggregated from existing article analysis
- Calculated daily per company
- Includes mention counts and sentiment scores

## File Structure

```
av-insights-backend/
├── config/
│   └── avCompanies.js          # Company-to-ticker mapping
├── db/
│   └── schema_investment_data.sql  # Database schema
├── scripts/
│   └── seedCompanies.js        # Seed company data
├── src/
│   ├── ingest/
│   │   └── stockDataFetcher.js # Fetch stock prices from API
│   ├── scheduler/
│   │   └── investmentScheduler.js  # Cron jobs for updates
│   └── api/
│       ├── queries.js          # Investment data queries (bottom)
│       └── server.js           # API endpoints
```

## Usage Examples

### Manual Stock Update

```bash
# Update all stocks
node src/ingest/stockDataFetcher.js

# Update with fundamentals (slower)
node src/ingest/stockDataFetcher.js --fundamentals
```

### Query Examples

```javascript
// Get top performing stocks
const performance = await getStockPerformance({ days: 30, limit: 10 });

// Get stock history
const history = await getStockPriceHistory('TSLA', { days: 90 });

// Get company metrics
const metrics = await getCompanyMetrics({ limit: 20 });

// Get sentiment correlation
const correlation = await getInvestmentSentimentCorrelation({ 
  days: 30, 
  minMentions: 5 
});
```

## Alternative Data Sources

If you need more than the Alpha Vantage free tier:

### Free Options:
- **Yahoo Finance** (via yfinance Python library or unofficial APIs)
- **IEX Cloud** (free tier: 50k requests/month)
- **Finnhub** (free tier: 60 calls/minute)
- **Polygon.io** (free tier: limited historical data)

### Paid Options:
- **Alpha Vantage Premium** ($49.99/month - 75 calls/minute)
- **Twelve Data** ($29/month - real-time & historical)
- **Financial Modeling Prep** ($29/month - fundamentals)
- **Quandl** (various pricing - comprehensive financial data)

## Troubleshooting

### Rate Limit Errors
If you see "Rate limit reached" errors:
- Wait 1 minute and try again
- Reduce concurrent requests
- Consider upgrading API plan

### Missing Stock Data
If a company's stock data isn't appearing:
- Verify ticker symbol is correct in `avCompanies.js`
- Check if company is publicly traded
- Ensure `is_public: true` in config

### Empty Results
If queries return empty:
- Run `seedCompanies.js` first
- Run initial stock data fetch
- Check database tables have data

## Future Enhancements

- [ ] Support for crypto/blockchain AV projects
- [ ] Insider trading tracking
- [ ] Patent filing analysis
- [ ] Funding round tracking
- [ ] Analyst ratings aggregation
- [ ] Options flow data
- [ ] Real-time WebSocket price updates
- [ ] Custom investment portfolios
- [ ] Price alerts and notifications
