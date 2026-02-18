-- Investment Data Schema for AV Insights
-- Run this SQL in your Supabase SQL editor

-- Table: av_companies
-- Master list of AV companies with stock ticker mapping
CREATE TABLE IF NOT EXISTS av_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  ticker VARCHAR(10),
  exchange VARCHAR(10), -- NASDAQ, NYSE, etc.
  is_public BOOLEAN DEFAULT false,
  sector VARCHAR(100),
  market_cap BIGINT,
  description TEXT,
  website VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: stock_prices
-- Daily stock price data for tracked companies
CREATE TABLE IF NOT EXISTS stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES av_companies(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  close DECIMAL(10, 2),
  volume BIGINT,
  adj_close DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticker, date)
);

-- Table: company_financials
-- Quarterly/annual financial metrics
CREATE TABLE IF NOT EXISTS company_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES av_companies(id) ON DELETE CASCADE,
  fiscal_period VARCHAR(10), -- Q1, Q2, Q3, Q4, or ANNUAL
  fiscal_year INTEGER NOT NULL,
  revenue BIGINT,
  net_income BIGINT,
  earnings_per_share DECIMAL(10, 2),
  research_and_development BIGINT,
  operating_cash_flow BIGINT,
  report_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, fiscal_period, fiscal_year)
);

-- Table: company_metrics
-- Real-time or daily company metrics and ratios
CREATE TABLE IF NOT EXISTS company_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES av_companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  market_cap BIGINT,
  pe_ratio DECIMAL(10, 2),
  price_to_book DECIMAL(10, 2),
  dividend_yield DECIMAL(5, 2),
  beta DECIMAL(5, 2),
  fifty_two_week_high DECIMAL(10, 2),
  fifty_two_week_low DECIMAL(10, 2),
  avg_volume_30d BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- Table: company_news_sentiment
-- Aggregated sentiment scores from articles per company per day
CREATE TABLE IF NOT EXISTS company_news_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES av_companies(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  mention_count INTEGER DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  avg_sentiment_score DECIMAL(3, 2), -- -1 to 1 scale
  high_impact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_name, date)
);

-- Table: investment_events
-- Track major investment-related events (funding, IPOs, M&A, etc.)
CREATE TABLE IF NOT EXISTS investment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES av_companies(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'funding', 'ipo', 'merger', 'acquisition', 'partnership'
  event_date DATE NOT NULL,
  amount BIGINT, -- in USD
  description TEXT,
  source_url VARCHAR(500),
  article_ids TEXT[], -- References to related articles
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker_date ON stock_prices(ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_company_id ON stock_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_company_financials_company_year ON company_financials(company_id, fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_company_metrics_company_date ON company_metrics(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_company_news_sentiment_date ON company_news_sentiment(date DESC);
CREATE INDEX IF NOT EXISTS idx_company_news_sentiment_company ON company_news_sentiment(company_name);
CREATE INDEX IF NOT EXISTS idx_investment_events_company_date ON investment_events(company_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_investment_events_type ON investment_events(event_type);

-- Enable Row Level Security (recommended for Supabase)
ALTER TABLE av_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_news_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_events ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (adjust based on your auth requirements)
CREATE POLICY "Allow public read access on av_companies" ON av_companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access on stock_prices" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read access on company_financials" ON company_financials FOR SELECT USING (true);
CREATE POLICY "Allow public read access on company_metrics" ON company_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read access on company_news_sentiment" ON company_news_sentiment FOR SELECT USING (true);
CREATE POLICY "Allow public read access on investment_events" ON investment_events FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_av_companies_updated_at BEFORE UPDATE ON av_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_news_sentiment_updated_at BEFORE UPDATE ON company_news_sentiment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
