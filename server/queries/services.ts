import { getDb } from "./connection.js";
import { services } from "../../db/schema.js";
import { eq, like, desc, and, sql } from "drizzle-orm";

export async function findAllServices(search?: string, active?: boolean) {
  const db = getDb();
  const conditions = [];

  if (search) {
    conditions.push(like(services.name, `%${search}%`));
  }
  if (active !== undefined) {
    conditions.push(eq(services.isActive, active ? 1 : 0));
  }

  const query = db.select().from(services);
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }
  
  return query.orderBy(desc(services.createdAt));
}

export async function findServiceById(id: number) {
  const db = getDb();
  const results = await db.select().from(services).where(eq(services.id, id));
  return results[0] || null;
}

export async function createService(data: {
  name: string;
  description?: string;
  price: string;
  duration: number;
  category?: string;
  isActive?: boolean;
}) {
  console.log("[DB] Guardando servicio:", data.name);
  try {
    const db = getDb();
    const result = await db.insert(services).values({
      name: data.name,
      description: data.description || "",
      price: data.price || "0.00",
      duration: data.duration || 30,
      category: data.category || "General",
      isActive: data.isActive !== false ? 1 : 0,
    });
    
    const insertId = (result as any)[0].insertId;
    console.log("[DB] Servicio creado con ID:", insertId);
    return findServiceById(Number(insertId));
  } catch (error) {
    console.error("[DB ERROR]:", error);
    throw error;
  }
}

export async function updateService(
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: string;
    duration?: number;
    category?: string;
    isActive?: boolean;
  }
) {
  const db = getDb();
  const updateData: any = { ...data };
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive ? 1 : 0;
  }
  await db.update(services).set(updateData).where(eq(services.id, id));
  return findServiceById(id);
}

export async function deleteService(id: number) {
  const db = getDb();
  await db.delete(services).where(eq(services.id, id));
}




export async function bulkCreateServices(servicesData: any[]) {
  if (!servicesData.length) return 0;
  const db = getDb();
  
  const mappedData = servicesData.map(s => ({
    name: s.name,
    description: s.description || "",
    price: String(Math.floor(Number(s.price) || 0)),
    duration: Number(s.duration) || 30,
    category: s.category || "General",
    isActive: s.isActive !== false ? 1 : 0
  }));
  
  const result = await db.insert(services).values(mappedData);
  return (result as any)[0].affectedRows;
}
