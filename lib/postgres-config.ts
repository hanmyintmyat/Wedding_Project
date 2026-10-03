// Pure configuration validation shared by runtime and one-time CLI scripts.
// Errors never include connection strings, credentials or database identifiers.
export function validatePostgresUrl(value: string | undefined, direct = false) {
  const key = direct ? "DIRECT_URL" : "DATABASE_URL";
  try {
    const url = new URL(value?.trim() || "");
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.username || !url.password) throw new Error();
    if (url.hostname !== (direct ? "db.prisma.io" : "pooled.db.prisma.io")) throw new Error();
    if (!["require", "verify-full"].includes(url.searchParams.get("sslmode") || "")) throw new Error();
    return { ok: true, message: `${key} is configured for Prisma Postgres.` };
  } catch {
    return { ok: false, message: `Configure ${key} as a ${direct ? "direct" : "pooled"} Prisma Postgres TCP URL with SSL.` };
  }
}
