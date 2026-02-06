// src/api/testQueries.js
import "dotenv/config";
import {
  getRecentArticles,
  getTopCompanies,
  getCategoryStats,
  getDashboardStats,
  getSentimentStats,
} from "./queries.js";

async function testQueries() {
  console.log("Testing Analytics Queries...\n");

  try {
    // Test 1: Dashboard Stats
    console.log("📊 Dashboard Stats:");
    const stats = await getDashboardStats({ days: 7 });
    console.log(JSON.stringify(stats, null, 2));
    console.log();

    // Test 2: Top Companies
    console.log("🏢 Top 10 Companies (Last 30 days):");
    const companies = await getTopCompanies({ limit: 10, days: 30 });
    companies.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}: ${c.count} mentions`));
    console.log();

    // Test 3: Category Breakdown
    console.log("📁 Categories:");
    const categories = await getCategoryStats({ days: 30 });
    categories.forEach((c) => console.log(`  ${c.name}: ${c.count}`));
    console.log();

    // Test 4: Sentiment
    console.log("😊 Sentiment Distribution:");
    const sentiment = await getSentimentStats({ days: 30 });
    sentiment.forEach((s) => console.log(`  ${s.sentiment}: ${s.count}`));
    console.log();

    // Test 5: Recent Articles
    console.log("📰 Recent Articles (5 most recent):");
    const articles = await getRecentArticles({ limit: 5 });
    articles.forEach((a) => {
      console.log(`  • ${a.title}`);
      console.log(`    Category: ${a.ai_category} | Relevance: ${a.ai_relevance_score} | Source: ${a.sources?.name}`);
      console.log(`    Companies: ${a.ai_companies?.join(", ") || "none"}`);
      console.log();
    });

    console.log("✅ All queries executed successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testQueries();
