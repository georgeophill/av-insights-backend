import { supabase } from '../db/supabaseClient.js';
import { openai } from "../llm/openaiClient.js";

/**
 * Fetch a small batch of pending articles.
 * We'll mark them as "processing" before analyzing to avoid duplicates.
 */
async function claimPendingArticles(limit = 5) {
  // 1) Select candidate ids
  const { data: candidates, error: selectError } = await supabase
    .from('articles')
    .select('id')
    .eq('ai_status', 'pending')
    .not('cleaned_content', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (selectError) throw new Error(`Select pending failed: ${selectError.message}`);
  if (!candidates || candidates.length === 0) return [];

  const ids = candidates.map(x => x.id);

  // 2) Claim them (set processing) and return full rows to process
  const { data: claimed, error: claimError } = await supabase
    .from('articles')
    .update({ ai_status: 'processing', ai_started_at: new Date().toISOString(), ai_error: null })
    .in('id', ids)
    .eq('ai_status', 'pending')
    .select('id, title, url, cleaned_content');

  if (claimError) throw new Error(`Claim failed: ${claimError.message}`);
  return claimed || [];
}

function trimToMaxChars(text, maxChars) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[TRUNCATED]";
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    // Attempt to salvage if model wrapped JSON in text
    const first = str.indexOf("{");
    const last = str.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const maybe = str.slice(first, last + 1);
      return JSON.parse(maybe);
    }
    throw new Error("Model did not return valid JSON");
  }
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
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit");

      if (!isRateLimit || attempt > maxRetries) throw err;

      const backoffMs = Math.min(30000, 1000 * 2 ** (attempt - 1));
      console.warn(`[ai-worker] Rate limited, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(backoffMs);
    }
  }
}

async function analyzeArticle({ title, url, cleaned_content }) {
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const maxChars = Number(process.env.OPENAI_MAX_INPUT_CHARS || 8000);
  const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 350);
  const text = trimToMaxChars(cleaned_content || "", maxChars);

  const prompt = `
You are an autonomous vehicle (AV) industry analyst.

Analyze the article content and return ONLY valid JSON with the following shape:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "companies": ["Waymo", "Tesla"],
  "category": "safety|regulation|hardware|software|partnerships|incidents|business|other",
  "sentiment": "positive|neutral|negative",
  "impact": "low|medium|high",
  "regulatory_relevance": true|false
}

Rules:
- summary must be 3–5 concise bullets
- companies should be a deduplicated list (empty array if none)
- choose the single best category
- output MUST be JSON only (no markdown, no commentary)

Title: ${title}
URL: ${url}

CONTENT:
${text}
`.trim();

  const call = async () => {
    // Using the Responses API as shown in OpenAI’s quickstart. [1](https://www.bits8byte.com/understanding-rate-limits-in-openai-api-a-comprehensive-guide)
    const res = await openai.responses.create({
      model,
      input: prompt,
      max_output_tokens: maxOutputTokens,
    });

    // Quickstart shows output_text as the easiest way to read result text. [1](https://www.bits8byte.com/understanding-rate-limits-in-openai-api-a-comprehensive-guide)
    const out = res.output_text;
    if (!out) throw new Error("No output_text returned from OpenAI");

    const json = safeJsonParse(out);

    // Minimal validation/sanitization (prevents weird shapes from breaking DB updates)
    return {
      summary: Array.isArray(json.summary) ? json.summary.slice(0, 5) : [],
      companies: Array.isArray(json.companies) ? json.companies.slice(0, 25) : [],
      category: typeof json.category === "string" ? json.category : "other",
      sentiment: typeof json.sentiment === "string" ? json.sentiment : "neutral",
      impact: typeof json.impact === "string" ? json.impact : "low",
      regulatory_relevance: Boolean(json.regulatory_relevance),
    };
  };

  const maxRetries = Number(process.env.OPENAI_MAX_RETRIES || 4);
  return withRetries(call, { maxRetries });
}

async function saveAnalysis(id, analysis) {
  const { error } = await supabase
    .from('articles')
    .update({
      ai_status: 'done',
      ai_processed_at: new Date().toISOString(),
      ai_summary: analysis.summary,
      ai_companies: analysis.companies,
      ai_category: analysis.category,
      ai_sentiment: analysis.sentiment,
      ai_impact: analysis.impact,
      ai_regulatory_relevance: analysis.regulatory_relevance
    })
    .eq('id', id);

  if (error) throw new Error(`Save failed: ${error.message}`);
}

async function markError(id, err) {
  const { error } = await supabase
    .from('articles')
    .update({
      ai_status: 'error',
      ai_error: err?.message?.slice(0, 500) || String(err).slice(0, 500)
    })
    .eq('id', id);

  if (error) console.error('Failed to mark error:', error.message);
}

async function main() {
  console.log('[ai-worker] Claiming pending articles...');
  const batch = await claimPendingArticles(3); // keep tiny for first run
  console.log(`[ai-worker] Claimed ${batch.length} articles`);

  for (const article of batch) {
    try {
      console.log(`[ai-worker] Analyzing: ${article.title}`);
      const analysis = await analyzeArticle(article);
      await saveAnalysis(article.id, analysis);
      console.log(`[ai-worker] Done: ${article.title}`);
    } catch (err) {
      console.error('[ai-worker] Error:', err.message);
      await markError(article.id, err);
    }
  }

  console.log('[ai-worker] Finished batch');
}

main().catch(e => {
  console.error('[ai-worker] Fatal:', e.message);
  process.exit(1);
});