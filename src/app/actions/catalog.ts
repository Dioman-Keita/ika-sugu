"use server";

import db from "@/lib/db";
import { Product } from "@/types/product.types";
import { Review } from "@/types/review.types";
import { ReviewStatus } from "@/generated/prisma/client";

const formatReviewDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getAverageRating = (ratings: Array<{ rating: number }>): number => {
  if (ratings.length === 0) return 0;
  const avg = ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
  return Math.round(avg * 10) / 10;
};

const toUiProduct = (product: {
  id: string;
  name: string;
  images: string[];
  basePrice: { toNumber: () => number };
  discountPercentage: number;
  finalPrice: { toNumber: () => number };
  reviews: Array<{ rating: number }>;
}): Product => ({
  id: product.id,
  title: product.name,
  srcUrl: product.images[0] ?? "/images/pic1.png",
  gallery: product.images,
  basePrice: product.basePrice.toNumber(),
  discountPercentage: product.discountPercentage,
  finalPrice: product.finalPrice.toNumber(),
  rating: getAverageRating(product.reviews),
});

const toUiReview = (review: {
  id: string;
  content: string;
  rating: number;
  createdAt: Date;
  user: { name: string };
}): Review => ({
  id: review.id,
  user: review.user.name,
  content: review.content,
  rating: review.rating,
  date: formatReviewDate(review.createdAt),
});

export const getHomeCatalogAction = async () => {
  const [newArrivalsRaw, topSellingIds, homeReviewsRaw] = await Promise.all([
    db.product.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          select: { rating: true },
        },
      },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 4,
    }),
    db.review.findMany({
      where: { status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const topSellingRaw = topSellingIds.length
    ? await db.product.findMany({
        where: { id: { in: topSellingIds.map((item) => item.productId) } },
        include: {
          reviews: {
            where: { status: ReviewStatus.APPROVED },
            select: { rating: true },
          },
        },
      })
    : [];

  const topSellingMap = new Map(topSellingRaw.map((product) => [product.id, product]));
  const topSellingData = topSellingIds
    .map((item) => topSellingMap.get(item.productId))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .map(toUiProduct);

  return {
    newArrivalsData: newArrivalsRaw.map(toUiProduct),
    topSellingData,
    reviewsData: homeReviewsRaw.map(toUiReview),
  };
};

export const getShopProductsAction = async ({
  page = 1,
  pageSize = 9,
}: {
  page?: number;
  pageSize?: number;
}) => {
  const safePageSize = Math.min(Math.max(Math.floor(pageSize), 1), 60);
  const safePage = Math.max(Math.floor(page), 1);
  const skip = (safePage - 1) * safePageSize;

  const [totalProducts, products] = await Promise.all([
    db.product.count(),
    db.product.findMany({
      skip,
      take: safePageSize,
      orderBy: { createdAt: "desc" },
      include: {
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          select: { rating: true },
        },
      },
    }),
  ]);

  return {
    products: products.map(toUiProduct),
    totalProducts,
    currentPage: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(totalProducts / safePageSize)),
  };
};

export const getProductPageAction = async (productId: string) => {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
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
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        select: { rating: true },
      },
    },
  });

  return {
    product: toUiProduct({
      ...product,
      reviews: product.reviews.map((review) => ({ rating: review.rating })),
    }),
    relatedProducts: relatedRaw.map(toUiProduct),
    reviews: product.reviews.map(toUiReview),
  };
};
