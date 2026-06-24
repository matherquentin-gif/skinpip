const { Client } = require("pg");

const connString =
  "postgresql://neondb_owner:npg_6RxOw7jEgImf@ep-lingering-violet-atz3obk0.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const client = new Client({ connectionString: connString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // List existing databases
  const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
  console.log("Existing databases:", dbs.rows.map((r) => r.datname).join(", "));

  // Check if skinpip database exists
  const exists = dbs.rows.some((r) => r.datname === "skinpip");
  if (!exists) {
    // CREATE DATABASE cannot run in a transaction, so we need to set autoCommit
    await client.query("CREATE DATABASE skinpip");
    console.log("Created database: skinpip");
  } else {
    console.log("Database skinpip already exists");
  }

  await client.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
