import { getDb } from "../api/queries/connection";

async function migrate() {
  const db = getDb();
  console.log("Creando tablas para el módulo de Compras...");
  
  try {
    // 1. Tabla de Proveedores
    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contactName VARCHAR(255),
        rut VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabla 'suppliers' lista.");

    // 2. Tabla de Compras
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplierId INT NOT NULL,
        invoiceNumber VARCHAR(100),
        rut VARCHAR(20),
        netAmount DECIMAL(10,2) NOT NULL,
        taxAmount DECIMAL(10,2) NOT NULL,
        totalAmount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        purchaseDate DATE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabla 'purchases' lista.");

    // 3. Tabla de Items de Compra (por si se decide usar en el futuro)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchaseItems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchaseId INT NOT NULL,
        productId INT NOT NULL,
        quantity INT NOT NULL,
        costPrice DECIMAL(10,2) NOT NULL,
        salePrice DECIMAL(10,2)
      );
    `);
    console.log("✅ Tabla 'purchaseItems' lista.");

    console.log("🚀 ¡Migración completada con éxito!");
  } catch (err) {
    console.error("❌ Error en la migración:", err.message);
  }
}

migrate();
