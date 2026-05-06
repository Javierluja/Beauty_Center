import mysql from 'mysql2/promise';

async function run() {
  // URL de TiDB Cloud desde el .env
  const connectionUrl = 'mysql://49HqaDVwXAkahtA.root:Xd4UXDQfXyhsRvB2@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test';

  const connection = await mysql.createConnection({
    uri: connectionUrl,
    ssl: {
      rejectUnauthorized: true
    }
  });

  try {
    console.log("Conectando a TiDB Cloud y alterando tabla sales...");
    // Intentamos añadir la columna
    await connection.query("ALTER TABLE sales ADD COLUMN amountPaid DECIMAL(10,2) DEFAULT '0.00' AFTER status;");
    console.log("¡Columna 'amountPaid' añadida con éxito!");
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
      console.log("La columna 'amountPaid' ya existe. Todo en orden.");
    } else {
      console.error("Error al alterar la tabla:", error);
    }
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
