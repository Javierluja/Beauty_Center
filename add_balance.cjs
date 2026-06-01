const mysql = require("mysql2/promise");

async function main() {
  const url = 'mysql://41HovKQE757mqLq.root:oDK4GE0tzpamWZPQ@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
  const connection = await mysql.createConnection(url);
  try {
    await connection.query("ALTER TABLE customers ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00;");
    console.log("Column 'balance' added to 'customers' table.");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column 'balance' already exists.");
    } else {
      console.error(err);
    }
  }
  await connection.end();
}

main();
