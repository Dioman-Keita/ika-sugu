export type CustomerShippingAddress = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  country: string;
  zip: string;
};

/**
 * Safely normalizes the JSON `Order.shippingAddress` payload (written by the
 * Stripe webhook) into a typed address. Returns `null` for missing, malformed,
 * or all-empty payloads so callers render the "no address" fallback instead of
 * a blank block. Shared by the customer and admin order views so both treat
 * legacy/empty payloads identically.
 */
export function parseShippingAddress(value: unknown): CustomerShippingAddress | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  const str = (key: string) => (typeof a[key] === "string" ? (a[key] as string) : "");
  const address: CustomerShippingAddress = {
    firstName: str("firstName"),
    lastName: str("lastName"),
    address: str("address"),
    city: str("city"),
    country: str("country"),
    zip: str("zip"),
  };
  const hasAnyValue = Object.values(address).some((v) => v.trim().length > 0);
  return hasAnyValue ? address : null;
}
