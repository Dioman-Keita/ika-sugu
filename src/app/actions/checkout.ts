"use server";

import { Prisma, OrderStatus } from "@/generated/prisma/client";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { convertMoney, getCurrentTargetCurrency } from "@/lib/currency/server";

export type CheckoutInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zip: string;
};

const toMoney = (value: number) => new Prisma.Decimal(value).toDecimalPlaces(2);
const toRate = (value: number) => new Prisma.Decimal(value).toDecimalPlaces(8);

const vatPortionFromGross = (gross: Prisma.Decimal, vatPct: Prisma.Decimal) => {
  const net = gross.div(new Prisma.Decimal(1).add(vatPct.div(100)));
  return gross.sub(net).toDecimalPlaces(2);
};

export async function placeOrderAction(input: CheckoutInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const requiredFields: Array<keyof CheckoutInput> = [
    "firstName",
    "lastName",
    "email",
    "address",
    "city",
    "country",
    "zip",
  ];

  for (const field of requiredFields) {
    if (!String(input[field] ?? "").trim()) {
      throw new Error(`Checkout field "${field}" is required.`);
    }
  }

  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  vatRate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const targetCurrency = await getCurrentTargetCurrency();

  const lineSnapshots = await Promise.all(
    cart.items.map(async (item) => {
      const sourceUnitGrossPrice = Number(item.variant.price);
      const sourceCurrency = item.variant.currency;
      const converted = await convertMoney({
        amount: sourceUnitGrossPrice,
        sourceCurrency,
        targetCurrency,
      });

      if (converted.currency !== targetCurrency) {
        throw new Error(
          `Unable to convert ${sourceCurrency} to ${targetCurrency} for checkout.`,
        );
      }

      const quantity = item.quantity;
      const vatRate = new Prisma.Decimal(item.variant.product.vatRate);
      const targetGrossTotalPrice = toMoney(converted.amount * quantity);
      const vatAmount = vatPortionFromGross(targetGrossTotalPrice, vatRate);
      const netTotal = targetGrossTotalPrice.sub(vatAmount).toDecimalPlaces(2);
      const netUnit = netTotal.div(quantity).toDecimalPlaces(2);

      return {
        productId: item.variant.product.id,
        quantity,
        unitPrice: netUnit,
        totalPrice: netTotal,
        vatRate,
        vatAmount,
        sourceCurrency: converted.sourceCurrency,
        targetCurrency: converted.currency,
        exchangeRate: converted.rate == null ? null : toRate(converted.rate),
        sourceUnitGrossPrice: toMoney(sourceUnitGrossPrice),
        sourceTotalGrossPrice: toMoney(sourceUnitGrossPrice * quantity),
      };
    }),
  );

  const subtotal = lineSnapshots.reduce(
    (sum, line) => sum.add(line.totalPrice),
    new Prisma.Decimal(0),
  );
  const taxTotal = lineSnapshots.reduce(
    (sum, line) => sum.add(line.vatAmount),
    new Prisma.Decimal(0),
  );
  const total = subtotal.add(taxTotal).toDecimalPlaces(2);

  const order = await db.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        currency: targetCurrency,
        customerEmail: input.email.trim(),
        customerPhone: input.phone.trim() || null,
        shippingAddress: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          address: input.address.trim(),
          city: input.city.trim(),
          country: input.country.trim(),
          zip: input.zip.trim(),
        },
        subtotal,
        taxTotal,
        total,
        items: {
          create: lineSnapshots,
        },
      },
      select: { id: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return createdOrder;
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/");

  return {
    id: order.id,
    currency: targetCurrency,
  };
}
