# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Ika Sugu** ("Your Market" in Malinké) is a full-stack e-commerce platform: Next.js 16 (App Router, React 19), Bun runtime, PostgreSQL via Prisma 7, Better Auth, Stripe, Supabase Storage, Tailwind CSS v4. It is **variant-first** (products sell through `ProductVariant`s, never bare products) and **multi-currency** with snapshot pricing at purchase time.

## Commands

The package manager is **Bun** (`bun@1.3.8`). Always use `bun`/`bunx`, not npm/pnpm.

```bash
bun install
bun run dev                      # next dev (Turbopack); dev:webpack for the webpack dev server
bun run build                    # generate-prisma-client + next build --webpack
bun run start
bun run typecheck                # tsc --noEmit
bun run lint                     # eslint .   (lint:fix to autofix)
bun run format                   # prettier --write .  (format:check to verify)
bun run generate-prisma-client   # regenerate client into src/generated/prisma
bun run seed                     # runs src/scripts/seed.ts
```

There is **no test runner configured** — do not assume `bun test`/jest exist. "Verifying" a change means `bun run typecheck` + `bun run lint`, and running the app.

`build` uses `--webpack` (not Turbopack) on purpose; see the Turbopack/Bun note below. Run `generate-prisma-client` after any change to `prisma/schema.prisma`.

Prisma migrations use `prisma.config.ts`, which points the **datasource at `DIRECT_URL`** (the non-pooled port 5432 connection) — migrations must use the direct URL, while the app runtime uses pooled `DATABASE_URL`.

## Architecture

### Server-first data flow
Almost all business logic lives in **Server Actions** under `src/app/actions/*` (each file starts with `"use server"`) — these handle both reads and writes. Client components fetch through **TanStack Query hooks** in `src/hooks/*` (`use-cart`, `use-products`, `use-admin`, `use-auth`, `use-checkout`) that wrap those actions. Query keys are centralized in `src/hooks/query-keys.ts` — reuse them so invalidation stays consistent. The thin API routes in `src/app/api/*` exist only for things that cannot be actions: `auth/[...all]` (Better Auth handler), `webhooks/stripe` (Stripe signature verification), `categories`, and admin asset cleanup.

### Prisma client lives in `src/generated/prisma`
The client is **generated into the repo**, not `node_modules`. Import the singleton DB instance from `@/lib/db` and types from `@/generated/prisma/client` (e.g. `import { Prisma, OrderStatus } from "@/generated/prisma/client"`). `@/lib/db` wires Prisma to a `pg` Pool via `@prisma/adapter-pg`, auto-corrects the Supabase pooler port to 6543, and configures SSL — never construct `PrismaClient` directly elsewhere. Path alias `@/*` → `src/*`.

### Money is the crown jewel — handle it through the helpers, never ad hoc
Prices are stored as `Decimal` and quoted in a per-variant `currency`. The display/checkout currency comes from a single global `SiteSettings.targetCurrency` row.

- **Conversion**: `convertMoney({ amount, sourceCurrency, targetCurrency })` from `@/lib/currency/server` looks up the latest stored `ExchangeRate` (or its inverse). Rates are pulled from currencyapi.com by `syncExchangeRates` and refreshed lazily by `ensureFreshExchangeRates`.
- **Rounding / formatting / fraction digits** live in `@/lib/currency/shared` (`roundMoney`, `formatMoney`, `getCurrencyFractionDigits`). **XOF has 0 decimal places** — do not assume 2 anywhere; always go through these helpers.
- **Stripe minor units**: `toStripeMinorAmount` / `fromStripeMinorAmount` in `@/lib/payments/stripe-money` scale by the currency's fraction digits (so XOF is *not* ×100). Always use these when crossing the Stripe boundary.
- **VAT**: prices are stored **VAT-inclusive (gross)**. `@/lib/pricing/vat` extracts/applies tax (`vatPortionFromGross`, `removeVatFromGrossPrice`, `applyVatToNetPrice`, `vatAmountFromNetPrice`). Per-product `vatRate` is a percentage Decimal.

### Checkout & order fulfillment (atomic, snapshot-based)
`placeOrderAction` (`src/app/actions/checkout.ts`) converts each cart line into the target currency, computes VAT, and **embeds the priced snapshot into Stripe line-item `metadata`** (productId, variantId, unitPrice, vatRate, sourceCurrency, sourceUnitGrossPrice), then creates a Checkout Session. The order is **not** created here. The Stripe **webhook** (`src/app/api/webhooks/stripe/route.ts`) handles `checkout.session.completed`: it is **idempotent** (skips if `stripeSessionId` already exists) and creates Order + OrderItems + decrements stock + clears the cart inside a single `db.$transaction`. `OrderItem` stores full pricing snapshots (source/target currency, exchange rate, gross/net, VAT) so historical orders never shift when rates or prices change.

### Auth & admin gate
`@/lib/auth` configures Better Auth (email/password + optional Google) over the Prisma adapter; password-reset emails go through Resend (`@/lib/email/resend`), falling back to console logging in dev. **Admin authorization is allowlist-based**: `isAdminEmail(email)` checks the comma-separated `ADMIN_EMAILS` env var — there is no role column. Every admin action in `src/app/actions/admin.ts` calls a local `assertAdmin()` guard first; replicate that pattern for any new admin action.

### Cart: guest + user
A `Cart` belongs to either a `userId` or a `guestId` (cookie `guest_cart_id`). Guest carts merge into the user cart on login via `syncCartAction`. Cart items reference a `ProductVariant`, with `@@unique([cartId, variantId])`.

### Internationalization (custom, no i18n library)
Supported locales are `en` and `fr` (`@/lib/i18n/locale`, `SUPPORTED_LOCALES`). UI strings are a flat key→string map in `@/lib/i18n/messages.ts`; `getMessages(locale)` returns a `t(key, params)` function. Locale is read from the `ui-locale` cookie (`LOCALE_COOKIE_KEY` in `@/lib/ui-preferences-keys`). Translatable **content** (products, categories) lives in dedicated `ProductTranslation` / `CategoryTranslation` tables keyed by `locale`; always pass `locale` into actions that return content. Auth errors from Better Auth are mapped to localized strings in `@/lib/i18n/auth-errors.ts`.

### Catalog options are a single source of truth
`@/lib/catalog-options` defines the controlled vocabularies (currencies USD/EUR/XOF, sizes, dress styles, shop sections) plus their `isXOption` type guards. Admin authoring and validation reference these — add new enum-like values here, not as inline literals.

### Storage
Product images are in a public Supabase bucket (`products`). Client-side upload uses the public anon key; server-side deletion/cleanup uses `SUPABASE_SERVICE_ROLE_KEY` (`@/lib/supabase/server`, `@/lib/storage/deleteImages`) which bypasses RLS — keep that key server-only. `next.config.mjs` whitelists Supabase hostnames in `images.remotePatterns`; new image hosts must be added there.

### Bootstrap
`ensureCoreApplicationData()` (`@/lib/bootstrap/application`) lazily seeds core catalog data + the global `SiteSettings` row, memoized via a module-level promise. Admin currency/settings actions call it before reading settings.

## Conventions & gotchas

- **Prettier**: `printWidth: 90`, double quotes, semicolons, `trailingComma: all`. ESLint extends `next/core-web-vitals` + `next/typescript`; `src/generated/**` and `prisma/migrations/**` are ignored.
- **Stripe is imported lazily** inside the webhook via dynamic `import("@/lib/stripe")`, and `stripe` is in `serverExternalPackages` — this is a deliberate workaround for Turbopack/Bun chunk-loading failures. Don't "clean up" these dynamic imports or switch the production build off webpack without understanding that constraint.
- Project design notes & specs live under `notes/`. The product authoring back-office spec is `notes/admin-product-authoring.md` (locked-in decisions: backend-generated SKUs, mandatory FR+EN translations, dropdown-first categorical fields); see also `notes/currency-philosophy.md`.
- `GEMINI.md` mirrors this overview; trust the code over it when they disagree. The `withDbRetry`/`withDbFallback` resilience helpers it mentions are **local (non-exported) helpers in `src/app/actions/orders.ts`** — they wrap transient DB errors with a single retry / fallback value, and are not shared utilities.
