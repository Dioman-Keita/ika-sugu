"use client";

import { useCallback, useState } from "react";
import { Upload, X, Star } from "lucide-react";
import Image from "next/image";
import { uploadImage, UploadError } from "@/lib/storage/uploadImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageItem = {
  url: string;
  isCover: boolean;
};

type Props = {
  productId: string;
  initialImages?: ImageItem[];
  onPersist?: (images: ImageItem[]) => Promise<void>;
  max?: number;
  labels: {
    drop: string;
    hint: string;
    uploading: string;
    cover: string;
    deleteTitle: string;
    setCoverTitle: string;
  };
};

const MAX_FILES = 6;

export default function ProductImageUploader({
  productId,
  initialImages = [],
  onPersist,
  labels,
  max = MAX_FILES,
}: Props) {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emitChange = useCallback(
    async (next: ImageItem[]) => {
      setImages(next);
      if (onPersist) await onPersist(next);
    },
    [onPersist],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files).slice(0, max - images.length);
      if (fileArray.length === 0) return;
      setIsUploading(true);
      try {
        const uploaded: ImageItem[] = [];
        for (const file of fileArray) {
          const url = await uploadImage(file, { productId });
          uploaded.push({ url, isCover: false });
        }
        const next =
          images.length === 0 && uploaded.length > 0
            ? [{ ...uploaded[0], isCover: true }, ...uploaded.slice(1), ...images]
            : [...images, ...uploaded];
        await emitChange(next);
      } catch (err) {
        const message = err instanceof UploadError ? err.message : "Upload failed";
        setError(message);
      } finally {
        setIsUploading(false);
      }
    },
    [emitChange, images, max, productId],
  );

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeImage = async (url: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new UploadError(body.error ?? "Failed to delete image");
      }
      const next = images.filter((img) => img.url !== url);
      if (next.length > 0 && !next.some((img) => img.isCover)) {
        next[0].isCover = true;
      }
      await emitChange([...next]);
    } catch (err) {
      const message = err instanceof UploadError ? err.message : "Failed to delete image";
      setError(message);
    }
  };

  const setCover = async (url: string) => {
    const next = images.map((img) => ({ ...img, isCover: img.url === url }));
    await emitChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition bg-surface-card",
          isDragging ? "border-primary/70 bg-primary/5" : "border-border",
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFileInput}
          className="hidden"
          id="product-images-input"
        />
        <label htmlFor="product-images-input" className="cursor-pointer space-y-2 block">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-section flex items-center justify-center text-primary">
            <Upload size={20} />
          </div>
          <p className="text-sm font-medium text-foreground">{labels.drop}</p>
          <p className="text-xs text-muted-foreground">{labels.hint}</p>
          {isUploading && <p className="text-xs text-primary">{labels.uploading}</p>}
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.url}
              className="relative group border border-border rounded-lg overflow-hidden"
            >
              <Image
                src={img.url}
                alt="Product"
                width={400}
                height={240}
                className="w-full h-36 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-start justify-end p-2 gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removeImage(img.url)}
                  title={labels.deleteTitle}
                >
                  <X size={16} />
                </Button>
                <Button
                  size="icon"
                  variant={img.isCover ? "default" : "secondary"}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => setCover(img.url)}
                  title={labels.setCoverTitle}
                >
                  <Star size={16} fill={img.isCover ? "currentColor" : "none"} />
                </Button>
              </div>
              {img.isCover && (
                <span className="absolute top-2 left-2 text-[11px] px-2 py-1 bg-primary text-white rounded-full">
                  {labels.cover}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
