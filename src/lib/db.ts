import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

let didWarnSupabasePort = false;
let didWarnInsecureDbSsl = false;

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const parsedUrl = new URL(connectionString);
  const hostname = parsedUrl.hostname.toLowerCase();
  const isSupabase =
    hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.com");
  const isSupabasePooler = hostname.endsWith(".pooler.supabase.com");

  if (isSupabasePooler && (parsedUrl.port === "" || parsedUrl.port === "5432")) {
    parsedUrl.port = "6543";
    if (process.env.NODE_ENV !== "production" && !didWarnSupabasePort) {
      didWarnSupabasePort = true;
      console.warn(
        '[db] DATABASE_URL points to Supabase pooler but uses port 5432; using 6543 instead. Update your ".env" to avoid this warning.',
      );
    }
  }

  const normalizedConnectionString = parsedUrl.toString();

  const allowInsecureDbSsl = process.env.ALLOW_INSECURE_DB_SSL === "true";
  const supabaseCa = process.env.SUPABASE_CA_CERT;
  const ssl = isSupabase
    ? allowInsecureDbSsl
      ? { rejectUnauthorized: false }
      : supabaseCa
        ? { ca: supabaseCa, rejectUnauthorized: true }
        : { rejectUnauthorized: true }
    : undefined;

  if (
    isSupabase &&
    allowInsecureDbSsl &&
    process.env.NODE_ENV !== "production" &&
    !didWarnInsecureDbSsl
  ) {
    didWarnInsecureDbSsl = true;
    console.warn(
      "[db] ALLOW_INSECURE_DB_SSL=true disables TLS certificate validation. Do not use this in production.",
    );
  }

  const pool = new Pool({
    connectionString: normalizedConnectionString,
    ...(ssl ? { ssl } : {}),
    // Fail fast instead of hanging forever when DB is unreachable.
    // 5s was too aggressive in dev; allow slower connects while still bounded.
    connectionTimeoutMillis: 15000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;
