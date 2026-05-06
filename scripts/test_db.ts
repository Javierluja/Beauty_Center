import { getDb } from "../api/queries/connection";

async function testInsert() {
  const db = getDb();
  console.log("Intentando insertar un proveedor de prueba...");
  try {
    const result = await db.execute("INSERT INTO suppliers (name, contactName, rut, phone, email) VALUES ('Proveedor Test', 'Contacto Test', '1-1', '123', 'test@test.com');");
    console.log("✅ Inserción exitosa:", result);
  } catch (err) {
    console.error("❌ Error al insertar:", err.message);
  }
}

testInsert();
