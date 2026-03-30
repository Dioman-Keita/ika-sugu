CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "Product"
ADD COLUMN "sourceLocale" TEXT,
ADD COLUMN "status" "ProductStatus";

UPDATE "Product"
SET "sourceLocale" = 'fr'
WHERE "sourceLocale" IS NULL;

UPDATE "Product"
SET "status" = 'PUBLISHED'
WHERE "status" IS NULL;

ALTER TABLE "Product"
ALTER COLUMN "sourceLocale" SET DEFAULT 'fr',
ALTER COLUMN "sourceLocale" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "status" SET NOT NULL;

CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
CREATE INDEX "Product_sourceLocale_idx" ON "Product"("sourceLocale");
