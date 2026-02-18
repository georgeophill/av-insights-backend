// src/api/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  getRecentArticles,
  getTopCompanies,
  getCategoryStats,
  getDashboardStats,
  getSentimentStats,
  searchArticles,
  getTrendingThemes,
  getActivityTimeline,
  getFeaturedArticles,
  getCompanyMomentum,
  getCompanyCoMentions,
  getSourceMetrics,
  getRegulatoryInsights,
  getAVLocations,
  getAVCompanies,
  getLatestStockPrices,
  getStockPriceHistory,
  getStockPerformance,
  getCompanyMetrics,
  getInvestmentSentimentCorrelation,
  getBusinessArticles,
  getInvestmentDashboard,
} from "./queries.js";
import { openai } from "../llm/openaiClient.js";

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    service: "AV Insights API",
    status: "running",
    version: "1.0.0",
  });
});

// Dashboard stats
app.get("/api/stats", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await getDashboardStats({ days });
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Recent articles with filters
app.get("/api/articles", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      category: req.query.category || null,
      sentiment: req.query.sentiment || null,
      minRelevance: parseFloat(req.query.minRelevance) || 0.5,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };
    const articles = await getRecentArticles(options);
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: error.message });
  }
});

// Top companies
app.get("/api/companies", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      days: parseInt(req.query.days) || 30,
    };
    const companies = await getTopCompanies(options);
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: error.message });
  }
});

// Category breakdown
app.get("/api/categories", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const categories = await getCategoryStats({ days });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sentiment distribution
app.get("/api/sentiment", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const sentiment = await getSentimentStats({ days });
    res.json(sentiment);
  } catch (error) {
    console.error("Error fetching sentiment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Search articles
app.get("/api/search", async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term 'q' is required" });
    }
    const options = {
      limit: parseInt(req.query.limit) || 20,
    };
    const results = await searchArticles(searchTerm, options);
    res.json(results);
  } catch (error) {
    console.error("Error searching articles:", error);
    res.status(500).json({ error: error.message });
  }
});

// Trending themes/topics
app.get("/api/trends/themes", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 15,
      days: parseInt(req.query.days) || 7,
    };
    const themes = await getTrendingThemes(options);
    res.json(themes);
  } catch (error) {
    console.error("Error fetching trending themes:", error);
    res.status(500).json({ error: error.message });
  }
});

// Activity timeline
app.get("/api/trends/timeline", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const timeline = await getActivityTimeline({ days });
    res.json(timeline);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ error: error.message });
  }
});

// Featured high-impact articles
app.get("/api/featured", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 10,
      days: parseInt(req.query.days) || 7,
    };
    const featured = await getFeaturedArticles(options);
    res.json(featured);
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    res.status(500).json({ error: error.message });
  }
});

// Company momentum (trending companies)
app.get("/api/companies/momentum", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const momentum = await getCompanyMomentum({ limit });
    res.json(momentum);
  } catch (error) {
    console.error("Error fetching company momentum:", error);
    res.status(500).json({ error: error.message });
  }
});

// Company co-mentions
app.get("/api/companies/co-mentions", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 10,
      days: parseInt(req.query.days) || 30,
    };
    const coMentions = await getCompanyCoMentions(options);
    res.json(coMentions);
  } catch (error) {
    console.error("Error fetching co-mentions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Source performance metrics
app.get("/api/sources", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const metrics = await getSourceMetrics({ days });
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching source metrics:", error);
    res.status(500).json({ error: error.message });
  }
});

// Regulatory insights
app.get("/api/regulatory", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 10,
      days: parseInt(req.query.days) || 30,
    };
    const insights = await getRegulatoryInsights(options);
    res.json(insights);
  } catch (error) {
    console.error("Error fetching regulatory insights:", error);
    res.status(500).json({ error: error.message });
  }
});

// AV Locations
app.get("/api/locations", async (req, res) => {
  try {
    const status = req.query.status;
    const locations = await getAVLocations({ status });
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INVESTMENT ENDPOINTS
// ============================================================================

// Investment dashboard overview
app.get("/api/investment/dashboard", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const dashboard = await getInvestmentDashboard({ days });
    res.json(dashboard);
  } catch (error) {
    console.error("Error fetching investment dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all AV companies
app.get("/api/investment/companies", async (req, res) => {
  try {
    const options = {
      publicOnly: req.query.publicOnly === "true",
      sector: req.query.sector || null,
    };
    const companies = await getAVCompanies(options);
    res.json(companies);
  } catch (error) {
    console.error("Error fetching AV companies:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get latest stock prices
app.get("/api/investment/stocks/latest", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const prices = await getLatestStockPrices({ limit });
    res.json(prices);
  } catch (error) {
    console.error("Error fetching latest stock prices:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get stock price history for a specific ticker
app.get("/api/investment/stocks/:ticker/history", async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = parseInt(req.query.days) || 30;
    const history = await getStockPriceHistory(ticker, { days });
    res.json(history);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get stock performance rankings
app.get("/api/investment/stocks/performance", async (req, res) => {
  try {
    const options = {
      days: parseInt(req.query.days) || 30,
      limit: parseInt(req.query.limit) || 20,
    };
    const performance = await getStockPerformance(options);
    res.json(performance);
  } catch (error) {
    console.error("Error fetching stock performance:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get company fundamental metrics
app.get("/api/investment/metrics", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const metrics = await getCompanyMetrics({ limit });
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching company metrics:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get sentiment-price correlation
app.get("/api/investment/sentiment-correlation", async (req, res) => {
  try {
    const options = {
      days: parseInt(req.query.days) || 30,
      minMentions: parseInt(req.query.minMentions) || 5,
    };
    const correlation = await getInvestmentSentimentCorrelation(options);
    res.json(correlation);
  } catch (error) {
    console.error("Error fetching sentiment correlation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get business-focused articles
app.get("/api/investment/business-news", async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      days: parseInt(req.query.days) || 7,
    };
    const articles = await getBusinessArticles(options);
    res.json(articles);
  } catch (error) {
    console.error("Error fetching business articles:", error);
    res.status(500).json({ error: error.message });
  }
});

// AI Chat with RAG
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: "Question is required" });
    }

    // Extract key search terms from the question using AI
    const keywordExtraction = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Extract the most important company names and key topics from this question about autonomous vehicles. Return ONLY the keywords separated by spaces, no other text: "${question}"`
      }],
      temperature: 0.3,
      max_tokens: 50,
    });

    const searchTerms = keywordExtraction.choices[0].message.content.trim();
    console.log(`[Chat] Question: "${question}" -> Search terms: "${searchTerms}"`);

    // Search for relevant articles using the extracted keywords
    const articles = await searchArticles(searchTerms, { limit: 8 });

    // Build context from article summaries
    let context = "";
    if (articles.length > 0) {
      context = "Here are relevant articles from the AV industry database:\n\n";
      articles.forEach((article, idx) => {
        const summaries = Array.isArray(article.ai_summary) 
          ? article.ai_summary.join(' ') 
          : '';
        const companies = Array.isArray(article.ai_companies)
          ? article.ai_companies.join(', ')
          : '';
        context += `Article ${idx + 1}: "${article.title}"\n`;
        context += `Companies: ${companies}\n`;
        context += `Summary: ${summaries}\n`;
        context += `Published: ${article.published_at}\n\n`;
      });
    } else {
      context = "No relevant articles found in the database.\n\n";
    }

    // Call OpenAI with RAG context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in autonomous vehicles (AV) and the AV industry. 
Answer questions based ONLY on the provided article context. If the context doesn't contain 
enough information to answer the question, say so clearly. Be concise but informative. 
Always cite which companies or topics are mentioned in the articles when relevant.`
        },
        {
          role: "user",
          content: `${context}\n\nQuestion: ${question}\n\nAnswer:`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = completion.choices[0].message.content;

    // Return response with sources
    res.json({
      answer,
      sources: articles.map(a => ({
        id: a.id,
        title: a.title,
        url: a.url,
        published_at: a.published_at,
        companies: a.ai_companies,
      }))
    });

  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AV Insights API running on http://localhost:${PORT}`);
  console.log(`📱 Access from phone: http://192.168.0.131:${PORT}`);
  console.log(`📊 Dashboard stats: http://localhost:${PORT}/api/stats`);
  console.log(`📰 Recent articles: http://localhost:${PORT}/api/articles`);
  console.log(`🏢 Top companies: http://localhost:${PORT}/api/companies`);
});
