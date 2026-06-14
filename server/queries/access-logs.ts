import { desc } from "drizzle-orm";
import { accessLogs } from "../../db/schema.js";
import { getDb } from "./connection.js";

export async function createAccessLog(data: { userId: number, userName: string, userEmail: string, action: string, ipAddress?: string }) {
  const db = getDb();
  await db.insert(accessLogs).values({
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    action: data.action,
    ipAddress: data.ipAddress || "Unknown",
  });
}

export async function getAccessLogs() {
  const db = getDb();
  return await db.select().from(accessLogs).orderBy(desc(accessLogs.createdAt));
}
