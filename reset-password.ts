import { getDb } from "./server/queries/connection.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function resetPassword() {
  const db = getDb();
  console.log("Generando nueva contraseña...");
  const newPassword = "BeautyCenter2025!";
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  console.log("Actualizando usuario...");
  const res = await db.update(users).set({ password: hashedPassword }).where(eq(users.email, 'lujamonkey@gmail.com'));
  
  console.log("Resultado de la actualización:", res);
  console.log("La nueva contraseña temporal es:", newPassword);
}

resetPassword().catch(console.error);
