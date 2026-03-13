/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "dressStyle" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "compareAtPrice" DECIMAL(10,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "sku" TEXT;

-- Backfill required pricing for existing rows (variant-level price becomes mandatory).
UPDATE "ProductVariant" pv
SET "price" = p."finalPrice"
FROM "Product" p
WHERE pv."productId" = p."id" AND pv."price" IS NULL;

-- Optional: populate compareAtPrice for discounted products (safe to leave null otherwise).
UPDATE "ProductVariant" pv
SET "compareAtPrice" = p."basePrice"
FROM "Product" p
WHERE
  pv."productId" = p."id"
  AND p."discountPercentage" > 0
  AND pv."compareAtPrice" IS NULL;

ALTER TABLE "ProductVariant" ALTER COLUMN "price" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Product_dressStyle_idx" ON "Product"("dressStyle");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_price_idx" ON "ProductVariant"("productId", "price");
