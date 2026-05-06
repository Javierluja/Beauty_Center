import mysql from 'mysql2/promise';

async function run() {
  const connectionUrl = 'mysql://49HqaDVwXAkahtA.root:Xd4UXDQfXyhsRvB2@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test';

  const connection = await mysql.createConnection({
    uri: connectionUrl,
    ssl: { rejectUnauthorized: true }
  });

  try {
    console.log("Renombrando Cliente #1 a CLIENTE COMÚN...");
    await connection.query("UPDATE customers SET name = 'CLIENTE COMÚN', phone = '000000000' WHERE id = 1");
    console.log("¡Hecho!");
  } catch (error: any) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

run();
