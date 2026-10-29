import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

// Publishable key is safe for the browser; row-level security guards the data.
export const supabase = createClient(url ?? "http://localhost", key ?? "missing-key");
