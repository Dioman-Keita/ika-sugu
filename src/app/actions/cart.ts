"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { convertMoney, getCurrentTargetCurrency } from "@/lib/currency/server";

const GUEST_CART_COOKIE_NAME =
  process.env.NEXT_PUBLIC_GUEST_CART_COOKIE_NAME || "guest_cart_id";

const cartWithInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              translations: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.CartInclude;

function isDecimalLike(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  );
}

/**
 * Recursively converts Prisma Decimal objects to plain numbers
 * so the data can be serialized across the Server → Client boundary.
 */
function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (isDecimalLike(obj)) {
    return obj.toNumber() as T;
  }
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(serializeDecimals) as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDecimals(value);
    }
    return result as T;
  }
  return obj;
}

/** Shape returned by `getCartAction` after serialization (client-safe). */
export type CartDTO = {
  id: string;
  items: unknown[];
} & Record<string, unknown>;

function emptyCartShell(): CartDTO {
  return {
    id: "",
    userId: null,
    guestId: null,
    items: [],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

async function applyDisplayCurrencyToCart<
  T extends { items: Array<Record<string, unknown>> },
>(cart: T): Promise<T> {
  const targetCurrency = await getCurrentTargetCurrency();

  const items = await Promise.all(
    cart.items.map(async (item) => {
      const variant = item.variant as
        | {
            price: { toNumber: () => number } | number;
            compareAtPrice: { toNumber: () => number } | number | null;
            currency?: string | null;
          }
        | undefined;

      if (!variant) return item;

      const rawPrice =
        typeof variant.price === "number" ? variant.price : variant.price.toNumber();
      const convertedPrice = await convertMoney({
        amount: rawPrice,
        sourceCurrency: variant.currency,
        targetCurrency,
      });

      const rawCompareAtPrice =
        variant.compareAtPrice == null
          ? null
          : typeof variant.compareAtPrice === "number"
            ? variant.compareAtPrice
            : variant.compareAtPrice.toNumber();

      const convertedCompareAtPrice =
        rawCompareAtPrice == null
          ? null
          : await convertMoney({
              amount: rawCompareAtPrice,
              sourceCurrency: variant.currency,
              targetCurrency,
            });

      return {
        ...item,
        variant: {
          ...variant,
          price: convertedPrice.amount,
          compareAtPrice: convertedCompareAtPrice?.amount ?? null,
          currency: convertedPrice.currency,
          sourceCurrency: convertedPrice.sourceCurrency,
        },
      };
    }),
  );

  return {
    ...cart,
    items,
  };
}

/**
 * Gets or creates a guest ID from cookies.
 */
async function getOrCreateGuestId() {
  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

  if (!guestId) {
    const newGuestId = crypto.randomUUID();
    guestId = newGuestId;
    cookieStore.set(GUEST_CART_COOKIE_NAME, newGuestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return guestId;
}

export type GetCartOptions = {
  /**
   * RSC prefetch only: no cookie writes, no guest-cart merge, no new cart/persisted guest rows.
   * Avoids Next.js restrictions on mutating cookies during static/SSR render paths.
   */
  readOnly?: boolean;
};

/**
 * Retrieves the current cart for the user or guest.
 * Creates one if it doesn't exist (unless `readOnly`).
 */
export async function getCartAction(options: GetCartOptions = {}): Promise<CartDTO> {
  const readOnly = options.readOnly ?? false;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  if (userId && !readOnly) {
    await mergeGuestCartForUserId(userId);
  }

  let guestId: string | null = null;
  if (!userId) {
    guestId = readOnly
      ? ((await cookies()).get(GUEST_CART_COOKIE_NAME)?.value ?? null)
      : await getOrCreateGuestId();
  }

  if (!userId && !guestId) {
    return serializeDecimals(emptyCartShell()) as CartDTO;
  }

  const where = userId ? { userId } : { guestId: guestId! };

  let cart = await db.cart.findUnique({
    where,
    include: cartWithInclude,
  });

  if (!cart) {
    if (readOnly) {
      return serializeDecimals(emptyCartShell()) as CartDTO;
    }
    cart = await db.cart.create({
      data: userId ? { userId } : { guestId: guestId! },
      include: cartWithInclude,
    });
  }

  const cartWithDisplayCurrency = await applyDisplayCurrencyToCart(cart);

  return serializeDecimals(cartWithDisplayCurrency) as CartDTO;
}

/**
 * Adds an item to the cart.
 */
export async function addToCartAction(variantId: string, quantity: number = 1) {
  const cart = await getCartAction();

  const existingItem = await db.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId,
      },
    },
  });

  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

/**
 * Updates the quantity of a cart item (caller's cart only).
 */
export async function updateCartQuantityAction(itemId: string, quantity: number) {
  const cart = await getCartAction();
  if (!cart.id) {
    throw new Error("Cart not initialized");
  }

  if (quantity < 1) return removeFromCartAction(itemId);

  const result = await db.cartItem.updateMany({
    where: { id: itemId, cartId: cart.id },
    data: { quantity },
  });

  if (result.count !== 1) {
    throw new Error("Cart item not found");
  }

  revalidatePath("/cart");
  return { success: true };
}

/**
 * Removes an item from the cart (caller's cart only).
 */
export async function removeFromCartAction(itemId: string) {
  const cart = await getCartAction();
  if (!cart.id) {
    throw new Error("Cart not initialized");
  }

  const result = await db.cartItem.deleteMany({
    where: { id: itemId, cartId: cart.id },
  });

  if (result.count !== 1) {
    throw new Error("Cart item not found");
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

/**
 * Merges the guest cart (guest_cart_id cookie) into the user's cart.
 */
async function mergeGuestCartForUserId(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

  if (!guestId) return false;

  const guestCart = await db.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    cookieStore.delete(GUEST_CART_COOKIE_NAME);
    return false;
  }

  const userCart = await db.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { items: true },
  });

  const targetCartId = userCart.id;

  for (const item of guestCart.items) {
    const existingInUser = await db.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: targetCartId,
          variantId: item.variantId,
        },
      },
    });

    if (existingInUser) {
      await db.cartItem.update({
        where: { id: existingInUser.id },
        data: { quantity: existingInUser.quantity + item.quantity },
      });
    } else {
      await db.cartItem.update({
        where: { id: item.id },
        data: { cartId: targetCartId },
      });
    }
  }

  await db.cart.delete({ where: { id: guestCart.id } });
  cookieStore.delete(GUEST_CART_COOKIE_NAME);

  revalidatePath("/cart");
  return true;
}

/**
 * Merges a guest cart into a user cart.
 * Should be called after login (client can trigger refetch afterward).
 */
export async function syncCartAction(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return false;

  return mergeGuestCartForUserId(session.user.id);
}

/**
 * Gets the total number of items in the cart.
 * Optimized for navbar display.
 */
export async function getCartCountAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  if (userId) {
    await mergeGuestCartForUserId(userId);
  }

  const cookieStore = await cookies();
  const guestId = userId ? null : cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

  if (!userId && !guestId) return 0;

  const cart = await db.cart.findUnique({
    where: userId ? { userId } : { guestId: guestId! },
    select: {
      items: {
        select: {
          quantity: true,
        },
      },
    },
  });

  if (!cart) return 0;

  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
