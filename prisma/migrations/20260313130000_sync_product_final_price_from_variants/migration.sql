-- Keep Product.finalPrice synchronized with the minimum active variant price.
-- This ensures shop sorting by Product.finalPrice stays correct even when variant prices change.

CREATE OR REPLACE FUNCTION sync_product_final_price(_product_id TEXT) RETURNS VOID AS $$
BEGIN
  UPDATE "Product" p
  SET "finalPrice" = v.min_price
  FROM (
    SELECT MIN("price") AS min_price
    FROM "ProductVariant"
    WHERE "productId" = _product_id AND "isActive" = true
  ) v
  WHERE p."id" = _product_id AND v.min_price IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION productvariant_sync_product_final_price() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM sync_product_final_price(OLD."productId");
    RETURN OLD;
  END IF;

  IF (TG_OP = 'UPDATE' AND NEW."productId" IS DISTINCT FROM OLD."productId") THEN
    PERFORM sync_product_final_price(OLD."productId");
  END IF;

  PERFORM sync_product_final_price(NEW."productId");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productvariant_sync_product_final_price ON "ProductVariant";
CREATE TRIGGER trg_productvariant_sync_product_final_price
AFTER INSERT OR UPDATE OF "price", "isActive", "productId" OR DELETE ON "ProductVariant"
FOR EACH ROW EXECUTE FUNCTION productvariant_sync_product_final_price();

-- Backfill existing products.
UPDATE "Product" p
SET "finalPrice" = v.min_price
FROM (
  SELECT "productId", MIN("price") AS min_price
  FROM "ProductVariant"
  WHERE "isActive" = true
  GROUP BY "productId"
) v
WHERE p."id" = v."productId";

