import { getDb } from "./server/queries/connection.js";
import { sql } from "drizzle-orm";
async function run() {
  const db = getDb();
  try {
    await db.execute(sql`ALTER TABLE customers ADD COLUMN rut VARCHAR(20)`);
    console.log("Added rut");
  } catch(e) { console.log(e); }
  try {
    await db.execute(sql`ALTER TABLE customers ADD COLUMN address TEXT`);
    console.log("Added address");
  } catch(e) { console.log(e); }
  try {
    await db.execute(sql`ALTER TABLE customers ADD COLUMN profession VARCHAR(255)`);
    console.log("Added profession");
  } catch(e) { console.log(e); }
  console.log("Cols added");
}
run();
