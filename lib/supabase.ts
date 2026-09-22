import "server-only";

import { createClient } from "@supabase/supabase-js";

// The browser never talks to Postgres. Every read and write goes through a
// Server Action using the service-role key, and RLS denies anon outright.
// Access control for the app itself is the password gate in middleware.ts.
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. See .env.example.",
  );
}

export const db = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
