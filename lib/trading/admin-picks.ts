import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseTickerList } from "@/lib/trading/ticker-list";
import type { Json } from "@/lib/supabase/database.types";

const ADMIN_PICKS_SLUG = "admin-picks-universe";

function symbolsFromThresholds(thresholds: Json) {
  if (!thresholds || typeof thresholds !== "object" || Array.isArray(thresholds)) {
    return [];
  }
  const value = thresholds.symbols;
  if (!Array.isArray(value)) return [];
  return parseTickerList(value.filter((symbol): symbol is string => typeof symbol === "string")).symbols;
}

export async function getAdminPickSymbols() {
  if (!isSupabaseConfigured) return [];

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("strategies")
    .select("thresholds")
    .eq("slug", ADMIN_PICKS_SLUG)
    .maybeSingle();
  if (error) throw new Error(`Admin picks could not be loaded: ${error.message}`);
  return symbolsFromThresholds(data?.thresholds ?? {});
}

export async function saveAdminPickSymbols(symbols: string[]) {
  if (!isSupabaseConfigured) throw new Error("Supabase is required to save Admin's Picks.");

  const parsed = parseTickerList(symbols);
  if (parsed.invalid.length) {
    throw new Error(`Invalid ticker symbols: ${parsed.invalid.join(", ")}`);
  }
  if (parsed.exceedsLimit) {
    throw new Error("Admin's Picks is limited to 100 ticker symbols.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("strategies").upsert(
    {
      slug: ADMIN_PICKS_SLUG,
      name: "Admin's Picks Universe",
      type: "universe",
      enabled: true,
      risk_level: "balanced",
      thresholds: { symbols: parsed.symbols },
      updated_at: new Date().toISOString()
    },
    { onConflict: "slug" }
  );
  if (error) throw new Error(`Admin picks could not be saved: ${error.message}`);
  return parsed.symbols;
}
