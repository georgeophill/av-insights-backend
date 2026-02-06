import Parser from "rss-parser";
import { supabase } from "../db/supabaseClient.js";
import { logIngestion } from "../utils/logger.js";
import { cleanText } from "../utils/cleanText.js";
import { extractFullText } from "../utils/extractFullText.js";
import "dotenv/config";

const parser = new Parser();

const FULLTEXT_ENABLED = (process.env.FULLTEXT_ENABLED ?? "true") === "true";
const FULLTEXT_MIN_SNIPPET_CHARS = Number(process.env.FULLTEXT_MIN_SNIPPET_CHARS ?? 400,);
const FULLTEXT_MIN_EXTRACTED_CHARS = Number(process.env.FULLTEXT_MIN_EXTRACTED_CHARS ?? 800,);
const FULLTEXT_MAX_PER_FEED = Number(process.env.FULLTEXT_MAX_PER_FEED ?? 5);

async function toArticleRow(source, item, opts = {}) {
  const allowFullText = opts.allowFullText ?? true;
  const url = item.link?.trim();
  if (!url) return null;

  let raw =
    item.content ||
    item["content:encoded"] ||
    item.contentSnippet ||
    item.summary ||
    null;

  let title = (item.title || "Untitled").trim();
  let cleanedContent = cleanText(raw ?? "");

 // Track full-text attempt + usage (for FULLTEXT_MAX_PER_FEED)
  let fullTextAttempted = false;
  let fullTextUsed = false;

  // If the snippet is short, try to fetch full article text (only if allowed)
  if (allowFullText && FULLTEXT_ENABLED && cleanedContent.length < FULLTEXT_MIN_SNIPPET_CHARS) {
    fullTextAttempted = true;

    try {
      if ((process.env.FULLTEXT_DEBUG ?? "false") === "true") {
          console.log(`[fulltext-debug] attempting url=${url}`);
        }
      const extracted = await extractFullText(url);

      if (extracted?.textContent && extracted.textContent.length >= FULLTEXT_MIN_EXTRACTED_CHARS) {
        raw = extracted.textContent;
        cleanedContent = cleanText(raw);

        if (extracted.title && extracted.title.length > 5) {
          title = extracted.title;
        }

        fullTextUsed = true;
        console.log(`[fulltext] ✅ ${cleanedContent.length} chars extracted for: ${title}`);
      } else {
        console.log(`[fulltext] ⚠️ Extraction too short/empty for: ${title}`);
      }
    } catch (e) {
      console.log(`[fulltext] ⚠️ Failed for: ${title} (${e.message})`);
    }
  }

  const row = {
      source_id: source.id,
      title,
      url,
      published_at: item.isoDate
        ? new Date(item.isoDate).toISOString()
        : item.pubDate
          ? new Date(item.pubDate).toISOString()
          : null,
      author: item.creator || item.author || null,
      raw_content: raw,
      cleaned_content: cleanedContent,
    };

    return { row, fullTextAttempted, fullTextUsed };
}

export async function ingestRSSFeeds() {
  console.log("Fetching RSS sources...");

  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .eq("active", true)
    .eq("type", "rss");

  if (error) {
    console.error("Error fetching sources:", error.message);
    return;
  }

  console.log(`Found ${sources.length} RSS sources`);
  for (const source of sources) {
    console.log(`Fetching feed: ${source.name}`);
    let fullTextAttempts = 0; // reset per feed/source
    await logIngestion({
      sourceId: source.id,
      status: "started",
      message: "Starting RSS fetch",
    });

    try {
      const feed = await parser.parseURL(source.url);
      console.log(`Fetched ${feed.items.length} items from ${source.name}`);

      await logIngestion({
        sourceId: source.id,
        status: "fetched",
        message: `Fetched ${feed.items.length} items`,
        meta: { itemCount: feed.items.length },
      });

      const filteredRows = [];

      for (const item of feed.items) {
        const allowFullText = fullTextAttempts < FULLTEXT_MAX_PER_FEED;

        const result = await toArticleRow(source, item, { allowFullText });
        if (!result) continue;

        const { row, fullTextAttempted } = result;

        // Cap requests: count attempts (not just successes)
        if (fullTextAttempted) fullTextAttempts++;

        filteredRows.push(row);
      }

      const { error: upsertError } = await supabase
        .from("articles")
        .upsert(filteredRows, { onConflict: "url" });

      if (upsertError) {
        console.error(
          `DB insert failed for ${source.name}:`,
          upsertError.message,
        );

        await logIngestion({
          sourceId: source.id,
          status: "db_error",
          message: upsertError.message,
        });
      } else {
        console.log(
          `Upserted ${filteredRows.length} articles for ${source.name}`,
        );

        await logIngestion({
          sourceId: source.id,
          status: "success",
          message: `Upserted ${filteredRows.length} articles`,
          meta: { upsertedCount: filteredRows.length },
        });
      }
    } catch (err) {
      console.error(`Failed to fetch ${source.name}:`, err.message);

      await logIngestion({
        sourceId: source.id,
        status: "fetch_error",
        message: err.message,
      });
    }
  }
}
