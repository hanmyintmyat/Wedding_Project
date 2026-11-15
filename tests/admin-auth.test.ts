import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mock, test } from "node:test";
import bcrypt from "bcryptjs";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { getAdminCredentialsError } from "../lib/admin-credentials";

test("production credentials and database fallback remain safe", async () => {
  const originalEnvironment = { ...process.env };
  const password = randomBytes(24).toString("hex");
  const databasePassword = randomBytes(24).toString("hex");
  const email = "auth-test@example.invalid";
  const logs: string[] = [];
  const logger = mock.method(console, "error", (...args: unknown[]) => logs.push(args.map(String).join(" ")));
  Object.assign(process.env, {
    NODE_ENV: "production",
    AUTH_SECRET: randomBytes(48).toString("hex"),
    ADMIN_EMAIL: `  ${email.toUpperCase()}  `,
    ADMIN_PASSWORD: password,
    // A synthetic configuration only. The database delegate is mocked before queries.
    DATABASE_URL: "postgresql://test:test@pooled.db.prisma.io/test?sslmode=require"
  });

  const { authOptions } = await import("../lib/auth");
  const { getPrismaClient } = await import("../lib/db");
  const shared = globalThis as typeof globalThis & { postgresPrisma7?: ReturnType<typeof getPrismaClient> };
  const originalClient = shared.postgresPrisma7;
  let databaseAccount: { id: string; email: string; passwordHash: string; role: "ADMIN" } | null = null;
  const lookup = mock.fn(async () => databaseAccount);
  shared.postgresPrisma7 = { user: { findUnique: lookup } } as unknown as ReturnType<typeof getPrismaClient>;
  const provider = authOptions.providers.find((entry) => typeof entry !== "function" && entry.id === "credentials") as CredentialsConfig;
  const authorize = provider.options?.authorize as CredentialsConfig["authorize"];
  const request = { body: {}, query: {}, headers: {}, method: "POST" };
  const login = (submittedEmail: string, submittedPassword: string) => authorize({ email: submittedEmail, password: submittedPassword }, request);

  try {
    for (const malformed of [undefined, { email: null, password }, { email: {}, password }, { email: email, password: {} }]) {
      assert.equal(await authorize(malformed as Parameters<typeof authorize>[0], request), null, "malformed credentials must be rejected safely");
    }
    assert.equal((await login(` ${email.toUpperCase()} `, password))?.id, "env-admin");
    assert.equal(lookup.mock.callCount(), 0, "valid environment login requires no database query");
    assert.equal(await login(email, `${password}incorrect`), null);
    assert.equal(await login("admin@example.com", password), null, "the admin email must come from the environment");

    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    assert.equal(await login("admin@example.com", "ChangeMe123!"), null, "production must not use development defaults");
    assert.equal(await login(email, password), null, "missing environment values must not authorize the environment account");
    process.env.ADMIN_EMAIL = `  ${email.toUpperCase()}  `;

    process.env.ADMIN_PASSWORD = ` ${password} `;
    assert.equal((await login(email, ` ${password} `))?.id, "env-admin");
    assert.equal(await login(email, password), null, "password whitespace must not be silently removed");

    const hash = await bcrypt.hash(password, 4);
    process.env.ADMIN_PASSWORD = hash;
    assert.equal(await login(email, password), null);
    assert.equal(await login(email, hash), null, "a configured hash must not become a plaintext password");
    process.env.ADMIN_PASSWORD = ` ${hash} `;
    assert.equal(await login(email, ` ${hash} `), null, "surrounding whitespace must not let a hash become a plaintext password");
    assert.ok(logs.some((message) => message.includes("not a bcrypt hash")));

    databaseAccount = { id: "database-admin", email, passwordHash: await bcrypt.hash(databasePassword, 4), role: "ADMIN" };
    for (const [configuredEmail, configuredPassword] of [
      ["", password],
      [email, ""],
      [email, "short"],
      [email, "ChangeMe123!"],
      [email, hash]
    ]) {
      process.env.ADMIN_EMAIL = configuredEmail;
      process.env.ADMIN_PASSWORD = configuredPassword;
      assert.equal((await login(email, databasePassword))?.id, "database-admin", "environment misconfiguration must not disable an existing database account");
    }
    assert.equal(await login(email, `${databasePassword}incorrect`), null);
    assert.equal(await login(email, "ChangeMe123!"), null, "the old default remains disabled in production");
    assert.ok(logs.every((message) => ![email, password, databasePassword, hash, process.env.AUTH_SECRET!].some((value) => message.includes(value))));
  } finally {
    logger.mock.restore();
    shared.postgresPrisma7 = originalClient;
    for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
    Object.assign(process.env, originalEnvironment);
  }
});

test("configuration errors give guidance without including credential values", () => {
  assert.ok(getAdminCredentialsError("", "configured-password", true)?.includes("ADMIN_EMAIL"));
  assert.ok(getAdminCredentialsError("test@example.invalid", "", true)?.includes("ADMIN_PASSWORD"));
  assert.ok(getAdminCredentialsError("test@example.invalid", "short", true));
  assert.ok(getAdminCredentialsError("test@example.invalid", "$2b$12$example", true)?.includes("plain password"));
  assert.ok(getAdminCredentialsError("test@example.invalid", " $2b$12$example\n", true)?.includes("plain password"));
  assert.equal(getAdminCredentialsError("test@example.invalid", "configured-password", true), null);
});
