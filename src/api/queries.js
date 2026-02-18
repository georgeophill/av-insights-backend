// src/api/queries.js
import { supabase } from "../db/supabaseClient.js";

/**
 * Get recent AV-relevant articles with optional filters
 */
export async function getRecentArticles(options = {}) {
  const {
    limit = 20,
    offset = 0,
    category = null,
    sentiment = null,
    minRelevance = 0.5,
    startDate = null,
    endDate = null,
  } = options;

  let query = supabase
    .from("articles")
    .select(`
      id,
      title,
      url,
      published_at,
      ai_category,
      ai_sentiment,
      ai_impact,
      ai_relevance_score,
      ai_companies,
      ai_summary,
      ai_themes,
      sources (name)
    `)
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("ai_relevance_score", minRelevance)
    .order("published_at", { ascending: false });

  if (category) {
    query = query.eq("ai_category", category);
  }

  if (sentiment) {
    query = query.eq("ai_sentiment", sentiment);
  }

  if (startDate) {
    query = query.gte("published_at", startDate);
  }

  if (endDate) {
    query = query.lte("published_at", endDate);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  return data;
}

/**
 * Get top companies by mention count
 */
export async function getTopCompanies(options = {}) {
  const { limit = 20, days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select("ai_companies, published_at")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .not("ai_companies", "is", null);

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  // Flatten and count companies
  const companyCounts = {};
  data.forEach((article) => {
    if (Array.isArray(article.ai_companies)) {
      article.ai_companies.forEach((company) => {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      });
    }
  });

  // Sort and limit
  const topCompanies = Object.entries(companyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return topCompanies;
}

/**
 * Get category breakdown with counts
 */
export async function getCategoryStats(options = {}) {
  const { days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select("ai_category")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .not("ai_category", "is", null);

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  // Count by category
  const categoryCounts = {};
  data.forEach((article) => {
    const cat = article.ai_category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return categories;
}

/**
 * Get dashboard stats/metrics
 */
export async function getDashboardStats(options = {}) {
  const { days = 7 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Total articles processed
  const { count: totalProcessed, error: e1 } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("ai_status", "done");

  // AV-relevant articles
  const { count: avRelevant, error: e2 } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true);

  // Recent articles (last N days)
  const { count: recentCount, error: e3 } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString());

  // Processing queue
  const { count: pendingCount, error: e4 } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("ai_status", "pending");

  // High impact articles (recent)
  const { count: highImpact, error: e5 } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .eq("ai_impact", "high")
    .gte("published_at", cutoffDate.toISOString());

  if (e1 || e2 || e3 || e4 || e5) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return {
    totalProcessed: totalProcessed || 0,
    avRelevant: avRelevant || 0,
    recentArticles: recentCount || 0,
    pendingQueue: pendingCount || 0,
    highImpactRecent: highImpact || 0,
    relevanceRate: totalProcessed > 0 ? (avRelevant / totalProcessed).toFixed(2) : 0,
  };
}

/**
 * Get sentiment distribution
 */
export async function getSentimentStats(options = {}) {
  const { days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select("ai_sentiment")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .not("ai_sentiment", "is", null);

  if (error) {
    throw new Error(`Failed to fetch sentiment: ${error.message}`);
  }

  const sentimentCounts = {};
  data.forEach((article) => {
    const sentiment = article.ai_sentiment;
    sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
  });

  return Object.entries(sentimentCounts).map(([sentiment, count]) => ({
    sentiment,
    count,
  }));
}

/**
 * Search articles by keyword
 */
export async function searchArticles(searchTerm, options = {}) {
  const { limit = 20 } = options;

  // Split into keywords
  const keywords = searchTerm.split(/\s+/).filter(k => k.length > 2);
  
  if (keywords.length === 0) {
    return [];
  }

  // Fetch a large pool of recent articles to search through
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      url,
      published_at,
      ai_category,
      ai_companies,
      ai_summary,
      sources (name)
    `)
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .order("published_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Failed to search articles: ${error.message}`);
  }

  // Filter client-side for keywords in title, companies, or summary
  const filteredArticles = data.filter(article => {
    const searchText = [
      article.title,
      JSON.stringify(article.ai_companies || []),
      JSON.stringify(article.ai_summary || [])
    ].join(' ').toLowerCase();

    return keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  });

  return filteredArticles.slice(0, limit);
}

/**
 * Get trending themes/topics
 */
export async function getTrendingThemes(options = {}) {
  const { limit = 15, days = 7 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select("ai_themes, published_at")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .not("ai_themes", "is", null);

  if (error) {
    throw new Error(`Failed to fetch themes: ${error.message}`);
  }

  const themeCounts = {};
  data.forEach((article) => {
    if (Array.isArray(article.ai_themes)) {
      article.ai_themes.forEach((theme) => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    }
  });

  return Object.entries(themeCounts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get article activity timeline (by day)
 */
export async function getActivityTimeline(options = {}) {
  const { days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select("published_at, ai_category")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .order("published_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch timeline: ${error.message}`);
  }

  // Group by date
  const timelineCounts = {};
  data.forEach((article) => {
    const date = article.published_at?.split("T")[0];
    if (date) {
      if (!timelineCounts[date]) {
        timelineCounts[date] = { date, count: 0, categories: {} };
      }
      timelineCounts[date].count++;
      const cat = article.ai_category || "uncategorized";
      timelineCounts[date].categories[cat] = (timelineCounts[date].categories[cat] || 0) + 1;
    }
  });

  return Object.values(timelineCounts).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get high-impact featured articles
 */
export async function getFeaturedArticles(options = {}) {
  const { limit = 10, days = 7 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      url,
      published_at,
      ai_category,
      ai_impact,
      ai_sentiment,
      ai_relevance_score,
      ai_companies,
      ai_summary,
      ai_regulatory_relevance,
      sources (name)
    `)
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .eq("ai_impact", "high")
    .gte("published_at", cutoffDate.toISOString())
    .order("ai_relevance_score", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured articles: ${error.message}`);
  }

  return data;
}

/**
 * Get company momentum (trending up/down)
 */
export async function getCompanyMomentum(options = {}) {
  const { limit = 10 } = options;

  // Get recent mentions (last 7 days)
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 7);

  // Get previous period (7-14 days ago)
  const previousCutoff = new Date();
  previousCutoff.setDate(previousCutoff.getDate() - 14);

  const { data, error } = await supabase
    .from("articles")
    .select("ai_companies, published_at")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", previousCutoff.toISOString())
    .not("ai_companies", "is", null);

  if (error) {
    throw new Error(`Failed to fetch momentum: ${error.message}`);
  }

  const recentCounts = {};
  const previousCounts = {};

  data.forEach((article) => {
    const isRecent = new Date(article.published_at) >= recentCutoff;
    const counts = isRecent ? recentCounts : previousCounts;

    if (Array.isArray(article.ai_companies)) {
      article.ai_companies.forEach((company) => {
        counts[company] = (counts[company] || 0) + 1;
      });
    }
  });

  const momentum = Object.keys({ ...recentCounts, ...previousCounts }).map((company) => {
    const recent = recentCounts[company] || 0;
    const previous = previousCounts[company] || 0;
    const change = recent - previous;
    const percentChange = previous > 0 ? ((change / previous) * 100).toFixed(1) : null;

    return {
      company,
      recentCount: recent,
      previousCount: previous,
      change,
      percentChange: percentChange ? parseFloat(percentChange) : null,
      trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
    };
  });

  return momentum
    .filter((m) => m.recentCount > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, limit);
}

/**
 * Get company co-mentions (which companies appear together)
 */
export async function getCompanyCoMentions(options = {}) {
  const { limit = 10, days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select("ai_companies")
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .not("ai_companies", "is", null);

  if (error) {
    throw new Error(`Failed to fetch co-mentions: ${error.message}`);
  }

  const pairs = {};

  data.forEach((article) => {
    const companies = article.ai_companies || [];
    if (companies.length < 2) return;

    // Create pairs
    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        const pair = [companies[i], companies[j]].sort().join(" + ");
        pairs[pair] = (pairs[pair] || 0) + 1;
      }
    }
  });

  return Object.entries(pairs)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get source performance/quality metrics
 */
export async function getSourceMetrics(options = {}) {
  const { days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select(`
      source_id,
      ai_av_relevance,
      ai_relevance_score,
      ai_impact,
      sources (name)
    `)
    .eq("ai_status", "done")
    .gte("published_at", cutoffDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch source metrics: ${error.message}`);
  }

  const metrics = {};

  data.forEach((article) => {
    const sourceName = article.sources?.name || "Unknown";
    if (!metrics[sourceName]) {
      metrics[sourceName] = {
        name: sourceName,
        total: 0,
        relevant: 0,
        highImpact: 0,
        avgRelevance: 0,
        relevanceSum: 0,
      };
    }

    metrics[sourceName].total++;
    if (article.ai_av_relevance) {
      metrics[sourceName].relevant++;
      metrics[sourceName].relevanceSum += article.ai_relevance_score || 0;
    }
    if (article.ai_impact === "high") {
      metrics[sourceName].highImpact++;
    }
  });

  return Object.values(metrics)
    .map((m) => ({
      name: m.name,
      totalArticles: m.total,
      relevantArticles: m.relevant,
      highImpactArticles: m.highImpact,
      relevanceRate: m.total > 0 ? ((m.relevant / m.total) * 100).toFixed(1) : 0,
      avgRelevanceScore: m.relevant > 0 ? (m.relevanceSum / m.relevant).toFixed(2) : 0,
    }))
    .sort((a, b) => b.relevantArticles - a.relevantArticles);
}

/**
 * Get regulatory-focused insights
 */
export async function getRegulatoryInsights(options = {}) {
  const { limit = 10, days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      url,
      published_at,
      ai_category,
      ai_companies,
      ai_summary,
      sources (name)
    `)
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .eq("ai_regulatory_relevance", true)
    .gte("published_at", cutoffDate.toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch regulatory insights: ${error.message}`);
  }

  return data;
}

/**
 * Get AV locations worldwide
 */
export async function getAVLocations(options = {}) {
  const { status } = options;

  let query = supabase
    .from("av_locations")
    .select("*")
    .order("city", { ascending: true });

  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch AV locations: ${error.message}`);
  }

  return data;
}

// ============================================================================
// INVESTMENT DATA QUERIES
// ============================================================================

/**
 * Get all AV companies with optional filters
 */
export async function getAVCompanies(options = {}) {
  const { publicOnly = false, sector = null } = options;

  let query = supabase
    .from("av_companies")
    .select("*")
    .order("name", { ascending: true });

  if (publicOnly) {
    query = query.eq("is_public", true).not("ticker", "is", null);
  }

  if (sector) {
    query = query.eq("sector", sector);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data;
}

/**
 * Get latest stock prices for all companies
 */
export async function getLatestStockPrices(options = {}) {
  const { limit = 50 } = options;

  const { data, error } = await supabase
    .from("stock_prices")
    .select(`
      *,
      av_companies (name, sector)
    `)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch stock prices: ${error.message}`);
  }

  // Group by ticker to get latest price for each
  const latestPrices = {};
  data.forEach((price) => {
    if (!latestPrices[price.ticker]) {
      latestPrices[price.ticker] = price;
    }
  });

  return Object.values(latestPrices);
}

/**
 * Get stock price history for a specific company
 */
export async function getStockPriceHistory(ticker, options = {}) {
  const { days = 30 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("stock_prices")
    .select(`
      *,
      av_companies (name, sector)
    `)
    .eq("ticker", ticker)
    .gte("date", cutoffDate.toISOString().split('T')[0])
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch stock history for ${ticker}: ${error.message}`);
  }

  return data;
}

/**
 * Get stock performance metrics (returns, volatility)
 */
export async function getStockPerformance(options = {}) {
  const { days = 30, limit = 20 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get all stock prices for the period
  const { data, error } = await supabase
    .from("stock_prices")
    .select(`
      ticker,
      date,
      close,
      av_companies (name, sector)
    `)
    .gte("date", cutoffDate.toISOString().split('T')[0])
    .order("ticker", { ascending: true })
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch stock performance: ${error.message}`);
  }

  // Calculate performance metrics for each ticker
  const performanceByTicker = {};

  data.forEach((price) => {
    if (!performanceByTicker[price.ticker]) {
      performanceByTicker[price.ticker] = {
        ticker: price.ticker,
        name: price.av_companies?.name,
        sector: price.av_companies?.sector,
        prices: [],
      };
    }
    performanceByTicker[price.ticker].prices.push({
      date: price.date,
      close: parseFloat(price.close),
    });
  });

  // Calculate metrics
  const performance = Object.values(performanceByTicker).map((stock) => {
    if (stock.prices.length < 2) {
      return null;
    }

    const prices = stock.prices.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstPrice = prices[0].close;
    const lastPrice = prices[prices.length - 1].close;
    const returns = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Calculate daily returns for volatility
    const dailyReturns = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = ((prices[i].close - prices[i - 1].close) / prices[i - 1].close) * 100;
      dailyReturns.push(dailyReturn);
    }

    // Calculate volatility (standard deviation of daily returns)
    const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance);

    return {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      startPrice: firstPrice.toFixed(2),
      endPrice: lastPrice.toFixed(2),
      returns: returns.toFixed(2),
      volatility: (volatility * Math.sqrt(252)).toFixed(2), // Annualized
      dataPoints: prices.length,
    };
  }).filter(Boolean);

  return performance.sort((a, b) => parseFloat(b.returns) - parseFloat(a.returns)).slice(0, limit);
}

/**
 * Get company metrics (P/E, market cap, etc.)
 */
export async function getCompanyMetrics(options = {}) {
  const { limit = 20 } = options;

  // Get latest metrics for each company
  const { data, error } = await supabase
    .from("company_metrics")
    .select(`
      *,
      av_companies (name, ticker, sector)
    `)
    .order("date", { ascending: false })
    .limit(limit * 5); // Get more to ensure we have latest for each company

  if (error) {
    throw new Error(`Failed to fetch company metrics: ${error.message}`);
  }

  // Get latest metric for each company
  const latestMetrics = {};
  data.forEach((metric) => {
    const companyId = metric.company_id;
    if (!latestMetrics[companyId]) {
      latestMetrics[companyId] = metric;
    }
  });

  return Object.values(latestMetrics).slice(0, limit);
}

/**
 * Get investment sentiment correlation (stock price vs news sentiment)
 */
export async function getInvestmentSentimentCorrelation(options = {}) {
  const { days = 30, minMentions = 5 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get news sentiment
  const { data: sentimentData, error: sentError } = await supabase
    .from("company_news_sentiment")
    .select("*")
    .gte("date", cutoffDate.toISOString().split('T')[0])
    .gte("mention_count", minMentions);

  if (sentError) {
    throw new Error(`Failed to fetch sentiment data: ${sentError.message}`);
  }

  // Get stock prices for same period
  const { data: priceData, error: priceError } = await supabase
    .from("stock_prices")
    .select(`
      ticker,
      date,
      close,
      av_companies (name)
    `)
    .gte("date", cutoffDate.toISOString().split('T')[0]);

  if (priceError) {
    throw new Error(`Failed to fetch price data: ${priceError.message}`);
  }

  // Match companies by name and correlate
  const correlation = {};

  sentimentData.forEach((sent) => {
    const matchingPrices = priceData.filter((p) => 
      p.av_companies?.name === sent.company_name
    );

    if (matchingPrices.length > 0) {
      const ticker = matchingPrices[0].ticker;
      if (!correlation[sent.company_name]) {
        correlation[sent.company_name] = {
          company: sent.company_name,
          ticker,
          totalMentions: 0,
          avgSentiment: 0,
          sentimentSum: 0,
          sentimentCount: 0,
        };
      }

      correlation[sent.company_name].totalMentions += sent.mention_count;
      if (sent.avg_sentiment_score !== null) {
        correlation[sent.company_name].sentimentSum += sent.avg_sentiment_score * sent.mention_count;
        correlation[sent.company_name].sentimentCount += sent.mention_count;
      }
    }
  });

  // Calculate averages
  return Object.values(correlation).map((c) => ({
    company: c.company,
    ticker: c.ticker,
    totalMentions: c.totalMentions,
    avgSentiment: c.sentimentCount > 0 
      ? (c.sentimentSum / c.sentimentCount).toFixed(2) 
      : null,
  })).sort((a, b) => b.totalMentions - a.totalMentions);
}

/**
 * Get business-category articles for investment signals
 */
export async function getBusinessArticles(options = {}) {
  const { limit = 20, days = 7 } = options;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      url,
      published_at,
      ai_category,
      ai_sentiment,
      ai_impact,
      ai_companies,
      ai_summary,
      sources (name)
    `)
    .eq("ai_status", "done")
    .eq("ai_av_relevance", true)
    .in("ai_category", ["business", "stocks", "markets", "partnerships"])
    .gte("published_at", cutoffDate.toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch business articles: ${error.message}`);
  }

  return data;
}

/**
 * Get investment dashboard overview
 */
export async function getInvestmentDashboard(options = {}) {
  const { days = 7 } = options;

  try {
    const [
      topPerformers,
      businessNews,
      companyMetrics,
      sentiment
    ] = await Promise.all([
      getStockPerformance({ days, limit: 10 }),
      getBusinessArticles({ limit: 5, days }),
      getCompanyMetrics({ limit: 10 }),
      getInvestmentSentimentCorrelation({ days, minMentions: 3 })
    ]);

    return {
      topPerformers,
      businessNews,
      companyMetrics,
      sentiment,
      period: `${days} days`
    };
  } catch (error) {
    throw new Error(`Failed to fetch investment dashboard: ${error.message}`);
  }
}
