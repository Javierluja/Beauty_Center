import { getDb } from "./api/queries/connection.js";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const db = getDb();
    const result = await db.execute(sql`SELECT id, name, email, role FROM users`);
    console.log(result[0]);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}
run();
