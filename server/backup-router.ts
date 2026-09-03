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
    const [allCustomers, allServices, allProducts, allPacks, allPurchases, allAppointments, allSales, allExpenses] = await Promise.all([
      db.select().from(customers),
      db.select().from(services),
      db.select().from(products),
      db.select().from(sessionPacks),
      db.select().from(purchases),
      db.select().from(appointments),
      db.select().from(sales),
      db.select().from(expenses),
    ]);

    let sent = 0;

    for (const c of allCustomers) {
      syncToGoogleSheets({
        tipo: "cliente",
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

    for (const s of allServices) {
      syncToGoogleSheets({
        tipo: "servicio",
        id: s.id,
        nombre: s.name,
        precio: String(s.price),
        duracion: s.duration,
        categoria: s.category || "General",
      });
      sent++;
    }

    for (const prod of allProducts) {
      syncToGoogleSheets({
        tipo: "producto",
        id: prod.id,
        nombre: prod.name,
        sku: prod.sku || "",
        precio: String(prod.price),
        stock: prod.stock,
        minStock: prod.minStock,
        categoria: prod.category || "General",
      });
      sent++;
    }

    for (const p of allPacks) {
      syncToGoogleSheets({
        tipo: "sesion_pack_creado",
        packId: p.id,
        clientId: p.clientId,
        totalSesiones: p.totalSessions,
        sesionesRestantes: p.remainingSessions,
        servicio: p.customTitle || "Pack",
        notas: p.status,
      });
      sent++;
    }

    for (const pur of allPurchases) {
      syncToGoogleSheets({
        tipo: "compra",
        id: pur.id,
        factura: pur.invoiceNumber || "",
        rut: pur.rut || "",
        neto: String(pur.netAmount),
        iva: String(pur.taxAmount),
        total: String(pur.totalAmount),
        fechaCompra: pur.purchaseDate,
        notas: pur.notes || "",
      });
      sent++;
    }

    for (const a of allAppointments) {
      syncToGoogleSheets({
        tipo: "cita_creada",
        id: a.id,
        clientId: a.clientId,
        serviceId: a.serviceId,
        fechaCita: a.appointmentDate,
        horaCita: a.appointmentTime,
        profesional: a.staffName || "General",
        estado: a.status,
        notas: a.notes || "",
      });
      sent++;
    }

    for (const sal of allSales) {
      syncToGoogleSheets({
        tipo: "venta",
        id: sal.id,
        clientId: sal.clientId,
        total: String(sal.finalTotal),
        metodo: sal.paymentMethod,
        fecha: sal.createdAt ? new Date(sal.createdAt).toLocaleString("es-CL") : "",
      });
      sent++;
    }

    for (const exp of allExpenses) {
      syncToGoogleSheets({
        tipo: "gasto",
        id: exp.id,
        descripcion: exp.description,
        monto: String(exp.amount),
        categoria: exp.category,
        fecha: exp.date,
      });
      sent++;
    }

    return { success: true, recordsSent: sent };
  }),
});
