export function getSafeNext(nextValue: string | null | undefined): string | null {
  if (!nextValue) return null;
  const v = nextValue.trim();
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//")) return null;
  // Avoid CRLF injection in headers/redirects.
  if (v.includes("\r") || v.includes("\n")) return null;
  return v;
}
