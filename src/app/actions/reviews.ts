"use server";

import db from "@/lib/db";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type CreateProductReviewInput = {
  productId: string;
  rating: number;
  content: string;
  title?: string;
};

const clampInt = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.trunc(value)));

export async function createProductReviewAction(input: CreateProductReviewInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const productId = String(input.productId || "").trim();
  if (!productId) throw new Error("Invalid productId");

  const rating = clampInt(Number(input.rating), 1, 5);
  const content = String(input.content || "").trim();
  const title = input.title ? String(input.title).trim() : undefined;

  if (content.length < 10) throw new Error("Review is too short");

  const userId = session.user.id;

  const hasAlreadyReviewed = await db.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    select: { id: true },
  });

  if (hasAlreadyReviewed) {
    throw new Error("Duplicate review");
  }

  const verifiedPurchase = Boolean(
    await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      },
      select: { id: true },
    }),
  );

  try {
    const review = await db.review.create({
      data: {
        productId,
        userId,
        rating,
        content,
        ...(title ? { title } : {}),
        verifiedPurchase,
      },
      select: { id: true },
    });

    // Review is PENDING by default. Product pages show APPROVED reviews only.
    revalidatePath(`/shop/product/${productId}`);

    return { ok: true as const, reviewId: review.id, status: "PENDING" as const };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Duplicate review");
    }
    throw err;
  }
}
