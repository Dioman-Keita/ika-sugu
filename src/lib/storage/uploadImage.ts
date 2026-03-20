import imageCompression from "browser-image-compression";
import { getSupabaseClient } from "@/lib/supabase/client";

const MAX_FILE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];

type UploadOptions = {
  productId: string;
  bucket?: string;
};

export class UploadError extends Error {}

const validateFile = (file: File) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new UploadError("Invalid file type. Only images are allowed.");
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_FILE_MB) {
    throw new UploadError("File is too large. Max 5MB allowed.");
  }
};

const compress = async (file: File) =>
  imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    initialQuality: 0.8,
    useWebWorker: true,
  });

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * Files are validated and compressed client-side before upload.
 */
export const uploadImage = async (file: File, opts: UploadOptions): Promise<string> => {
  const { productId, bucket = "products" } = opts;
  validateFile(file);

  const compressed = await compress(file);
  const supabase = getSupabaseClient();

  const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const path = `${productId}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new UploadError(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new UploadError("Unable to get public URL");
  }

  return data.publicUrl;
};

export type UploadedImage = {
  url: string;
  path: string;
};

export const deleteImage = async (publicUrl: string) => {
  const supabase = getSupabaseClient();
  const marker = "/storage/v1/object/public/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) throw new UploadError("Invalid public URL");
  const path = publicUrl.slice(idx + marker.length);
  const [bucket, ...rest] = path.split("/");
  const storagePath = rest.join("/");
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) throw new UploadError(error.message);
};
