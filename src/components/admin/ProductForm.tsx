"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateProductMutation, useUpdateProductMutation } from "@/hooks/use-admin";
import ProductImageUploader from "./ProductImageUploader";
import type { createAdminProduct } from "@/app/actions/admin";
import { deleteAdminProductImagesAction } from "@/app/actions/admin";
import {
  CURRENCY_OPTIONS,
  DRESS_STYLE_OPTIONS,
  SHOP_SECTION_OPTIONS,
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
  shopSection?: string;
  colorName: string;
  colorHex?: string;
  size: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  currency?: string;
  stock?: number | string;
  isActive?: boolean;
  images: { url: string; isCover: boolean }[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  categories: Category[];
  targetCurrency: string;
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

const COLOR_SWATCHES = [
  { label: "Green", value: "#16A34A" },
  { label: "Red", value: "#DC2626" },
  { label: "Yellow", value: "#FACC15" },
  { label: "Orange", value: "#EA580C" },
  { label: "Cyan", value: "#22D3EE" },
  { label: "Blue", value: "#2563EB" },
  { label: "Purple", value: "#9333EA" },
  { label: "Pink", value: "#DB2777" },
  { label: "White", value: "#F5F5F5" },
  { label: "Black", value: "#1F1F1F" },
  { label: "Gray", value: "#8C9198" },
  { label: "Brown", value: "#6B4D32" },
] as const;

const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const parseDecimalInput = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const candidate = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");

  if (!candidate) return 0;

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDecimalInput = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  return typeof value === "number" ? String(value) : value;
};

const parseIntegerInput = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;

  const digitsOnly = String(value ?? "").replace(/\D+/g, "");
  if (!digitsOnly) return 0;

  const parsed = Number(digitsOnly);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatIntegerInput = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(Math.max(0, Math.trunc(value)));
  return String(value).replace(/\D+/g, "");
};

export default function ProductForm({
  mode,
  categories,
  targetCurrency,
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
  const [basePrice, setBasePrice] = useState(String(initial?.basePrice ?? 0));
  const [discountPercentage, setDiscountPercentage] = useState(
    String(initial?.discountPercentage ?? 0),
  );
  const [vatRate, setVatRate] = useState(String(initial?.vatRate ?? 20));
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
    const basePriceValue = parseDecimalInput(basePrice);
    const discountValue = parseDecimalInput(discountPercentage);
    const vatRateValue = parseDecimalInput(vatRate);
    const pct = Math.max(0, Math.min(100, discountValue));
    const net = Math.max(0, Number((basePriceValue * (1 - pct / 100)).toFixed(2)));
    const vat = Math.max(0, vatRateValue);
    return Math.max(0, Number((net * (1 + vat / 100)).toFixed(2)));
  }, [basePrice, discountPercentage, vatRate]);

  const variantHelpText = labels["variant.help"];
  const skuFallbackText = labels["variant.skuFallback"];
  const missingShopSectionMessage = labels["error.variant.shopSection"];
  const missingImagesMessage = labels["error.variant.images"];
  const vatHintTemplate = labels["field.vatHint"];

  const [variants, setVariants] = useState<VariantInput[]>(
    initial?.variants?.map((variant) => ({
      ...variant,
      price: formatDecimalInput(variant.price),
      compareAtPrice:
        variant.compareAtPrice === null || variant.compareAtPrice === undefined
          ? null
          : formatDecimalInput(variant.compareAtPrice),
      stock: formatIntegerInput(variant.stock),
      images: variant.images ?? [],
    })) ?? [
      {
        id: crypto.randomUUID(),
        shopSection: "",
        colorName: "Standard",
        size: "Unique",
        price: String(initial?.basePrice ?? 0),
        stock: "0",
        isActive: true,
        images: [],
      },
    ],
  );

  const displayCurrency = useMemo(
    () => String(targetCurrency ?? "USD").toUpperCase(),
    [targetCurrency],
  );
  const displayCurrencyLabel =
    labels[`currency.${displayCurrency.toLowerCase()}`] ?? displayCurrency;

  const updateVariant = (id: string, patch: Partial<VariantInput>) => {
    setVariants((prev) =>
      prev.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    );
  };

  const updateTranslation = (
    targetLocale: LocaleCode,
    field: keyof TranslationFields,
    value: string | Partial<Record<"material" | "care" | "fit" | "pattern", string>>,
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
        setSlug(toSlug(String(value)));
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
        shopSection: "",
        colorName: "",
        size: "",
        price: 0,
        stock: "0",
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

  const replacePendingUploads = (urls: string[]) => {
    pendingCleanupRef.current = urls;
    setPendingCleanupUrls(urls);
  };

  useEffect(() => {
    const flushPendingUploads = () => {
      const urls = pendingCleanupRef.current;
      if (urls.length === 0) return;

      const body = JSON.stringify({ urls });

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
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
    const failValidation = (message: string) => {
      setError(message);
      toast.error(message);
    };

    if (!categoryId) {
      failValidation(labels["error.category"]);
      return;
    }

    if (!translations.fr.name || !translations.fr.description) {
      failValidation(labels["error.translation.fr"]);
      return;
    }
    if (!translations.en.name || !translations.en.description) {
      failValidation(labels["error.translation.en"]);
      return;
    }
    if (variants.length === 0) {
      failValidation(labels["error.variants.required"]);
      return;
    }

    const missingShopSectionIndex = variants.findIndex(
      (variant) => !String(variant.shopSection ?? "").trim(),
    );
    if (missingShopSectionIndex >= 0) {
      failValidation(
        missingShopSectionMessage.replace(
          "{index}",
          String(missingShopSectionIndex + 1),
        ),
      );
      return;
    }

    const missingImagesIndex = variants.findIndex(
      (variant) => (variant.images?.length ?? 0) === 0,
    );
    if (missingImagesIndex >= 0) {
      failValidation(
        missingImagesMessage.replace(
          "{index}",
          String(missingImagesIndex + 1),
        ),
      );
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
      basePrice: parseDecimalInput(basePrice),
      discountPercentage: parseDecimalInput(discountPercentage),
      vatRate: parseDecimalInput(vatRate),
      translations: (["fr", "en"] as const).map((targetLocale) => ({
        locale: targetLocale,
        name: translations[targetLocale].name,
        description: translations[targetLocale].description,
        specs: translations[targetLocale].specs,
      })),
      variants: variants.map((variant) => ({
        shopSection: variant.shopSection || null,
        colorName: variant.colorName || "Standard",
        colorHex: variant.colorHex ?? null,
        size: variant.size || "Unique",
        price: parseDecimalInput(variant.price),
        compareAtPrice:
          variant.compareAtPrice === null ||
          variant.compareAtPrice === undefined ||
          String(variant.compareAtPrice).trim() === ""
            ? null
            : parseDecimalInput(variant.compareAtPrice),
        currency: variant.currency || "USD",
        stock: parseIntegerInput(variant.stock),
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
            onChange={(e) => {
              const nextLocale = e.target.value as LocaleCode;
              setSourceLocale(nextLocale);
              if (!slugEdited) {
                setSlug(toSlug(translations[nextLocale].name));
              }
            }}
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
          >
            <option value="fr">{labels["locale.fr"]}</option>
            <option value="en">{labels["locale.en"]}</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {labels["field.sourceLocale.hint"]}
          </p>
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

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {labels["section.pricing"]}
          </p>
          <p className="text-xs text-muted-foreground">
            {labels["section.pricing.hint"]}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="border border-border rounded-2xl p-4 bg-surface-section space-y-2">
            <label className="text-sm font-medium text-foreground">
              {labels["field.basePrice"]}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              {labels["field.basePrice.hint"]}
            </p>
          </div>

          <div className="border border-border rounded-2xl p-4 bg-surface-section space-y-2">
            <label className="text-sm font-medium text-foreground">
              {labels["field.discount"]}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              {labels["field.discount.hint"]}
            </p>
          </div>

          <div className="border border-border rounded-2xl p-4 bg-surface-section space-y-2">
            <label className="text-sm font-medium text-foreground">
              {labels["field.vat"]}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
              placeholder="20"
            />
            <p className="text-xs text-muted-foreground">
              {labels["field.vat.inputHint"]}
            </p>
          </div>

          <div className="border border-border rounded-2xl p-4 bg-surface-section space-y-2">
            <label className="text-sm font-medium text-foreground">
              {labels["field.dressStyle"]}
            </label>
            <select
              value={dressStyle}
              onChange={(e) => setDressStyle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            >
              <option value="">{labels["placeholder.dressStyle"]}</option>
              {DRESS_STYLE_OPTIONS.map((style) => (
                <option key={style} value={style}>
                  {translateAttribute(style, locale)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {labels["field.dressStyle.hint"]}
            </p>
          </div>

          <div className="border border-border rounded-2xl p-4 bg-surface-section space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-foreground">
              {labels["field.finalPrice"]}
            </label>
            <div className="h-[46px] flex items-center px-4 rounded-xl border border-border bg-background text-sm text-foreground">
              {finalPrice.toFixed(2)} {displayCurrencyLabel}
            </div>
            <p className="text-xs text-muted-foreground">
              {labels["field.finalPrice.hint"]}
            </p>
            <p className="text-xs text-muted-foreground">
              {labels["field.finalPrice.currencyHint"]}
            </p>
            {labels["field.vatHint"] && (
              <p className="text-xs text-muted-foreground">
                {vatHintTemplate.replace(
                  "{rate}",
                  parseDecimalInput(vatRate).toFixed(1),
                )}
              </p>
            )}
          </div>
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
                    onChange={(e) => updateSpec(targetLocale, "material", e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={t("product.specs.material")}
                  />
                  <input
                    value={translations[targetLocale].specs.care ?? ""}
                    onChange={(e) => updateSpec(targetLocale, "care", e.target.value)}
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
                    onChange={(e) => updateSpec(targetLocale, "pattern", e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={t("product.specs.pattern")}
                  />
                </div>
              </div>
            </div>
          ))}
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
              setSlug(toSlug(e.target.value));
            }}
            required
            className="w-full rounded-xl border border-border bg-surface-section px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-foreground/10 outline-none"
            placeholder={labels["placeholder.slug"]}
          />
          <p className="text-xs text-muted-foreground">{labels["field.slug.hint"]}</p>
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
          <p className="text-xs text-muted-foreground">
            {labels["field.category.hint"]}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {labels["section.variants"]}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full h-9 px-4"
              onClick={addVariant}
            >
              {labels["action.addVariant"]}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {labels["section.variants.hint"]}
          </p>
        </div>

        <div className="space-y-5">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="border border-border rounded-2xl p-4 bg-surface-section space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  {labels["section.variantLabel"]} {index + 1}
                </div>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeVariant(variant.id)}
                  >
                    {labels["action.remove"]}
                  </Button>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.shopSectionLabel"]}
                  </label>
                  <select
                    value={variant.shopSection ?? ""}
                    onChange={(e) =>
                      updateVariant(variant.id, { shopSection: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  >
                    <option value="">{labels["placeholder.variant.shopSection"]}</option>
                    {SHOP_SECTION_OPTIONS.map((section) => (
                      <option key={section} value={section}>
                        {labels[`sectionOption.${section}`] ?? section}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {labels["variant.shopSectionHint"]}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.colorLabel"]}
                  </label>
                  <select
                    value={variant.colorHex ?? ""}
                    onChange={(e) => {
                      const selected = COLOR_SWATCHES.find(
                        (swatch) => swatch.value === e.target.value,
                      );
                      updateVariant(variant.id, {
                        colorName: selected?.label ?? "",
                        colorHex: selected?.value ?? "",
                      });
                    }}
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  >
                    <option value="">{labels["placeholder.variant.colorPalette"]}</option>
                    {COLOR_SWATCHES.map((swatch) => (
                      <option key={swatch.value} value={swatch.value}>
                        {translateAttribute(swatch.label, locale)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {labels["variant.colorHint"]}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.sizeLabel"]}
                  </label>
                  <select
                    value={variant.size}
                    onChange={(e) => updateVariant(variant.id, { size: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  >
                    <option value="">{labels["placeholder.variant.size"]}</option>
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {translateAttribute(size, locale)}
                      </option>
                    ))}{" "}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {labels["variant.sizeHint"]}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.skuLabel"]}
                  </label>
                  <div className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-muted-foreground flex items-center">
                    {variant.sku ?? skuFallbackText}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {labels["variant.skuHint"]}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.priceLabel"]}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatDecimalInput(variant.price)}
                    onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={labels["placeholder.variant.price"]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.compareAtPriceLabel"]}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatDecimalInput(variant.compareAtPrice)}
                    onChange={(e) =>
                      updateVariant(variant.id, {
                        compareAtPrice: e.target.value === "" ? null : e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                    placeholder={labels["placeholder.variant.compareAtPrice"]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {labels["variant.currencyLabel"]}
                  </label>
                  <select
                    value={variant.currency ?? "USD"}
                    onChange={(e) =>
                      updateVariant(variant.id, { currency: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency} value={currency}>
                        {labels[`currency.${currency.toLowerCase()}`] ?? currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {labels["variant.stockLabel"]}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInput(variant.stock)}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      stock: e.target.value.replace(/\D+/g, ""),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
                  placeholder={labels["placeholder.variant.stock"]}
                />
                <p className="text-xs text-muted-foreground">
                  {labels["variant.stockHint"]}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {labels["variant.activeLabel"]}
                </label>
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
                <p className="text-xs text-muted-foreground">
                  {labels["variant.activeHint"]}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {labels["variant.mediaLabel"]}
                </p>
                <p className="text-xs text-muted-foreground">{variantHelpText}</p>
              </div>

              <ProductImageUploader
                productId={productId}
                initialImages={variant.images}
                onPersist={async (images) => updateVariant(variant.id, { images })}
                onUploadComplete={registerPendingUploads}
                labels={{
                  drop: labels["uploader.drop"],
                  hint: labels["uploader.hint"],
                  uploading: labels["uploader.uploading"],
                  cover: labels["uploader.cover"],
                  deleteTitle: labels["uploader.deleteTitle"],
                  setCoverTitle: labels["uploader.setCoverTitle"],
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
