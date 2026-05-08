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
    .mutation(({ input }) => createAppointment(input)),

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
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateAppointment(id, data);
    }),

  delete: authedQuery
    .input(z.number())
    .mutation(({ input }) => deleteAppointment(input)),
});
