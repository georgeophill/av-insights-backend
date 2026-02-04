import Parser from 'rss-parser';
import { supabase } from '../db/supabaseClient.js';

const parser = new Parser();

export async function ingestRSSFeeds() {
  console.log('Fetching RSS sources...');

  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .eq('active', true)
    .eq('type', 'rss');

  if (error) {
    console.error('Error fetching sources:', error.message);
    return;
  }

  console.log(`Found ${sources.length} RSS sources`);
   for (const source of sources) {
    console.log(`Fetching feed: ${source.name}`);

    try {
        const feed = await parser.parseURL(source.url);
        console.log(`Fetched ${feed.items.length} items from ${source.name}`);
    } catch (err) {
        console.error(`Failed to fetch ${source.name}:`, err.message);
    }
}
}
   


