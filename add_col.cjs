const mysql = require('mysql2/promise'); 
require('dotenv/config'); 

(async () => { 
  try {
    const conn = await mysql.createConnection({uri: process.env.DATABASE_URL, ssl: {rejectUnauthorized: true}}); 
    await conn.query('ALTER TABLE users ADD COLUMN permissions JSON'); 
    await conn.query(`UPDATE users SET permissions = '{"clientes":true,"cuentas":true,"personal":true}'`); 
    console.log('Column added'); 
    process.exit(0); 
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
      process.exit(0);
    }
    console.error(e);
  }
})()
