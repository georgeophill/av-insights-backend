import { ingestRSSFeeds } from './ingest/rssIngest.js';

async function main() {
  console.log('Starting AV ingestion...');
  await ingestRSSFeeds();
  console.log('Ingestion finished.');
}

main();
