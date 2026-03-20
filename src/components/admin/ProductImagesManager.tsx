"use client";

import { useState } from "react";
import ProductImageUploader from "./ProductImageUploader";

type ImageItem = { url: string; isCover: boolean };

type Props = {
  productId: string;
  initialImages: ImageItem[];
  labels: {
    saving: string;
    uploader: {
      drop: string;
      hint: string;
      uploading: string;
      cover: string;
      deleteTitle: string;
      setCoverTitle: string;
    };
  };
};

export default function ProductImagesManager({
  productId,
  initialImages,
  labels,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = async (images: ImageItem[]) => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save images");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <ProductImageUploader
        productId={productId}
        initialImages={initialImages}
        onPersist={persist}
        labels={labels.uploader}
      />
      {saving && <p className="text-xs text-muted-foreground">{labels.saving}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
