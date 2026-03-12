import type { Locale } from "./locale";
import { messages } from "./messages";

/**
 * Maps a raw auth error message (from better-auth) to an i18n key,
 * then returns the translated string for the given locale.
 */

const AUTH_ERROR_MAP: Record<string, string> = {
  // better-auth sign-in errors
  "invalid email or password": "auth.errors.invalidCredentials",
  "invalid credentials": "auth.errors.invalidCredentials",
  "user not found": "auth.errors.invalidCredentials",
  // email / account errors
  "email already in use": "auth.errors.emailInUse",
  "email is already in use": "auth.errors.emailInUse",
  "user already exists": "auth.errors.emailInUse",
  // email verification
  "email is not verified": "auth.errors.emailNotVerified",
  "email not verified": "auth.errors.emailNotVerified",
  // rate limiting
  "too many requests": "auth.errors.tooManyRequests",
  "too many failed login attempts": "auth.errors.tooManyRequests",
  // password policy
  "password is too short": "auth.errors.passwordTooShort",
  "password too short": "auth.errors.passwordTooShort",
};

export function translateAuthError(rawMessage: string, locale: Locale): string {
  const key = AUTH_ERROR_MAP[rawMessage.toLowerCase().trim()];
  if (key) {
    return messages[locale][key] ?? messages["en"][key] ?? rawMessage;
  }
  return messages[locale]["auth.errors.unknown"] ?? rawMessage;
}
