import { z } from "zod";
import { createRouter, adminProQuery } from "./middleware.js";
import { expenses } from "../db/schema";
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
      return await db.insert(expenses).values({
        description: input.description,
        amount: input.amount,
        category: input.category,
        date: input.date,
        notes: input.notes,
      });
    }),

  delete: adminProQuery
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = getDb();
      return await db.delete(expenses).where(eq(expenses.id, input));
    }),
});
