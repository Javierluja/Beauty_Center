import { getDb } from "./connection.js";
import { expenses, sales } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";

export async function findAllExpenses() {
  const db = getDb();
  return db.select().from(expenses).orderBy(sql`${expenses.createdAt} DESC`);
}

export async function createExpense(data: {
  description: string;
  amount: string;
  category: string;
  createdBy?: number;
}) {
  const db = getDb();
  const result = await db.insert(expenses).values(data);
  const insertId = (result as any)[0].insertId;
  const results = await db.select().from(expenses).where(eq(expenses.id, Number(insertId)));
  return results[0];
}

export async function deleteExpense(id: number) {
  const db = getDb();
  await db.delete(expenses).where(eq(expenses.id, id));
}

// Resumen diario para el Dashboard
export async function getDailySummary() {
  const db = getDb();
  const today = new Date().toLocaleDateString('en-CA');

  // Ingresos (Ventas)
  const incomeResult = await db
    .select({ total: sql<string>`coalesce(sum(finalTotal), 0)` })
    .from(sales)
    .where(sql`date(createdAt) = ${today}`);

  // Egresos (Gastos)
  const expenseResult = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(expenses)
    .where(sql`date(createdAt) = ${today}`);

  const income = Number(incomeResult[0]?.total ?? 0);
  const expense = Number(expenseResult[0]?.total ?? 0);

  return {
    income,
    expense,
    net: income - expense,
  };
}

