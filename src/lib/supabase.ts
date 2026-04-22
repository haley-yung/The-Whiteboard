import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createJsClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserSupabase() {
  return createBrowserClient(url, anonKey);
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No-op: no auth, server components can't write cookies in this app
      },
    },
  });
}

// Light client for places where we don't need cookie context (RSC reads)
export function createRscSupabase() {
  return createJsClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
