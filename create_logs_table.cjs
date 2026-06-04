require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }
  const cleanUri = uri.includes("?") ? uri.split("?")[0] : uri;
  const connection = await mysql.createConnection({
    uri: cleanUri,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log("Connected, creating table accessLogs...");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS accessLogs (
      id int AUTO_INCREMENT NOT NULL,
      userId int NOT NULL,
      userName varchar(255) NOT NULL,
      userEmail varchar(255) NOT NULL,
      action varchar(100) NOT NULL,
      ipAddress varchar(100),
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT accessLogs_id PRIMARY KEY(id)
    )
  `);
  console.log("accessLogs table checked/created successfully!");
  await connection.end();
}

main().catch(console.error);
