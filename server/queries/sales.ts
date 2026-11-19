import { getDb } from "./connection.js";
import { sales, saleItems, customers, users, services, products } from "../../db/schema.js";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";

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
    conditions.push(lte(sales.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: sales.id,
      clientId: sales.clientId,
      total: sales.total,
      discount: sales.discount,
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
      discount: sales.discount,
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
  const sale = await findSaleById(id);
  if (!sale) return null;
  const updates: any = { status };
  if (status === "paid") {
    updates.amountPaid = sale.finalTotal;
  }
  await db.update(sales).set(updates).where(eq(sales.id, id));
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

export async function updateSale(id: number, data: {
  paymentMethod?: string;
  status?: string;
  total?: string;
  discount?: string;
  finalTotal?: string;
  amountPaid?: string;
  notes?: string;
  createdAt?: Date;
  items?: Array<{
    id: number;
    quantity?: number;
    unitPrice?: string;
    totalPrice?: string;
  }>;
}) {
  const db = getDb();
  const sale = await findSaleById(id);
  if (!sale) throw new Error("Sale not found");

  const updates: any = {};
  if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
  if (data.status !== undefined) updates.status = data.status;
  if (data.total !== undefined) updates.total = data.total;
  if (data.discount !== undefined) updates.discount = data.discount;
  if (data.finalTotal !== undefined) updates.finalTotal = data.finalTotal;
  if (data.amountPaid !== undefined) updates.amountPaid = data.amountPaid;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.createdAt !== undefined) updates.createdAt = data.createdAt;

  // Si se cambia a estado pagado y no se especificó un amountPaid manual, se iguala al finalTotal
  if (data.status === "paid" && data.amountPaid === undefined) {
    updates.amountPaid = data.finalTotal || sale.finalTotal;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(sales).set(updates).where(eq(sales.id, id));
  }

  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      const itemUpdates: any = {};
      if (item.quantity !== undefined) itemUpdates.quantity = item.quantity;
      if (item.unitPrice !== undefined) itemUpdates.unitPrice = item.unitPrice;
      if (item.totalPrice !== undefined) itemUpdates.totalPrice = item.totalPrice;
      if (Object.keys(itemUpdates).length > 0) {
        await db.update(saleItems).set(itemUpdates).where(eq(saleItems.id, item.id));
      }
    }
  }

  return findSaleById(id);
}

export async function deleteSale(id: number) {
  const db = getDb();
  const sale = await findSaleById(id);
  if (!sale) throw new Error("Venta no encontrada");

  // Revertir el stock de productos vendidos
  const items = await findSaleItems(id);
  const { updateProductStock } = await import("./products.js");
  for (const item of items) {
    if (item.type === "product" || item.type === "producto") {
      try {
        await updateProductStock(item.itemId, item.quantity);
      } catch (err) {
        console.error(`[Stock Revert Error] on product ${item.itemId}:`, err);
      }
    }
  }

  // Eliminar ítems de la venta
  await db.delete(saleItems).where(eq(saleItems.saleId, id));

  // Eliminar la venta
  await db.delete(sales).where(eq(sales.id, id));

  return { success: true, id };
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
  createdAt?: Date;
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
  if (dateTo) conditions.push(lte(sales.createdAt, dateTo));

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

export async function findSaleItems(saleId: number) {
  const db = getDb();
  return await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId));
}

export async function getCierreCajaData(dateFrom: Date, dateTo: Date) {
  const db = getDb();

  const salesList = await db
    .select({
      id: sales.id,
      clientId: sales.clientId,
      clientName: customers.name,
      total: sales.total,
      discount: sales.discount,
      finalTotal: sales.finalTotal,
      paymentMethod: sales.paymentMethod,
      status: sales.status,
      amountPaid: sales.amountPaid,
      notes: sales.notes,
      createdBy: sales.createdBy,
      creatorName: users.name,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.clientId, customers.id))
    .leftJoin(users, eq(sales.createdBy, users.id))
    .where(and(gte(sales.createdAt, dateFrom), lte(sales.createdAt, dateTo)))
    .orderBy(desc(sales.createdAt));

  if (salesList.length === 0) {
    return { sales: [], items: [] };
  }

  const saleIds = salesList.map((s) => s.id);

  const itemsList = await db
    .select({
      id: saleItems.id,
      saleId: saleItems.saleId,
      type: saleItems.type,
      itemId: saleItems.itemId,
      name: saleItems.name,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      totalPrice: saleItems.totalPrice,
    })
    .from(saleItems)
    .where(inArray(saleItems.saleId, saleIds));

  // Obtener categorías de productos y servicios
  const productIds = itemsList
    .filter((i) => i.type === "product" || i.type === "producto")
    .map((i) => i.itemId);
  const serviceIds = itemsList
    .filter((i) => i.type === "service" || i.type === "servicio" || i.type === "pack")
    .map((i) => i.itemId);

  const productCategories = new Map<number, string>();
  if (productIds.length > 0) {
    const prods = await db
      .select({ id: products.id, category: products.category })
      .from(products)
      .where(inArray(products.id, productIds));
    for (const p of prods) {
      if (p.category) productCategories.set(p.id, p.category);
    }
  }

  const serviceCategories = new Map<number, string>();
  if (serviceIds.length > 0) {
    const servs = await db
      .select({ id: services.id, category: services.category })
      .from(services)
      .where(inArray(services.id, serviceIds));
    for (const s of servs) {
      if (s.category) serviceCategories.set(s.id, s.category);
    }
  }

  const enrichedItems = itemsList.map((item) => {
    let category = "General";
    if (item.type === "product" || item.type === "producto") {
      category = productCategories.get(item.itemId) || "Producto";
    } else if (item.type === "pack") {
      category = "Pack de Sesiones";
    } else {
      category = serviceCategories.get(item.itemId) || "Servicio";
    }

    return {
      ...item,
      category,
    };
  });

  return {
    sales: salesList,
    items: enrichedItems,
  };
}




