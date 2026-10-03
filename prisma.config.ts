import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Prisma. Expected postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: databaseUrl
  }
});
