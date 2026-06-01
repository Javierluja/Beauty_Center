import { getDb } from "./api/queries/connection.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function resetPassword() {
  try {
    const db = getDb();
    const email = "lujamonkey@gmail.com";
    const newPassword = "admin123";
    
    console.log(`Hashing new password: ${newPassword}...`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`Updating password for ${email} in the database...`);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));
      
    console.log("Password updated successfully!");
  } catch (error) {
    console.error("Error resetting password:", error);
  }
  process.exit(0);
}

resetPassword();
