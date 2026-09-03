import { getDb } from "./connection.js";
import { customers } from "../../db/schema.js";
import { eq, desc, sql, or } from "drizzle-orm";

export async function findAllClients(search?: string) {
  const db = getDb();
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select()
      .from(customers)
      .where(
        or(
          sql`${customers.name} COLLATE utf8mb4_general_ci LIKE ${term}`,
          sql`COALESCE(${customers.phone}, '') COLLATE utf8mb4_general_ci LIKE ${term}`,
          sql`COALESCE(${customers.rut}, '') COLLATE utf8mb4_general_ci LIKE ${term}`,
          sql`COALESCE(${customers.email}, '') COLLATE utf8mb4_general_ci LIKE ${term}`
        )
      )
      .orderBy(desc(customers.createdAt));
  }
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function findClientById(id: number) {
  const db = getDb();
  const rows = await db.select().from(customers).where(eq(customers.id, id));
  return rows[0] || null;
}

export async function findClientByPhone(phone: string) {
  const db = getDb();
  const rows = await db.select().from(customers).where(eq(customers.phone, phone));
  return rows[0] || null;
}

export async function createClient(data: {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  birthDate?: string;
  rut?: string;
  address?: string;
  profession?: string;
  firstService?: string;
}) {
  try {
    const db = getDb();
    const result = await db.insert(customers).values(data);
    const insertId = (result as any)[0].insertId;
    console.log("[DB] Cliente creado con ID:", insertId);
    return findClientById(Number(insertId));
  } catch (error) {
    console.error("[DB ERROR] Fallo al crear cliente:", error);
    throw error;
  }
}

export async function updateClient(
  id: number,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    balance?: string;
    birthDate?: string;
    rut?: string;
    address?: string;
    profession?: string;
    firstService?: string;
  }
) {
  const db = getDb();
  await db.update(customers).set(data).where(eq(customers.id, id));
  return findClientById(id);
}

export async function deleteClient(id: number) {
  const db = getDb();
  await db.delete(customers).where(eq(customers.id, id));
}

export async function bulkCreateClients(clientsData: any[]) {
  if (!clientsData.length) return 0;
  const db = getDb();
  
  const mappedData = clientsData.map(c => ({
    name: c.name,
    phone: c.phone || "",
    email: c.email || null,
    notes: c.notes || null,
    birthDate: c.birthDate || null,
    rut: c.rut || null,
    address: c.address || null,
    profession: c.profession || null,
    firstService: c.firstService || null,
  }));
  
  const result = await db.insert(customers).values(mappedData);
  return (result as any)[0].affectedRows;
}
