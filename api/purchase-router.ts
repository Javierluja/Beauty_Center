import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { suppliers, purchases, purchaseItems, products } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

export const purchaseRouter = createRouter({
  listSuppliers: authedQuery.query(async () => {
    const db = getDb();
    return db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }),

  createSupplier: authedQuery
    .input(z.object({
      name: z.string(),
      contactName: z.string().optional(),
      rut: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = getDb();
        const result = await db.insert(suppliers).values(input);
        const insertId = (result as any)[0].insertId;
        const rows = await db.select().from(suppliers).where(eq(suppliers.id, Number(insertId)));
        return rows[0];
      } catch (err) {
        console.error("[API] Error creando proveedor:", err);
        throw new Error("No se pudo crear el proveedor: " + err.message);
      }
    }),

  listPurchases: authedQuery.query(async () => {
    try {
      const db = getDb();
      return db
        .select({
          id: purchases.id,
          invoiceNumber: purchases.invoiceNumber,
          rut: purchases.rut,
          totalAmount: purchases.totalAmount,
          status: purchases.status,
          purchaseDate: purchases.purchaseDate,
          notes: purchases.notes,
          supplierName: suppliers.name,
        })
        .from(purchases)
        .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
        .orderBy(desc(purchases.purchaseDate));
    } catch (err) {
      console.error("[API] Error listando compras:", err);
      throw new Error("No se pudieron cargar las compras");
    }
  }),

  createPurchase: authedQuery
    .input(z.object({
      supplierId: z.number(),
      invoiceNumber: z.string(),
      rut: z.string(),
      netAmount: z.number(),
      taxAmount: z.number(),
      totalAmount: z.number(),
      purchaseDate: z.string(),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        costPrice: z.number(),
        salePrice: z.number().optional(),
      })).optional().default([])
    }))
    .mutation(async ({ input }) => {
      try {
        const db = getDb();
        const { items, ...purchaseData } = input;
        
        console.log("[API] Creando compra:", purchaseData.invoiceNumber);

        // 1. Insert Purchase
        const result = await db.insert(purchases).values({
          ...purchaseData,
          netAmount: String(purchaseData.netAmount),
          taxAmount: String(purchaseData.taxAmount),
          totalAmount: String(purchaseData.totalAmount),
        });
        const purchaseId = Number((result as any)[0].insertId);
        
        // 2. Insert Items (if any) and Update Product Stock/Price
        if (items && items.length > 0) {
          for (const item of items) {
            await db.insert(purchaseItems).values({
              purchaseId,
              productId: item.productId,
              quantity: item.quantity,
              costPrice: String(item.costPrice),
              salePrice: item.salePrice ? String(item.salePrice) : null,
            });
            
            // Update stock
            await db.update(products)
              .set({ 
                stock: sql`${products.stock} + ${item.quantity}`,
                price: item.salePrice ? String(item.salePrice) : undefined
              })
              .where(eq(products.id, item.productId));
          }
        }
        
        return { id: purchaseId };
      } catch (err) {
        console.error("[API] Error creando compra:", err);
        throw new Error("No se pudo registrar la factura: " + err.message);
      }
    }),
});


