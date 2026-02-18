# Investment Data - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Database Setup
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy and paste the contents of `db/schema_investment_data.sql`
3. Click "Run" to create all investment tables

### Step 2: Get API Key
1. Visit https://www.alphavantage.co/support/#api-key
2. Enter your email to get a free API key instantly
3. Add to `.env` file:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

### Step 3: Seed Companies
```bash
npm run seed:companies
```
This loads 80+ AV companies including Tesla, Waymo, Cruise, Aurora, etc.

### Step 4: Load Initial Stock Data
```bash
npm run update:stocks
```
⏱️ Takes ~10 minutes due to rate limits (5 calls/min)

### Step 5: Test the API
```bash
# In one terminal, start the server
npm run api

# In another terminal, test endpoints
curl http://localhost:3001/api/investment/dashboard
curl http://localhost:3001/api/investment/stocks/latest
curl http://localhost:3001/api/investment/stocks/TSLA/history?days=30
```

## 📊 Investment API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/investment/dashboard` | Overview: top performers, news, metrics |
| `/api/investment/companies` | All AV companies (filter by public/sector) |
| `/api/investment/stocks/latest` | Latest prices for all stocks |
| `/api/investment/stocks/:ticker/history` | Price history for single stock |
| `/api/investment/stocks/performance` | Performance rankings |
| `/api/investment/metrics` | Fundamentals (P/E, market cap) |
| `/api/investment/sentiment-correlation` | News sentiment vs stock price |
| `/api/investment/business-news` | Business category articles |

## 📈 Available Companies

### Pure-Play AV (Public)
- **Aurora (AUR)** - Self-driving trucks
- **Mobileye (MBLY)** - Intel-owned AV tech
- **TuSimple (TSP)** - Autonomous trucking

### Traditional Auto
- **Tesla (TSLA)** - EV + FSD
- **General Motors (GM)** - Owner of Cruise
- **Ford (F)** - AV programs
- **Toyota (TM)**, **Volkswagen (VWAGY)**, **BMW (BMWYY)**

### Tech Giants
- **Alphabet/Google (GOOGL)** - Waymo parent
- **Amazon (AMZN)** - Zoox owner
- **NVIDIA (NVDA)** - AI chips
- **Intel (INTC)** - Mobileye parent
- **Apple (AAPL)**, **Microsoft (MSFT)**

### Chinese EV/AV
- **Baidu (BIDU)** - Apollo platform
- **NIO (NIO)**, **XPeng (XPEV)**, **Li Auto (LI)**
- **BYD (BYDDY)**

### Sensors/Components
- **Luminar (LAZR)** - LiDAR
- **Ouster (OUST)** - LiDAR
- **Innoviz (INVZ)** - LiDAR

### Ride-Sharing
- **Uber (UBER)**, **Lyft (LYFT)**, **Didi (DIDI)**

Total: **50+ public companies tracked**

## 🤖 Auto-Updates

Once you add the scheduler to your main server:

```javascript
// In src/start.js or src/api/server.js
import { initializeInvestmentSchedulers } from './scheduler/investmentScheduler.js';

// After starting server
initializeInvestmentSchedulers();
```

**Daily Updates:**
- Stock prices update at 6 PM ET (weekdays)
- After market close at 4 PM ET

**Weekly Updates:**
- Fundamentals update Saturdays at 10 AM
- P/E ratios, market cap, beta, etc.

## 💡 Investment Page Ideas

### 1. Performance Dashboard
- Top/bottom performers (day, week, month)
- Gainers/losers table with % change
- Sector performance comparison

### 2. Stock Charts
- Price history charts (candlestick or line)
- Volume overlay
- Compare multiple stocks

### 3. Company Fundamentals
- P/E ratio comparison
- Market cap rankings
- Valuation metrics table

### 4. Sentiment Analysis
- News sentiment vs stock price correlation
- Sentiment heatmap by company
- High-impact business news feed

### 5. Market Signals
- Business/partnership articles
- Momentum indicators (trending up/down)
- Company co-mentions (potential partnerships)

### 6. Sector Analysis
- Group by sector (AV, Traditional Auto, Tech, Sensors)
- Sector performance comparison
- Market cap distribution pie chart

## 📦 Files Created

```
av-insights-backend/
├── config/
│   └── avCompanies.js                   # 80+ companies with tickers
├── db/
│   ├── schema_investment_data.sql       # Database schema
│   └── README_INVESTMENT.md             # Full documentation
├── scripts/
│   └── seedCompanies.js                 # Populate companies table
├── src/
│   ├── ingest/
│   │   └── stockDataFetcher.js          # Fetch from Alpha Vantage
│   ├── scheduler/
│   │   └── investmentScheduler.js       # Cron jobs
│   └── api/
│       ├── queries.js                   # +10 new investment queries
│       └── server.js                    # +8 new API endpoints
└── package.json                         # +3 npm scripts
```

## 🎯 Next Steps

1. **Run the setup** (Steps 1-4 above)
2. **Test API endpoints** with curl or Postman
3. **Create Investment page** in frontend
4. **Add to Navigation** with TrendingUp or DollarSign icon
5. **Build visualizations** (charts, tables, cards)

## 🆘 Need Help?

See detailed docs: `db/README_INVESTMENT.md`

Common issues:
- **Rate limit errors:** Wait 1 minute, or upgrade API plan
- **Empty data:** Run `npm run seed:companies` first
- **Missing tickers:** Check `config/avCompanies.js`

---

**Ready to visualize investment data? Let's build the frontend! 🚀**
