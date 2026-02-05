// src/utils/cleanText.js

export function cleanText(input) {
  if (!input) return null;

  let text = String(input);

  // Remove script/style blocks (rare in RSS, but happens)
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');

  // Strip HTML tags
  text = text.replace(/<\/?[^>]+(>|$)/g, ' ');

  // Decode a few common HTML entities (minimal, dependency-free)
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Avoid storing tiny useless strings
  if (text.length < 20) return null;

  return text;
}