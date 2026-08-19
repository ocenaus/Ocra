import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Admin Supabase client using the service role key. This bypasses Row Level
 * Security entirely — only use it from trusted server-side code (background
 * jobs, alert processing, diagnostics) that has already authorized the
 * operation itself. Never import this from a client component and never
 * return its client instance from an API response.
 */
export function createAdminClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
