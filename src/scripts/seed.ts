import "dotenv/config";

import { OrderStatus, Prisma, ReviewStatus } from "../generated/prisma/client";
import db from "../lib/db";

const prisma = db;

const toMoney = (value: number | Prisma.Decimal) =>
  new Prisma.Decimal(value).toDecimalPlaces(2);

const grossPrice = (base: number, discountPct: number, vatPct: number) => {
  const net = new Prisma.Decimal(base).mul(
    new Prisma.Decimal(1).sub(new Prisma.Decimal(discountPct).div(100)),
  );
  return toMoney(net.mul(new Prisma.Decimal(1).add(new Prisma.Decimal(vatPct).div(100))));
};

const vatPortionFromGross = (gross: Prisma.Decimal, vatPct: Prisma.Decimal) => {
  const net = gross.div(new Prisma.Decimal(1).add(vatPct.div(100)));
  return gross.sub(net).toDecimalPlaces(2);
};

const toSku = (productSlug: string, colorName: string, size: string) =>
  `${productSlug}-${colorName}-${size}`
    .toUpperCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^A-Z0-9-]/g, "");

const storagePublicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co"}/storage/v1/object/public`;
const seedImage = (path: string) => `${storagePublicBase}/${path}`;

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

  const vatFashion = new Prisma.Decimal(18);
  const vatAccessories = new Prisma.Decimal(10);

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
        dressStyle: "casual",
        basePrice: toMoney(120),
        discountPercentage: 0,
        vatRate: vatFashion,
        finalPrice: grossPrice(120, 0, vatFashion.toNumber()),
        variants: {
          create: [
            {
              sku: toSku("t-shirt-with-tape-details", "White", "Small"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "Small",
              images: [seedImage("products/seed/tee-white-s.png")],
              price: grossPrice(120, 0, vatFashion.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 8,
            },
            {
              sku: toSku("t-shirt-with-tape-details", "White", "Medium"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "Medium",
              images: [seedImage("products/seed/tee-white-m.png")],
              price: grossPrice(120, 0, vatFashion.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 0,
            },
            {
              sku: toSku("t-shirt-with-tape-details", "White", "Large"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "Large",
              images: [seedImage("products/seed/tee-white-l.png")],
              price: grossPrice(120, 0, vatFashion.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 6,
            },
            {
              sku: toSku("t-shirt-with-tape-details", "Black", "Small"),
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "Small",
              images: [seedImage("products/seed/tee-black-s.png")],
              price: grossPrice(125, 0, vatFashion.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 12,
            },
            {
              sku: toSku("t-shirt-with-tape-details", "Black", "Medium"),
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "Medium",
              images: [seedImage("products/seed/tee-black-m.png")],
              price: grossPrice(125, 0, vatFashion.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 9,
            },
            {
              sku: toSku("t-shirt-with-tape-details", "Black", "Large"),
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "Large",
              images: [seedImage("products/seed/tee-black-l.png")],
              price: grossPrice(125, 0, vatFashion.toNumber()),
              compareAtPrice: null,
              currency: "USD",
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
        dressStyle: "casual",
        basePrice: toMoney(260),
        discountPercentage: 20,
        vatRate: vatFashion,
        finalPrice: grossPrice(260, 20, vatFashion.toNumber()),
        variants: {
          create: [
            {
              sku: toSku("skinny-fit-jeans", "Blue", "30"),
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "30",
              images: [seedImage("products/seed/jeans-blue-30.png")],
              price: grossPrice(260, 20, vatFashion.toNumber()),
              compareAtPrice: grossPrice(260, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 5,
            },
            {
              sku: toSku("skinny-fit-jeans", "Blue", "32"),
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "32",
              images: [seedImage("products/seed/jeans-blue-32.png")],
              price: grossPrice(260, 20, vatFashion.toNumber()),
              compareAtPrice: grossPrice(260, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 10,
            },
            {
              sku: toSku("skinny-fit-jeans", "Blue", "34"),
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "34",
              images: [seedImage("products/seed/jeans-blue-34.png")],
              price: grossPrice(260, 20, vatFashion.toNumber()),
              compareAtPrice: grossPrice(260, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 8,
            },
            {
              sku: toSku("skinny-fit-jeans", "Blue", "36"),
              colorName: "Blue",
              colorHex: "#314F7F",
              size: "36",
              images: [seedImage("products/seed/jeans-blue-36.png")],
              price: grossPrice(260, 20, vatFashion.toNumber()),
              compareAtPrice: grossPrice(260, 0, vatFashion.toNumber()),
              currency: "USD",
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
        dressStyle: "gym",
        basePrice: toMoney(145),
        discountPercentage: 10,
        vatRate: vatFashion,
        finalPrice: grossPrice(145, 10, vatFashion.toNumber()),
        variants: {
          create: [
            {
              sku: toSku("urban-runner-sneakers", "White", "S"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "S",
              images: [seedImage("products/seed/sneaker-white-s.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 4,
            },
            {
              sku: toSku("urban-runner-sneakers", "White", "M"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "M",
              images: [seedImage("products/seed/sneaker-white-m.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 7,
            },
            {
              sku: toSku("urban-runner-sneakers", "White", "L"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "L",
              images: [seedImage("products/seed/sneaker-white-l.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 3,
            },
            {
              sku: toSku("urban-runner-sneakers", "White", "XL"),
              colorName: "White",
              colorHex: "#F5F5F5",
              size: "XL",
              images: [seedImage("products/seed/sneaker-white-xl.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 0,
            },
            {
              sku: toSku("urban-runner-sneakers", "Gray", "S"),
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "S",
              images: [seedImage("products/seed/sneaker-gray-s.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 5,
            },
            {
              sku: toSku("urban-runner-sneakers", "Gray", "M"),
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "M",
              images: [seedImage("products/seed/sneaker-gray-m.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 4,
            },
            {
              sku: toSku("urban-runner-sneakers", "Gray", "L"),
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "L",
              images: [seedImage("products/seed/sneaker-gray-l.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
              stock: 6,
            },
            {
              sku: toSku("urban-runner-sneakers", "Gray", "XL"),
              colorName: "Gray",
              colorHex: "#8C9198",
              size: "XL",
              images: [seedImage("products/seed/sneaker-gray-xl.png")],
              price: grossPrice(145, 10, vatFashion.toNumber()),
              compareAtPrice: grossPrice(145, 0, vatFashion.toNumber()),
              currency: "USD",
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
        dressStyle: "formal",
        basePrice: toMoney(80),
        discountPercentage: 0,
        vatRate: vatAccessories,
        finalPrice: grossPrice(80, 0, vatAccessories.toNumber()),
        variants: {
          create: [
            {
              sku: toSku("leather-belt", "Brown", "S"),
              colorName: "Brown",
              colorHex: "#6B4D32",
              size: "S",
              images: [seedImage("products/seed/belt-brown-s.png")],
              price: grossPrice(80, 0, vatAccessories.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 10,
            },
            {
              sku: toSku("leather-belt", "Brown", "M"),
              colorName: "Brown",
              colorHex: "#6B4D32",
              size: "M",
              images: [seedImage("products/seed/belt-brown-m.png")],
              price: grossPrice(80, 0, vatAccessories.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 12,
            },
            {
              sku: toSku("leather-belt", "Brown", "L"),
              colorName: "Brown",
              colorHex: "#6B4D32",
              size: "L",
              images: [seedImage("products/seed/belt-brown-l.png")],
              price: grossPrice(85, 0, vatAccessories.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 6,
            },
            {
              sku: toSku("leather-belt", "Black", "S"),
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "S",
              images: [seedImage("products/seed/belt-black-s.png")],
              price: grossPrice(80, 0, vatAccessories.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 9,
            },
            {
              sku: toSku("leather-belt", "Black", "M"),
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "M",
              images: [seedImage("products/seed/belt-black-m.png")],
              price: grossPrice(80, 0, vatAccessories.toNumber()),
              compareAtPrice: null,
              currency: "USD",
              stock: 0,
            },
            {
              sku: toSku("leather-belt", "Black", "L"),
              colorName: "Black",
              colorHex: "#1F1F1F",
              size: "L",
              images: [seedImage("products/seed/belt-black-l.png")],
              price: grossPrice(85, 0, vatAccessories.toNumber()),
              compareAtPrice: null,
              currency: "USD",
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

  const aliceLine1Gross = toMoney(new Prisma.Decimal(tee.finalPrice).mul(2));
  const aliceLine1Vat = vatPortionFromGross(aliceLine1Gross, vatFashion);
  const aliceLine1Net = aliceLine1Gross.sub(aliceLine1Vat);
  const aliceLine2Gross = toMoney(new Prisma.Decimal(jeans.finalPrice).mul(1));
  const aliceLine2Vat = vatPortionFromGross(aliceLine2Gross, vatFashion);
  const aliceLine2Net = aliceLine2Gross.sub(aliceLine2Vat);
  const aliceSubtotal = toMoney(new Prisma.Decimal(aliceLine1Net).add(aliceLine2Net));
  const aliceTaxTotal = toMoney(new Prisma.Decimal(aliceLine1Vat).add(aliceLine2Vat));
  const aliceTotal = toMoney(new Prisma.Decimal(aliceSubtotal).add(aliceTaxTotal));

  await prisma.order.create({
    data: {
      userId: alice.id,
      status: OrderStatus.PAID,
      currency: "USD",
      customerEmail: alice.email,
      customerPhone: null,
      shippingAddress: {
        firstName: "Alice",
        lastName: "Keita",
        address: "Avenue 1",
        city: "Bamako",
        country: "ML",
        zip: "1000",
      },
      subtotal: aliceSubtotal,
      taxTotal: aliceTaxTotal,
      total: aliceTotal,
      items: {
        create: [
          {
            productId: tee.id,
            quantity: 2,
            unitPrice: toMoney(aliceLine1Net.div(2)),
            totalPrice: aliceLine1Net,
            sourceCurrency: "USD",
            targetCurrency: "USD",
            exchangeRate: new Prisma.Decimal(1),
            sourceUnitGrossPrice: toMoney(tee.finalPrice),
            sourceTotalGrossPrice: aliceLine1Gross,
            vatRate: vatFashion,
            vatAmount: aliceLine1Vat,
          },
          {
            productId: jeans.id,
            quantity: 1,
            unitPrice: aliceLine2Net,
            totalPrice: aliceLine2Net,
            sourceCurrency: "USD",
            targetCurrency: "USD",
            exchangeRate: new Prisma.Decimal(1),
            sourceUnitGrossPrice: toMoney(jeans.finalPrice),
            sourceTotalGrossPrice: aliceLine2Gross,
            vatRate: vatFashion,
            vatAmount: aliceLine2Vat,
          },
        ],
      },
    },
  });

  const bobLine1Gross = toMoney(new Prisma.Decimal(sneakers.finalPrice).mul(1));
  const bobLine1Vat = vatPortionFromGross(bobLine1Gross, vatFashion);
  const bobLine1Net = bobLine1Gross.sub(bobLine1Vat);
  const bobLine2Gross = toMoney(new Prisma.Decimal(belt.finalPrice).mul(3));
  const bobLine2Vat = vatPortionFromGross(bobLine2Gross, vatAccessories);
  const bobLine2Net = bobLine2Gross.sub(bobLine2Vat);
  const bobSubtotal = toMoney(new Prisma.Decimal(bobLine1Net).add(bobLine2Net));
  const bobTaxTotal = toMoney(new Prisma.Decimal(bobLine1Vat).add(bobLine2Vat));
  const bobTotal = toMoney(new Prisma.Decimal(bobSubtotal).add(bobTaxTotal));

  await prisma.order.create({
    data: {
      userId: bob.id,
      status: OrderStatus.SHIPPED,
      currency: "USD",
      customerEmail: bob.email,
      customerPhone: null,
      shippingAddress: {
        firstName: "Bob",
        lastName: "Traore",
        address: "Rue 2",
        city: "Dakar",
        country: "SN",
        zip: "11500",
      },
      subtotal: bobSubtotal,
      taxTotal: bobTaxTotal,
      total: bobTotal,
      items: {
        create: [
          {
            productId: sneakers.id,
            quantity: 1,
            unitPrice: bobLine1Net,
            totalPrice: bobLine1Net,
            sourceCurrency: "USD",
            targetCurrency: "USD",
            exchangeRate: new Prisma.Decimal(1),
            sourceUnitGrossPrice: toMoney(sneakers.finalPrice),
            sourceTotalGrossPrice: bobLine1Gross,
            vatRate: vatFashion,
            vatAmount: bobLine1Vat,
          },
          {
            productId: belt.id,
            quantity: 3,
            unitPrice: toMoney(bobLine2Net.div(3)),
            totalPrice: bobLine2Net,
            sourceCurrency: "USD",
            targetCurrency: "USD",
            exchangeRate: new Prisma.Decimal(1),
            sourceUnitGrossPrice: toMoney(belt.finalPrice),
            sourceTotalGrossPrice: bobLine2Gross,
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
