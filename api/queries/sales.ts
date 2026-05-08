import { getDb } from "./connection.js";
import { sales, saleItems, customers, users } from "../../db/schema.js";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export async function findAllSales(filters?: {
  clientId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
}) {
  const db = getDb();
  const conditions = [];

  if (filters?.clientId) {
    conditions.push(eq(sales.clientId, filters.clientId));
  }
  if (filters?.status) {
    conditions.push(eq(sales.status, filters.status));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(sales.createdAt, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(gte(sales.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: sales.id,
      clientId: sales.clientId,
      total: sales.total,
      finalTotal: sales.finalTotal,
      amountPaid: sales.amountPaid,
      paymentMethod: sales.paymentMethod,
      status: sales.status,
      notes: sales.notes,
      createdBy: sales.createdBy,
      createdAt: sales.createdAt,
      clientName: customers.name,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.clientId, customers.id))
    .where(whereClause)
    .orderBy(desc(sales.createdAt));
}

export async function findSaleById(id: number) {
  const db = getDb();
  const saleResults = await db
    .select({
      id: sales.id,
      clientId: sales.clientId,
      total: sales.total,
      finalTotal: sales.finalTotal,
      amountPaid: sales.amountPaid,
      paymentMethod: sales.paymentMethod,
      status: sales.status,
      notes: sales.notes,
      createdBy: sales.createdBy,
      createdAt: sales.createdAt,
      clientName: customers.name,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.clientId, customers.id))
    .where(eq(sales.id, id));

  const sale = saleResults[0];
  return sale || null;
}

export async function updateSaleStatus(id: number, status: string) {
  const db = getDb();
  await db.update(sales).set({ status }).where(eq(sales.id, id));
  return findSaleById(id);
}

export async function updateSaleAbono(id: number, newAbono: string) {
  const db = getDb();
  const sale = await findSaleById(id);
  if (!sale) throw new Error("Sale not found");
  
  const totalPaid = Number(sale.amountPaid || 0) + Number(newAbono);
  const status = totalPaid >= Number(sale.finalTotal) ? "paid" : "pending";
  
  await db.update(sales).set({ amountPaid: totalPaid.toString(), status }).where(eq(sales.id, id));
  return findSaleById(id);
}

export async function createSale(data: {
  clientId?: number;
  total: string;
  discount?: string;
  finalTotal: string;
  paymentMethod: string;
  status?: string;
  amountPaid?: string;
  notes?: string;
  createdBy?: number;
}) {
  try {
    const db = getDb();
    const result = await db.insert(sales).values({
      amountPaid: "0.00",
      ...data
    });
    const insertId = (result as any)[0].insertId;
    return findSaleById(Number(insertId));
  } catch (error) {
    console.error("[DB ERROR] Fallo al crear venta:", error);
    throw error;
  }
}

export async function addSaleItem(data: {
  saleId: number;
  type: string;
  itemId: number;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}) {
  try {
    const db = getDb();
    await db.insert(saleItems).values(data);
    return true;
  } catch (error) {
    console.error("[DB ERROR] Fallo al agregar item de venta:", error);
    throw error;
  }
}

export async function getSalesSummary(dateFrom?: Date, dateTo?: Date) {
  const db = getDb();
  const conditions = [];
  if (dateFrom) conditions.push(gte(sales.createdAt, dateFrom));
  if (dateTo) conditions.push(gte(sales.createdAt, dateTo));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      totalSales: sql<number>`count(*)`,
      totalRevenue: sql<string>`coalesce(sum(${sales.finalTotal}), 0)`,
    })
    .from(sales)
    .where(whereClause);

  return result[0];
}

export async function getDailyPaymentMethods() {
  const db = getDb();
  const today = new Date().toLocaleDateString('en-CA');
  
  return db
    .select({
      method: sales.paymentMethod,
      amount: sql<string>`sum(${sales.finalTotal})`,
    })
    .from(sales)
    .where(sql`date(${sales.createdAt}) = ${today}`)
    .groupBy(sales.paymentMethod);
}


