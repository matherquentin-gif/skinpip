import { config } from "dotenv";
// Load .env.local first (real values), then .env — matches Next.js + the app.
config({ path: ".env.local" });
config();
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (push/migrate/studio) prefers the direct/unpooled URL when available.
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/skinpip",
  },
});
