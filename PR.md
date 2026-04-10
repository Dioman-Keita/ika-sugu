# Pull Request: Atomic Order Creation & Stripe Webhook Integration

## Description

This PR refactors the checkout flow to ensure **atomicity**. Orders are no longer created in the database before payment. Instead, the order fulfillment (Order & OrderItems creation, Stock decrement, Cart clearing) is triggered by the Stripe Webhook upon successful payment confirmation.

## Key Changes

### 🛒 Checkout Workflow

- **Before**: Order was created as `PENDING` in the database, then redirected to Stripe.
- **After**: All order data is snapshotted into Stripe Session Metadata. The database is only touched after Stripe confirms the funds are captured.

### ⚡ Technical Fixes (Next.js 16 + Bun + Turbopack)

- Fixed `ChunkLoadError` and `Failed to load external module pg` by using **Dynamic Imports** and marking native packages as external.
- Updated `next.config.mjs` with `serverExternalPackages: ["stripe", "node:crypto", "pg", "@prisma/client", "@prisma/adapter-pg"]` to resolve Turbopack resolution bugs on Windows.
- Switched to `constructEventAsync` to leverage the `SubtleCryptoProvider` required by the modern Stripe Fetch HttpClient in Bun environments.

### 🛡️ Reliability & Atomic Fulfillment

- Implemented **Idempotency** checks using `stripeSessionId` to prevent duplicate orders.
- Wrapped all post-payment operations in a single **Prisma Transaction** with an increased timeout (30s) for database stability.
- Centralized Stripe SDK settings in `src/lib/stripe.ts`.

## How to Test

1. Run `bun dev`.
2. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
3. Complete a purchase on the platform.
4. Verify that:
   - The order appears in the DB/Admin only **after** the payment succeeds.
   - Products stock levels are correctly decremented.
   - The user's cart is cleared.

## Screenshots / Logs

Confirmation of successful fulfillment in logs:

```
✅ [STRIPE WEBHOOK] Event Verified: checkout.session.completed
📡 Processing fulfillment for user: [USER_ID]
📦 [STRIPE WEBHOOK] Order [ORDER_ID] CREATED
🏁 Fulfillment Success
```
