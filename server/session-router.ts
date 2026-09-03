import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import { sessionPacks, sessionUsage } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./queries/connection.js";
import { syncToGoogleSheets } from "./lib/backup-sheets.js";

export const sessionRouter = createRouter({
  listAll: authedQuery.query(async () => {
    const db = getDb();
    return await db.select().from(sessionPacks);
  }),

  listByClient: authedQuery
    .input(z.number())
    .query(async ({ input }) => {
      const db = getDb();
      return await db
        .select()
        .from(sessionPacks)
        .where(eq(sessionPacks.clientId, input));
    }),

  createPack: authedQuery
    .input(
      z.object({
        clientId: z.number(),
        serviceId: z.number(),
        customTitle: z.string().optional(),
        totalSessions: z.number().min(1).max(40).default(10),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const res = await db.insert(sessionPacks).values({
        clientId: input.clientId,
        serviceId: input.serviceId,
        customTitle: input.customTitle,
        totalSessions: input.totalSessions,
        remainingSessions: input.totalSessions,
        purchaseDate: new Date().toISOString().split('T')[0],
      });

      try {
        const { findClientById } = await import("./queries/clients.js");
        const { findServiceById } = await import("./queries/services.js");
        const client = await findClientById(input.clientId);
        const service = await findServiceById(input.serviceId);
        syncToGoogleSheets({
          tipo: "sesion_pack_creado",
          cliente: client?.name || "Desconocido",
          telefono: client?.phone || "",
          servicio: input.customTitle || service?.name || "Pack de Sesiones",
          totalSesiones: input.totalSessions,
          sesionesRestantes: input.totalSessions,
          fecha: new Date().toLocaleDateString("es-CL"),
        });
      } catch (e) {}

      return res;
    }),

  useSession: authedQuery
    .input(
      z.object({
        packId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const pack = await db
        .select()
        .from(sessionPacks)
        .where(eq(sessionPacks.id, input.packId))
        .then((res: any) => res[0]);

      if (!pack || pack.remainingSessions <= 0) {
        throw new Error("No sessions remaining");
      }

      const sessionNumber = pack.totalSessions - pack.remainingSessions + 1;

      await db.insert(sessionUsage).values({
        packId: input.packId,
        sessionNumber,
        notes: input.notes,
      });

      const newRemaining = pack.remainingSessions - 1;
      await db
        .update(sessionPacks)
        .set({
          remainingSessions: newRemaining,
          status: newRemaining === 0 ? "finished" : "active"
        })
        .where(eq(sessionPacks.id, input.packId));

      try {
        const { findClientById } = await import("./queries/clients.js");
        const { findServiceById } = await import("./queries/services.js");
        const client = await findClientById(pack.clientId);
        const service = await findServiceById(pack.serviceId);
        syncToGoogleSheets({
          tipo: "sesion_utilizada",
          packId: input.packId,
          cliente: client?.name || "Desconocido",
          servicio: pack.customTitle || service?.name || "Sesión",
          sesionNumero,
          totalSesiones: pack.totalSessions,
          sesionesRestantes: newRemaining,
          notas: input.notes || "",
          fecha: new Date().toLocaleDateString("es-CL"),
        });
      } catch (e) {}

      return { success: true, remaining: newRemaining };
    }),

  getUsageHistory: authedQuery
    .input(z.number())
    .query(async ({ input }) => {
      const db = getDb();
      return await db
        .select()
        .from(sessionUsage)
        .where(eq(sessionUsage.packId, input));
    }),

  deletePack: authedQuery
    .input(z.object({ packId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Primero borramos el historial de uso
      await db.delete(sessionUsage).where(eq(sessionUsage.packId, input.packId));
      // Luego borramos el plan
      await db.delete(sessionPacks).where(eq(sessionPacks.id, input.packId));
      return { success: true };
    }),

  updatePack: authedQuery
    .input(
      z.object({
        packId: z.number(),
        customTitle: z.string().optional(),
        totalSessions: z.number().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const pack = await db
        .select()
        .from(sessionPacks)
        .where(eq(sessionPacks.id, input.packId))
        .then((res: any) => res[0]);

      if (!pack) throw new Error("Plan no encontrado");

      const updates: any = {};
      if (input.customTitle !== undefined) updates.customTitle = input.customTitle;
      if (input.totalSessions !== undefined) {
        const sessionsUsed = pack.totalSessions - pack.remainingSessions;
        updates.totalSessions = input.totalSessions;
        updates.remainingSessions = Math.max(0, input.totalSessions - sessionsUsed);
        updates.status = updates.remainingSessions === 0 ? "finished" : "active";
      }

      await db.update(sessionPacks).set(updates).where(eq(sessionPacks.id, input.packId));
      return { success: true };
    }),
});
