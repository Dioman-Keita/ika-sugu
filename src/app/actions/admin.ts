"use server";

import db from "@/lib/db";
import { Prisma, ReviewStatus, OrderStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 15;
const REVENUE_GENERATING_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const assertAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = session.user?.email?.toLowerCase();
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail));
  if (!isAdmin) throw new Error("Forbidden");
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

export async function getAdminProducts({ page = 1 }: { page?: number } = {}) {
  await assertAdmin();
  const skip = (page - 1) * PAGE_SIZE;
  const [total, products] = await Promise.all([
    db.product.count(),
    db.product.findMany({
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
      basePrice: p.basePrice.toNumber(),
      discountPercentage: p.discountPercentage,
      finalPrice: p.finalPrice.toNumber(),
      activeVariants: p.variants.length,
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
      createdAt: p.createdAt,
    })),
  };
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
