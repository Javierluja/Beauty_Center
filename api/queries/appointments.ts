import { getDb } from "./connection";
import { appointments, customers, services } from "@db/schema";
import { eq, and, gte, lte, asc, desc, sql } from "drizzle-orm";

export async function findAllAppointments(filters?: {
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}) {
  const db = getDb();
  const conditions = [];

  if (filters?.clientId) conditions.push(eq(appointments.clientId, filters.clientId));
  if (filters?.dateFrom) conditions.push(sql`${appointments.appointmentDate} >= ${filters.dateFrom}`);
  if (filters?.dateTo) conditions.push(sql`${appointments.appointmentDate} <= ${filters.dateTo}`);
  if (filters?.status) conditions.push(eq(appointments.status, filters.status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: appointments.id,
      clientId: appointments.clientId,
      serviceId: appointments.serviceId,
      staffName: appointments.staffName,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      packId: appointments.packId,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      clientName: customers.name,
      clientPhone: customers.phone,
      serviceName: services.name,
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.clientId, customers.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(whereClause)
    .orderBy(desc(appointments.appointmentDate), appointments.appointmentTime);
}

export async function findAppointmentById(id: number) {
  const db = getDb();
  const results = await db
    .select({
      id: appointments.id,
      clientId: appointments.clientId,
      serviceId: appointments.serviceId,
      staffName: appointments.staffName,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      packId: appointments.packId,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      clientName: customers.name,
      clientPhone: customers.phone,
      serviceName: services.name,
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.clientId, customers.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.id, id));

  return results[0] || null;
}

export async function createAppointment(data: {
  clientId: number;
  serviceId: number;
  staffName?: string;
  appointmentDate: string;
  appointmentTime: string;
  packId?: number;
  status?: string;
  notes?: string;
}) {
  try {
    const db = getDb();
    const result = await db.insert(appointments).values({
      ...data,
      status: data.status || "pending",
    });
    const insertId = (result as any)[0].insertId;
    return findAppointmentById(Number(insertId));
  } catch (error) {
    console.error("[DB ERROR] Fallo al crear cita:", error);
    throw error;
  }
}

export async function updateAppointment(id: number, data: any) {
  const db = getDb();
  await db.update(appointments).set(data).where(eq(appointments.id, id));
  return findAppointmentById(id);
}

export async function deleteAppointment(id: number) {
  const db = getDb();
  await db.delete(appointments).where(eq(appointments.id, id));
}

export async function getTodayAppointmentsCount() {
  const db = getDb();
  const today = new Date().toLocaleDateString('en-CA');
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(sql`date(${appointments.appointmentDate}) = ${today}`);
  return result[0]?.count ?? 0;
}

export async function findUpcomingAppointments(days: number = 7) {
  const db = getDb();
  const today = new Date().toLocaleDateString('en-CA');
  
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + days);
  const dateTo = limitDate.toLocaleDateString('en-CA');

  return db
    .select({
      id: appointments.id,
      clientId: appointments.clientId,
      serviceId: appointments.serviceId,
      staffName: appointments.staffName,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      packId: appointments.packId,
      status: appointments.status,
      clientName: customers.name,
      clientPhone: customers.phone,
      serviceName: services.name,
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.clientId, customers.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        sql`date(${appointments.appointmentDate}) >= ${today}`,
        sql`date(${appointments.appointmentDate}) <= ${dateTo}`
      )
    )
    .orderBy(asc(appointments.appointmentDate), asc(appointments.appointmentTime));
}
