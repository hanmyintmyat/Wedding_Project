import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type GlobalWithPrisma = typeof globalThis & { prisma?: PrismaClient };

const POSTGRES_URL_PATTERN = /^postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^:\s]+:\d+\/[^?\s]+(?:\?.*)?$/;

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

export function getDatabaseUrl({ direct = false }: { direct?: boolean } = {}) {
  const url = direct ? process.env.DIRECT_URL || process.env.DATABASE_URL : process.env.DATABASE_URL;
  return url?.trim() || "";
}

export function validateDatabaseUrl(url = getDatabaseUrl()) {
  if (!url) {
    return {
      ok: false,
      message: "DATABASE_URL is not set. Expected postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"
    };
  }

  if (!POSTGRES_URL_PATTERN.test(url)) {
    return {
      ok: false,
      message: "DATABASE_URL must use postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"
    };
  }

  return { ok: true, message: "DATABASE_URL is present." };
}

export function getPrismaClient() {
  const validation = validateDatabaseUrl();

  if (!validation.ok) {
    throw new DatabaseConfigurationError(validation.message);
  }

  const globalForPrisma = globalThis as GlobalWithPrisma;

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
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
    console.error("[database] Health check failed", error);
    return {
      connected: false,
      status: "Connection Error",
      detail: "Unable to connect with the configured DATABASE_URL."
    };
  }
}
