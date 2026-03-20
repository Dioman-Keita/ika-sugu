"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createAdminProduct, updateAdminProduct } from "@/app/actions/admin";
import ProductImageUploader from "./ProductImageUploader";

type Category = { id: string; name: string };

type VariantInput = {
  id: string;
  sku?: string;
  colorName: string;
  colorHex?: string;
  size: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  stock?: number;
  images: { url: string; isCover: boolean }[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  categories: Category[];
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    dressStyle?: string | null;
    categoryId: string;
    basePrice: number;
    discountPercentage: number;
    vatRate: number;
    variants?: VariantInput[];
  };
  labels: Record<string, string>;
};

export default function ProductForm({
  mode,
  categories,
  initial,
  labels,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [productId] = useState(initial?.id ?? crypto.randomUUID());
  const [slugEdited, setSlugEdited] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dressStyle, setDressStyle] = useState(initial?.dressStyle ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? 0);
  const [discountPercentage, setDiscountPercentage] = useState(
    initial?.discountPercentage ?? 0,
  );
  const [vatRate, setVatRate] = useState(initial?.vatRate ?? 20);

  const finalPrice = useMemo(() => {
    const pct = Math.max(0, Math.min(100, discountPercentage || 0));
    const net = Math.max(0, Number((basePrice * (1 - pct / 100)).toFixed(2)));
    const vat = Math.max(0, vatRate || 0);
    return Math.max(0, Number((net * (1 + vat / 100)).toFixed(2)));
  }, [basePrice, discountPercentage, vatRate]);

  const [variants, setVariants] = useState<VariantInput[]>(
    initial?.variants?.map((v) => ({
      ...v,
      id: v.id,
      images: v.images ?? [],
    })) ?? [
      {
        id: crypto.randomUUID(),
        colorName: "Default",
        size: "Unique",
        price: basePrice || 0,
        stock: 0,
        images: [],
      },
    ],
  );

  const updateVariant = (id: string, patch: Partial<VariantInput>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        colorName: "",
        size: "",
        price: 0,
        stock: 0,
        images: [],
      },
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError(labels["error.category"]);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          id: productId,
          name,
          slug,
          description,
          dressStyle: dressStyle || null,
          categoryId,
          basePrice: Number(basePrice),
          discountPercentage: Number(discountPercentage) || 0,
          vatRate: Number(vatRate) || 0,
          variants: variants.map((v) => ({
            sku: v.sku ?? null,
            colorName: v.colorName || "Default",
            colorHex: v.colorHex ?? null,
            size: v.size || "Unique",
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            currency: v.currency || "USD",
            stock: Number(v.stock) || 0,
            images: v.images?.map((img) => img.url) ?? [],
          })),
        };
        const result =
          mode === "create"
            ? await createAdminProduct(payload)
            : await updateAdminProduct({ ...payload, id: initial!.id });
        router.push(`/admin/products/${result.id}`);
        router.refresh();
      } catch (err) {
        setError((err as Error).message ?? "Error");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.name"]}
          </label>
        <input
          value={name}
          onChange={(e) => {
            const nextName = e.target.value;
            setName(nextName);
            if (!slugEdited) {
              const autoSlug = nextName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-_]/g, "");
              setSlug(autoSlug);
            }
          }}
          required
          className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          placeholder={labels["placeholder.name"]}
        />
      </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.slug"]}
          </label>
          <input
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
            required
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            placeholder={labels["placeholder.slug"]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {labels["field.description"]}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none min-h-[120px]"
          placeholder={labels["placeholder.description"]}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.category"]}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.basePrice"]}
          </label>
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            required
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.discount"]}
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.vat"]}
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            placeholder="20"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.dressStyle"]}
          </label>
          <input
            value={dressStyle}
            onChange={(e) => setDressStyle(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            placeholder={labels["placeholder.dressStyle"]}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {labels["field.finalPrice"]}
          </label>
          <div className="h-[46px] flex items-center px-4 rounded-xl border border-border bg-surface-section text-sm text-foreground">
            {finalPrice.toFixed(2)} USD
          </div>
          {labels["field.vatHint"] && (
            <p className="text-xs text-muted-foreground">
              {labels["field.vatHint"]?.replace("{rate}", vatRate.toFixed(1))}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Variantes</p>
            <p className="text-xs text-muted-foreground">
              Couleurs, tailles, prix, stock et images spécifiques.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full h-9 px-4"
            onClick={addVariant}
          >
            Ajouter une variante
          </Button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className="border border-border rounded-2xl p-4 bg-surface-section space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  Variante {idx + 1}
                </div>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeVariant(variant.id)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={variant.colorName}
                  onChange={(e) =>
                    updateVariant(variant.id, { colorName: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Couleur (ex: Navy)"
                />
                <input
                  value={variant.size}
                  onChange={(e) => updateVariant(variant.id, { size: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Taille (ex: M)"
                />
                <input
                  value={variant.sku ?? ""}
                  onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="SKU (optionnel)"
                />
              </div>

              <div className="grid md:grid-cols-4 gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(variant.id, { price: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Prix TTC"
                />
                <input
                  type="number"
                  step="0.01"
                  value={variant.compareAtPrice ?? ""}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      compareAtPrice:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Prix barré (optionnel)"
                />
                <input
                  type="number"
                  step="1"
                  value={variant.stock ?? 0}
                  onChange={(e) =>
                    updateVariant(variant.id, { stock: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Stock"
                />
                <input
                  value={variant.colorHex ?? ""}
                  onChange={(e) =>
                    updateVariant(variant.id, { colorHex: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Code couleur (hex)"
                />
              </div>

              <ProductImageUploader
                productId={productId}
                initialImages={variant.images}
                onPersist={async (imgs) => updateVariant(variant.id, { images: imgs })}
                labels={{
                  drop: "Glissez-déposez ou cliquez",
                  hint: "JPG, PNG, WEBP · max 5MB · compression auto",
                  uploading: "Upload...",
                  cover: "Principale",
                  deleteTitle: "Supprimer",
                  setCoverTitle: "Définir comme principale",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => router.back()}
          disabled={isPending}
        >
          {labels["action.cancel"]}
        </Button>
        <Button type="submit" className="rounded-full" disabled={isPending}>
          {isPending
            ? labels["action.saving"]
            : mode === "create"
              ? labels["action.create"]
              : labels["action.save"]}
        </Button>
      </div>
    </form>
  );
}
