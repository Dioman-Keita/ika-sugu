"use server";

import db from "@/lib/db";
import { Product } from "@/types/product.types";
import { Review } from "@/types/review.types";
import { Prisma, ProductStatus, ReviewStatus } from "@/generated/prisma/client";
import { Locale } from "@/lib/i18n/messages";

type ProductSpecsJson = Partial<Record<"material" | "care" | "fit" | "pattern", string>>;

const labelKeyBySpecKey: Record<keyof ProductSpecsJson, string> = {
  material: "product.specs.material",
  care: "product.specs.care",
  fit: "product.specs.fit",
  pattern: "product.specs.pattern",
};

const toUiSpecs = (raw: unknown): Array<{ labelKey: string; value: string }> => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const obj = raw as Record<string, unknown>;

  const items: Array<{ labelKey: string; value: string }> = [];
  (Object.keys(labelKeyBySpecKey) as Array<keyof ProductSpecsJson>).forEach((key) => {
    const value = obj[key];
    if (typeof value === "string" && value.trim().length > 0) {
      items.push({ labelKey: labelKeyBySpecKey[key], value: value.trim() });
    }
  });
  return items;
};

const formatReviewDate = (date: Date, locale: Locale = "en"): string =>
  date.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getAverageRating = (ratings: Array<{ rating: number }>): number => {
  if (ratings.length === 0) return 0;
  const avg = ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
  return Math.round(avg * 10) / 10;
};

const isTransientDbError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const maybe = err as { code?: unknown; message?: unknown };
  const code = typeof maybe.code === "string" ? maybe.code : "";
  const message = typeof maybe.message === "string" ? maybe.message : "";
  const normalizedMessage = message.toLowerCase();
  return (
    ["P1001", "P1008", "P1017", "P2037"].includes(code) ||
    normalizedMessage.includes("connection timeout") ||
    normalizedMessage.includes("can't reach database server") ||
    normalizedMessage.includes("connection terminated unexpectedly") ||
    normalizedMessage.includes("server has closed the connection") ||
    normalizedMessage.includes("terminating connection") ||
    normalizedMessage.includes("connection ended unexpectedly")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withDbRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    await sleep(250);
    return await fn();
  }
};

const withDbFallback = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await withDbRetry(fn);
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    return fallback;
  }
};

const toUiProduct = (
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    basePrice: { toNumber: () => number };
    discountPercentage: number;
    finalPrice: { toNumber: () => number };
    reviews?: Array<{ rating: number }>;
    variants: Array<{
      id: string;
      sku: string | null;
      colorName: string;
      colorHex: string | null;
      size: string;
      images: string[];
      price: { toNumber: () => number };
      compareAtPrice: { toNumber: () => number } | null;
      currency: string;
      stock: number;
      isActive: boolean;
    }>;
    translations?: Array<{
      locale: string;
      name: string;
      description: string;
      specs?: unknown;
    }>;
  },
  locale: Locale = "en",
): Product => {
  // Try to find the specific translation for the requested locale
  const translation = product.translations?.find((t) => t.locale === locale);

  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const prices = activeVariants.map((variant) => variant.price.toNumber());
  const minVariantPrice = prices.length
    ? Math.min(...prices)
    : product.finalPrice.toNumber();

  const compareAtPrices = activeVariants
    .map((variant) => variant.compareAtPrice?.toNumber() ?? null)
    .filter((value): value is number => typeof value === "number");
  const minVariantCompareAtPrice = compareAtPrices.length
    ? Math.min(...compareAtPrices)
    : null;

  const basePrice = minVariantCompareAtPrice ?? product.basePrice.toNumber();
  const finalPrice = minVariantPrice;
  const discountPercentage =
    basePrice > finalPrice ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

  return {
    variants: product.variants.map((variant) => ({
      ...variant,
      price: variant.price.toNumber(),
      compareAtPrice: variant.compareAtPrice?.toNumber() ?? null,
    })),
    id: product.id,
    slug: product.slug,
    title: translation?.name ?? product.name,
    description: translation?.description ?? product.description,
    specs: translation?.specs ? toUiSpecs(translation.specs) : [],
    srcUrl:
      product.variants.find((variant) => variant.images.length > 0)?.images[0] ??
      "/images/pic1.png",
    gallery: product.variants.find((variant) => variant.images.length > 0)?.images ?? [],
    basePrice,
    discountPercentage,
    finalPrice,
    rating: getAverageRating(product.reviews ?? []),
  };
};

const toUiReview = (
  review: {
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
    user: { name: string };
  },
  locale: Locale = "en",
): Review => ({
  id: review.id,
  user: review.user.name,
  content: review.content,
  rating: review.rating,
  date: formatReviewDate(review.createdAt, locale),
});

export const getHomeCatalogAction = async (locale: Locale = "en") => {
  const newArrivalsRaw = await withDbFallback(
    () =>
      db.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          translations: { where: { locale } },
          variants: {
            where: { isActive: true },
            orderBy: [{ colorName: "asc" }, { size: "asc" }],
          },
          reviews: {
            where: { status: ReviewStatus.APPROVED },
            select: { rating: true },
          },
        },
      }),
    [],
  );

  const topSellingIds = await withDbFallback(
    () =>
      db.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 4,
      }),
    [],
  );

  const homeReviewsRaw = await withDbFallback(
    () =>
      db.review.findMany({
        where: { status: ReviewStatus.APPROVED },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true } } },
      }),
    [],
  );

  const topSellingRaw = topSellingIds.length
    ? await withDbFallback(
        () =>
          db.product.findMany({
            where: {
              id: { in: topSellingIds.map((item) => item.productId) },
              status: ProductStatus.PUBLISHED,
            },
            include: {
              translations: { where: { locale } },
              variants: {
                where: { isActive: true },
                orderBy: [{ colorName: "asc" }, { size: "asc" }],
              },
              reviews: {
                where: { status: ReviewStatus.APPROVED },
                select: { rating: true },
              },
            },
          }),
        [],
      )
    : [];

  const topSellingMap = new Map(topSellingRaw.map((product) => [product.id, product]));
  const topSellingData = topSellingIds
    .map((item) => topSellingMap.get(item.productId))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .map((product) => toUiProduct(product, locale));

  return {
    newArrivalsData: newArrivalsRaw.map((product) => toUiProduct(product, locale)),
    topSellingData,
    reviewsData: homeReviewsRaw.map((review) => toUiReview(review, locale)),
  };
};

export const getShopProductsAction = async ({
  page = 1,
  pageSize = 9,
  locale = "en",
  category,
  style,
  color,
  size,
  minPrice,
  maxPrice,
  sort = "most-popular",
}: {
  page?: number;
  pageSize?: number;
  locale?: Locale;
  category?: string | null;
  style?: string | null;
  color?: string | null;
  size?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: "most-popular" | "low-price" | "high-price" | "newest";
}) => {
  const safePageSize = Math.min(Math.max(Math.floor(pageSize), 1), 60);
  const safePage = Math.max(Math.floor(page), 1);
  const skip = (safePage - 1) * safePageSize;

  const variantWhere: Prisma.ProductVariantWhereInput = {
    isActive: true,
    ...(color ? { colorName: color } : {}),
    ...(size ? { size } : {}),
    ...((typeof minPrice === "number" || typeof maxPrice === "number") && {
      price: {
        ...(typeof minPrice === "number" ? { gte: new Prisma.Decimal(minPrice) } : {}),
        ...(typeof maxPrice === "number" ? { lte: new Prisma.Decimal(maxPrice) } : {}),
      },
    }),
  };

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.PUBLISHED,
    ...(category ? { category: { slug: category } } : {}),
    ...(style ? { dressStyle: style } : {}),
    variants: { some: variantWhere },
  };

  // Prisma doesn't support ordering products by min/max variant price via relation aggregates
  // in our current schema setup. We treat `Product.finalPrice` as the "from" price for sorting.
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "low-price"
      ? [{ finalPrice: "asc" }]
      : sort === "high-price"
        ? [{ finalPrice: "desc" }]
        : sort === "most-popular"
          ? [{ reviews: { _count: "desc" } }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

  try {
    const totalProducts = await withDbRetry(() => db.product.count({ where }));

    const products =
      sort === "low-price" || sort === "high-price"
        ? await withDbRetry(async () => {
            const conditions: Prisma.Sql[] = [
              Prisma.sql`pv."isActive" = true`,
              ...(color ? [Prisma.sql`pv."colorName" = ${color}`] : []),
              ...(size ? [Prisma.sql`pv."size" = ${size}`] : []),
              ...(typeof minPrice === "number"
                ? [Prisma.sql`pv."price" >= ${new Prisma.Decimal(minPrice)}`]
                : []),
              ...(typeof maxPrice === "number"
                ? [Prisma.sql`pv."price" <= ${new Prisma.Decimal(maxPrice)}`]
                : []),
              ...(style ? [Prisma.sql`p."dressStyle" = ${style}`] : []),
              ...(category ? [Prisma.sql`c."slug" = ${category}`] : []),
            ];

            const direction = sort === "low-price" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

            const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
              SELECT p."id" AS id
              FROM "Product" p
              JOIN "ProductVariant" pv ON pv."productId" = p."id"
              LEFT JOIN "Category" c ON c."id" = p."categoryId"
              WHERE ${Prisma.join(conditions, " AND ")}
              GROUP BY p."id"
              ORDER BY MIN(pv."price") ${direction}, p."createdAt" DESC
              LIMIT ${safePageSize} OFFSET ${skip}
            `);

            const ids = rows.map((r) => r.id);
            if (ids.length === 0) return [];

            const fetched = await db.product.findMany({
              where: { id: { in: ids } },
              include: {
                translations: { where: { locale } },
                variants: {
                  where: variantWhere,
                  orderBy: [{ price: "asc" }, { colorName: "asc" }, { size: "asc" }],
                  take: 1,
                },
              },
            });

            const byId = new Map(fetched.map((p) => [p.id, p]));
            return ids
              .map((id) => byId.get(id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
          })
        : await withDbRetry(() =>
            db.product.findMany({
              where,
              skip,
              take: safePageSize,
              orderBy,
              include: {
                translations: { where: { locale } },
                variants: {
                  where: variantWhere,
                  orderBy: [{ price: "asc" }, { colorName: "asc" }, { size: "asc" }],
                  take: 1,
                },
              },
            }),
          );

    const ratingByProductId = products.length
      ? new Map(
          (
            await withDbRetry(() =>
              db.review.groupBy({
                by: ["productId"],
                where: {
                  status: ReviewStatus.APPROVED,
                  productId: { in: products.map((product) => product.id) },
                },
                _avg: { rating: true },
              }),
            )
          ).map((row) => [row.productId, row._avg.rating ?? 0]),
        )
      : new Map<string, number>();

    return {
      products: products.map((product) =>
        toUiProduct(
          {
            ...(product as unknown as Parameters<typeof toUiProduct>[0]),
            reviews: ratingByProductId.has(product.id)
              ? [{ rating: ratingByProductId.get(product.id) ?? 0 }]
              : [],
          },
          locale,
        ),
      ),
      totalProducts,
      currentPage: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(totalProducts / safePageSize)),
    };
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    console.error("getShopProductsAction: transient DB error", err);
    return {
      products: [],
      totalProducts: 0,
      currentPage: safePage,
      pageSize: safePageSize,
      totalPages: 1,
    };
  }
};

export const getProductPageAction = async (productId: string, locale: Locale = "en") => {
  const product = await db.product.findFirst({
    where: { id: productId, status: ProductStatus.PUBLISHED },
    include: {
      translations: { where: { locale } },
      variants: {
        where: { isActive: true },
        orderBy: [{ colorName: "asc" }, { size: "asc" }],
      },
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) return null;

  const relatedRaw = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: ProductStatus.PUBLISHED,
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      translations: { where: { locale } },
      variants: {
        where: { isActive: true },
        orderBy: [{ colorName: "asc" }, { size: "asc" }],
      },
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        select: { rating: true },
      },
    },
  });

  return {
    product: toUiProduct(
      {
        ...product,
        reviews: product.reviews.map((review) => ({ rating: review.rating })),
      },
      locale,
    ),
    relatedProducts: relatedRaw.map((product) => toUiProduct(product, locale)),
    reviews: product.reviews.map((review) => toUiReview(review, locale)),
  };
};

export const getCategoriesAction = async (locale: Locale = "en") => {
  try {
    const categories = await withDbRetry(() =>
      db.category.findMany({
        include: {
          translations: {
            where: { locale },
          },
        },
      }),
    );

    return categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.translations?.[0]?.name ?? category.name,
    }));
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    console.error("getCategoriesAction: transient DB error", err);
    return [];
  }
};
