import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { getAdminCategories } from "@/app/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

export default async function AdminNewProductPage() {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const categories = await getAdminCategories(locale);
  if (!categories.length) return notFound();

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {m["admin.product.form.subtitle"]}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {m["admin.product.form.title.new"]}
        </h1>
      </div>

      <div className="border border-border rounded-2xl p-5 bg-surface-card shadow-sm">
        <ProductForm
          mode="create"
          categories={categories}
          labels={{
            "field.slug": m["admin.product.form.slug"],
            "field.slug.hint": m["admin.product.form.slug.hint"],
            "field.sourceLocale": m["admin.product.form.sourceLocale"],
            "field.sourceLocale.hint": m["admin.product.form.sourceLocale.hint"],
            "field.status": m["admin.product.form.status"],
            "field.category": m["admin.product.form.category"],
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
            "status.draft": m["admin.product.status.draft"],
            "status.published": m["admin.product.status.published"],
            "status.archived": m["admin.product.status.archived"],
            "locale.fr": m["admin.product.locale.fr"],
            "locale.en": m["admin.product.locale.en"],
            "action.create": m["admin.product.form.action.create"],
            "action.save": m["admin.product.form.action.save"],
            "action.cancel": m["admin.product.form.action.cancel"],
            "action.saving": m["admin.product.form.action.saving"],
            "action.regenerateSlug": m["admin.product.form.action.regenerateSlug"],
            "action.addVariant": m["admin.product.form.action.addVariant"],
            "action.remove": m["common.remove"],
            "placeholder.variant.size": m["admin.product.form.placeholder.variant.size"],
            "placeholder.variant.price":
              m["admin.product.form.placeholder.variant.price"],
            "placeholder.variant.compareAtPrice":
              m["admin.product.form.placeholder.variant.compareAtPrice"],
            "placeholder.variant.colorPalette":
              m["admin.product.form.placeholder.variant.colorPalette"],
            "placeholder.variant.stock":
              m["admin.product.form.placeholder.variant.stock"],
            "variant.help": m["admin.product.form.variant.help"],
            "variant.colorLabel": m["admin.product.form.variant.colorLabel"],
            "variant.colorHint": m["admin.product.form.variant.colorHint"],
            "variant.sizeLabel": m["admin.product.form.variant.sizeLabel"],
            "variant.sizeHint": m["admin.product.form.variant.sizeHint"],
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
