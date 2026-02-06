// src/api/testNewEndpoints.js
import "dotenv/config";
import {
  getTrendingThemes,
  getActivityTimeline,
  getFeaturedArticles,
  getCompanyMomentum,
  getCompanyCoMentions,
  getSourceMetrics,
  getRegulatoryInsights,
} from "./queries.js";

async function testNewEndpoints() {
  console.log("🧪 Testing New Analytics Endpoints\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Trending Themes
    console.log("\n📈 TRENDING THEMES (Last 7 days):");
    console.log("-".repeat(60));
    const themes = await getTrendingThemes({ limit: 10, days: 7 });
    themes.forEach((t, i) => console.log(`  ${i + 1}. ${t.theme} (${t.count} mentions)`));

    // Test 2: Activity Timeline
    console.log("\n⏰ ACTIVITY TIMELINE (Last 14 days):");
    console.log("-".repeat(60));
    const timeline = await getActivityTimeline({ days: 14 });
    timeline.slice(-7).forEach((day) => {
      console.log(`  ${day.date}: ${day.count} articles`);
    });

    // Test 3: Featured High-Impact Articles
    console.log("\n🔥 FEATURED HIGH-IMPACT ARTICLES:");
    console.log("-".repeat(60));
    const featured = await getFeaturedArticles({ limit: 5, days: 7 });
    featured.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title}`);
      console.log(`     Impact: ${a.ai_impact} | Relevance: ${a.ai_relevance_score} | Category: ${a.ai_category}`);
      console.log(`     Companies: ${a.ai_companies?.join(", ") || "none"}`);
    });

    // Test 4: Company Momentum
    console.log("\n⚡ COMPANY MOMENTUM (Trending Up/Down):");
    console.log("-".repeat(60));
    const momentum = await getCompanyMomentum({ limit: 10 });
    momentum.forEach((m) => {
      const arrow = m.trend === "up" ? "↗️" : m.trend === "down" ? "↘️" : "→";
      const change = m.change > 0 ? `+${m.change}` : m.change;
      console.log(`  ${arrow} ${m.company}: ${m.recentCount} mentions (${change} from prev week)`);
    });

    // Test 5: Company Co-Mentions
    console.log("\n🤝 COMPANY CO-MENTIONS:");
    console.log("-".repeat(60));
    const coMentions = await getCompanyCoMentions({ limit: 8, days: 30 });
    coMentions.forEach((cm, i) => {
      console.log(`  ${i + 1}. ${cm.pair} (${cm.count} articles together)`);
    });

    // Test 6: Source Performance
    console.log("\n🏆 SOURCE PERFORMANCE METRICS:");
    console.log("-".repeat(60));
    const sources = await getSourceMetrics({ days: 30 });
    sources.forEach((s) => {
      console.log(`  ${s.name}:`);
      console.log(`     Total: ${s.totalArticles} | Relevant: ${s.relevantArticles} (${s.relevanceRate}%)`);
      console.log(`     High Impact: ${s.highImpactArticles} | Avg Score: ${s.avgRelevanceScore}`);
    });

    // Test 7: Regulatory Insights
    console.log("\n⚖️  REGULATORY INSIGHTS:");
    console.log("-".repeat(60));
    const regulatory = await getRegulatoryInsights({ limit: 5, days: 30 });
    regulatory.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     Category: ${r.ai_category} | Companies: ${r.ai_companies?.join(", ") || "none"}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ All new endpoints tested successfully!\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNewEndpoints();
