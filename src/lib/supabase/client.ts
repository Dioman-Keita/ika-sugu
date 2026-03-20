import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase client env vars are missing (NEXT_PUBLIC_SUPABASE_URL + PUBLISHABLE KEY)",
    );
  }

  return { url, anonKey };
};

export const getSupabaseClient = (): SupabaseClient => {
  if (client) return client;
  const { url, anonKey } = getEnv();
  client = createClient(url, anonKey);
  return client;
};
