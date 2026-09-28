// One-off helper: create the `skinpip` database on a Postgres server if it
// doesn't exist yet.
//
// Usage:
//   ADMIN_DATABASE_URL="postgresql://user:pass@host/neondb?sslmode=require" node scripts/create-db.mjs
//
// Never hardcode a connection string here: this repository is public.
import pg from "pg";

const { Client } = pg;

const connString = process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

async function main() {
  if (!connString) {
    throw new Error("Set ADMIN_DATABASE_URL (or DATABASE_URL_UNPOOLED) to an admin connection string.");
  }

  // TLS stays verified: the connection string's sslmode governs encryption.
  const client = new Client({ connectionString: connString });
  await client.connect();

  const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
  console.log("Existing databases:", dbs.rows.map((r) => r.datname).join(", "));

  const exists = dbs.rows.some((r) => r.datname === "skinpip");
  if (!exists) {
    // CREATE DATABASE cannot run inside a transaction; pg autocommits by default.
    await client.query("CREATE DATABASE skinpip");
    console.log("Created database: skinpip");
  } else {
    console.log("Database skinpip already exists");
  }

  await client.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
