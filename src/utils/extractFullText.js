// src/utils/extractFullText.js
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * Resolve Google News redirect URLs to actual article URLs.
 * Google News RSS feeds provide wrapper URLs that need to be resolved.
 */
async function resolveGoogleNewsUrl(url) {
  const debug = (process.env.FULLTEXT_DEBUG ?? "false") === "true";
  
  // Only process Google News URLs
  if (!url.includes("news.google.com")) {
    return url;
  }

  try {
    const res = await fetch(url, {
      redirect: "manual", // Don't follow redirects automatically
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "accept": "text/html,application/xhtml+xml",
      },
    });

    // Check for redirect
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location && !location.includes("news.google.com")) {
        if (debug) {
          console.log(`[fulltext-debug] Google News redirect: ${location}`);
        }
        return location;
      }
    }

    // If no redirect, try parsing HTML for the article link
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Look for canonical link
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href && !canonical.href.includes("news.google.com")) {
      if (debug) {
        console.log(`[fulltext-debug] Google News canonical: ${canonical.href}`);
      }
      return canonical.href;
    }

    // Look for article links in the page
    const articleLink = doc.querySelector('a[href*="http"]:not([href*="google.com"])');
    if (articleLink && articleLink.href) {
      if (debug) {
        console.log(`[fulltext-debug] Google News parsed link: ${articleLink.href}`);
      }
      return articleLink.href;
    }
    
    if (debug) {
      console.log(`[fulltext-debug] Google News resolution failed, using original URL`);
    }
  } catch (err) {
    if (debug) {
      console.log(`[fulltext-debug] Google News resolution error: ${err.message}`);
    }
  }

  return url; // Fallback to original URL
}

/**
 * Fetch a web page and extract the primary readable content.
 * Returns: { title, textContent, excerpt, byline, siteName, length }
 */
export async function extractFullText(url, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? Number(process.env.FULLTEXT_TIMEOUT_MS ?? 12000);
  const userAgent =
    opts.userAgent ??
    process.env.FULLTEXT_USER_AGENT ??
    "AV-InsightsBot/1.0 (+personal project; readability extraction)";

  const debug = (process.env.FULLTEXT_DEBUG ?? "false") === "true";

  // Resolve Google News URLs first
  const resolvedUrl = await resolveGoogleNewsUrl(url);
  if (debug && resolvedUrl !== url) {
    console.log(`[fulltext-debug] URL resolved: ${url} → ${resolvedUrl}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(resolvedUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": userAgent,
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-GB,en;q=0.9",
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    const finalUrl = res.url;

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();

    if (debug) {
        console.log(
          `[fulltext-debug] status=${res.status} content-type=${contentType.split(";")[0]} finalUrl=${finalUrl} htmlLen=${html.length}`
        );
        console.log(`[fulltext-debug] htmlHead=${JSON.stringify(html.slice(0, 160))}`);
      }

    // JSDOM needs a URL to resolve relative links correctly
    const dom = new JSDOM(html, { url: resolvedUrl });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.trim().length < 200) {
            if (debug) {
        const len = article?.textContent ? article.textContent.trim().length : 0;
        console.log(`[fulltext-debug] readabilityLen=${len} (too short) title=${JSON.stringify(article?.title ?? null)}`);
      }
      return {
        title: article?.title ?? null,
        textContent: null,
        excerpt: article?.excerpt ?? null,
        byline: article?.byline ?? null,
        siteName: article?.siteName ?? null,
        length: 0,
      };
    }

    const text = article.textContent.trim();

    return {
      title: article.title ?? null,
      textContent: text,
      excerpt: article.excerpt ?? null,
      byline: article.byline ?? null,
      siteName: article.siteName ?? null,
      length: text.length,
    };
  } finally {
    clearTimeout(timer);
  }
}
``