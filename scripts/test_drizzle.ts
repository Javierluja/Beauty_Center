import { getDb } from "../api/queries/connection";
import { suppliers } from "../db/schema";

async function testDrizzle() {
  const db = getDb();
  console.log("Intentando insertar con Drizzle...");
  try {
    const result = await db.insert(suppliers).values({
      name: "Drizzle Test",
      contactName: "Test",
      rut: "2-2"
    });
    console.log("✅ Éxito Drizzle:", result);
  } catch (err) {
    console.error("❌ Fallo Drizzle:", err);
  }
}

testDrizzle();
