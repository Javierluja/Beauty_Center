import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { getDb } from "./connection.js";

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function findAllUsers() {
  return await getDb().select().from(users);
}

export async function createUser(data: any) {
  const db = getDb();
  const result = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: data.password, // Aseguramos que la contraseña se guarde
    role: data.role || "ventas",
    avatar: data.avatar || null,
  });
  const insertId = (result as any)[0].insertId;
  return findUserById(Number(insertId));
}

export async function updateUser(id: number, data: any) {
  const db = getDb();
  await db.update(users).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(users.id, id));
  return findUserById(id);
}

export async function deleteUser(id: number) {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
}
