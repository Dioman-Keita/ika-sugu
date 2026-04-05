# PR: Global Currency Target, Core Bootstrap, and Admin UX Polish

## Summary

This PR introduces a first complete pass on the project's currency strategy and cleans up several admin UX inconsistencies that were slowing product authoring down.

The branch started as a broad admin polish effort, then converged on a clearer product goal:

- define a global target currency for the storefront
- convert product, cart, checkout, and order amounts coherently
- make the target currency configurable from the admin dashboard
- ensure a freshly reset database remains usable without fake demo data
- tighten the admin product workflow with clearer labels, validation, and empty states

## Why

Before this work:

- prices were effectively anchored to a single assumed currency in several parts of the app
- admin pages could become unusable on an empty database after a reset
- some admin states were technically correct but not operationally helpful
- a number of admin labels, statuses, and visible texts were still inconsistent or too raw

This PR establishes a more realistic baseline for production:

- source currency remains attached to product variants
- the site has a configurable global target currency
- conversions happen server-side with stored exchange rates
- order currency snapshots are persisted at checkout
- core structural data is bootstrapped automatically when missing

## Main Changes

### 1. Global currency target

Added a global site currency configuration with exchange-rate storage and a shared server-side conversion layer.

Includes:

- `SiteSettings` model
- `ExchangeRate` model
- currency conversion helpers
- exchange-rate sync support
- refresh-window configuration through environment variables

Relevant files:

- [schema.prisma](C:/Users/Dioman/Documents/ika-sugu/prisma/schema.prisma)
- [shared.ts](C:/Users/Dioman/Documents/ika-sugu/src/lib/currency/shared.ts)
- [server.ts](C:/Users/Dioman/Documents/ika-sugu/src/lib/currency/server.ts)
- [.env.examples](C:/Users/Dioman/Documents/ika-sugu/.env.examples)

### 2. Admin currency settings

Added a dedicated admin settings page to manage the site's target currency and trigger exchange-rate synchronization.

Includes:

- admin settings page
- admin currency settings form
- sidebar navigation entry
- i18n labels and toasts

Relevant files:

- [page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/settings/page.tsx)
- [AdminCurrencySettingsForm.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/admin/AdminCurrencySettingsForm.tsx)
- [AdminSidebar.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/admin/AdminSidebar.tsx)
- [messages.ts](C:/Users/Dioman/Documents/ika-sugu/src/lib/i18n/messages.ts)

### 3. Storefront, cart, and checkout currency alignment

Converted the main commerce flows to use the target currency consistently.

Includes:

- home and shop catalog conversion
- product page price conversion
- cart price conversion
- checkout price conversion
- consistent money formatting in UI components

Relevant files:

- [catalog.ts](C:/Users/Dioman/Documents/ika-sugu/src/app/actions/catalog.ts)
- [cart.ts](C:/Users/Dioman/Documents/ika-sugu/src/app/actions/cart.ts)
- [ProductCard.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/common/ProductCard.tsx)
- [Header/index.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/product-page/Header/index.tsx)
- [CartContainer.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/cart-page/CartContainer.tsx)
- [OrderSummary.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/checkout-page/OrderSummary.tsx)

### 4. Real checkout persistence and money snapshots

Replaced the old pseudo-checkout behavior with real order creation and currency snapshots.

Includes:

- checkout server action
- persisted order creation
- `PENDING` status on order creation instead of fake `PAID`
- source/target currency snapshots on each order item
- exchange rate snapshot per line item
- shipping contact snapshot on orders
- cart cleanup after successful checkout

Relevant files:

- [checkout.ts](C:/Users/Dioman/Documents/ika-sugu/src/app/actions/checkout.ts)
- [CheckoutContainer.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/checkout/CheckoutContainer.tsx)
- [use-checkout.ts](C:/Users/Dioman/Documents/ika-sugu/src/hooks/use-checkout.ts)
- [schema.prisma](C:/Users/Dioman/Documents/ika-sugu/prisma/schema.prisma)

### 5. Core bootstrap for empty databases

Added automatic bootstrap for the minimum structural data required to use the app after a reset, without inserting fake demo products.

Includes:

- base categories with FR/EN translations
- automatic site settings creation
- shared application bootstrap entry point

This means a fresh database can still:

- open the admin product form
- resolve shop categories
- load currency settings safely

Relevant files:

- [catalog.ts](C:/Users/Dioman/Documents/ika-sugu/src/lib/bootstrap/catalog.ts)
- [application.ts](C:/Users/Dioman/Documents/ika-sugu/src/lib/bootstrap/application.ts)
- [admin.ts](C:/Users/Dioman/Documents/ika-sugu/src/app/actions/admin.ts)
- [catalog.ts](C:/Users/Dioman/Documents/ika-sugu/src/app/actions/catalog.ts)

### 6. Admin product authoring improvements

Improved product authoring rules and form clarity.

Includes:

- variant-level `shopSection`
- stricter variant validation
- client-side validation with `sonner`
- better section structure for the product form
- integer-only stock input
- category hints tied to storefront behavior
- removal of the slug regenerate button
- localized variant labels, hints, and statuses
- storefront product link fixes from admin

Relevant files:

- [ProductForm.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/admin/ProductForm.tsx)
- [admin.ts](C:/Users/Dioman/Documents/ika-sugu/src/app/actions/admin.ts)
- [new/page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/products/new/page.tsx)
- [[id]/page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/products/[id]/page.tsx)

### 7. Admin empty states and UX polish

Reworked several “empty but technically working” admin states into more actionable, human-readable states.

Includes:

- explicit empty states for products, orders, users, and reviews
- useful empty state on `/admin/products/new` when categories are missing
- localized action labels and loading states
- localized status badges
- admin overview and product listing prices aligned with currency logic
- removal of unnecessary UI fallback strings where i18n keys are now guaranteed

Relevant files:

- [products/page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/products/page.tsx)
- [orders/page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/orders/page.tsx)
- [users/page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/users/page.tsx)
- [reviews/page.tsx](C:/Users/Dioman/Documents/ika-sugu/src/app/admin/reviews/page.tsx)
- [AdminOverviewContent.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/admin/AdminOverviewContent.tsx)
- [StatusBadge.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/admin/StatusBadge.tsx)
- [ReviewActions.tsx](C:/Users/Dioman/Documents/ika-sugu/src/components/admin/ReviewActions.tsx)

## Environment Variables

Added or documented in [`.env.examples`](C:/Users/Dioman/Documents/ika-sugu/.env.examples):

- `CURRENCY_API_KEY`
- `SITE_SETTINGS_ID`
- `EXCHANGE_RATES_REFRESH_WINDOW_MS`

## Product Decisions Captured in This PR

- the site has one global target currency
- product variants keep their source currency
- storefront and checkout both use the target currency
- `XOF` is the canonical code for FCFA
- exchange-rate sync is cached server-side rather than fetched live per render
- empty databases should be bootstrapped with structural data, not fake catalog content

## Manual Testing Checklist

### Currency

- open `/admin/settings`
- change the target currency
- sync exchange rates
- verify home, shop, product page, cart, checkout, and admin order totals follow the new target currency

### Product authoring

- open `/admin/products/new`
- create a product with translated content
- add at least one variant with:
  - shop section
  - color
  - size
  - price
  - stock
  - at least one image
- confirm validation blocks incomplete variants

### Empty database

- reset the database
- open `/admin/products/new`
- confirm categories are bootstrapped automatically
- confirm `/admin/settings` still works
- confirm no fake demo product is created automatically

### Checkout

- add a product variant to cart
- complete checkout
- confirm an order is created in the database
- confirm order status starts as `PENDING`
- confirm order and order items store currency snapshot fields

## Verification

The following checks were run during this work:

- `bun run lint`
- `bun run typecheck`

## Follow-up Ideas

- store currency and rate details in a dedicated admin order detail page
- add a scheduled job for automatic exchange-rate refresh
- introduce explicit payment-provider handling before moving orders from `PENDING` to `PAID`
- audit remaining storefront/admin components for any residual currency assumptions
