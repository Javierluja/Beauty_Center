import { createRouter, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { customers, services, products, appointments, sales, sessionPacks, expenses } from "../db/schema.js";
import { syncToGoogleSheets } from "./lib/backup-sheets.js";

export const backupRouter = createRouter({
  exportAll: authedQuery.query(async () => {
    const db = getDb();
    const [
      allCustomers,
      allServices,
      allProducts,
      allAppointments,
      allSales,
      allPacks,
      allExpenses
    ] = await Promise.all([
      db.select().from(customers),
      db.select().from(services),
      db.select().from(products),
      db.select().from(appointments),
      db.select().from(sales),
      db.select().from(sessionPacks),
      db.select().from(expenses),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      counts: {
        customers: allCustomers.length,
        services: allServices.length,
        products: allProducts.length,
        appointments: allAppointments.length,
        sales: allSales.length,
        sessionPacks: allPacks.length,
        expenses: allExpenses.length,
      },
      data: {
        customers: allCustomers,
        services: allServices,
        products: allProducts,
        appointments: allAppointments,
        sales: allSales,
        sessionPacks: allPacks,
        expenses: allExpenses,
      }
    };
  }),

  syncAllToSheets: authedQuery.mutation(async () => {
    const db = getDb();
    const [allCustomers, allServices, allPacks] = await Promise.all([
      db.select().from(customers),
      db.select().from(services),
      db.select().from(sessionPacks),
    ]);

    let sent = 0;

    for (const c of allCustomers) {
      syncToGoogleSheets({
        tipo: "backup_cliente",
        id: c.id,
        nombre: c.name,
        telefono: c.phone,
        email: c.email || "",
        rut: c.rut || "",
        direccion: c.address || "",
        cumpleanos: c.birthDate || "",
        primerServicio: c.firstService || "",
      });
      sent++;
    }

    for (const p of allPacks) {
      syncToGoogleSheets({
        tipo: "backup_sesion_pack",
        id: p.id,
        clientId: p.clientId,
        totalSesiones: p.totalSessions,
        restantes: p.remainingSessions,
        titulo: p.customTitle || "",
        estado: p.status,
      });
      sent++;
    }

    return { success: true, recordsSent: sent };
  }),
});
