require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.DATABASE_URL;
  const cleanUri = uri.includes("?") ? uri.split("?")[0] : uri;
  const connection = await mysql.createConnection({
    uri: cleanUri,
    ssl: { rejectUnauthorized: false }
  });

  // =======================================================
  // ⚠️  CAMBIA ESTOS DATOS ANTES DE EJECUTAR:
  const ADMIN_NAME  = "Javier";
  const ADMIN_EMAIL = "lujamonkey@gmail.com";
  const ADMIN_PASS  = "123456";
  // =======================================================

  const hashed = await bcrypt.hash(ADMIN_PASS, 10);

  const [rows] = await connection.execute(
    'SELECT COUNT(*) as c FROM users WHERE email = ?',
    [ADMIN_EMAIL]
  );
  if (rows[0].c > 0) {
    console.log(`⚠️  Ya existe un usuario con email ${ADMIN_EMAIL}. Actualizando contraseña...`);
    await connection.execute(
      'UPDATE users SET password = ?, name = ?, role = "admin_pro", updatedAt = NOW() WHERE email = ?',
      [hashed, ADMIN_NAME, ADMIN_EMAIL]
    );
    console.log("✅ Contraseña actualizada.");
  } else {
    await connection.execute(
      'INSERT INTO users (name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, "admin_pro", NOW(), NOW())',
      [ADMIN_NAME, ADMIN_EMAIL, hashed]
    );
    console.log(`✅ Usuario admin_pro creado: ${ADMIN_EMAIL}`);
  }

  await connection.end();
}

main().catch(console.error);
