import { z } from "zod";
import { createRouter, adminProQuery } from "./middleware.js";
import { expenses } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./queries/connection.js";

export const expenseRouter = createRouter({
  list: adminProQuery.query(async () => {
    const db = getDb();
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }),

  create: adminProQuery
    .input(
      z.object({
        description: z.string(),
        amount: z.string(),
        category: z.string(),
        date: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(expenses).values({
        description: input.description,
        amount: input.amount,
        category: input.category,
        date: input.date,
        notes: input.notes,
      });
      
      const insertId = (result as any)[0].insertId;
      
      try {
        fetch("https://script.google.com/macros/s/AKfycbz_Xa916OIVWUyKwhpM4K73vntd0kaxgtuGuOG8fTdkkwg9mHAzLM9yLbhDU1i5z9c_Dg/exec", {
          method: "POST",
          body: JSON.stringify({
            tipo: "gasto",
            id: insertId,
            descripcion: input.description,
            categoria: input.category,
            monto: input.amount,
            fecha: input.date
          })
        }).catch(e => console.error(e));
      } catch (e) {}

      return result;
    }),

  delete: adminProQuery
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = getDb();
      return await db.delete(expenses).where(eq(expenses.id, input));
    }),
});


