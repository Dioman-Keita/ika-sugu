import imageCompression from "browser-image-compression";
import { uploadAdminProductImageAction } from "@/app/actions/admin";

const MAX_FILE_MB = 5;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/gif",
];

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
 * Uploads an image via server action.
 * Files are validated and compressed client-side before upload.
 */
export const uploadImage = async (file: File, opts: UploadOptions): Promise<string> => {
  const { productId } = opts;
  validateFile(file);

  const compressedFile = await compress(file);

  // Create FormData to send to the server action
  const formData = new FormData();
  formData.append("file", compressedFile, file.name);
  formData.append("productId", productId);

  try {
    const { url } = await uploadAdminProductImageAction(formData);
    return url;
  } catch (err) {
    throw new UploadError(err instanceof Error ? err.message : "Upload failed");
  }
};
