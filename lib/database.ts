import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { validatePostgresUrl } from "./postgres-config";

type GlobalWithPrisma = typeof globalThis & { postgresPrisma7?: PrismaClient };

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

export function getDatabaseUrl({ direct = false }: { direct?: boolean } = {}) {
  const url = direct ? process.env.DIRECT_URL : process.env.DATABASE_URL;
  return url?.trim() || "";
}

export function validateDatabaseUrl(url = getDatabaseUrl()) {
  return validatePostgresUrl(url);
}

export function getPrismaClient() {
  const validation = validateDatabaseUrl();

  if (!validation.ok) {
    throw new DatabaseConfigurationError(validation.message);
  }

  const globalForPrisma = globalThis as GlobalWithPrisma;

  if (!globalForPrisma.postgresPrisma7) {
    const adapter = new PrismaPg({
      connectionString: getDatabaseUrl(),
      max: 3,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
      allowExitOnIdle: true
    });
    globalForPrisma.postgresPrisma7 = new PrismaClient({ adapter });
  }

  return globalForPrisma.postgresPrisma7;
}

export async function getDatabaseHealth() {
  const validation = validateDatabaseUrl();

  if (!validation.ok) {
    return {
      connected: false,
      status: "Connection Error",
      detail: validation.message
    };
  }

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    return {
      connected: true,
      status: "Connected",
      detail: "Database connection is healthy."
    };
  } catch (error) {
    console.error("[database] Health check failed", error instanceof DatabaseConfigurationError ? "configuration" : "unavailable");
    return {
      connected: false,
      status: "Connection Error",
      detail: "Unable to connect with the configured DATABASE_URL."
    };
  }
}
