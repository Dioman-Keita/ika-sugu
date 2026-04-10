import Stripe from "stripe";

const requireEnv = (name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET") => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

/**
 * Helper function to ensure consistent Stripe initialization across the project.
 * It uses a stable API version and fetch-compatible HttpClient for Bun stability.
 */
export const getStripeInstance = (apiKey?: string) => {
  return new Stripe(apiKey || requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  });
};

export const getStripeWebhookSecret = () => requireEnv("STRIPE_WEBHOOK_SECRET");

/**
 * Default shared instance.
 * For Route Handlers (affected by Turbopack bugs), use getStripeInstance via dynamic import.
 */
export const stripe = getStripeInstance();
