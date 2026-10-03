import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";
import { validatePostgresUrl } from "./lib/postgres-config";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

// Generation/validation do not connect. Never let database commands target a stale local URL.
const directUrl = env("DIRECT_URL");
if (process.argv.some(argument => ["migrate", "db", "studio"].includes(argument))) {
  const validation = validatePostgresUrl(directUrl, true);
  if (!validation.ok) throw new Error(validation.message);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: directUrl
  }
});
