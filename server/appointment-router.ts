import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import {
  findAllAppointments,
  findAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayAppointmentsCount,
  findUpcomingAppointments,
} from "./queries/appointments.js";

import { syncToGoogleSheets } from "./lib/backup-sheets.js";

export const appointmentRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        clientId: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => findAllAppointments(input)),

  todayCount: authedQuery.query(() => getTodayAppointmentsCount()),

  upcoming: authedQuery
    .input(z.number().optional().default(7))
    .query(({ input }) => findUpcomingAppointments(input)),

  byId: authedQuery
    .input(z.number())
    .query(({ input }) => findAppointmentById(input)),

  create: authedQuery
    .input(
      z.object({
        clientId: z.number(),
        serviceId: z.number(),
        staffName: z.string().optional(),
        appointmentDate: z.string(),
        appointmentTime: z.string(),
        packId: z.number().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const appt = await createAppointment(input);
      if (appt) {
        try {
          const { findClientById } = await import("./queries/clients.js");
          const { findServiceById } = await import("./queries/services.js");
          const client = await findClientById(appt.clientId);
          const service = await findServiceById(appt.serviceId);
          syncToGoogleSheets({
            tipo: "cita_creada",
            id: appt.id,
            cliente: client?.name || "Desconocido",
            telefono: client?.phone || "",
            servicio: service?.name || "Servicio",
            fechaCita: appt.appointmentDate,
            horaCita: appt.appointmentTime,
            profesional: appt.staffName || "General",
            estado: appt.status,
            packId: appt.packId || null,
          });
        } catch (e) {}
      }
      return appt;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        serviceId: z.number().optional(),
        staffName: z.string().optional(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
        packId: z.number().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const appt = await updateAppointment(id, data);
      if (appt) {
        try {
          const { findClientById } = await import("./queries/clients.js");
          const { findServiceById } = await import("./queries/services.js");
          const client = await findClientById(appt.clientId);
          const service = await findServiceById(appt.serviceId);
          syncToGoogleSheets({
            tipo: "cita_actualizada",
            id: appt.id,
            cliente: client?.name || "Desconocido",
            servicio: service?.name || "Servicio",
            fechaCita: appt.appointmentDate,
            horaCita: appt.appointmentTime,
            estado: appt.status,
          });
        } catch (e) {}
      }
      return appt;
    }),

  delete: authedQuery
    .input(z.number())
    .mutation(({ input }) => deleteAppointment(input)),
});


