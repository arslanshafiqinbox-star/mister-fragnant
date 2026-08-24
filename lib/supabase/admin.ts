import { createAdminClient } from "@supabase/server/core";

/** Server-only admin client (bypasses RLS). Uses SUPABASE_SECRET_KEY. */
export function getSupabaseAdmin() {
  return createAdminClient();
}
