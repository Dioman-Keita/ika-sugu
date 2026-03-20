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
        <p className="text-sm text-muted-foreground">{m["admin.product.form.subtitle"]}</p>
        <h1 className="text-2xl font-semibold text-foreground">{m["admin.product.form.title.new"]}</h1>
      </div>

      <div className="border border-border rounded-2xl p-5 bg-surface-card shadow-sm">
        <ProductForm
          mode="create"
          categories={categories}
          labels={{
            "field.name": m["admin.product.form.name"],
            "field.slug": m["admin.product.form.slug"],
            "field.description": m["admin.product.form.description"],
            "field.category": m["admin.product.form.category"],
            "field.basePrice": m["admin.product.form.basePrice"],
            "field.discount": m["admin.product.form.discount"],
            "field.vat": m["admin.product.form.vat"],
            "field.dressStyle": m["admin.product.form.dressStyle"],
            "field.finalPrice": m["admin.product.form.finalPrice"],
            "field.vatHint": m["admin.product.form.vatHint"],
            "placeholder.name": m["admin.product.form.placeholder.name"],
            "placeholder.slug": m["admin.product.form.placeholder.slug"],
            "placeholder.description": m["admin.product.form.placeholder.description"],
            "placeholder.dressStyle": m["admin.product.form.placeholder.dressStyle"],
            "error.category": m["admin.product.form.error.category"],
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
