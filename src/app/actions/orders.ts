"use server";

import { headers } from "next/headers";
import { OrderStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export type CustomerOrderStatus = "delivered" | "shipped" | "processing" | "cancelled";

export type CustomerOrderProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export type CustomerShippingAddress = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  country: string;
  zip: string;
};

export type CustomerOrder = {
  id: string;
  date: string;
  status: CustomerOrderStatus;
  total: number;
  currency: string;
  rawStatus: OrderStatus;
  shippingAddress: CustomerShippingAddress | null;
  products: CustomerOrderProduct[];
};

function mapCustomerOrderStatus(status: OrderStatus): CustomerOrderStatus {
  switch (status) {
    case OrderStatus.DELIVERED:
      return "delivered";
    case OrderStatus.SHIPPED:
      return "shipped";
    case OrderStatus.CANCELED:
      return "cancelled";
    case OrderStatus.PENDING:
    case OrderStatus.PAID:
    default:
      return "processing";
  }
}

function parseShippingAddress(value: unknown): CustomerShippingAddress | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  const str = (key: string) => (typeof a[key] === "string" ? (a[key] as string) : "");
  const address: CustomerShippingAddress = {
    firstName: str("firstName"),
    lastName: str("lastName"),
    address: str("address"),
    city: str("city"),
    country: str("country"),
    zip: str("zip"),
  };
  const hasAnyValue = Object.values(address).some((v) => v.trim().length > 0);
  return hasAnyValue ? address : null;
}

const isTransientDbError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("connection") ||
    normalizedMessage.includes("timeout") ||
    normalizedMessage.includes("econnreset") ||
    normalizedMessage.includes("unexpectedly")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withDbRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (!isTransientDbError(error)) throw error;
    await sleep(250);
    return await fn();
  }
};

const withDbFallback = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await withDbRetry(fn);
  } catch (error) {
    if (!isTransientDbError(error)) throw error;
    return fallback;
  }
};

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return [];
  }

  const orders = await withDbFallback(
    () =>
      db.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: {
              product: { select: { id: true, name: true } },
              variant: {
                select: {
                  id: true,
                  colorName: true,
                  images: true,
                  size: true,
                },
              },
            },
          },
        },
      }),
    [],
  );

  return orders.map((order) => ({
    id: order.id,
    date: order.createdAt.toISOString(),
    status: mapCustomerOrderStatus(order.status),
    total: order.total.toNumber(),
    currency: order.currency,
    rawStatus: order.status,
    shippingAddress: parseShippingAddress(order.shippingAddress),
    products: order.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      image: item.variant?.images[0] ?? "/images/pic1.png",
      price: item.sourceUnitGrossPrice.toNumber(),
      quantity: item.quantity,
      size: item.variant?.size,
      color: item.variant?.colorName,
    })),
  }));
}

export async function getOrderDetail(orderId: string): Promise<CustomerOrder | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return null;
  }

  const order = await withDbFallback(
    () =>
      db.order.findUnique({
        where: { id: orderId, userId: session.user.id },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: {
              product: { select: { id: true, name: true } },
              variant: {
                select: {
                  id: true,
                  colorName: true,
                  images: true,
                  size: true,
                },
              },
            },
          },
        },
      }),
    null,
  );

  if (!order) return null;

  return {
    id: order.id,
    date: order.createdAt.toISOString(),
    status: mapCustomerOrderStatus(order.status),
    total: order.total.toNumber(),
    currency: order.currency,
    rawStatus: order.status,
    shippingAddress: parseShippingAddress(order.shippingAddress),
    products: order.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      image: item.variant?.images[0] ?? "/images/pic1.png",
      price: item.sourceUnitGrossPrice.toNumber(),
      quantity: item.quantity,
      size: item.variant?.size,
      color: item.variant?.colorName,
    })),
  };
}
