# PR — SKU-level variant pricing + URL-driven shop filters

## Summary
This PR moves the catalog toward a **real e-commerce variant model**:
- **Variants (SKUs) own pricing** (price / compare-at / currency) and are the source of truth for what users see when selecting color/size.
- Shop filters are now **URL-driven** (shareable/SEO-friendly) instead of local-only UI state.
- Seed data and a new Prisma migration are included.

## What changed
### 1) Prisma: variants as sellable SKUs
- `ProductVariant` now includes:
  - `sku` (unique, optional)
  - `price` (required)
  - `compareAtPrice` (optional)
  - `currency` (default `"USD"`)
- `Product` now includes `dressStyle` to support the “Style” filter.
- Migration added: `prisma/migrations/20260313111411_add_full_product_variant_support/migration.sql`

### 2) Product page: show the selected variant truthfully
- Product header now displays the **selected variant** price and discount, and passes the selected variant pricing into cart add flow.

### 3) Shop filters: shareable links (URL is the source of truth)
Filters now write to query params and reset `page` automatically.
- Supported params:
  - `category`, `style`, `color`, `size`, `minPrice`, `maxPrice`, `sort`, `page`
- Sort select is also URL-driven.

## How to test
1) DB
   - `bunx prisma migrate dev`
   - `bun run generate-prisma-client`
   - `bun run seed`
2) UI
   - `/shop`:
     - set `color/size/price/category/style` filters and confirm the URL updates
     - copy/paste the URL in a new tab and confirm the same results
   - `/shop/product/...`:
     - change color/size and confirm **images + price + discount** update consistently per variant

## Commits
- `d868254` feat: add SKU-level variant pricing and URL-driven shop filters

