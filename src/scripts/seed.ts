import "dotenv/config";

import { OrderStatus, Prisma, ReviewStatus } from "../generated/prisma/client";
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
  await prisma.productTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryTranslation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [fashionCategory, shoesCategory, accessoriesCategory] = await Promise.all([
    prisma.category.create({
      data: {
        name: "Fashion",
        slug: "fashion",
        description: "Everyday clothing essentials",
        translations: {
          create: [{ locale: "fr", name: "Mode", description: "Vêtements du quotidien" }],
        },
      },
    }),
    prisma.category.create({
      data: {
        name: "Shoes",
        slug: "shoes",
        description: "Sneakers and casual shoes",
        translations: {
          create: [
            {
              locale: "fr",
              name: "Chaussures",
              description: "Baskets et chaussures décontractées",
            },
          ],
        },
      },
    }),
    prisma.category.create({
      data: {
        name: "Accessories",
        slug: "accessories",
        description: "Belts, bags and small accessories",
        translations: {
          create: [
            {
              locale: "fr",
              name: "Accessoires",
              description: "Ceintures, sacs et petits accessoires",
            },
          ],
        },
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
        variants: {
          create: [
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "Small",
              images: ["/images/pic1.png"],
              stock: 8,
            },
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "Medium",
              images: ["/images/pic1.png"],
              stock: 0,
            },
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "Large",
              images: ["/images/pic1.png"],
              stock: 6,
            },
            {
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "Small",
              images: ["/images/pic1.png"],
              stock: 12,
            },
            {
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "Medium",
              images: ["/images/pic1.png"],
              stock: 9,
            },
            {
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "Large",
              images: ["/images/pic1.png"],
              stock: 0,
            },
          ],
        },
        translations: {
          create: [
            {
              locale: "en",
              name: "T-shirt with Tape Details",
              description: "Soft cotton t-shirt for daily wear.",
              specs: {
                material: "100% Cotton",
                care: "Machine wash warm, tumble dry",
                fit: "Regular fit",
                pattern: "Solid",
              },
            },
            {
              locale: "fr",
              name: "T-shirt à bandes décoratives",
              description: "T-shirt en coton doux pour un usage quotidien.",
              specs: {
                material: "100% coton",
                care: "Lavage en machine a chaud, seche-linge",
                fit: "Coupe reguliere",
                pattern: "Uni",
              },
            },
          ],
        },
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
        variants: {
          create: [
            {
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "30",
              images: ["/images/pic2.png"],
              stock: 5,
            },
            {
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "32",
              images: ["/images/pic2.png"],
              stock: 10,
            },
            {
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "34",
              images: ["/images/pic2.png"],
              stock: 8,
            },
            {
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "36",
              images: ["/images/pic2.png"],
              stock: 0,
            },
          ],
        },
        translations: {
          create: [
            {
              locale: "en",
              name: "Skinny Fit Jeans",
              description: "Stretch denim jeans with slim cut.",
              specs: {
                material: "98% Cotton, 2% Elastane",
                care: "Machine wash cold, hang dry",
                fit: "Skinny fit",
                pattern: "Solid",
              },
            },
            {
              locale: "fr",
              name: "Jean coupe slim",
              description: "Jean en denim stretch à coupe ajustée.",
              specs: {
                material: "98% coton, 2% elastane",
                care: "Lavage en machine a froid, secher a l'air",
                fit: "Coupe slim",
                pattern: "Uni",
              },
            },
          ],
        },
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
        variants: {
          create: [
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "S",
              images: ["/images/pic6.png"],
              stock: 4,
            },
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "M",
              images: ["/images/pic6.png"],
              stock: 7,
            },
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "L",
              images: ["/images/pic6.png"],
              stock: 3,
            },
            {
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "XL",
              images: ["/images/pic6.png"],
              stock: 0,
            },
            {
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "S",
              images: ["/images/pic6.png"],
              stock: 5,
            },
            {
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "M",
              images: ["/images/pic6.png"],
              stock: 4,
            },
            {
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "L",
              images: ["/images/pic6.png"],
              stock: 6,
            },
            {
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "XL",
              images: ["/images/pic6.png"],
              stock: 0,
            },
          ],
        },
        translations: {
          create: [
            {
              locale: "en",
              name: "Urban Runner Sneakers",
              description: "Lightweight sneakers for city walking.",
              specs: {
                material: "Mesh and synthetic",
                care: "Wipe clean with damp cloth",
                fit: "True to size",
                pattern: "Color block",
              },
            },
            {
              locale: "fr",
              name: "Baskets Urban Runner",
              description: "Baskets légères pour marcher en ville.",
              specs: {
                material: "Mesh et synthetique",
                care: "Nettoyer avec un chiffon humide",
                fit: "Taille normale",
                pattern: "Bicolore",
              },
            },
          ],
        },
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
        variants: {
          create: [
            {
              colorName: "Brown",
              colorHex: "#6B4D32",
              size: "S",
              images: ["/images/pic7.png"],
              stock: 10,
            },
            {
              colorName: "Brown",
              colorHex: "#6B4D32",
              size: "M",
              images: ["/images/pic7.png"],
              stock: 12,
            },
            {
              colorName: "Brown",
              colorHex: "#6B4D32",
              size: "L",
              images: ["/images/pic7.png"],
              stock: 6,
            },
            {
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "S",
              images: ["/images/pic7.png"],
              stock: 9,
            },
            {
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "M",
              images: ["/images/pic7.png"],
              stock: 0,
            },
            {
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "L",
              images: ["/images/pic7.png"],
              stock: 7,
            },
          ],
        },
        translations: {
          create: [
            {
              locale: "en",
              name: "Leather Belt",
              description: "Classic genuine leather belt.",
              specs: {
                material: "Genuine leather",
                care: "Wipe clean, condition leather",
                fit: "Adjustable",
                pattern: "Solid",
              },
            },
            {
              locale: "fr",
              name: "Ceinture en cuir",
              description: "Ceinture classique en cuir véritable.",
              specs: {
                material: "Cuir veritable",
                care: "Essuyer, nourrir le cuir",
                fit: "Ajustable",
                pattern: "Uni",
              },
            },
          ],
        },
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
  const aliceSubtotal = toMoney(new Prisma.Decimal(aliceLine1Total).add(aliceLine2Total));
  const aliceTaxTotal = toMoney(new Prisma.Decimal(aliceLine1Vat).add(aliceLine2Vat));
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
  const bobSubtotal = toMoney(new Prisma.Decimal(bobLine1Total).add(bobLine2Total));
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
