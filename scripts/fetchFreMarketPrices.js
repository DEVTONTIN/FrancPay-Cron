import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing env vars SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("🚀 Starting price fetch…");

  try {
    const dex = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0x4863cd69209a444d96e02b3a1b0d9cda912f364c"
    ).then(r => r.json());

    const cg = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=frec&vs_currencies=usd"
    ).then(r => r.json());

    const dexPrice = dex?.pairs?.[0]?.priceUsd ?? null;
    const cgPrice = cg?.frec?.usd ?? null;

    if (!dexPrice && !cgPrice) {
      throw new Error("No price data available");
    }

    const { error } = await supabase
      .from("FrePriceSnapshot")
      .insert({
        price_dex: dexPrice,
        price_cg: cgPrice,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    console.log("✅ Snapshot saved:", { dexPrice, cgPrice });
  } catch (e) {
    console.error("❌ Error:", e);
    process.exit(1);
  }
}

main();
