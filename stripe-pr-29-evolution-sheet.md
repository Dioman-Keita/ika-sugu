# PR #29 Evolution Sheet

## Scope

PR: [Atomic Order Creation & Stripe Webhook Integration](https://github.com/Dioman-Keita/ika-sugu/pull/29)

Goal of this sheet:
- turn bot feedback into a practical evolution plan
- separate real merge blockers from secondary cleanup
- keep one shared reference before implementation

## Current Intent Of The PR

The PR moves order creation from the pre-payment checkout step to the Stripe webhook.

Target behavior:
- no database order is created before payment confirmation
- Stripe Checkout creates only a payment session
- the webhook becomes the single fulfillment entry point
- order creation, stock decrement, and cart cleanup happen atomically after confirmed payment

This direction is good. The remaining work is mostly about money correctness, inventory safety, and a few robustness issues.

## Priority Ranking

### 1. Must Fix Before Merge

#### A. Zero-decimal currency handling is wrong

Problem:
- Stripe `unit_amount` is scaled with `* 100` unconditionally
- webhook totals are descaled with `/ 100` unconditionally

Why it matters:
- breaks real charging for currencies like `XOF`
- can overcharge or under-record totals by a factor of `100`
- corrupts reconciliation, refunds, and reporting

Risk level:
- Critical

Decision:
- all Stripe amount scaling must use currency-aware fraction digits
- `USD/EUR` use 2 decimals
- `XOF` uses 0 decimals

---

#### B. VAT formula in webhook is inconsistent with the meaning of the stored values

Problem:
- webhook computes VAT using a gross-extraction formula
- but the data being reused appears to be net-based in that path

Why it matters:
- stored `vatAmount`, `taxTotal`, `subtotal`, and `total` become inconsistent
- accounting truth becomes unreliable

Risk level:
- Critical

Decision:
- define one explicit invariant for webhook pricing inputs
- if line values are net, VAT must be computed as `net * rate`
- if line values are gross, VAT must be extracted from gross
- the code must use one shared pricing helper, not mixed formulas

---

#### C. Source currency snapshots are stored with amounts from the target/session currency

Problem:
- `sourceCurrency` is stored from product metadata
- but `sourceUnitGrossPrice` / `sourceTotalGrossPrice` appear derived from Stripe session amounts
- Stripe session amounts are in target currency, not necessarily source currency

Why it matters:
- order snapshots lie about what currency a stored amount belongs to
- breaks auditability and multi-currency accounting

Risk level:
- Critical

Decision:
- source amounts must come from source-side product/cart snapshot data
- target amounts must come from Stripe/session-side converted data
- source and target money must never be reconstructed from the wrong side

---

#### D. Stock can go negative during webhook fulfillment

Problem:
- stock decrement happens without enforcing `stock >= quantity` inside the transaction

Why it matters:
- concurrent checkouts can oversell
- inventory can go negative

Risk level:
- High

Decision:
- enforce stock guard at fulfillment time inside the same transaction
- fulfillment must fail safely if stock is insufficient

## 2. Should Fix In The Same PR If Reasonable

#### E. Cart cleanup may be broader than the paid session scope

Problem:
- if webhook cleanup targets the whole cart too loosely, unrelated items may be removed

Why it matters:
- user loses cart state incorrectly

Risk level:
- Medium to High

Decision:
- cart cleanup should target only the session-confirmed cart or the exact purchased variant set

---

#### F. `STRIPE_WEBHOOK_SECRET!` uses a non-null assertion

Problem:
- env absence becomes an ugly runtime failure

Why it matters:
- weaker startup/runtime safety

Risk level:
- Medium

Decision:
- validate the secret explicitly and fail with a controlled error

---

#### G. Checkout success feedback may happen too early

Problem:
- UI can imply success before webhook fulfillment is fully confirmed

Why it matters:
- user experience becomes misleading

Risk level:
- Medium

Decision:
- success UI should reflect payment/session completion carefully
- fulfillment success should not be implied unless the system truly confirmed the state we want to promise

## 3. Useful But Not Merge-Critical

#### H. Framer Motion in server pages

Problem:
- `/checkout/success` and `/checkout/cancel` are server pages but use client-side motion directly

Why it matters:
- rendering/build correctness risk

Risk level:
- Low to Medium

Decision:
- move motion into a client boundary or remove it

---

#### I. Host header used to build absolute URLs

Problem:
- URL construction from `host` can be fragile behind proxies or some deployment setups

Why it matters:
- environment robustness

Risk level:
- Low to Medium

Decision:
- prefer a trusted site URL env/config when available

---

#### J. Temporary `session_*` id returned from checkout action

Problem:
- returned id is not a real persisted order id

Why it matters:
- naming/semantics confusion

Risk level:
- Low

Decision:
- return an explicit session identifier field or a less misleading payload shape

## Merge Recommendation

### Must fix before merge
- zero-decimal Stripe amount handling
- VAT consistency in webhook
- source/target currency snapshot correctness
- non-negative stock enforcement

### Strongly recommended in the same PR
- scoped cart cleanup
- explicit webhook secret validation
- success flow semantics

### Can follow shortly after if needed
- motion client boundary
- host/header hardening
- temporary checkout return id cleanup

## Implementation Principles

To avoid repeating the same class of bug:

1. Keep one money invariant per field
- each stored amount must have a clear meaning:
  - source or target
  - net or gross
  - pre- or post-conversion

2. Centralize currency scaling
- Stripe smallest-unit conversion must use shared helpers
- no raw `* 100` or `/ 100` in webhook or checkout code

3. Centralize VAT math
- VAT helpers must be shared
- no mixed net/gross assumptions in separate files

4. Preserve auditability
- source values come from source-side data
- target values come from converted/session-side data
- no backfilling one side from the other

5. Keep fulfillment atomic
- order creation
- order items creation
- stock decrement with guard
- cart cleanup
- idempotency check

## Suggested Execution Order

1. Fix currency scaling for Stripe amounts
2. Fix webhook money model and VAT math
3. Fix source/target snapshots
4. Add stock guard in transaction
5. Tighten cart cleanup
6. Clean up env/runtime hardening and UI polish

## Notes

- The PR direction is good.
- The biggest remaining risks are not architectural anymore; they are accounting and fulfillment correctness risks.
- We should treat money invariants and inventory guarantees as the real merge gate.
