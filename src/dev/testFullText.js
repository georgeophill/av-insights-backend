// src/dev/testFullText.js
import "dotenv/config";
import { extractFullText } from "../utils/extractFullText.js";

const url = process.argv[2];
if (!url) {
  console.log("Usage: node src/dev/testFullText.js <article_url>");
  process.exit(1);
}

const result = await extractFullText(url);
console.log("Extracted length:", result.length);
console.log("Title:", result.title);
console.log("Excerpt:", result.excerpt);
console.log("First 600 chars:\n", (result.textContent ?? "").slice(0, 600));