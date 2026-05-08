import { z } from "zod";
import { createRouter, adminProQuery } from "./middleware.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection.js";
import bcrypt from "bcryptjs"; // Importar para manejar contraseñas

export const userRouter = createRouter({
  list: adminProQuery.query(async () => {
    const db = getDb();
    return await db.select().from(users);
  }),

  delete: adminProQuery
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = getDb();
      return await db.delete(users).where(eq(users.id, input));
    }),

  updateRole: adminProQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin_pro", "ventas"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      return await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    }),

  create: adminProQuery
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(), // Ahora recibimos la contraseña
        role: z.enum(["admin_pro", "ventas"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      return await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword, // Guardamos la contraseña encriptada
        role: input.role,
      });
    }),
});


