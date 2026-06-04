import { z } from "zod";
import { createRouter, adminProQuery, authedQuery } from "./middleware.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection.js";
import { getAccessLogs } from "./queries/access-logs.js";
import bcrypt from "bcryptjs"; // Importar para manejar contraseñas

export const userRouter = createRouter({
  list: adminProQuery.query(async () => {
    const db = getDb();
    return await db.select().from(users);
  }),

  accessLogs: adminProQuery.query(async () => {
    return await getAccessLogs();
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
        role: z.enum(["admin_pro", "admin", "ventas"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      return await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    }),

  updatePermissions: adminProQuery
    .input(
      z.object({
        userId: z.number(),
        permissions: z.string(), // We store it as string/JSON text
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      return await db
        .update(users)
        .set({ permissions: input.permissions, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    }),

  create: adminProQuery
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        role: z.enum(["admin_pro", "admin", "ventas"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      return await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
      });
    }),

  changePassword: authedQuery
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1).then(r => r[0]);
      if (!user) throw new Error("Usuario no encontrado");

      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) {
        throw new Error("Contraseña actual incorrecta");
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      return await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
    }),
});


