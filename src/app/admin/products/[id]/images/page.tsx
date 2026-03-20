import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import ProductImagesManager from "@/components/admin/ProductImagesManager";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";

type Props = { params: { id: string } };

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  variants: {
    select: { id: true, images: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

const shapeProduct = (
  product: {
    id: string;
    name: string;
    slug: string;
    variants: { id: string; images: string[] }[];
  } | null,
) => {
  if (!product) return null;
  const primaryVariant = product.variants[0];
  const initialImages =
    primaryVariant?.images.map((url, idx) => ({ url, isCover: idx === 0 })) ?? [];
  return { ...product, initialImages };
};

const getProduct = async (idOrSlug: string | undefined) => {
  if (!idOrSlug) return null;

  // Try by product id, then slug, then variant id
  const product =
    (await db.product.findUnique({
      where: { id: idOrSlug },
      select: { ...PRODUCT_SELECT },
    })) ??
    (await db.product.findUnique({
      where: { slug: idOrSlug },
      select: { ...PRODUCT_SELECT },
    })) ??
    (await db.product.findFirst({
      where: { variants: { some: { id: idOrSlug } } },
      select: { ...PRODUCT_SELECT },
    }));

  return shapeProduct(product);
};

export default async function ProductImagesPage({ params }: Props) {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const product = await getProduct(params.id);
  if (!product) return notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{m["admin.media.title"]}</p>
          <h1 className="text-xl font-semibold text-foreground">{product.name}</h1>
          <Link
            href={`/shop/product/${product.slug}`}
            className="text-primary text-sm hover:underline"
            target="_blank"
          >
            {m["admin.media.openProduct"]}
          </Link>
        </div>
      </div>

      <div className="border border-border rounded-2xl p-4 bg-surface-card">
        <ProductImagesManager
          productId={product.id}
          initialImages={product.initialImages}
          labels={{
            saving: m["admin.media.saving"],
            uploader: {
              drop: m["admin.media.uploader.drop"],
              hint: m["admin.media.uploader.hint"],
              uploading: m["admin.media.uploader.uploading"],
              cover: m["admin.media.uploader.cover"],
              deleteTitle: m["admin.media.uploader.delete"],
              setCoverTitle: m["admin.media.uploader.setCover"],
            },
          }}
        />
      </div>
    </div>
  );
}
