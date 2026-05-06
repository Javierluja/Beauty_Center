import { getDb } from "./connection";
import { products } from "@db/schema";
import { eq, like, desc, lte, and } from "drizzle-orm";

export async function findAllProducts(search?: string, active?: boolean, lowStock?: boolean) {
  const db = getDb();
  const conditions = [];

  if (lowStock) {
    conditions.push(lte(products.stock, products.minStock));
  }
  if (search) {
    conditions.push(like(products.name, `%${search}%`));
  }
  if (active !== undefined) {
    conditions.push(eq(products.isActive, active ? 1 : 0));
  }

  const query = db.select().from(products);
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }
  
  return query.orderBy(desc(products.createdAt));
}

export async function findProductById(id: number) {
  const db = getDb();
  const results = await db.select().from(products).where(eq(products.id, id));
  return results[0] || null;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  sku?: string;
  price: string;
  stock?: number;
  minStock?: number;
  category?: string;
  isActive?: boolean;
}) {
  try {
    const db = getDb();
    const result = await db.insert(products).values({
      ...data,
      isActive: data.isActive !== false ? 1 : 0
    });
    const insertId = (result as any)[0].insertId;
    console.log("[DB] Producto creado con ID:", insertId);
    return findProductById(Number(insertId));
  } catch (error) {
    console.error("[DB ERROR] Fallo al crear producto:", error);
    throw error;
  }
}

export async function updateProduct(
  id: number,
  data: {
    name?: string;
    description?: string;
    sku?: string;
    price?: string;
    stock?: number;
    minStock?: number;
    category?: string;
    isActive?: boolean;
  }
) {
  const db = getDb();
  const updateData: any = { ...data };
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive ? 1 : 0;
  }
  await db.update(products).set(updateData).where(eq(products.id, id));
  return findProductById(id);
}

export async function deleteProduct(id: number) {
  const db = getDb();
  await db.delete(products).where(eq(products.id, id));
}

export async function updateProductStock(id: number, quantity: number) {
  const db = getDb();
  const product = await findProductById(id);
  if (!product) return null;
  
  const newStock = product.stock + quantity;
  await db
    .update(products)
    .set({ stock: newStock })
    .where(eq(products.id, id));
    
  return findProductById(id);
}
