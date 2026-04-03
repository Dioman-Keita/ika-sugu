-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "shopSection" TEXT;

-- CreateIndex
CREATE INDEX "ProductVariant_shopSection_idx" ON "ProductVariant"("shopSection");
