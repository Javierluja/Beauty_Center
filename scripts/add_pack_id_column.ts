import { getDb } from "../api/queries/connection";

async function migrate() {
  const db = getDb();
  console.log("Añadiendo columna packId a la tabla appointments...");
  try {
    await db.execute("ALTER TABLE appointments ADD COLUMN packId INT AFTER serviceId;");
    console.log("¡Columna packId añadida con éxito!");
  } catch (err) {
    console.error("Error al añadir columna:", err.message);
  }
}

migrate();
