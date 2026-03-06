import "dotenv/config";

import {
  OrderStatus,
  Prisma,
  ReviewStatus,
} from "../generated/prisma/client";
import db from "../lib/db";

const prisma = db;

const toMoney = (value: number | Prisma.Decimal) =>
  new Prisma.Decimal(value).toDecimalPlaces(2);

const calcVatAmount = (lineTotal: Prisma.Decimal, vatRate: Prisma.Decimal) =>
  lineTotal.mul(vatRate).div(100).toDecimalPlaces(2);

async function main() {
  // Reset in FK-safe order
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [fashionCategory, shoesCategory, accessoriesCategory] =
    await Promise.all([
      prisma.category.create({
        data: {
          name: "Fashion",
          slug: "fashion",
          description: "Everyday clothing essentials",
        },
      }),
      prisma.category.create({
        data: {
          name: "Shoes",
          slug: "shoes",
          description: "Sneakers and casual shoes",
        },
      }),
      prisma.category.create({
        data: {
          name: "Accessories",
          slug: "accessories",
          description: "Belts, bags and small accessories",
        },
      }),
    ]);

  const [alice, bob, claire] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alice Keita",
        email: "alice@example.com",
        password: "seed-password",
      },
    }),
    prisma.user.create({
      data: {
        name: "Bob Traore",
        email: "bob@example.com",
        password: "seed-password",
      },
    }),
    prisma.user.create({
      data: {
        name: "Claire Diallo",
        email: "claire@example.com",
        password: "seed-password",
      },
    }),
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "T-shirt with Tape Details",
        slug: "t-shirt-with-tape-details",
        description: "Soft cotton t-shirt for daily wear.",
        basePrice: toMoney(120),
        discountPercentage: 0,
        finalPrice: toMoney(120),
        images: ["/images/pic1.png"],
        sizes: ["Small", "Medium", "Large"],
        colors: ["White", "Black"],
        stock: 50,
        categoryId: fashionCategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Skinny Fit Jeans",
        slug: "skinny-fit-jeans",
        description: "Stretch denim jeans with slim cut.",
        basePrice: toMoney(260),
        discountPercentage: 20,
        finalPrice: toMoney(208),
        images: ["/images/pic2.png"],
        sizes: ["30", "32", "34", "36"],
        colors: ["Blue"],
        stock: 30,
        categoryId: fashionCategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Urban Runner Sneakers",
        slug: "urban-runner-sneakers",
        description: "Lightweight sneakers for city walking.",
        basePrice: toMoney(145),
        discountPercentage: 10,
        finalPrice: toMoney(130.5),
        images: ["/images/pic6.png"],
        sizes: ["40", "41", "42", "43"],
        colors: ["White", "Gray"],
        stock: 40,
        categoryId: shoesCategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Leather Belt",
        slug: "leather-belt",
        description: "Classic genuine leather belt.",
        basePrice: toMoney(80),
        discountPercentage: 0,
        finalPrice: toMoney(80),
        images: ["/images/pic7.png"],
        sizes: ["S", "M", "L"],
        colors: ["Brown", "Black"],
        stock: 80,
        categoryId: accessoriesCategory.id,
      },
    }),
  ]);

  const [tee, jeans, sneakers, belt] = products;

  const vatFashion = toMoney(18);
  const vatAccessories = toMoney(10);

  const aliceLine1Total = toMoney(new Prisma.Decimal(tee.finalPrice).mul(2));
  const aliceLine1Vat = calcVatAmount(aliceLine1Total, vatFashion);
  const aliceLine2Total = toMoney(new Prisma.Decimal(jeans.finalPrice).mul(1));
  const aliceLine2Vat = calcVatAmount(aliceLine2Total, vatFashion);
  const aliceSubtotal = toMoney(
    new Prisma.Decimal(aliceLine1Total).add(aliceLine2Total)
  );
  const aliceTaxTotal = toMoney(
    new Prisma.Decimal(aliceLine1Vat).add(aliceLine2Vat)
  );
  const aliceTotal = toMoney(new Prisma.Decimal(aliceSubtotal).add(aliceTaxTotal));

  await prisma.order.create({
    data: {
      userId: alice.id,
      status: OrderStatus.PAID,
      subtotal: aliceSubtotal,
      taxTotal: aliceTaxTotal,
      total: aliceTotal,
      items: {
        create: [
          {
            productId: tee.id,
            quantity: 2,
            unitPrice: tee.finalPrice,
            totalPrice: aliceLine1Total,
            vatRate: vatFashion,
            vatAmount: aliceLine1Vat,
          },
          {
            productId: jeans.id,
            quantity: 1,
            unitPrice: jeans.finalPrice,
            totalPrice: aliceLine2Total,
            vatRate: vatFashion,
            vatAmount: aliceLine2Vat,
          },
        ],
      },
    },
  });

  const bobLine1Total = toMoney(new Prisma.Decimal(sneakers.finalPrice).mul(1));
  const bobLine1Vat = calcVatAmount(bobLine1Total, vatFashion);
  const bobLine2Total = toMoney(new Prisma.Decimal(belt.finalPrice).mul(3));
  const bobLine2Vat = calcVatAmount(bobLine2Total, vatAccessories);
  const bobSubtotal = toMoney(
    new Prisma.Decimal(bobLine1Total).add(bobLine2Total)
  );
  const bobTaxTotal = toMoney(new Prisma.Decimal(bobLine1Vat).add(bobLine2Vat));
  const bobTotal = toMoney(new Prisma.Decimal(bobSubtotal).add(bobTaxTotal));

  await prisma.order.create({
    data: {
      userId: bob.id,
      status: OrderStatus.SHIPPED,
      subtotal: bobSubtotal,
      taxTotal: bobTaxTotal,
      total: bobTotal,
      items: {
        create: [
          {
            productId: sneakers.id,
            quantity: 1,
            unitPrice: sneakers.finalPrice,
            totalPrice: bobLine1Total,
            vatRate: vatFashion,
            vatAmount: bobLine1Vat,
          },
          {
            productId: belt.id,
            quantity: 3,
            unitPrice: belt.finalPrice,
            totalPrice: bobLine2Total,
            vatRate: vatAccessories,
            vatAmount: bobLine2Vat,
          },
        ],
      },
    },
  });

  await prisma.review.createMany({
    data: [
      {
        userId: alice.id,
        productId: tee.id,
        rating: 5,
        title: "Excellent quality",
        content: "Very comfortable fabric and great fit.",
        verifiedPurchase: true,
        helpfulCount: 6,
        status: ReviewStatus.APPROVED,
      },
      {
        userId: bob.id,
        productId: jeans.id,
        rating: 4,
        title: "Nice jeans",
        content: "Good value for money.",
        verifiedPurchase: true,
        helpfulCount: 2,
        status: ReviewStatus.APPROVED,
      },
      {
        userId: claire.id,
        productId: sneakers.id,
        rating: 5,
        title: "Super comfortable",
        content: "Perfect for walking all day.",
        verifiedPurchase: false,
        helpfulCount: 1,
        status: ReviewStatus.PENDING,
      },
    ],
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
