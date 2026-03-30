import { getSupabaseServiceClient, parseStoragePath } from "@/lib/supabase/server";

export async function deleteStorageFiles(publicUrls: string[]) {
  const uniqueUrls = Array.from(new Set(publicUrls.filter(Boolean)));
  if (uniqueUrls.length === 0) return;

  try {
    const storage = getSupabaseServiceClient();
    const pathsByBucket = new Map<string, string[]>();

    for (const publicUrl of uniqueUrls) {
      try {
        const { bucket, path } = parseStoragePath(publicUrl);
        const existing = pathsByBucket.get(bucket) ?? [];
        existing.push(path);
        pathsByBucket.set(bucket, existing);
      } catch (err) {
        console.warn("[storage] Skipping invalid public URL during cleanup", publicUrl, err);
      }
    }

    for (const [bucket, paths] of pathsByBucket.entries()) {
      if (paths.length === 0) continue;
      const { error } = await storage.storage.from(bucket).remove(paths);
      if (error) {
        console.error(`[storage] Failed to remove files from bucket "${bucket}"`, error);
      }
    }
  } catch (err) {
    console.error("[storage] Image cleanup failed", err);
  }
}
