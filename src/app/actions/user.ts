"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Check if the current user is an admin based on ADMIN_EMAILS env variable.
 * This runs server-side so the admin list is never exposed to the client.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return false;
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = session.user.email.toLowerCase();
  return adminEmails.includes(userEmail);
}
