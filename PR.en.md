# Pull Request: Admin Product Authoring Hardening

This PR strengthens the product back-office to align it with the actual catalog business contract. It fixes the image upload flow, significantly enriches the admin form, adds product statuses, structures variant creation, and connects real publication to the storefront.

## Objective

- Fix the product addition bug related to image uploads.
- Converge the admin interface with the product/variant model actually used.
- Prepare a true bilingual `fr/en` back-office.
- Introduce a product lifecycle: `DRAFT / PUBLISHED / ARCHIVED`.
- Stabilize the lifecycle of uploaded media before saving.

## Business Architecture

The chosen model is a classic e-commerce `Product + Variants` model, very close to an `SPU / SKU` logic.

- `Product`
  - Parent product sheet
  - Catalog / marketing unit
  - Holds common content: name, slug, description, category, dress style, status, source locale, translations, specs
- `ProductVariant`
  - Sellable unit
  - Holds variable content: color, size, price, compare-at price, stock, images, SKU, isActive

In practice:

- The storefront product page corresponds to the product sheet.
- The user then chooses a variant.
- The `SKU` is generated solely by the backend.

This is not a "hierarchical variant-first" model. Variants are flat and attached to a parent product.

## Admin Form Workflow

The addition flow now follows this logic:

1. Choose the source language.
2. Fill in translated content for `fr/en`.
3. Generate or adjust the slug.
4. Complete product metadata.
5. Add sellable variants.

Form Field Rules:

- What is common to all versions goes on the product sheet.
- What changes according to a buyable option goes on the variant.

Examples:

- Product Sheet: Name, description, category, status, translated specs.
- Variant: Color, size, stock, price, images, SKU.

## Key Changes

### 1. Secured and Stabilized Admin Image Upload

- **Server-Side Upload (Server Action):** Transitioned from direct client upload to a server action (`uploadAdminProductImageAction`). This resolves the authentication conflict between Better Auth and Supabase RLS policies.
- **Service Role Usage:** The server action uses the `SUPABASE_SERVICE_ROLE_KEY` to upload files securely after verifying admin rights via Better Auth.
- **Next.js Image Optimization:** Configured the bucket to "Public" mode and updated `remotePatterns` in `next.config.mjs` to allow image optimization by Next.js without 403 errors.
- **Validation and Compression:** Maintained file type/size validation and compression (`browser-image-compression`) on the client side before sending to the server to save bandwidth.
- **Lifecycle Management:**
  - Immediate deletion of files removed from the admin UI.
  - Cleanup on `cancel` during product creation.
  - Cleanup after `save` for orphan uploads.
  - Best-effort cleanup fallback on abrupt tab closure via `sendBeacon` / `keepalive`.

Key Files:

- `src/app/actions/admin.ts` (Secure upload action)
- `src/lib/storage/uploadImage.ts` (Refactored to use server action)
- `src/components/admin/ProductImageUploader.tsx` (Simplified client logic)
- `src/lib/supabase/server.ts` (Client with Service Role)
- `next.config.mjs` (Supabase hostname authorization)

### 2. Expanded Product Admin Contract

- `SKU` generated solely by the backend.
- `dressStyle`, `size`, `currency`, `status`, `sourceLocale` structured as dropdown lists.
- Support for mandatory `fr` and `en` translations.
- Support for translated specs: `material`, `care`, `fit`, `pattern`.
- Support for the `isActive` flag on variants.
- Auto-generated slug from the source language, but editable.
- Slug regeneration button.
- Storefront display of the selected variant's `SKU`.

Key Files:

- `src/components/admin/ProductForm.tsx`
- `src/app/actions/admin.ts`
- `src/components/product-page/Header/index.tsx`
- `src/lib/catalog-options.ts`
- `src/lib/i18n/messages.ts`

### 3. Prisma Evolution and Product Publication

- Added `Product.status`.
- Added `Product.sourceLocale`.
- New `ProductStatus` enum.
- Prisma migration added to the repo.
- The storefront now only retrieves `PUBLISHED` products.

Key Files:

- `prisma/schema.prisma`
- `prisma/migrations/20260330090000_add_product_status_and_source_locale/migration.sql`
- `src/app/actions/catalog.ts`

### 4. Improved Admin Product List

- Display of product status in the admin list.
- Filters: `All / Draft / Published / Archived`.
- Pagination compatible with status filtering.

### 5. Colors and Variants

- The admin color picker is now compact.
- Accepts a predefined palette plus free CSS input (`hex`, `rgb()`, `hsl()`, etc.).
- Palette aligned with storefront colors while keeping `Gray` and `Brown` from seeds.

### 6. Project Documentation

- Added dedicated framing for the product admin feature.
- Added a warning document on repository critical points.

Files:

- `admin-product-authoring.md`
- `emmergency.md`

## Migration

Command applied/required for this PR:

```powershell
bunx prisma migrate deploy
```

Then, if necessary:

```powershell
bun run generate-prisma-client
```

## Recommended Manual Testing

- Create a product in `DRAFT`.
- Check that the slug generates from the source language.
- Manually modify the slug.
- Use "Regenerate" to recalculate it.
- Fill in `fr/en` and save.
- Add multiple variants.
- Verify backend SKU generation.
- Upload images, remove one, then save.
- Upload an image then cancel creation.
- Upload an image then abruptly close the tab.
- Republish the product as `PUBLISHED`.
- Verify it appears correctly on the storefront.
- Open the product page and verify the SKU display of the selected variant.
- Check status filters in the admin list.

## Verification

- [x] `bun run typecheck`
- [x] Backend `SKU` generation.
- [x] Admin upload with server-side deletion of removed images.
- [x] Best-effort cleanup on abrupt tab closure.
- [x] Bilingual `fr/en` product form.
- [x] Product statuses connected in admin and storefront.
- [x] Storefront display of the selected variant's `SKU`.

## Risks / Remaining Limits

- Cleanup on abrupt closure remains best-effort by browser nature.
- No deferred purge strategy yet for very old orphan assets.
- The product back-office is now much more complete, but further advanced business facets and editorial workflows are possible.
