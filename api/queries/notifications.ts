import { getDb } from "./connection.js";
import { notifications } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function findAllNotifications(filters?: {
  clientId?: number;
  sent?: number;
  type?: string;
}) {
  const db = getDb();
  const conditions = [];

  if (filters?.clientId) {
    conditions.push(eq(notifications.clientId, filters.clientId));
  }
  if (filters?.sent !== undefined) {
    conditions.push(eq(notifications.sent, filters.sent));
  }
  if (filters?.type) {
    conditions.push(eq(notifications.type, filters.type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: {
  clientId: number;
  appointmentId?: number;
  type: string;
  message: string;
}) {
  const db = getDb();
  const result = await db.insert(notifications).values({
    ...data,
    sent: 0,
  });
  const insertId = (result as any)[0].insertId;
  
  const rows = await db.select().from(notifications).where(eq(notifications.id, Number(insertId))).limit(1);
  return rows[0] || null;
}

export async function markNotificationAsSent(id: number) {
  const db = getDb();
  await db
    .update(notifications)
    .set({ sent: 1, sentAt: new Date() })
    .where(eq(notifications.id, id));
    
  const rows = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteNotification(id: number) {
  const db = getDb();
  await db.delete(notifications).where(eq(notifications.id, id));
}
