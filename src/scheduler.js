import cron from 'node-cron';
import { ingestRSSFeeds } from './ingest/rssIngest.js';

let isRunning = false;

async function runJob() {
  if (isRunning) {
    console.log('[scheduler] Previous run still in progress — skipping this tick.');
    return;
  }

  isRunning = true;
  const startedAt = new Date().toISOString();
  console.log(`[scheduler] Job started at ${startedAt}`);

  try {
    await ingestRSSFeeds();
    console.log(`[scheduler] Job finished at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[scheduler] Job failed:', err.message);
  } finally {
    isRunning = false;
  }
}

// Run immediately once on startup (nice for confidence)
runJob();

// Then schedule hourly at minute 0
cron.schedule('0 * * * *', runJob);

console.log('[scheduler] Scheduled ingestion: 0 * * * * (hourly)');
``