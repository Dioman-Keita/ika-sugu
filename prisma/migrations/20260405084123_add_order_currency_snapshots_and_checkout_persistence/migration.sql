/*
  Warnings:

  - Added the required column `sourceCurrency` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceTotalGrossPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceUnitGrossPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetCurrency` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "shippingAddress" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "exchangeRate" DECIMAL(18,8),
ADD COLUMN     "sourceCurrency" TEXT NOT NULL,
ADD COLUMN     "sourceTotalGrossPrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "sourceUnitGrossPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "targetCurrency" TEXT NOT NULL;
