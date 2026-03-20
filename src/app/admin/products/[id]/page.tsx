import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import db from "@/lib/db";
import { getAdminCategories } from "@/app/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

type Props = { params: { id: string } };

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  dressStyle: true,
  categoryId: true,
  basePrice: true,
  vatRate: true,
  discountPercentage: true,
  variants: {
    select: {
      id: true,
      images: true,
      colorName: true,
      colorHex: true,
      size: true,
      price: true,
      compareAtPrice: true,
      currency: true,
      stock: true,
      sku: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

type ProductShape = Prisma.ProductGetPayload<{ select: typeof PRODUCT_SELECT }>;

const shapeProduct = (product: ProductShape | null) => {
  if (!product) return null;
  const variants =
    product.variants?.map((v) => ({
      id: v.id,
      colorName: v.colorName,
      colorHex: v.colorHex ?? undefined,
      size: v.size,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      currency: v.currency ?? "USD",
      stock: v.stock,
      sku: v.sku ?? undefined,
      images: (v.images ?? []).map((url: string, idx: number) => ({
        url,
        isCover: idx === 0,
      })),
    })) ?? [];
  return { ...product, variants };
};

export default async function AdminProductDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const product = await db.product.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    select: PRODUCT_SELECT,
  });
  const shaped = shapeProduct(product);
  if (!shaped) return notFound();

  const categories = await getAdminCategories();

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {m["admin.product.form.subtitle"]}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{shaped.name}</h1>
          <Link
            href={`/shop/product/${shaped.slug}`}
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
          initial={{
            id: shaped.id,
            name: shaped.name,
            slug: shaped.slug,
            description: shaped.description,
            dressStyle: shaped.dressStyle,
            categoryId: shaped.categoryId,
            basePrice: Number(shaped.basePrice),
            discountPercentage: shaped.discountPercentage,
            vatRate: Number(shaped.vatRate ?? 20),
            variants: shaped.variants,
          }}
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
