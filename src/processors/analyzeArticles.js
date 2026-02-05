import { supabase } from "../db/supabaseClient.js";
import { openai } from "../llm/openaiClient.js";
import { looksAVRelevant } from "../utils/avRelevanceHeuristic.js";
import { articleAnalysisSchema } from "../llm/articleSchema.js";

/**
 * Fetch a small batch of pending articles.
 * We'll mark them as "processing" before analyzing to avoid duplicates.
 */
async function claimPendingArticles(limit = 5) {
  // 1) Select candidate ids
  const { data: candidates, error: selectError } = await supabase
    .from("articles")
    .select("id")
    .eq("ai_status", "pending")
    .not("cleaned_content", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (selectError)
    throw new Error(`Select pending failed: ${selectError.message}`);
  if (!candidates || candidates.length === 0) return [];

  const ids = candidates.map((x) => x.id);

  // 2) Claim them (set processing) and return full rows to process
  const { data: claimed, error: claimError } = await supabase
    .from("articles")
    .update({
      ai_status: "processing",
      ai_started_at: new Date().toISOString(),
      ai_error: null,
    })
    .in("id", ids)
    .eq("ai_status", "pending")
    .select("id, title, url, cleaned_content");

  if (claimError) throw new Error(`Claim failed: ${claimError.message}`);
  return claimed || [];
}

function trimToMaxChars(text, maxChars) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[TRUNCATED]";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetries(fn, { maxRetries = 4 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;

      // 429 is the classic "rate limited" case; OpenAI rate limits are expected
      // and should be handled with backoff. [5](https://www.eweek.com/news/openai-retire-gpt4-chatgpt/)
      const msg = err?.message || "";
      const isRateLimit =
        msg.includes("429") || msg.toLowerCase().includes("rate limit");

      if (!isRateLimit || attempt > maxRetries) throw err;

      const backoffMs = Math.min(30000, 1000 * 2 ** (attempt - 1));
      console.warn(
        `[ai-worker] Rate limited, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`,
      );
      await sleep(backoffMs);
    }
  }
}

async function analyzeArticle({ title, url, cleaned_content }) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const maxChars = Number(process.env.OPENAI_MAX_INPUT_CHARS || 8000);
  const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 350);

  const text = trimToMaxChars(cleaned_content || "", maxChars);

  // Cheap heuristic to avoid spending tokens
  if (!looksAVRelevant(`${title}\n${text}`)) {
    return {
      __skip: true,
      skipped_reason: "Heuristic: not AV-relevant",
      av_relevance: false,
      relevance_score: 0,
      summary: [],
      companies: [],
      category: "other",
      sentiment: "neutral",
      impact: "low",
      regulatory_relevance: false,
      themes: [],
    };
  }

  const prompt = `
You are an autonomous vehicle (AV) industry analyst.

Analyze the article and output structured fields about AV relevance, summary, companies, and categorization.

Title: ${title}
URL: ${url}

CONTENT:
${text}
  `.trim();

  const call = async () => {
    const res = await openai.responses.create({
      model,
      input: prompt,
      max_output_tokens: maxOutputTokens,
      temperature: 0.2,
      text: {
        format: {
          type: "json_schema",
          name: articleAnalysisSchema.name,
          strict: articleAnalysisSchema.strict,
          schema: articleAnalysisSchema.schema
        }
      }
    });

    // With json_schema, the output should be valid JSON.
    const out = res.output_text;
    if (!out) throw new Error("No output_text returned from OpenAI");

    return JSON.parse(out);
  };

  const maxRetries = Number(process.env.OPENAI_MAX_RETRIES || 4);
  return withRetries(call, { maxRetries });
};

async function saveAnalysis(id, analysis) {
  const now = new Date().toISOString();

  // 1) Heuristic skip results (no OpenAI call was made)
  if (analysis.__skip) {
    const { error } = await supabase
      .from("articles")
      .update({
        ai_status: "skipped",
        ai_processed_at: now,
        ai_av_relevance: false,
        ai_relevance_score: 0,
        ai_skipped_reason: analysis.skipped_reason || "Heuristic: skipped",
        ai_summary: [],
        ai_companies: [],
        ai_category: "other",
        ai_sentiment: "neutral",
        ai_impact: "low",
        ai_regulatory_relevance: false,
        ai_themes: [],
      })
      .eq("id", id);

    if (error) throw new Error(`Save skipped failed: ${error.message}`);
    return "skipped";
  }

  // 2) Model-based relevance gate
  const isRelevant = Boolean(analysis.av_relevance);
  const score = Number(analysis.relevance_score ?? 0);

  const threshold = Number(process.env.AV_RELEVANCE_THRESHOLD ?? 0.55);

  // If the model says it's not AV relevant (or score too low), mark as skipped
  if (!isRelevant || score < threshold) {
    const { error } = await supabase
      .from("articles")
      .update({
        ai_status: "skipped",
        ai_processed_at: now,
        ai_av_relevance: isRelevant,
        ai_relevance_score: score,
        ai_themes: analysis.themes ?? [],
        ai_skipped_reason: !isRelevant
          ? "Model: not AV relevant"
          : `Model: relevance_score < ${threshold}`,

        // Keep outputs for audit/debugging
        ai_summary: analysis.summary ?? [],
        ai_companies: analysis.companies ?? [],
        ai_category: analysis.category ?? "other",
        ai_sentiment: analysis.sentiment ?? "neutral",
        ai_impact: analysis.impact ?? "low",
        ai_regulatory_relevance: Boolean(analysis.regulatory_relevance),
      })
      .eq("id", id);

    if (error) throw new Error(`Save model-skipped failed: ${error.message}`);
    return "skipped";
  }

  // 3) True AV-relevant articles: mark as done
  const { error } = await supabase
    .from("articles")
    .update({
      ai_status: "done",
      ai_processed_at: now,
      ai_av_relevance: isRelevant,
      ai_relevance_score: score,
      ai_themes: analysis.themes ?? [],

      ai_summary: analysis.summary ?? [],
      ai_companies: analysis.companies ?? [],
      ai_category: analysis.category ?? "other",
      ai_sentiment: analysis.sentiment ?? "neutral",
      ai_impact: analysis.impact ?? "low",
      ai_regulatory_relevance: Boolean(analysis.regulatory_relevance),
    })
    .eq("id", id);

  if (error) throw new Error(`Save failed: ${error.message}`);
  return "done";
}

async function markError(id, err) {
  const { error } = await supabase
    .from("articles")
    .update({
      ai_status: "error",
      ai_error: err?.message?.slice(0, 500) || String(err).slice(0, 500),
    })
    .eq("id", id);

  if (error) console.error("Failed to mark error:", error.message);
}

async function main() {
  console.log(`[ai-worker] PID=${process.pid} started at ${new Date().toISOString()}`);
  console.log("[ai-worker] Claiming pending articles...");
  const batch = await claimPendingArticles(3); // keep tiny for first run
  console.log(`[ai-worker] Claimed ${batch.length} articles`);

  for (const article of batch) {
    try {
      console.log(`[ai-worker] Analyzing: ${article.title}`);
      const analysis = await analyzeArticle(article);
      await saveAnalysis(article.id, analysis);    
      const status = await saveAnalysis(article.id, analysis);
      console.log(`[ai-worker] Saved as ${status}: ${article.title}`)
    } catch (err) {
      console.error("[ai-worker] Error:", err.message);
      await markError(article.id, err);
    }
  }

  console.log("[ai-worker] Finished batch");
}

main().catch((e) => {
  console.error("[ai-worker] Fatal:", e.message);
  process.exit(1);
});
