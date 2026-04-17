import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

let didWarnSupabasePort = false;

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
      console.warn("[db] Auto-switching to Supabase pooler port 6543.");
    }
  }

  const normalizedConnectionString = parsedUrl.toString();

  if (process.env.NODE_ENV !== "production") {
    console.log(`[db] Connecting to ${hostname} on port ${parsedUrl.port || "5432"}`);
    if (isSupabasePooler) {
      console.log(`[db] Supabase pooler detected. Using port ${parsedUrl.port}`);
    }
  }

  const allowInsecureDbSsl = process.env.ALLOW_INSECURE_DB_SSL === "true";
  const supabaseCa = process.env.SUPABASE_CA_CERT;
  const ssl = isSupabase
    ? allowInsecureDbSsl
      ? { rejectUnauthorized: false }
      : supabaseCa
        ? { ca: supabaseCa, rejectUnauthorized: true }
        : { rejectUnauthorized: true }
    : undefined;

  const pool = new Pool({
    connectionString: normalizedConnectionString,
    ...(ssl ? { ssl } : {}),
    max: isSupabasePooler ? 3 : 10,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    maxLifetimeSeconds: 60,
    keepAlive: true,
  });

  pool.on("error", (err) => {
    console.error("[db] Unexpected error on idle client", err);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;
