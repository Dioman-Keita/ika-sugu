"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCreateProductMutation, useUpdateProductMutation } from "@/hooks/use-admin";
import ProductImageUploader from "./ProductImageUploader";
import type { createAdminProduct } from "@/app/actions/admin";
import { deleteAdminProductImagesAction } from "@/app/actions/admin";
import {
  CURRENCY_OPTIONS,
  DRESS_STYLE_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/catalog-options";
import { translateAttribute } from "@/lib/i18n/messages";
import { useUiPreferences } from "@/lib/ui-preferences";
import { ProductStatus } from "@/generated/prisma/client";

type CreateProductResult = Awaited<ReturnType<typeof createAdminProduct>>;

type Category = { id: string; name: string };
type LocaleCode = "fr" | "en";

type TranslationFields = {
  name: string;
  description: string;
  specs: Partial<Record<"material" | "care" | "fit" | "pattern", string>>;
};

type VariantInput = {
  id: string;
  sku?: string | null;
  colorName: string;
  colorHex?: string;
  size: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  stock?: number;
  isActive?: boolean;
  images: { url: string; isCover: boolean }[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  categories: Category[];
  initial?: {
    id: string;
    slug: string;
    sourceLocale: LocaleCode;
    status: ProductStatus;
    dressStyle?: string | null;
    categoryId: string;
    basePrice: number;
    discountPercentage: number;
    vatRate: number;
    translations: Record<LocaleCode, TranslationFields>;
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
  const { locale, t } = useUiPreferences();
  const { mutate: create, isPending: isCreating } = useCreateProductMutation();
  const { mutate: update, isPending: isUpdating } = useUpdateProductMutation();
  const isPending = isCreating || isUpdating;

  const [error, setError] = useState<string | null>(null);
  const [productId] = useState(initial?.id ?? crypto.randomUUID());
  const [slugEdited, setSlugEdited] = useState(false);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [sourceLocale, setSourceLocale] = useState<LocaleCode>(
    initial?.sourceLocale ?? "fr",
  );
  const [status, setStatus] = useState<ProductStatus>(
    initial?.status ?? ProductStatus.DRAFT,
  );
  const [dressStyle, setDressStyle] = useState(initial?.dressStyle ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? 0);
  const [discountPercentage, setDiscountPercentage] = useState(
    initial?.discountPercentage ?? 0,
  );
  const [vatRate, setVatRate] = useState(initial?.vatRate ?? 20);
  const [translations, setTranslations] = useState<Record<LocaleCode, TranslationFields>>(
    initial?.translations ?? {
      fr: { name: "", description: "", specs: {} },
      en: { name: "", description: "", specs: {} },
    },
  );
  const [pendingCleanupUrls, setPendingCleanupUrls] = useState<string[]>([]);
  const pendingCleanupRef = useRef<string[]>([]);

  useEffect(() => {
    pendingCleanupRef.current = pendingCleanupUrls;
  }, [pendingCleanupUrls]);

  const finalPrice = useMemo(() => {
    const pct = Math.max(0, Math.min(100, discountPercentage || 0));
    const net = Math.max(0, Number((basePrice * (1 - pct / 100)).toFixed(2)));
    const vat = Math.max(0, vatRate || 0);
    return Math.max(0, Number((net * (1 + vat / 100)).toFixed(2)));
  }, [basePrice, discountPercentage, vatRate]);

  const [variants, setVariants] = useState<VariantInput[]>(
    initial?.variants?.map((variant) => ({
      ...variant,
      images: variant.images ?? [],
    })) ?? [
      {
        id: crypto.randomUUID(),
        colorName: "Default",
        size: "Unique",
        price: basePrice || 0,
        stock: 0,
        isActive: true,
        images: [],
      },
    ],
  );

  const updateVariant = (id: string, patch: Partial<VariantInput>) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  };

  const updateTranslation = (
    targetLocale: LocaleCode,
    field: keyof TranslationFields,
    value:
      | string
      | Partial<Record<"material" | "care" | "fit" | "pattern", string>>,
  ) => {
    setTranslations((prev) => {
      const next = {
        ...prev,
        [targetLocale]: {
          ...prev[targetLocale],
          [field]: value,
        },
      };

      if (!slugEdited && targetLocale === sourceLocale && field === "name") {
        const autoSlug = String(value)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-_]/g, "");
        setSlug(autoSlug);
      }

      return next;
    });
  };

  const updateSpec = (
    targetLocale: LocaleCode,
    specKey: "material" | "care" | "fit" | "pattern",
    value: string,
  ) => {
    updateTranslation(targetLocale, "specs", {
      ...translations[targetLocale].specs,
      [specKey]: value,
    });
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
        isActive: true,
        images: [],
      },
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const registerPendingUploads = (urls: string[]) => {
    if (urls.length === 0) return;
    setPendingCleanupUrls((prev) => {
      const next = Array.from(new Set([...prev, ...urls]));
      pendingCleanupRef.current = next;
      return next;
    });
  };

  const clearPendingUploads = (urls: string[]) => {
    if (urls.length === 0) return;
    const urlSet = new Set(urls);
    setPendingCleanupUrls((prev) => {
      const next = prev.filter((url) => !urlSet.has(url));
      pendingCleanupRef.current = next;
      return next;
    });
  };

  const replacePendingUploads = (urls: string[]) => {
    pendingCleanupRef.current = urls;
    setPendingCleanupUrls(urls);
  };

  useEffect(() => {
    const flushPendingUploads = () => {
      const urls = pendingCleanupRef.current;
      if (urls.length === 0) return;

      const body = JSON.stringify({ urls });

      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/admin/product-assets/cleanup", blob);
        return;
      }

      void fetch("/api/admin/product-assets/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    };

    const handlePageHide = () => {
      flushPendingUploads();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, []);

  const handleCancel = async () => {
    const uploadedImages = pendingCleanupRef.current;
    if (uploadedImages.length > 0) {
      try {
        await deleteAdminProductImagesAction(uploadedImages);
        replacePendingUploads([]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to cleanup uploaded images",
        );
        return;
      }
    }

    router.back();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      setError(labels["error.category"]);
      return;
    }

    if (!translations.fr.name || !translations.fr.description) {
      setError(labels["error.translation.fr"]);
      return;
    }
    if (!translations.en.name || !translations.en.description) {
      setError(labels["error.translation.en"]);
      return;
    }

    setError(null);

    const payload = {
      id: productId,
      slug,
      sourceLocale,
      status,
      dressStyle: dressStyle || null,
      categoryId,
      basePrice: Number(basePrice),
      discountPercentage: Number(discountPercentage) || 0,
      vatRate: Number(vatRate) || 0,
      translations: (["fr", "en"] as const).map((targetLocale) => ({
        locale: targetLocale,
        name: translations[targetLocale].name,
        description: translations[targetLocale].description,
        specs: translations[targetLocale].specs,
      })),
      variants: variants.map((variant) => ({
        colorName: variant.colorName || "Default",
        colorHex: variant.colorHex ?? null,
        size: variant.size || "Unique",
        price: Number(variant.price) || 0,
        compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
        currency: variant.currency || "USD",
        stock: Number(variant.stock) || 0,
        isActive: variant.isActive ?? true,
        images:
          variant.images
            ?.slice()
            .sort((a, b) => Number(b.isCover) - Number(a.isCover))
            .map((image) => image.url) ?? [],
        ...(variant.id ? { id: variant.id } : {}),
      })),
    };

    const submittedImageUrls = payload.variants.flatMap((variant) => variant.images);
    const mutationOptions = {
      onSuccess: async (result: CreateProductResult) => {
        const submittedImageSet = new Set(submittedImageUrls);
        const leftoverUploads = pendingCleanupRef.current.filter(
          (url) => !submittedImageSet.has(url),
        );

        if (leftoverUploads.length > 0) {
          try {
            await deleteAdminProductImagesAction(leftoverUploads);
          } catch (err) {
            console.error("[admin] Failed to cleanup orphaned uploads after save", err);
          }
        }

        replacePendingUploads([]);
        router.push(`/admin/products/${result.id}`);
        router.refresh();
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : "Error");
      },
    };

    if (mode === "create") {
      create(payload, mutationOptions);
      return;
    }

    update({ ...payload, id: initial!.id }, mutationOptions);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.sourceLocale"]}
          </label>
          <select
            value={sourceLocale}
            onChange={(e) => setSourceLocale(e.target.value as LocaleCode)}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          >
            <option value="fr">{labels["locale.fr"]}</option>
            <option value="en">{labels["locale.en"]}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.status"]}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          >
            <option value={ProductStatus.DRAFT}>{labels["status.draft"]}</option>
            <option value={ProductStatus.PUBLISHED}>{labels["status.published"]}</option>
            <option value={ProductStatus.ARCHIVED}>{labels["status.archived"]}</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.category"]}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["field.dressStyle"]}
          </label>
          <select
            value={dressStyle}
            onChange={(e) => setDressStyle(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          >
            <option value="">{labels["placeholder.dressStyle"]}</option>
            {DRESS_STYLE_OPTIONS.map((style) => (
              <option key={style} value={style}>
                {translateAttribute(style, locale)}
              </option>
            ))}
          </select>
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
              {labels["field.vatHint"].replace("{rate}", vatRate.toFixed(1))}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {labels["section.translations"]}
          </p>
          <p className="text-xs text-muted-foreground">
            {labels["section.translations.hint"]}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {(["fr", "en"] as const).map((targetLocale) => (
            <div
              key={targetLocale}
              className="border border-border rounded-2xl p-4 bg-surface-section space-y-3"
            >
              <div className="text-sm font-semibold text-foreground">
                {targetLocale === "fr" ? labels["locale.fr"] : labels["locale.en"]}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {targetLocale === "fr"
                    ? labels["field.name.fr"]
                    : labels["field.name.en"]}
                </label>
                <input
                  value={translations[targetLocale].name}
                  onChange={(e) =>
                    updateTranslation(targetLocale, "name", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder={
                    targetLocale === "fr"
                      ? labels["placeholder.name.fr"]
                      : labels["placeholder.name.en"]
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {targetLocale === "fr"
                    ? labels["field.description.fr"]
                    : labels["field.description.en"]}
                </label>
                <textarea
                  value={translations[targetLocale].description}
                  onChange={(e) =>
                    updateTranslation(targetLocale, "description", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground min-h-[140px]"
                  placeholder={
                    targetLocale === "fr"
                      ? labels["placeholder.description.fr"]
                      : labels["placeholder.description.en"]
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  {t("product.specsTitle")}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={translations[targetLocale].specs.material ?? ""}
                    onChange={(e) =>
                      updateSpec(targetLocale, "material", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={t("product.specs.material")}
                  />
                  <input
                    value={translations[targetLocale].specs.care ?? ""}
                    onChange={(e) =>
                      updateSpec(targetLocale, "care", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={t("product.specs.care")}
                  />
                  <input
                    value={translations[targetLocale].specs.fit ?? ""}
                    onChange={(e) => updateSpec(targetLocale, "fit", e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={t("product.specs.fit")}
                  />
                  <input
                    value={translations[targetLocale].specs.pattern ?? ""}
                    onChange={(e) =>
                      updateSpec(targetLocale, "pattern", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={t("product.specs.pattern")}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="border border-border rounded-2xl p-4 bg-surface-section space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  Variante {index + 1}
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
                <select
                  value={variant.size}
                  onChange={(e) => updateVariant(variant.id, { size: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                >
                  <option value="">Choisir une taille</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {translateAttribute(size, locale)}
                    </option>
                  ))}
                </select>
                <div className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-muted-foreground flex items-center">
                  {variant.sku ?? "SKU généré automatiquement"}
                </div>
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
                  placeholder="Prix barré"
                />
                <select
                  value={variant.currency ?? "USD"}
                  onChange={(e) =>
                    updateVariant(variant.id, { currency: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                <input
                  value={variant.colorHex ?? ""}
                  onChange={(e) =>
                    updateVariant(variant.id, { colorHex: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder="Code couleur (hex)"
                />
              </div>

              <input
                type="number"
                step="1"
                min="0"
                value={variant.stock ?? 0}
                onChange={(e) =>
                  updateVariant(variant.id, { stock: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                placeholder="Stock"
              />

              <select
                value={variant.isActive === false ? "inactive" : "active"}
                onChange={(e) =>
                  updateVariant(variant.id, { isActive: e.target.value === "active" })
                }
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
              >
                <option value="active">{t("admin.product.variant.active")}</option>
                <option value="inactive">{t("admin.product.variant.inactive")}</option>
              </select>

              <ProductImageUploader
                productId={productId}
                initialImages={variant.images}
                onPersist={async (images) => updateVariant(variant.id, { images })}
                onUploadComplete={registerPendingUploads}
                onDeleteComplete={clearPendingUploads}
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
          onClick={() => void handleCancel()}
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
