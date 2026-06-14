require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const uri = process.env.DATABASE_URL;
  const cleanUri = uri.includes("?") ? uri.split("?")[0] : uri;
  const connection = await mysql.createConnection({
    uri: cleanUri,
    ssl: { rejectUnauthorized: false }
  });
  
  const [tables] = await connection.execute("SHOW TABLES");
  console.log("Tables:");
  for (let row of tables) {
    const tableName = Object.values(row)[0];
    const [countRow] = await connection.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
    console.log(`- ${tableName}: ${countRow[0].c} rows`);
  }
  
  await connection.end();
}
main().catch(console.error);
