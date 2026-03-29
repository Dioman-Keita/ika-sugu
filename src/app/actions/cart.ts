"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

const GUEST_CART_COOKIE_NAME = process.env.NEXT_PUBLIC_GUEST_CART_COOKIE_NAME || "guest_cart_id";

/**
 * Recursively converts Prisma Decimal objects to plain numbers
 * so the data can be serialized across the Server → Client boundary.
 */
function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object" && "toNumber" in (obj as any) && typeof (obj as any).toNumber === "function") {
    return (obj as any).toNumber() as T;
  }
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(serializeDecimals) as T;
  if (typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj as any)) {
      result[key] = serializeDecimals(value);
    }
    return result as T;
  }
  return obj;
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

/**
 * Retrieves the current cart for the user or guest.
 * Creates one if it doesn't exist.
 */
export async function getCartAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  if (userId) {
    // Avoid empty-cart flash on /cart SSR and refetches: merge guest cookie before resolving user cart.
    await mergeGuestCartForUserId(userId);
  }

  const guestId = userId ? null : await getOrCreateGuestId();

  let cart = await db.cart.findUnique({
    where: userId ? { userId } : { guestId: guestId! },
    include: {
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    cart = await db.cart.create({
      data: userId ? { userId } : { guestId: guestId! },
      include: {
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
        },
      },
    });
  }

  return serializeDecimals(cart);
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
 * Updates the quantity of a cart item.
 */
export async function updateCartQuantityAction(itemId: string, quantity: number) {
  if (quantity < 1) return removeFromCartAction(itemId);

  await db.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  revalidatePath("/cart");
  return { success: true };
}

/**
 * Removes an item from the cart.
 */
export async function removeFromCartAction(itemId: string) {
  await db.cartItem.delete({
    where: { id: itemId },
  });

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

/**
 * Merges the guest cart (guest_cart_id cookie) into the user's cart.
 * Idempotent: safe on every read for logged-in users; no-ops if there is no guest cart.
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

  const userCart = await db.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  const targetCartId = userCart?.id ?? (await db.cart.create({ data: { userId } })).id;

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
