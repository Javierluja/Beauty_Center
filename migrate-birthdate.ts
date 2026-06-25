import { getDb } from "./server/queries/connection.js";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    const db = getDb();
    await db.execute(sql`ALTER TABLE customers ADD COLUMN birthDate date NULL;`);
    console.log("Migration successful: birthDate added to customers");
  } catch (error) {
    if (error.message.includes("Duplicate column name")) {
      console.log("Column already exists");
    } else {
      console.error("Migration failed:", error);
    }
  }
  process.exit(0);
}

runMigration();
