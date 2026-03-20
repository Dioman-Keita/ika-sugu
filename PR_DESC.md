# PR Description

## Summary
- Add VAT-aware admin product form with per-variant creation and media upload
- Extend admin actions to upsert variants and compute product final price from variants
- Update admin product detail page to feed variants/images into the form; remove separate media block
- Enhance seeds for VAT-inclusive pricing and order snapshots; add VAT labels/messages and checkout VAT breakdown

## Technical Details
- `ProductForm` now handles variants (color/size/SKU/price/compareAt/stock/hex) and per-variant image upload via `ProductImageUploader`; client pre-generates `productId` for storage paths.
- `createAdminProduct` / `updateAdminProduct` accept variants payload, createMany after deleteMany on update; product finalPrice derives from min variant price; VAT applied.
- Detail page `/admin/products/[id]` loads variants with images and passes them to the form; removed legacy ProductImagesManager section.
- Seeds recompute TTC prices with VAT (18% fashion, 10% accessories) and store net/tax snapshots in orders.
- Checkout summary now shows subtotal HT, estimated VAT, total TTC.
- i18n: adds VAT hint labels; adjusts final price wording.

## Testing
- Prisma migration applied locally: `bunx prisma migrate dev --name add_vat_support_for_all_products`
- Prisma client generated: `bunx prisma generate`
- Build fix: resolved ProductForm parse error (vatHint replace)

## Notes
- Git operations (add/commit/PR) not executed in this environment (read-only FS); run locally:
  - `git add .`
  - `git commit -m "feat: add variant-aware admin product form with media upload"`
  - `gh pr create --title "Add variant-aware admin product form with image uploads" --body-file PR_DESC.md`
