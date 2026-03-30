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

  const categories = await getAdminCategories();
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
            "field.sourceLocale": m["admin.product.form.sourceLocale"],
            "field.status": m["admin.product.form.status"],
            "field.category": m["admin.product.form.category"],
            "field.basePrice": m["admin.product.form.basePrice"],
            "field.discount": m["admin.product.form.discount"],
            "field.vat": m["admin.product.form.vat"],
            "field.dressStyle": m["admin.product.form.dressStyle"],
            "field.finalPrice": m["admin.product.form.finalPrice"],
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
          }}
        />
      </div>
    </div>
  );
}
