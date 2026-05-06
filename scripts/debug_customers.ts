import mysql from 'mysql2/promise';

async function run() {
  const connectionUrl = 'mysql://49HqaDVwXAkahtA.root:Xd4UXDQfXyhsRvB2@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test';

  const connection = await mysql.createConnection({
    uri: connectionUrl,
    ssl: { rejectUnauthorized: true }
  });

  try {
    console.log("Consultando lista de clientes en la BD...");
    const [rows] = await connection.query("SELECT id, name FROM customers");
    console.log("Clientes encontrados:", JSON.stringify(rows, null, 2));
  } catch (error: any) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

run();
