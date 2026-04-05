import db from "@/lib/db";

const CORE_CATEGORIES = [
  {
    slug: "fashion",
    name: "Fashion",
    description: "Everyday clothing essentials",
    translations: {
      fr: {
        name: "Mode",
        description: "Vêtements du quotidien",
      },
      en: {
        name: "Fashion",
        description: "Everyday clothing essentials",
      },
    },
  },
  {
    slug: "shoes",
    name: "Shoes",
    description: "Sneakers and casual shoes",
    translations: {
      fr: {
        name: "Chaussures",
        description: "Sneakers et chaussures casual",
      },
      en: {
        name: "Shoes",
        description: "Sneakers and casual shoes",
      },
    },
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Belts, bags and small accessories",
    translations: {
      fr: {
        name: "Accessoires",
        description: "Ceintures, sacs et petits accessoires",
      },
      en: {
        name: "Accessories",
        description: "Belts, bags and small accessories",
      },
    },
  },
] as const;

let coreCatalogBootstrapPromise: Promise<void> | null = null;

async function bootstrapCoreCatalogData() {
  for (const category of CORE_CATEGORIES) {
    const upsertedCategory = await db.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
      },
      select: { id: true },
    });

    for (const [locale, translation] of Object.entries(category.translations)) {
      await db.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: upsertedCategory.id,
            locale,
          },
        },
        update: {
          name: translation.name,
          description: translation.description,
        },
        create: {
          categoryId: upsertedCategory.id,
          locale,
          name: translation.name,
          description: translation.description,
        },
      });
    }
  }
}

export async function ensureCoreCatalogData() {
  const categoriesCount = await db.category.count();
  if (categoriesCount > 0) return;

  if (!coreCatalogBootstrapPromise) {
    coreCatalogBootstrapPromise = bootstrapCoreCatalogData().catch((error) => {
      coreCatalogBootstrapPromise = null;
      throw error;
    });
  }

  await coreCatalogBootstrapPromise;
}
