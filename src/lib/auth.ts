import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmailWithResend } from "@/lib/email/resend";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  undefined;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "IKA SUGU",
  ...(baseURL ? { baseURL } : {}),
  database: prismaAdapter(db, {
    provider: "postgresql",
    debugLogs: process.env.NODE_ENV !== "production",
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      // In dev, allow running without an email provider. We'll log the reset URL.
      // In prod, prefer configuring Resend via env vars.
      if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[better-auth] password reset url:", url, {
            email: user.email,
          });
          return;
        }
        throw new Error(
          "Email provider not configured (RESEND_API_KEY/RESEND_FROM_EMAIL)",
        );
      }

      const safeName = user.name || user.email;
      const html = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
          <p>Hello ${escapeHtml(safeName)},</p>
          <p>Use the link below to reset your password:</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `;

      await sendEmailWithResend({
        to: user.email,
        subject: "Reset your password",
        html,
      });
    },
  },
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "debug",
  },
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: { clientId: googleClientId, clientSecret: googleClientSecret },
        },
      }
    : {}),
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
