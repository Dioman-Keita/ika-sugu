import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import db from "@/lib/db";
import { getAdminCategories, getAdminCurrencySettings } from "@/app/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

type Props = { params: Promise<{ id: string }> };

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  sourceLocale: true,
  status: true,
  dressStyle: true,
  categoryId: true,
  basePrice: true,
  vatRate: true,
  discountPercentage: true,
  translations: {
    select: {
      locale: true,
      name: true,
      description: true,
      specs: true,
    },
  },
  variants: {
    select: {
      id: true,
      images: true,
      shopSection: true,
      colorName: true,
      colorHex: true,
      size: true,
      price: true,
      compareAtPrice: true,
      currency: true,
      stock: true,
      isActive: true,
      sku: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

type ProductShape = Prisma.ProductGetPayload<{ select: typeof PRODUCT_SELECT }>;

const shapeProduct = (product: ProductShape | null) => {
  if (!product) return null;
  const translationMap = new Map(
    product.translations.map((translation) => [translation.locale, translation]),
  );

  const variants =
    product.variants?.map((v) => ({
      id: v.id,
      shopSection: v.shopSection ?? undefined,
      colorName: v.colorName,
      colorHex: v.colorHex ?? undefined,
      size: v.size,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      currency: v.currency ?? "USD",
      stock: v.stock,
      isActive: v.isActive,
      sku: v.sku ?? undefined,
      images: (v.images ?? []).map((url: string, idx: number) => ({
        url,
        isCover: idx === 0,
      })),
    })) ?? [];
  return {
    ...product,
    translations: {
      fr: {
        name:
          translationMap.get("fr")?.name ??
          (product.sourceLocale === "fr" ? product.name : ""),
        description:
          translationMap.get("fr")?.description ??
          (product.sourceLocale === "fr" ? product.description : ""),
        specs: (translationMap.get("fr")?.specs as Record<string, string> | null) ?? {},
      },
      en: {
        name:
          translationMap.get("en")?.name ??
          (product.sourceLocale === "en" ? product.name : ""),
        description:
          translationMap.get("en")?.description ??
          (product.sourceLocale === "en" ? product.description : ""),
        specs: (translationMap.get("en")?.specs as Record<string, string> | null) ?? {},
      },
    },
    variants,
  };
};

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: PRODUCT_SELECT,
  });
  const shaped = shapeProduct(product);
  if (!shaped) return notFound();

  const categories = await getAdminCategories(locale);
  const currencySettings = await getAdminCurrencySettings();

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {m["admin.product.form.subtitle"]}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{shaped.name}</h1>
          <Link
            href={`/shop/product/${shaped.id}/${shaped.slug}`}
            className="text-primary text-sm hover:underline"
            target="_blank"
          >
            {m["admin.media.openProduct"]}
          </Link>
        </div>
      </div>

      <div className="border border-border rounded-2xl p-5 bg-surface-card shadow-sm space-y-6">
        <ProductForm
          mode="edit"
          categories={categories}
          targetCurrency={currencySettings.targetCurrency}
          initial={{
            id: shaped.id,
            slug: shaped.slug,
            sourceLocale: shaped.sourceLocale as "fr" | "en",
            status: shaped.status,
            dressStyle: shaped.dressStyle,
            categoryId: shaped.categoryId,
            basePrice: Number(shaped.basePrice),
            discountPercentage: shaped.discountPercentage,
            vatRate: Number(shaped.vatRate ?? 20),
            translations: shaped.translations,
            variants: shaped.variants,
          }}
          labels={{
            "field.slug": m["admin.product.form.slug"],
            "field.slug.hint": m["admin.product.form.slug.hint"],
            "field.sourceLocale": m["admin.product.form.sourceLocale"],
            "field.sourceLocale.hint": m["admin.product.form.sourceLocale.hint"],
            "field.status": m["admin.product.form.status"],
            "field.category": m["admin.product.form.category"],
            "field.category.hint": m["admin.product.form.category.hint"],
            "field.basePrice": m["admin.product.form.basePrice"],
            "field.basePrice.hint": m["admin.product.form.basePrice.hint"],
            "field.discount": m["admin.product.form.discount"],
            "field.discount.hint": m["admin.product.form.discount.hint"],
            "field.vat": m["admin.product.form.vat"],
            "field.vat.inputHint": m["admin.product.form.vat.inputHint"],
            "field.dressStyle": m["admin.product.form.dressStyle"],
            "field.dressStyle.hint": m["admin.product.form.dressStyle.hint"],
            "field.finalPrice": m["admin.product.form.finalPrice"],
            "field.finalPrice.hint": m["admin.product.form.finalPrice.hint"],
            "field.finalPrice.currencyHint":
              m["admin.product.form.finalPrice.currencyHint"],
            "field.vatHint": m["admin.product.form.vatHint"],
            "placeholder.slug": m["admin.product.form.placeholder.slug"],
            "placeholder.dressStyle": m["admin.product.form.placeholder.dressStyle"],
            "field.name.fr": m["admin.product.form.nameFr"],
            "field.name.en": m["admin.product.form.nameEn"],
            "field.description.fr": m["admin.product.form.descriptionFr"],
            "field.description.en": m["admin.product.form.descriptionEn"],
            "placeholder.name.fr": m["admin.product.form.placeholder.name.fr"],
            "placeholder.name.en": m["admin.product.form.placeholder.name.en"],
            "placeholder.description.fr":
              m["admin.product.form.placeholder.description.fr"],
            "placeholder.description.en":
              m["admin.product.form.placeholder.description.en"],
            "section.translations": m["admin.product.form.translations"],
            "section.translations.hint": m["admin.product.form.translations.hint"],
            "section.pricing": m["admin.product.form.pricing"],
            "section.pricing.hint": m["admin.product.form.pricing.hint"],
            "section.variants": m["admin.product.form.variants"],
            "section.variants.hint": m["admin.product.form.variants.hint"],
            "section.variantLabel": m["admin.product.form.variantLabel"],
            "error.category": m["admin.product.form.error.category"],
            "error.translation.fr": m["admin.product.form.error.translation.fr"],
            "error.translation.en": m["admin.product.form.error.translation.en"],
            "error.variants.required": m["admin.product.form.error.variants.required"],
            "error.variant.shopSection":
              m["admin.product.form.error.variant.shopSection"],
            "error.variant.images":
              m["admin.product.form.error.variant.images"],
            "status.draft": m["admin.product.status.draft"],
            "status.published": m["admin.product.status.published"],
            "status.archived": m["admin.product.status.archived"],
            "locale.fr": m["admin.product.locale.fr"],
            "locale.en": m["admin.product.locale.en"],
            "action.create": m["admin.product.form.action.create"],
            "action.save": m["admin.product.form.action.save"],
            "action.cancel": m["admin.product.form.action.cancel"],
            "action.saving": m["admin.product.form.action.saving"],
            "action.addVariant": m["admin.product.form.action.addVariant"],
            "action.remove": m["common.remove"],
            "placeholder.variant.size": m["admin.product.form.placeholder.variant.size"],
            "placeholder.variant.price":
              m["admin.product.form.placeholder.variant.price"],
            "placeholder.variant.compareAtPrice":
              m["admin.product.form.placeholder.variant.compareAtPrice"],
            "placeholder.variant.colorPalette":
              m["admin.product.form.placeholder.variant.colorPalette"],
            "placeholder.variant.shopSection":
              m["admin.product.form.placeholder.variant.shopSection"],
            "placeholder.variant.stock":
              m["admin.product.form.placeholder.variant.stock"],
            "variant.shopSectionLabel":
              m["admin.product.form.variant.shopSectionLabel"],
            "variant.shopSectionHint":
              m["admin.product.form.variant.shopSectionHint"],
            "variant.colorLabel": m["admin.product.form.variant.colorLabel"],
            "variant.colorHint": m["admin.product.form.variant.colorHint"],
            "variant.sizeLabel": m["admin.product.form.variant.sizeLabel"],
            "variant.sizeHint": m["admin.product.form.variant.sizeHint"],
            "variant.help": m["admin.product.form.variant.help"],
            "variant.stockLabel": m["admin.product.form.variant.stockLabel"],
            "variant.stockHint": m["admin.product.form.variant.stockHint"],
            "variant.activeLabel": m["admin.product.form.variant.activeLabel"],
            "variant.activeHint": m["admin.product.form.variant.activeHint"],
            "variant.skuLabel": m["admin.product.form.variant.skuLabel"],
            "variant.skuHint": m["admin.product.form.variant.skuHint"],
            "variant.skuFallback": m["admin.product.form.variant.skuFallback"],
            "variant.priceLabel": m["admin.product.form.variant.priceLabel"],
            "variant.compareAtPriceLabel":
              m["admin.product.form.variant.compareAtPriceLabel"],
            "variant.currencyLabel": m["admin.product.form.variant.currencyLabel"],
            "variant.mediaLabel": m["admin.product.form.variant.mediaLabel"],
            "currency.usd": m["currency.usd"],
            "currency.eur": m["currency.eur"],
            "currency.xof": m["currency.xof"],
            "sectionOption.men-clothes": m["nav.men"],
            "sectionOption.women-clothes": m["nav.women"],
            "sectionOption.kids-clothes": m["nav.kids"],
            "sectionOption.bag-shoes": m["nav.bagsShoes"],
            "uploader.drop": m["admin.product.form.uploader.drop"],
            "uploader.hint": m["admin.product.form.uploader.hint"],
            "uploader.uploading": m["admin.product.form.uploader.uploading"],
            "uploader.cover": m["admin.product.form.uploader.cover"],
            "uploader.deleteTitle": m["admin.product.form.uploader.deleteTitle"],
            "uploader.setCoverTitle": m["admin.product.form.uploader.setCoverTitle"],
          }}
        />
      </div>
    </div>
  );
}
