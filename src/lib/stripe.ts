import Stripe from "stripe";

/**
 * Helper function to ensure consistent Stripe initialization across the project.
 * It uses a stable API version and fetch-compatible HttpClient for Bun stability.
 */
export const getStripeInstance = (apiKey?: string) => {
  return new Stripe(apiKey || process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  });
};

/**
 * Default shared instance.
 * For Route Handlers (affected by Turbopack bugs), use getStripeInstance via dynamic import.
 */
export const stripe = getStripeInstance();
