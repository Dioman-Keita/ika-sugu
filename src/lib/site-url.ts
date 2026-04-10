const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export const getCanonicalSiteUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (configuredUrl) {
    const normalizedConfiguredUrl = configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`;
    return normalizeBaseUrl(normalizedConfiguredUrl);
  }

  return null;
};
