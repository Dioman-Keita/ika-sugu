"use server";

import db from "@/lib/db";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ReviewSubmissionErrorCode } from "@/lib/errors/review-errors";
import { REVIEW_MIN_CHARACTERS } from "@/lib/review-config";

type CreateProductReviewInput = {
  productId: string;
  rating: number;
  content: string;
  title?: string;
};

const clampInt = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.trunc(value)));

type CreateProductReviewSuccess = {
  ok: true;
  reviewId: string;
  status: "PENDING";
};

type CreateProductReviewError = {
  ok: false;
  errorCode: ReviewSubmissionErrorCode;
};

export type CreateProductReviewResult =
  | CreateProductReviewSuccess
  | CreateProductReviewError;

export async function createProductReviewAction(
  input: CreateProductReviewInput,
): Promise<CreateProductReviewResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, errorCode: ReviewSubmissionErrorCode.Unauthorized };
  }

  const productId = String(input.productId || "").trim();
  if (!productId) {
    return { ok: false, errorCode: ReviewSubmissionErrorCode.InvalidProductId };
  }

  const rating = clampInt(Number(input.rating), 1, 5);
  const content = String(input.content || "").trim();
  const title = input.title ? String(input.title).trim() : undefined;

  if (content.length < REVIEW_MIN_CHARACTERS) {
    return { ok: false, errorCode: ReviewSubmissionErrorCode.ReviewTooShort };
  }

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
    return { ok: false, errorCode: ReviewSubmissionErrorCode.DuplicateReview };
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

    return { ok: true, reviewId: review.id, status: "PENDING" };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, errorCode: ReviewSubmissionErrorCode.DuplicateReview };
    }
    throw err;
  }
}
