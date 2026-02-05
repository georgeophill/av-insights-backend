import Parser from "rss-parser";
import { supabase } from "../db/supabaseClient.js";
import { logIngestion } from "../utils/logger.js";
import { cleanText } from '../utils/cleanText.js';

const parser = new Parser();

function toArticleRow(source, item) {
  const url = item.link?.trim();
  if (!url) return null;

  const raw =
    item.content ||
    item['content:encoded'] ||
    item.contentSnippet ||
    item.summary ||
    null;

  return {
    source_id: source.id,
    title: (item.title || 'Untitled').trim(),
    url,
    published_at: item.isoDate || item.pubDate || null,
    author: item.creator || item.author || null,
    raw_content: raw,
    cleaned_content: cleanText(raw),
  };
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

      const rows = feed.items
        .map((item) => toArticleRow(source, item))
        .filter(Boolean);

      const { error: upsertError } = await supabase
        .from("articles")
        .upsert(rows, { onConflict: "url" });

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
        console.log(`Upserted ${rows.length} articles for ${source.name}`);

        await logIngestion({
          sourceId: source.id,
          status: "success",
          message: `Upserted ${rows.length} articles`,
          meta: { upsertedCount: rows.length },
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
