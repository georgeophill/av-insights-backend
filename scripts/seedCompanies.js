// scripts/seedCompanies.js
// Script to populate the av_companies table with initial data
import "dotenv/config";
import { supabase } from "../src/db/supabaseClient.js";
import { avCompanies } from "../config/avCompanies.js";

async function seedCompanies() {
  console.log("🌱 Seeding AV companies database...");
  console.log(`Found ${avCompanies.length} companies to insert`);

  const records = avCompanies
    .filter(c => c.status !== "defunct") // Skip defunct companies
    .map(c => ({
      name: c.name,
      ticker: c.ticker || null,
      exchange: c.exchange || null,
      is_public: c.isPublic || false,
      sector: c.sector || null,
      description: c.description || null,
      website: c.website || null,
    }));

  console.log(`Inserting ${records.length} active companies...`);

  const { data, error } = await supabase
    .from("av_companies")
    .upsert(records, { 
      onConflict: "name",
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error("❌ Error seeding companies:", error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${data.length} companies`);
  
  // Show summary
  const publicCompanies = data.filter(c => c.is_public && c.ticker);
  const privateCompanies = data.filter(c => !c.is_public || !c.ticker);
  
  console.log("\nSummary:");
  console.log(`  Public companies with tickers: ${publicCompanies.length}`);
  console.log(`  Private/subsidiary companies: ${privateCompanies.length}`);
  console.log(`  Total: ${data.length}`);
  
  process.exit(0);
}

seedCompanies().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
