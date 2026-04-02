"use server";

import db from "@/lib/db";
import {
  Prisma,
  ReviewStatus,
  OrderStatus,
  ProductStatus,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth, isAdminEmail } from "@/lib/auth";
import { deleteStorageFiles } from "@/lib/storage/deleteImages";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  CURRENCY_OPTIONS,
  DRESS_STYLE_OPTIONS,
  SIZE_OPTIONS,
  isCurrencyOption,
  isDressStyleOption,
  isSizeOption,
} from "@/lib/catalog-options";

const PAGE_SIZE = 15;
const REVENUE_GENERATING_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
const ADMIN_PRODUCT_STATUSES = [
  ProductStatus.DRAFT,
  ProductStatus.PUBLISHED,
  ProductStatus.ARCHIVED,
] as const;
const PRODUCT_AUTHORING_LOCALES = ["fr", "en"] as const;
type ProductAuthoringLocale = (typeof PRODUCT_AUTHORING_LOCALES)[number];

const assertAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  if (!isAdminEmail(session.user?.email)) throw new Error("Forbidden");
};

// ─── Stat helpers ─────────────────────────────────────────────────────────────

export async function getAdminStats() {
  await assertAdmin();
  const [
    totalOrders,
    totalUsers,
    totalProducts,
    pendingReviews,
    revenueAgg,
    ordersByStatusRaw,
    monthlyRevenueRaw,
  ] = await Promise.all([
    db.order.count(),
    db.user.count(),
    db.product.count(),
    db.review.count({ where: { status: ReviewStatus.PENDING } }),
    db.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: REVENUE_GENERATING_STATUSES },
      },
    }),
    db.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    db.$queryRaw<Array<{ month: Date; revenue: number }>>(Prisma.sql`
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        COALESCE(SUM(CASE WHEN status IN (${Prisma.join(REVENUE_GENERATING_STATUSES)}) THEN total ELSE 0 END), 0) AS revenue
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `),
  ]);

  const totalRevenue = revenueAgg._sum.total?.toNumber() ?? 0;

  const ordersByStatus: Record<string, number> = {};
  for (const row of ordersByStatusRaw) {
    ordersByStatus[row.status] = row._count.id;
  }

  const now = new Date();
  const months: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7); // "2025-01"
    const found = monthlyRevenueRaw.find((r) => {
      const rKey = new Date(r.month).toISOString().slice(0, 7);
      return rKey === key;
    });
    months.push({ month: key, revenue: found ? Number(found.revenue) : 0 });
  }

  return {
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    pendingReviews,
    ordersByStatus,
    monthlyRevenue: months,
  };
}

// ─── Recent Orders (for overview) ─────────────────────────────────────────────

export async function getRecentOrders() {
  await assertAdmin();
  const orders = await db.order.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true } },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    userName: o.user.name,
    userEmail: o.user.email,
    total: o.total.toNumber(),
    status: o.status,
    createdAt: o.createdAt,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
  }));
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAdminProducts({
  page = 1,
  status,
}: {
  page?: number;
  status?: ProductStatus;
} = {}) {
  await assertAdmin();
  const skip = (page - 1) * PAGE_SIZE;
  const where: Prisma.ProductWhereInput = status ? { status } : {};
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        variants: {
          where: { isActive: true },
          select: { id: true, stock: true },
        },
      },
    }),
  ]);

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name,
      status: p.status,
      basePrice: p.basePrice.toNumber(),
      discountPercentage: p.discountPercentage,
      finalPrice: p.finalPrice.toNumber(),
      activeVariants: p.variants.length,
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
      createdAt: p.createdAt,
    })),
  };
}

type UpsertProductInput = {
  id?: string;
  slug: string;
  sourceLocale: ProductAuthoringLocale;
  status: ProductStatus;
  dressStyle?: string | null;
  categoryId: string;
  basePrice: number;
  discountPercentage?: number;
  vatRate?: number;
  translations: Array<{
    locale: ProductAuthoringLocale;
    name: string;
    description: string;
    specs?: Partial<Record<"material" | "care" | "fit" | "pattern", string>>;
  }>;
  variants?: Array<{
    id?: string;
    colorName: string;
    colorHex?: string | null;
    size: string;
    price: number;
    compareAtPrice?: number | null;
    currency?: string;
    stock?: number;
    isActive?: boolean;
    images?: string[];
  }>;
};

const computeFinalPrice = (base: number, discount?: number) => {
  const pct = Math.max(0, Math.min(100, discount ?? 0));
  return Math.max(0, Number((base * (1 - pct / 100)).toFixed(2)));
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const normalizeProductInput = (data: UpsertProductInput) => {
  const slug = slugify(String(data.slug ?? ""));
  if (!slug) throw new Error("Product slug is required");
  if (!data.categoryId) throw new Error("Product category is required");
  if (!PRODUCT_AUTHORING_LOCALES.includes(data.sourceLocale)) {
    throw new Error("Product source locale must be either fr or en");
  }
  if (!ADMIN_PRODUCT_STATUSES.includes(data.status)) {
    throw new Error("Unsupported product status");
  }

  const dressStyle = data.dressStyle ?? null;
  if (dressStyle && !isDressStyleOption(dressStyle)) {
    throw new Error(
      `Unsupported dress style. Allowed values: ${DRESS_STYLE_OPTIONS.join(", ")}`,
    );
  }

  const basePrice = Number(data.basePrice);
  const discountPercentage = Number(data.discountPercentage ?? 0);
  const vatRate = Number(data.vatRate ?? 20);

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error("Base price must be a valid positive number");
  }
  if (
    !Number.isFinite(discountPercentage) ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    throw new Error("Discount percentage must be between 0 and 100");
  }
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error("VAT rate must be between 0 and 100");
  }

  const translationsByLocale = new Map<
    ProductAuthoringLocale,
    {
      locale: ProductAuthoringLocale;
      name: string;
      description: string;
      specs: Partial<Record<"material" | "care" | "fit" | "pattern", string>> | null;
    }
  >();
  for (const locale of PRODUCT_AUTHORING_LOCALES) {
    const input = data.translations.find((translation) => translation.locale === locale);
    const name = String(input?.name ?? "").trim();
    const description = String(input?.description ?? "").trim();

    if (!name) throw new Error(`Translation ${locale}: name is required`);
    if (!description) throw new Error(`Translation ${locale}: description is required`);

    const normalizedSpecsEntries = Object.entries(input?.specs ?? {}).flatMap(
      ([key, value]) => {
        const normalizedValue = String(value ?? "").trim();
        return normalizedValue ? [[key, normalizedValue]] : [];
      },
    );

    translationsByLocale.set(locale, {
      locale,
      name,
      description,
      specs:
        normalizedSpecsEntries.length > 0
          ? (Object.fromEntries(normalizedSpecsEntries) as Partial<
              Record<"material" | "care" | "fit" | "pattern", string>
            >)
          : null,
    });
  }

  const sourceTranslation = translationsByLocale.get(data.sourceLocale);
  if (!sourceTranslation) {
    throw new Error("Missing source locale translation");
  }

  const variants = (data.variants ?? []).map((variant, index) => {
    const colorName = String(variant.colorName ?? "").trim();
    const size = String(variant.size ?? "").trim();
    const currency = String(variant.currency ?? "USD")
      .trim()
      .toUpperCase();
    const price = Number(variant.price);
    const stock = Number(variant.stock ?? 0);
    const compareAtPrice =
      variant.compareAtPrice === null || variant.compareAtPrice === undefined
        ? null
        : Number(variant.compareAtPrice);
    const isActive = variant.isActive ?? true;

    if (!colorName) throw new Error(`Variant ${index + 1}: color is required`);
    if (!size) throw new Error(`Variant ${index + 1}: size is required`);
    if (!isSizeOption(size)) {
      throw new Error(
        `Variant ${index + 1}: unsupported size. Allowed values: ${SIZE_OPTIONS.join(", ")}`,
      );
    }
    if (!isCurrencyOption(currency)) {
      throw new Error(
        `Variant ${index + 1}: unsupported currency. Allowed values: ${CURRENCY_OPTIONS.join(", ")}`,
      );
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Variant ${index + 1}: price must be a valid positive number`);
    }
    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error(`Variant ${index + 1}: stock must be zero or greater`);
    }
    if (
      compareAtPrice !== null &&
      (!Number.isFinite(compareAtPrice) || compareAtPrice < price)
    ) {
      throw new Error(
        `Variant ${index + 1}: compare-at price must be greater than or equal to price`,
      );
    }

    return {
      id: variant.id,
      colorName,
      colorHex: variant.colorHex?.trim() || null,
      size,
      price,
      compareAtPrice,
      currency,
      stock,
      isActive,
      images: variant.images ?? [],
    };
  });

  const variantIdentity = new Set<string>();
  for (const variant of variants) {
    const key = `${variant.colorName.toLowerCase()}::${variant.size.toLowerCase()}`;
    if (variantIdentity.has(key)) {
      throw new Error("Each variant must have a unique color and size combination");
    }
    variantIdentity.add(key);
  }

  return {
    id: data.id,
    name: sourceTranslation.name,
    slug,
    description: sourceTranslation.description,
    sourceLocale: data.sourceLocale,
    status: data.status,
    dressStyle,
    categoryId: data.categoryId,
    basePrice,
    discountPercentage,
    vatRate,
    translations: PRODUCT_AUTHORING_LOCALES.map((locale) => {
      const translation = translationsByLocale.get(locale);
      if (!translation) throw new Error(`Missing ${locale} translation`);
      return translation;
    }),
    variants,
  };
};

const buildSkuBase = (productSlug: string, colorName: string, size: string) =>
  [productSlug, slugify(colorName), slugify(size)]
    .filter(Boolean)
    .join("-")
    .toUpperCase();

async function generateUniqueSku(
  tx: Prisma.TransactionClient,
  productSlug: string,
  colorName: string,
  size: string,
  excludeVariantId?: string,
) {
  const base = buildSkuBase(productSlug, colorName, size) || "SKU";
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await tx.productVariant.findFirst({
      where: {
        sku: candidate,
        ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function uploadAdminProductImageAction(formData: FormData) {
  await assertAdmin();

  const file = formData.get("file") as File;
  const productId = formData.get("productId") as string;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;

  if (!file || !productId || !bucket) {
    throw new Error("Missing required upload parameters");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const supabase = getSupabaseServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const path = `${productId}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Unable to get public URL");
  }

  return { url: data.publicUrl };
}

export async function deleteAdminProductImagesAction(publicUrls: string[]) {
  await assertAdmin();
  await deleteStorageFiles(publicUrls);
  return { success: true };
}

export async function createAdminProduct(data: UpsertProductInput) {
  await assertAdmin();
  const normalized = normalizeProductInput(data);
  const net = computeFinalPrice(normalized.basePrice, normalized.discountPercentage);
  const vatRate = Math.max(0, normalized.vatRate ?? 20);
  const finalPriceComputed = Number((net * (1 + vatRate / 100)).toFixed(2));

  const variantsPayload = normalized.variants.length
    ? normalized.variants
    : [
        {
          colorName: "Default",
          colorHex: null,
          size: "Unique",
          price: finalPriceComputed,
          compareAtPrice: normalized.basePrice,
          currency: "USD",
          stock: 0,
          isActive: true,
          images: [],
        },
      ];

  const minVariantPrice = variantsPayload.reduce(
    (min, v) => Math.min(min, Number(v.price)),
    Infinity,
  );
  const finalPrice = minVariantPrice === Infinity ? finalPriceComputed : minVariantPrice;

  const product = await db.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        id: normalized.id,
        name: normalized.name,
        slug: normalized.slug,
        description: normalized.description,
        sourceLocale: normalized.sourceLocale,
        status: normalized.status,
        dressStyle: normalized.dressStyle ?? null,
        basePrice: normalized.basePrice,
        vatRate,
        discountPercentage: normalized.discountPercentage ?? 0,
        finalPrice,
        categoryId: normalized.categoryId,
        translations: {
          create: normalized.translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name,
            description: translation.description,
            ...(translation.specs ? { specs: translation.specs } : {}),
          })),
        },
      },
      select: { id: true, slug: true },
    });

    for (const variant of variantsPayload) {
      const sku = await generateUniqueSku(
        tx,
        createdProduct.slug,
        variant.colorName,
        variant.size,
      );

      await tx.productVariant.create({
        data: {
          productId: createdProduct.id,
          sku,
          colorName: variant.colorName,
          colorHex: variant.colorHex ?? null,
          size: variant.size,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          currency: variant.currency ?? "USD",
          stock: variant.stock ?? 0,
          isActive: variant.isActive ?? true,
          images: variant.images ?? [],
        },
      });
    }

    return createdProduct;
  });

  revalidatePath("/admin/products");
  return product;
}

export async function updateAdminProduct(data: UpsertProductInput & { id: string }) {
  await assertAdmin();
  const normalized = normalizeProductInput(data);
  const net = computeFinalPrice(normalized.basePrice, normalized.discountPercentage);
  const vatRate = Math.max(0, normalized.vatRate ?? 20);
  const computedFinalPrice = Number((net * (1 + vatRate / 100)).toFixed(2));
  const removedImageUrls: string[] = [];

  const product = await db.$transaction(async (tx) => {
    const existingVariants = await tx.productVariant.findMany({
      where: { productId: normalized.id },
    });
    const incoming = normalized.variants;

    const existingById = new Map(existingVariants.map((v) => [v.id, v]));
    const incomingIds = new Set<string>();

    const toCreate: Prisma.ProductVariantCreateManyInput[] = [];
    const toUpdate: Array<{ id: string; data: Prisma.ProductVariantUpdateInput }> = [];

    for (const v of incoming) {
      if (v.id && existingById.has(v.id)) {
        incomingIds.add(v.id);
        toUpdate.push({
          id: v.id,
          data: {
            colorName: v.colorName,
            colorHex: v.colorHex ?? null,
            size: v.size,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            currency: v.currency ?? "USD",
            stock: v.stock ?? 0,
            isActive: v.isActive ?? true,
            images: v.images ?? [],
          },
        });
      } else {
        toCreate.push({
          productId: data.id,
          colorName: v.colorName,
          colorHex: v.colorHex ?? null,
          size: v.size,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          currency: v.currency ?? "USD",
          stock: v.stock ?? 0,
          isActive: v.isActive ?? true,
          images: v.images ?? [],
        });
      }
    }

    const toDeleteIds = existingVariants
      .filter((v) => !incomingIds.has(v.id))
      .map((v) => v.id);

    for (const existingVariant of existingVariants) {
      const incomingVariant = incoming.find(
        (variant) => variant.id === existingVariant.id,
      );
      const nextImages = new Set(incomingVariant?.images ?? []);
      for (const existingImage of existingVariant.images) {
        if (!nextImages.has(existingImage)) {
          removedImageUrls.push(existingImage);
        }
      }
    }

    if (toUpdate.length) {
      for (const { id, data: variantData } of toUpdate) {
        const existingVariant = existingById.get(id);
        const currentColorName = String(variantData.colorName ?? existingVariant?.colorName ?? "default");
        const currentSize = String(variantData.size ?? existingVariant?.size ?? "unique");

        const identityChanged = existingVariant && (existingVariant.colorName !== currentColorName || existingVariant.size !== currentSize);

        const sku =
          (existingVariant?.sku && !identityChanged)
            ? existingVariant.sku
            : await generateUniqueSku(
                tx,
                normalized.slug,
                currentColorName,
                currentSize,
                id,
              );

        await tx.productVariant.update({
          where: { id },
          data: { ...variantData, sku },
        });
      }
    }
    if (toDeleteIds.length) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDeleteIds } } });
    }
    if (toCreate.length) {
      for (const variant of toCreate) {
        const sku = await generateUniqueSku(
          tx,
          normalized.slug,
          variant.colorName,
          variant.size,
        );

        await tx.productVariant.create({
          data: {
            ...variant,
            sku,
          },
        });
      }
    }

    const minVariantPrice = incoming.length
      ? incoming.reduce((min, v) => Math.min(min, Number(v.price)), Infinity)
      : Infinity;
    const finalPrice =
      minVariantPrice === Infinity ? computedFinalPrice : minVariantPrice;

    const updated = await tx.product.update({
      where: { id: normalized.id },
      data: {
        name: normalized.name,
        slug: normalized.slug,
        description: normalized.description,
        sourceLocale: normalized.sourceLocale,
        status: normalized.status,
        dressStyle: normalized.dressStyle ?? null,
        basePrice: normalized.basePrice,
        vatRate,
        discountPercentage: normalized.discountPercentage ?? 0,
        finalPrice,
        categoryId: normalized.categoryId,
      },
      select: { id: true, slug: true },
    });

    for (const translation of normalized.translations) {
      await tx.productTranslation.upsert({
        where: {
          productId_locale: {
            productId: data.id,
            locale: translation.locale,
          },
        },
        update: {
          name: translation.name,
          description: translation.description,
          ...(translation.specs
            ? { specs: translation.specs }
            : { specs: Prisma.JsonNull }),
        },
        create: {
          productId: data.id,
          locale: translation.locale,
          name: translation.name,
          description: translation.description,
          ...(translation.specs ? { specs: translation.specs } : {}),
        },
      });
    }

    return updated;
  });

  await deleteStorageFiles(removedImageUrls);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}`);
  return product;
}

export async function getAdminCategories() {
  await assertAdmin();
  const cats = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return cats;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getAdminOrders({
  page = 1,
  status,
}: {
  page?: number;
  status?: OrderStatus;
} = {}) {
  await assertAdmin();
  const where: Prisma.OrderWhereInput = status ? { status } : {};
  const skip = (page - 1) * PAGE_SIZE;

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true } },
      },
    }),
  ]);

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
    orders: orders.map((o) => ({
      id: o.id,
      userName: o.user.name,
      userEmail: o.user.email,
      total: o.total.toNumber(),
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    })),
  };
}

export async function updateOrderStatusAction(id: string, status: OrderStatus) {
  await assertAdmin();
  await db.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAdminUsers({ page = 1 }: { page?: number } = {}) {
  await assertAdmin();
  const skip = (page - 1) * PAGE_SIZE;
  const [total, users] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      ordersCount: u._count.orders,
      createdAt: u.createdAt,
      emailVerified: u.emailVerified,
    })),
  };
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getAdminReviews({
  page = 1,
  status,
}: {
  page?: number;
  status?: ReviewStatus;
} = {}) {
  await assertAdmin();
  const where: Prisma.ReviewWhereInput = status ? { status } : {};
  const skip = (page - 1) * PAGE_SIZE;

  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    }),
  ]);

  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
    reviews: reviews.map((r) => ({
      id: r.id,
      userName: r.user.name,
      userEmail: r.user.email,
      productName: r.product.name,
      rating: r.rating,
      content: r.content,
      status: r.status,
      verifiedPurchase: r.verifiedPurchase,
      createdAt: r.createdAt,
    })),
  };
}

export async function updateReviewStatusAction(id: string, status: ReviewStatus) {
  await assertAdmin();
  await db.review.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reviews");
}
