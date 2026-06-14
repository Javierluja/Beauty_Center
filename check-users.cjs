require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const uri = process.env.DATABASE_URL;
  const cleanUri = uri.includes("?") ? uri.split("?")[0] : uri;
  const connection = await mysql.createConnection({
    uri: cleanUri,
    ssl: { rejectUnauthorized: false }
  });
  
  const [rows] = await connection.execute('SELECT id, name, email, role, password FROM users');
  console.log("Users in DB:", rows.length);
  console.log(rows);
  
  await connection.end();
}
main().catch(console.error);
