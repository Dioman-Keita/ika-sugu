const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  /**
   * Fix for Turbopack/Bun chunk loading errors.
   * Marking these packages as external tells Turbopack to NOT try and bundle them,
   * which is essential for native drivers and crypto modules.
   */
  serverExternalPackages: [
    "stripe",
    "node:crypto",
    "pg",
    "@prisma/client",
    "@prisma/adapter-pg",
  ],
};

export default nextConfig;
