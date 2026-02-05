import { supabase } from '../db/supabaseClient.js';

export async function logIngestion({ sourceId, status, message, meta = null }) {
  // Defensive: don't let logging crashes kill ingestion
  try {
    const payload = {
      source_id: sourceId,
      status,
      message,
      meta
    };

    const { error } = await supabase.from('ingestion_logs').insert(payload);
    if (error) console.error('Failed to write ingestion log:', error.message);
  } catch (e) {
    console.error('Unexpected logging error:', e.message);
  }
}