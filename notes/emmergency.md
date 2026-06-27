# Emergency Notes

## Immediate build issue

- The current build error comes from an import that is not resolvable in the installed dependency tree:
  - `src/app/layout.tsx` imported `@vercel/analytics/next`
  - the package was declared in `package.json`, but it was not present in `node_modules`
- Result: Next.js failed at module resolution before the app could build.
- Applied mitigation: removed the optional Vercel Analytics import/render from the root layout so the app can build without that package.

## High-priority repo observations

1. Type safety was already broken by the analytics import.
   - This was the concrete blocker for `bun run typecheck`.

2. Checkout is still a UI simulation, not an order pipeline.
   - `src/app/checkout/CheckoutContainer.tsx` simulates a delay and confirms locally.
   - No order creation, no stock update, no cart clearing, no payment integration.

3. Cart server actions need stricter validation.
   - `src/app/actions/cart.ts` accepts add-to-cart quantities without strong validation.
   - No stock guard or active-variant guard before insertion/update.

4. Shop page does redundant server fetching.
   - `src/app/shop/page.tsx` prefetches product data and then calls the same action again for totals.
   - Combined with dynamic rendering, this increases database work per request.

5. Documentation is outdated relative to the codebase.
   - `README.md` still describes older choices like Next 14 and Redux.
   - The actual stack is closer to Next 16, React 19, Prisma, Better Auth, and TanStack Query.

## Structural strengths

- The Prisma schema is solid for an e-commerce base:
  - products, variants, translations, orders, reviews, auth, cart
- The project already has a real full-stack direction:
  - App Router
  - server actions
  - PostgreSQL via Prisma
  - auth
  - admin area
  - i18n

## Recommended next actions

1. Keep analytics optional and reintroduce it only after the dependency is installed and verified.
2. Turn checkout into a real transactional flow.
3. Add server-side validation for cart mutations.
4. Remove duplicate fetches on the shop page.
5. Rewrite the README to match the current architecture.

## Product filtering gaps

- Currently supported product filters:
  - `category`
  - `style`
  - `color`
  - `size`
  - `minPrice`
  - `maxPrice`
  - `sort`
  - `page`

- Important limitation:
  - `section` exists in navbar URLs and changes the page context/title, but it does not actually filter products on the server.

- Product filters not yet supported:
  - text search by product name
  - text search by description
  - brand
  - stock / availability
  - on-sale / discounted only
  - newest as a dedicated filter facet
  - minimum rating
  - verified-purchase reviewed products
  - discount range
  - material/spec-based filtering
  - audience/gender segmentation as a real data filter replacing the current `section` behavior
