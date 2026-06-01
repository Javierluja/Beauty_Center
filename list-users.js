import { getDb } from "./api/queries/connection.js";
import { sql } from "drizzle-orm";

async function listUsers() {
  try {
    const db = getDb();
    console.log("Listing user emails in the database...");
    const rows = await db.execute(sql`SELECT id, name, email, role FROM users`);
    console.log(JSON.stringify(rows[0], null, 2));
  } catch (error) {
    console.error("Error listing users:", error);
  }
  process.exit(0);
}

listUsers();
