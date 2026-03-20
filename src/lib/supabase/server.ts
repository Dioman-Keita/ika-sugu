import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for the Supabase server client");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Supabase service key missing (SUPABASE_SERVICE_ROLE_KEY). Required for server-side operations such as file deletion.",
    );
  }

  return { url, serviceRoleKey };
};

export const getSupabaseServiceClient = (): SupabaseClient => {
  if (serviceClient) return serviceClient;
  const { url, serviceRoleKey } = getEnv();
  serviceClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serviceClient;
};

export const parseStoragePath = (publicUrl: string) => {
  const marker = "/storage/v1/object/public/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) throw new Error("Invalid Supabase public URL");
  const withoutBase = publicUrl.slice(idx + marker.length);
  const [bucket, ...rest] = withoutBase.split("/");
  if (!bucket || rest.length === 0) throw new Error("Invalid Supabase public URL");
  return { bucket, path: rest.join("/") };
};
